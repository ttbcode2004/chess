import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import Avatar from '../components/avatar';
import { SkeletonRows } from '../components/skeleton';
import { gamesApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface Player {
  id: string; username: string; rating: number;
  gamesPlayed: number; gamesWon: number; winRate: number;
  avatar: string | null; rank: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    gamesApi.leaderboard()
      .then(r => setPlayers(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-chess-bg">
      <Navbar />
      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl text-chess-gold">Leaderboard</h1>
            <p className="text-chess-light text-sm mt-1">Top players ranked by rating</p>
          </div>

          {/* Top 3 podium */}
          {!loading && players.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[players[1], players[0], players[2]].map((p, i) => {
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const heights = ['h-28', 'h-36', 'h-24'];
                const isMe = p.id === user?.id;
                return (
                  <Link
                    to={`/profile/${p.username}`}
                    key={p.id}
                    className={`flex flex-col items-center justify-end bg-chess-panel border rounded-xl p-4 transition-all hover:border-chess-gold/50 hover:-translate-y-1 ${
                      isMe ? 'border-chess-green/60' : 'border-chess-border'
                    } ${heights[i]}`}
                  >
                    <Avatar username={p.username} avatar={p.avatar} size="lg" />
                    <p className="text-2xl mt-1">{MEDAL[actualRank - 1]}</p>
                    <p className="text-chess-text font-semibold text-sm mt-1 truncate max-w-full">{p.username}</p>
                    <p className="text-chess-green font-mono text-sm font-bold">{p.rating}</p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="bg-chess-panel border border-chess-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2rem_1fr_6rem_5rem_5rem] gap-3 px-4 py-2.5 border-b border-chess-border">
              {['#', 'Player', 'Rating', 'Games', 'Win%'].map(h => (
                <span key={h} className="text-xs text-chess-light font-mono uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {loading ? (
              <div className="p-4"><SkeletonRows count={10} /></div>
            ) : players.length === 0 ? (
              <p className="text-chess-light text-center py-12">No ranked players yet — play some games!</p>
            ) : (
              <div>
                {players.map(p => {
                  const isMe = p.id === user?.id;
                  return (
                    <Link
                      to={`/profile/${p.username}`}
                      key={p.id}
                      className={`grid grid-cols-[2rem_1fr_6rem_5rem_5rem] gap-3 px-4 py-3 items-center transition-colors hover:bg-chess-hover border-b border-chess-border/50 last:border-0 ${
                        isMe ? 'bg-chess-green/5' : ''
                      }`}
                    >
                      <span className="text-sm font-mono text-chess-light">
                        {p.rank <= 3 ? MEDAL[p.rank - 1] : p.rank}
                      </span>

                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar username={p.username} avatar={p.avatar} size="sm" />
                        <span className={`text-sm font-medium truncate ${isMe ? 'text-chess-green' : 'text-chess-text'}`}>
                          {p.username}{isMe && ' (you)'}
                        </span>
                      </div>

                      <span className="text-chess-green font-mono font-semibold text-sm">{p.rating}</span>
                      <span className="text-chess-light text-sm font-mono">{p.gamesPlayed}</span>
                      <span className="text-chess-light text-sm font-mono">{p.winRate}%</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}