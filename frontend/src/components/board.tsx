import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';

const PIECE_SYMBOLS: Record<string, string> = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
};

interface Props {
  fen: string;
  orientation: 'white' | 'black';
  myColor: 'white' | 'black' | null;
  onMove: (from: string, to: string, promotion?: string) => void;
  lastMove?: { from: string; to: string } | null;
  disabled?: boolean;
}

interface PromoState {
  from: string;
  to: string;
}

type Square = Parameters<Chess['get']>[0];

export default function Board({
  fen,
  orientation,
  myColor,
  onMove,
  lastMove,
  disabled
}: Props) {

  const [selected, setSelected] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [promoState, setPromoState] = useState<PromoState | null>(null);

  const chess = new Chess(fen);

  useEffect(() => {
    setSelected(null);
    setLegalMoves([]);
  }, [fen]);

  const getLegalTargets = useCallback((sq: string): string[] => {
    try {
      return chess.moves({ square: sq as Square, verbose: true }).map(m => m.to);
    } catch {
      return [];
    }
  }, [fen]);

  function onSquareClick(sq: string) {
    if (disabled || !myColor || promoState) return;

    if (selected && legalMoves.includes(sq)) {
      const srcPiece = chess.get(selected as Square);

      const isPromo = srcPiece?.type === 'p' && (
        (myColor === 'white' && sq[1] === '8') ||
        (myColor === 'black' && sq[1] === '1')
      );

      if (isPromo) {
        setPromoState({ from: selected, to: sq });
      } else {
        onMove(selected, sq);
        setSelected(null);
        setLegalMoves([]);
      }
      return;
    }

    const piece = chess.get(sq as Square);
    const isMine = piece && (
      (myColor === 'white' && piece.color === 'w') ||
      (myColor === 'black' && piece.color === 'b')
    );

    if (isMine && sq !== selected) {
      setSelected(sq);
      setLegalMoves(getLegalTargets(sq));
    } else {
      setSelected(null);
      setLegalMoves([]);
    }
  }

  function handlePromotion(p: string) {
    if (!promoState) return;
    onMove(promoState.from, promoState.to, p);
    setPromoState(null);
    setSelected(null);
    setLegalMoves([]);
  }

  // check king
  let checkKingSq: string | null = null;
  if (chess.isCheck()) {
    const turn = chess.turn();
    for (let r = 1; r <= 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = String.fromCharCode(97 + f) + r;
        const p = chess.get(sq as Square);
        if (p?.type === 'k' && p.color === turn) {
          checkKingSq = sq;
        }
      }
    }
  }

  const isWhitePieces = myColor !== 'black';

  const promoOptions = isWhitePieces
    ? [['q','♕'],['r','♖'],['b','♗'],['n','♘']]
    : [['q','♛'],['r','♜'],['b','♝'],['n','♞']];

  return (
    <div className="w-full max-w-[min(90vh,600px)] mx-auto select-none">
      
      {/* BOARD */}
      <div className="grid grid-cols-8 grid-rows-8 w-full aspect-square shadow-board rounded overflow-hidden">

        {Array.from({ length: 64 }, (_, idx) => {
          const row = Math.floor(idx / 8);
          const col = idx % 8;

          const rank = orientation === 'white' ? 8 - row : row + 1;
          const file = orientation === 'white' ? col : 7 - col;

          const sq = String.fromCharCode(97 + file) + rank;

          const isLight = (file + rank) % 2 !== 0;
          const piece = chess.get(sq as Square);

          const hasCap = legalMoves.includes(sq) && !!piece;
          const hasLegal = legalMoves.includes(sq) && !piece;

          const cls = [
            'relative flex items-center justify-center',
            isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]',
            'aspect-square',
            sq === selected ? 'ring-2 ring-green-400' : '',
            sq === lastMove?.from ? 'ring-2 ring-yellow-400' : '',
            sq === lastMove?.to ? 'ring-2 ring-yellow-400' : '',
            sq === checkKingSq ? 'bg-red-400/40' : ''
          ].join(' ');

          return (
            <div
              key={sq}
              className={cls}
              onClick={() => onSquareClick(sq)}
            >

              {/* legal move dot */}
              {hasLegal && (
                <div className="w-3 h-3 bg-black/30 rounded-full" />
              )}

              {/* capture */}
              {hasCap && (
                <div className="absolute inset-1 border-4 border-red-400 rounded-full" />
              )}

              {/* piece */}
              {piece && (
                <span
                  className="pointer-events-none"
                  style={{
                    fontSize: 'clamp(24px, 6vw, 48px)',
                    color: piece.color === 'w' ? '#fff' : '#111',
                    textShadow:
                      piece.color === 'w'
                        ? '0 2px 4px rgba(0,0,0,.8)'
                        : '0 1px 2px rgba(255,255,255,.2)',
                  }}
                >
                  {PIECE_SYMBOLS[piece.color + piece.type.toUpperCase()]}
                </span>
              )}

            </div>
          );
        })}
      </div>

      {/* PROMOTION */}
      {promoState && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-chess-panel border border-chess-border rounded-xl p-5 text-center">
            <p className="text-xs mb-3 text-gray-400 uppercase">Promote</p>
            <div className="flex gap-2">
              {promoOptions.map(([p, sym]) => (
                <button
                  key={p}
                  onClick={() => handlePromotion(p)}
                  className="w-14 h-14 bg-gray-800 hover:bg-green-500 rounded text-3xl"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}