import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import toast from 'react-hot-toast';
import Board    from '../components/board';
import Navbar   from '../components/navbar';
import Avatar   from '../components/avatar';
import { useSocket }    from '../contexts/socketContext';
import { useAuthStore } from '../store/authStore';

interface Player {
  id: string; username: string; rating: number; avatar: string | null;
}

interface GameState {
  white:       Player;
  black:       Player;
  fen:         string;
  color:       'white' | 'black';
  timeControl: string;
  status:      'waiting' | 'active' | 'over';
  result?:     string;
  reason?:     string;
}

interface HistoryEntry {
  san:     string;
  moveNum: number;
  side:    'w' | 'b';
}

// Normalise a player object coming from the server.
// The server may send _id (Mongoose) instead of id.
function normalisePlayer(raw: any): Player {
  return {
    id:       String(raw._id ?? raw.id ?? ''),
    username: raw.username ?? '',
    rating:   raw.rating   ?? 0,
    avatar:   raw.avatar   ?? raw.avatarUrl ?? null,
  };
}

export default function Game() {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const location    = useLocation();           // ← read navigation state
  const { user: _user } = useAuthStore();
  const { on, send }    = useSocket();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [fen,       setFen]       = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [history,   setHistory]   = useState<HistoryEntry[]>([]);
  const [lastMove,  setLastMove]  = useState<{ from: string; to: string } | null>(null);
  const [drawOffer, setDrawOffer] = useState(false);
  const [gameOver,  setGameOver]  = useState<{ result: string; reason: string } | null>(null);

  const chessRef = useRef(new Chess());
  const histRef  = useRef<HTMLDivElement>(null);

  // ── FIX: Bootstrap from navigation state ─────────────────────────────────
  // Dashboard calls navigate(`/game/${id}`, { state: msg }) passing the full
  // game_start payload. We read it here on first mount so we never miss the event.
  useEffect(() => {
    const msg = location.state as any;
    if (!msg?.gameId || msg.gameId !== gameId) return;  // stale/unrelated state

    const initialFen = msg.fen ?? new Chess().fen();
    chessRef.current = new Chess(initialFen);
    setFen(initialFen);
    setHistory([]);
    setLastMove(null);
    setDrawOffer(false);
    setGameOver(null);
    setGameState({
      white:       normalisePlayer(msg.white),
      black:       normalisePlayer(msg.black),
      fen:         initialFen,
      color:       msg.color,
      timeControl: msg.timeControl ?? '10+0',
      status:      'active',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // Auto-scroll move list
  useEffect(() => {
    if (histRef.current) histRef.current.scrollTop = histRef.current.scrollHeight;
  }, [history]);

  const handleGameOver = useCallback((result: string, reason: string) => {
    const label = result === 'draw'
      ? 'Draw'
      : `${result.charAt(0).toUpperCase() + result.slice(1)} wins!`;
    setGameState(g => g ? { ...g, status: 'over', result: label, reason } : g);
    setGameOver({ result: label, reason });
  }, []);

  // ── WebSocket events ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [
      // game_start is also handled here in case the page is refreshed / opened
      // directly (no navigation state available).
      on('game_start', (msg) => {
        if (msg.gameId !== gameId) return;
        chessRef.current = new Chess(msg.fen);
        setFen(msg.fen);
        setHistory([]);
        setLastMove(null);
        setDrawOffer(false);
        setGameOver(null);
        setGameState({
          white:       normalisePlayer(msg.white),
          black:       normalisePlayer(msg.black),
          fen:         msg.fen,
          color:       msg.color,
          timeControl: msg.timeControl,
          status:      'active',
        });
      }),

      on('move', (msg) => {
        chessRef.current.load(msg.fen);
        setFen(msg.fen);
        setLastMove({ from: msg.from, to: msg.to });

        const totalMoves = chessRef.current.history().length;
        const moveNum    = Math.ceil(totalMoves / 2);
        // After a move chess.turn() has already flipped — side = who just moved
        const side: 'w' | 'b' = msg.turn === 'white' ? 'b' : 'w';
        setHistory(prev => [...prev, { san: msg.san, moveNum, side }]);

        if (msg.gameOver) {
          handleGameOver(msg.gameOver.result, msg.gameOver.reason);
        } else if (msg.check) {
          toast('Check!', { icon: '⚠️', duration: 1500 });
        }
      }),

      on('game_over',             (msg) => handleGameOver(msg.result, msg.reason)),
      on('draw_offer',            ()    => { setDrawOffer(true); toast('½ Opponent offers a draw', { duration: 6000 }); }),
      on('draw_declined',         ()    => toast.error('Draw declined')),
      on('opponent_disconnected', ()    => toast.error('Opponent disconnected', { duration: 6000 })),
    ];
    return () => unsubs.forEach(u => u());
  }, [on, handleGameOver, gameId]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  function handleMove(from: string, to: string, promotion?: string) {
    send({ type: 'move', gameId, from, to, promotion });
  }
  function handleResign() {
    if (!confirm('Are you sure you want to resign?')) return;
    send({ type: 'resign', gameId });
  }
  function handleDrawOffer() {
    send({ type: 'draw_offer', gameId });
    toast('Draw offer sent', { icon: '½' });
  }
  function respondDraw(accept: boolean) {
    setDrawOffer(false);
    send({ type: 'draw_response', gameId, accept });
    if (!accept) toast('Draw declined');
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const myColor      = gameState?.color ?? 'white';
  const chess        = chessRef.current;
  const isMyTurn     = chess.turn() === (myColor === 'white' ? 'w' : 'b');
  const isOver       = gameState?.status === 'over';
  const topPlayer    = myColor === 'white' ? gameState?.black : gameState?.white;
  const bottomPlayer = myColor === 'white' ? gameState?.white : gameState?.black;

  const pairedMoves: { num: number; w?: string; b?: string }[] = [];
  history.forEach(h => {
    if (h.side === 'w') {
      pairedMoves.push({ num: pairedMoves.length + 1, w: h.san });
    } else {
      if (pairedMoves.length === 0) pairedMoves.push({ num: 1 });
      pairedMoves[pairedMoves.length - 1].b = h.san;
    }
  });

  const lastMoveIdx = history.length - 1;
console.log({
  fen,
  myColor,
  turn: chess.turn(),
  isMyTurn
});
  return (
    <div className="flex flex-col h-screen bg-chess-bg overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Board column ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3 min-w-0 overflow-hidden">

          <PlayerBar
            player={topPlayer}
            isMyTurn={!isMyTurn && !isOver}
            color={myColor === 'white' ? 'black' : 'white'}
          />

          {gameState ? (
            <Board
              fen={fen}
              orientation={myColor}
              myColor={isOver ? null : myColor}
              onMove={handleMove}
              lastMove={lastMove}
              disabled={!gameState || !isMyTurn || isOver}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="text-5xl animate-bounce">♟</div>
              <p className="text-chess-text font-semibold">Waiting for opponent…</p>
              <p className="text-chess-light text-sm">Share your game link or challenge a friend</p>
            </div>
          )}

          <PlayerBar
            player={bottomPlayer}
            isMyTurn={isMyTurn && !isOver}
            color={myColor}
          />
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-chess-panel border-l border-chess-border min-h-0 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-chess-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-chess-light font-mono uppercase tracking-wider">
                  {gameState?.timeControl ?? '—'}
                </p>
                <p className={`text-sm font-medium mt-0.5 ${
                  isOver ? 'text-chess-gold'
                  : isMyTurn ? 'text-chess-green'
                  : 'text-chess-light'
                }`}>
                  {isOver
                    ? (gameState?.result ?? 'Game over')
                    : gameState
                    ? (isMyTurn ? 'Your turn' : "Opponent's turn")
                    : 'Waiting…'}
                </p>
              </div>
              {gameState && !isOver && (
                <div className={`w-2.5 h-2.5 rounded-full ${isMyTurn ? 'bg-chess-green animate-pulse' : 'bg-chess-hover'}`} />
              )}
            </div>
          </div>

          {/* Draw offer */}
          {drawOffer && !isOver && (
            <div className="mx-3 mt-3 bg-chess-card border border-chess-gold/40 rounded-xl p-3 flex-shrink-0 slide-up">
              <p className="text-chess-text text-sm font-medium mb-2.5">½ Opponent offers a draw</p>
              <div className="flex gap-2">
                <button onClick={() => respondDraw(true)}
                  className="flex-1 py-2 bg-chess-green hover:bg-chess-green-d text-white text-sm rounded-lg font-medium transition-colors">
                  Accept
                </button>
                <button onClick={() => respondDraw(false)}
                  className="flex-1 py-2 bg-chess-hover text-chess-light text-sm rounded-lg border border-chess-border transition-colors">
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Move history */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <p className="text-xs text-chess-light font-mono uppercase tracking-wider px-4 py-2.5 border-b border-chess-border flex-shrink-0">
              Moves
            </p>
            <div ref={histRef} className="flex-1 overflow-y-auto">
              {pairedMoves.length === 0 ? (
                <p className="text-chess-light text-xs text-center py-8">No moves yet</p>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {pairedMoves.map((row, ri) => {
                      const wIdx = ri * 2;
                      const bIdx = ri * 2 + 1;
                      return (
                        <tr key={row.num} className="hover:bg-chess-hover/50 transition-colors">
                          <td className="text-chess-light text-xs font-mono w-9 px-3 py-1.5 text-right select-none">
                            {row.num}.
                          </td>
                          <td className={`px-2 py-1.5 text-sm font-mono rounded ${
                            wIdx === lastMoveIdx ? 'bg-chess-green/20 text-chess-green font-semibold' : 'text-chess-text'
                          }`}>{row.w ?? ''}</td>
                          <td className={`px-2 py-1.5 text-sm font-mono rounded ${
                            bIdx === lastMoveIdx ? 'bg-chess-green/20 text-chess-green font-semibold' : 'text-chess-text'
                          }`}>{row.b ?? ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {gameState && !isOver && (
            <div className="px-3 py-3 border-t border-chess-border flex gap-2 flex-shrink-0">
              <button onClick={handleDrawOffer}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-chess-card hover:bg-chess-hover text-chess-light hover:text-chess-text text-sm rounded-lg border border-chess-border transition-colors">
                ½ <span className="hidden sm:inline">Draw</span>
              </button>
              <button onClick={handleResign}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-chess-red/10 hover:bg-chess-red/20 text-chess-red text-sm rounded-lg border border-chess-red/30 hover:border-chess-red/50 transition-colors">
                ⚑ <span className="hidden sm:inline">Resign</span>
              </button>
            </div>
          )}

          {/* Chat */}
          {/* {gameId && gameState && <GameChat gameId={gameId} />} */}
        </div>
      </div>

      {/* Game-over modal */}
      {gameOver && (
        <GameOverModal
          result={gameOver.result}
          reason={gameOver.reason}
          myColor={myColor}
          onHome={() => navigate('/')}
          opponentUsername={myColor === 'white' ? gameState?.black.username : gameState?.white.username}
        />
      )}
    </div>
  );
}

/* ── Player bar ──────────────────────────────────────────────────────────────── */
function PlayerBar({ player, isMyTurn, color }: {
  player?: Player; isMyTurn: boolean; color: 'white' | 'black';
}) {
  if (!player) return (
    <div className="w-full max-w-[560px] h-12 bg-chess-panel/40 rounded-xl border border-chess-border/50 animate-pulse" />
  );

  return (
    <div className={`flex items-center gap-3 w-full max-w-[560px] px-4 py-2.5 rounded-xl border transition-all duration-300 ${
      isMyTurn
        ? 'bg-chess-panel border-chess-green shadow-[0_0_16px_rgba(129,182,76,.2)]'
        : 'bg-chess-panel border-chess-border'
    }`}>
      <Avatar username={player.username} avatar={player.avatar} size="sm" />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-medium text-chess-text truncate">{player.username}</span>
        <span className="rating-badge flex-shrink-0">{player.rating}</span>
        <span className="text-xs text-chess-light select-none">{color === 'white' ? '♔' : '♚'}</span>
      </div>

      {isMyTurn && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chess-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-chess-green" />
          </span>
          <span className="text-chess-green text-xs font-mono hidden sm:inline">thinking</span>
        </div>
      )}
    </div>
  );
}

/* ── Game-over modal ─────────────────────────────────────────────────────────── */
function GameOverModal({ result, reason, myColor, onHome, opponentUsername }: {
  result: string; reason: string; myColor: string;
  onHome: () => void; opponentUsername?: string;
}) {
  const isWin  = result.toLowerCase().includes(myColor);
  const isDraw = result.toLowerCase().includes('draw');
  const icon   = isDraw ? '½' : isWin ? '🏆' : '♟';
  const color  = isDraw ? 'text-chess-gold' : isWin ? 'text-chess-green' : 'text-chess-red';
  const bgLine = isDraw ? 'bg-chess-gold/10 border-chess-gold/30'
               : isWin  ? 'bg-chess-green/10 border-chess-green/30'
               :           'bg-chess-red/10 border-chess-red/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-chess-panel border border-chess-border rounded-2xl p-8 text-center w-full max-w-sm pop-in shadow-2xl">
        <div className="text-5xl mb-3">{icon}</div>
        <h2 className={`font-display text-3xl font-bold ${color}`}>{result}</h2>
        <div className={`mt-3 mb-6 px-4 py-2 rounded-lg border inline-block ${bgLine}`}>
          <span className="text-sm text-chess-light">{reason}</span>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onHome}
            className="w-full py-3 bg-chess-green hover:bg-chess-green-d text-white rounded-xl font-semibold transition-colors">
            Back to Home
          </button>
          {opponentUsername && (
            <Link to={`/profile/${opponentUsername}`}
              className="w-full py-3 bg-chess-card hover:bg-chess-hover text-chess-text rounded-xl text-sm transition-colors border border-chess-border">
              View {opponentUsername}'s Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}