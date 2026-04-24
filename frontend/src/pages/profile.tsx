import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import Avatar from '../components/avatar';
import { SkeletonCard, Skeleton } from '../components/skeleton';
// import { profileApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface ProfileUser {
  id: string; username: string; rating: number;
  gamesPlayed: number; gamesWon: number; winRate: number;
  avatar: string | null; createdAt: string;
}
interface GameRow {
  id: string; result: string | null; resultReason: string | null;
  timeControl: string; createdAt: string;
  white: { id: string; username: string; rating: number };
  black: { id: string; username: string; rating: number };
}

const STAT_LABELS = ['Rating', 'Games', 'Wins', 'Win %'];

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuthStore();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [games,   setGames]   = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);

  const isMe = me?.username === username;

  // useEffect(() => {
  //   if (!username) return;
  //   setLoading(true);
  //   profileApi.get(username)
  //     .then(r => { setProfile(r.data.user); setGames(r.data.games); })
  //     .catch(() => navigate('/404'))
  //     .finally(() => setLoading(false));
  // }, [username, navigate]);


  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="flex flex-col h-screen bg-chess-bg">
      <Navbar />
      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Back link */}
          <Link to="/" className="text-chess-light hover:text-chess-text text-sm flex items-center gap-1 w-fit">
            ← Back
          </Link>

          {loading ? (
            <>
              <SkeletonCard lines={4} />
              <SkeletonCard lines={6} />
            </>
          ) : profile && (
            <>
              {/* Profile card */}
              <div className="bg-chess-panel border border-chess-border rounded-xl p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <Avatar username={profile.username} avatar={profile.avatar} size="xl" />
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="font-display text-3xl text-chess-text">{profile.username}</h1>
                    <p className="text-chess-light text-sm mt-1">Member since {memberSince}</p>

                    <div className="grid grid-cols-4 gap-3 mt-5">
                      {[
                        profile.rating,
                        profile.gamesPlayed,
                        profile.gamesWon,
                        `${profile.winRate}%`,
                      ].map((val, i) => (
                        <div key={i} className="bg-chess-card rounded-lg p-3 text-center">
                          <p className="text-chess-green font-mono font-bold text-lg">{val}</p>
                          <p className="text-chess-light text-xs mt-0.5">{STAT_LABELS[i]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

        
              </div>

              {/* Recent games */}
              <div className="bg-chess-panel border border-chess-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-chess-border">
                  <h2 className="font-display text-lg">Recent Games</h2>
                </div>

                {games.length === 0 ? (
                  <p className="text-chess-light text-center py-10">No games played yet</p>
                ) : (
                  <div>
                    {games.map(g => {
                      const isWhite = g.white.id === profile.id;
                      const opp = isWhite ? g.black : g.white;
                      const myResult = g.result === 'draw' ? 'draw'
                        : ((g.result === 'white' && isWhite) || (g.result === 'black' && !isWhite))
                        ? 'win' : 'loss';
                      const rColor = myResult === 'win'
                        ? 'text-chess-green bg-chess-green/10'
                        : myResult === 'loss'
                        ? 'text-chess-red bg-chess-red/10'
                        : 'text-chess-light bg-chess-hover';

                      return (
                        <div key={g.id} className="flex items-center gap-3 px-5 py-3 border-b border-chess-border/50 last:border-0 hover:bg-chess-hover transition-colors">
                          <span className={`text-xs font-bold font-mono w-10 text-center py-1 rounded ${rColor}`}>
                            {myResult === 'win' ? 'Win' : myResult === 'loss' ? 'Loss' : '½'}
                          </span>
                          <span className="text-chess-light text-sm">{isWhite ? '♔' : '♚'}</span>
                          <Link
                            to={`/profile/${opp.username}`}
                            className="text-chess-text text-sm hover:text-chess-green transition-colors flex-1 min-w-0 truncate"
                          >
                            vs {opp.username}
                          </Link>
                          <Skeleton className="hidden" />
                          <span className="rating-badge flex-shrink-0">{opp.rating}</span>
                          <div className="text-right flex-shrink-0">
                            <p className="text-chess-light text-xs">{g.timeControl}</p>
                            <p className="text-chess-light text-xs">
                              {new Date(g.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}