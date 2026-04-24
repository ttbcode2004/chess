import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/navbar';
import Avatar from '../components/avatar';
import { SkeletonRows } from '../components/skeleton';
import { useSocket } from '../contexts/socketContext';
import { usersApi, gamesApi, authApi } from '../api/client';

// ── Types ──────────────────────────────────────────────────────────────────────
interface OnlineUser {
  id:       string;
  username: string;
  rating:   number;
  avatar:   string | null;
}

interface GameRow {
  id:          string;
  result:      string | null;
  status:      string;
  timeControl: string;
  createdAt:   string;
  white: { id: string; username: string; rating: number };
  black: { id: string; username: string; rating: number };
}

interface Challenge {
  challengeId: string;
  from:        { id: string; username: string };
  timeControl: string;
}

type Tab = 'online' | 'search' | 'history';

export default function Dashboard() {
 
  
  const { on, send } = useSocket();
  const navigate     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [onlineUsers,   setOnlineUsers]   = useState<OnlineUser[]>([]);
  const [games,         setGames]         = useState<GameRow[]>([]);
  const [searchQ,       setSearchQ]       = useState('');
  const [searchRes,     setSearchRes]     = useState<OnlineUser[]>([]);
  const [challenges,    setChallenges]    = useState<Challenge[]>([]);
  const [sentChallenge, setSentChallenge] = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [tab, setTabState] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'online'
  );

  function setTab(t: Tab) {
    setTabState(t);
    setSearchParams({ tab: t });
  }

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await authApi.me();
        setUser(res.data.data); // ⚠️ chú ý structure backend
      } catch (err) {
        console.error(err);
      }
    };

    fetchMe();
  }, []);

  // ── Load game history ──────────────────────────────────────────────────────
  useEffect(() => {
    gamesApi.list()
      .then(r => setGames(r.data.games ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  
  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [
      on('online_users', (_msg) => {
        usersApi.getOnlineUsers()
          .then(r => setOnlineUsers(r.data.data ?? []))
          .catch(() => setOnlineUsers([]));
      }),

      on('challenge_received', (msg: Challenge) => {
        setChallenges(prev => [...prev, msg]);
        toast(`⚔️ ${msg.from.username} challenges you!`, { duration: 6000 });
      }),

      on('challenge_declined', (msg: { byUsername: string }) => {
        setSentChallenge(null);
        toast.error(`${msg.byUsername} declined your challenge`);
      }),

      on('game_start', (msg) => {
        navigate(`/game/${msg.gameId}`, { state: msg });
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [on, navigate]);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (searchQ.length < 2) { setSearchRes([]); return; }
    const t = setTimeout(() => {
      usersApi.search(searchQ)
        .then(r => {
          const list = r.data.data ?? r.data.users ?? [];
          setSearchRes(list.map((u: any) => ({
            id:       u._id ?? u.id,
            username: u.username,
            rating:   u.rating,
            avatar:   u.avatar ?? u.avatarUrl ?? null,
          })));
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  // ── Actions ────────────────────────────────────────────────────────────────
  function challengeUser(userId: string) {
    setSentChallenge(userId);
    send({ type: 'challenge', toUserId: userId, timeControl: '10+0' });
    toast('Challenge sent!', { icon: '⚔️', duration: 4000 });
  }

  function acceptChallenge(c: Challenge) {
    setChallenges(prev => prev.filter(x => x.challengeId !== c.challengeId));
    send({ type: 'challenge_accept', challengeId: c.challengeId });
  }

  function declineChallenge(c: Challenge) {
    setChallenges(prev => prev.filter(x => x.challengeId !== c.challengeId));
    send({ type: 'challenge_decline', challengeId: c.challengeId });
  }

  const winRate = user && (user.gamesPlayed ?? 0) > 0
    ? Math.round(((user.gamesWon ?? 0) / (user.gamesPlayed ?? 1)) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-chess-bg">
      <Navbar />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── LEFT: Profile ── */}
          <div className="flex flex-col gap-4">

            <div className="bg-chess-panel border border-chess-border rounded-xl p-5">
              <Link to={`/profile/${user?.username}`} className="flex items-center gap-4 group">
                <Avatar
                  username={user?.username ?? ''}
                  avatar={user?.avatar ?? user?.avatar}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-chess-text font-semibold text-lg leading-none group-hover:text-chess-green transition-colors truncate">
                    {user?.username}
                  </p>
                  <p className="text-chess-light text-xs mt-1 truncate">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="rating-badge">{user?.rating ?? 1000}</span>
                    <span className="text-xs text-chess-light">{user?.gamesPlayed ?? 0} games</span>
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-chess-border">
                {[
                  { label: 'Rating', value: user?.rating ?? 1000 },
                  { label: 'Wins',   value: user?.gamesWon ?? 0 },
                  { label: 'Win %',  value: `${winRate}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-chess-card rounded-lg py-2">
                    <p className="text-chess-green font-mono font-bold text-base">{value}</p>
                    <p className="text-chess-light text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Incoming challenges */}
            {challenges.length > 0 && (
              <div className="bg-chess-panel border border-chess-gold/40 rounded-xl p-4 slide-up">
                <p className="text-chess-gold text-sm font-semibold mb-3 flex items-center gap-2">
                  ⚔️ Challenges
                  <span className="bg-chess-gold text-[#0d0c0b] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {challenges.length}
                  </span>
                </p>
                <div className="space-y-2">
                  {challenges.map(c => (
                    <div key={c.challengeId} className="flex items-center justify-between bg-chess-card rounded-lg p-3">
                      <div>
                        <p className="text-chess-text text-sm font-medium">{c.from.username}</p>
                        <p className="text-chess-light text-xs font-mono">{c.timeControl}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => acceptChallenge(c)}
                          className="px-3 py-1.5 bg-chess-green hover:bg-chess-green-d text-white text-xs rounded-lg font-medium transition-colors">
                          Accept
                        </button>
                        <button onClick={() => declineChallenge(c)}
                          className="px-3 py-1.5 bg-chess-hover text-chess-light text-xs rounded-lg border border-chess-border transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-chess-panel border border-chess-border rounded-xl p-4">
              <p className="text-xs text-chess-light font-mono uppercase tracking-wider mb-3">Quick Links</p>
              <div className="space-y-1">
                <Link to="/leaderboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-chess-hover transition-colors text-sm text-chess-text">
                  🏆 Leaderboard
                </Link>
                <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-chess-hover transition-colors text-sm text-chess-text">
                  ⚙️ Settings
                </Link>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Main panel ── */}
          <div className="lg:col-span-2 bg-chess-panel border border-chess-border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 400 }}>

            {/* Tabs */}
            <div className="flex border-b border-chess-border flex-shrink-0">
              {([
                ['online',  `Online (${onlineUsers.length})`],
                ['search',  'Find Players'],
                ['history', 'Game History'],
              ] as [Tab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                    tab === t
                      ? 'text-chess-green border-chess-green'
                      : 'text-chess-light border-transparent hover:text-chess-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-4">

              {/* ── Online tab ── */}
              {tab === 'online' && (
                onlineUsers.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-4xl mb-3">👥</p>
                    <p className="text-chess-text font-medium">No players online</p>
                    <p className="text-chess-light text-sm mt-1">Be the first — invite a friend!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {onlineUsers
                      .filter(u => u.id !== user?.id)
                      .map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-chess-card hover:bg-chess-hover rounded-xl p-3 transition-colors group">
                          <Link to={`/profile/${u.username}`} className="flex items-center gap-3 group/link">
                            <Avatar username={u.username} avatar={u.avatar} size="md" online />
                            <div>
                              <p className="text-chess-text text-sm font-medium group-hover/link:text-chess-green transition-colors">
                                {u.username}
                              </p>
                              <p className="text-xs text-chess-green">● Online</p>
                            </div>
                            <span className="rating-badge">{u.rating}</span>
                          </Link>
                          <button
                            onClick={() => challengeUser(u.id)}
                            disabled={!!sentChallenge}
                            className="px-3 py-1.5 bg-chess-green hover:bg-chess-green-d text-white text-xs rounded-lg font-medium transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
                          >
                            {sentChallenge === u.id ? '⏳ Waiting…' : '⚔️ Challenge'}
                          </button>
                        </div>
                      ))}
                  </div>
                )
              )}

              {/* ── Search tab ── */}
              {tab === 'search' && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      placeholder="Search players by username…"
                      autoFocus
                      className="w-full bg-chess-card border border-chess-border rounded-xl pl-10 pr-4 py-3 text-chess-text placeholder-chess-hover focus:outline-none focus:border-chess-green transition-colors text-sm"
                    />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-chess-light"
                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                    </svg>
                  </div>

                  {searchQ.length >= 2 ? (
                    searchRes.length === 0 ? (
                      <p className="text-chess-light text-sm text-center py-10">No players found for "{searchQ}"</p>
                    ) : (
                      <div className="space-y-1.5">
                        {searchRes.map(u => (
                          <div key={u.id} className="flex items-center justify-between bg-chess-card rounded-xl p-3.5">
                            <Link to={`/profile/${u.username}`} className="flex items-center gap-3 group">
                              <Avatar username={u.username} avatar={u.avatar} size="md" />
                              <div>
                                <p className="text-chess-text text-sm font-medium group-hover:text-chess-green transition-colors">{u.username}</p>
                                <span className="rating-badge">{u.rating}</span>
                              </div>
                            </Link>
                            <button
                              onClick={() => challengeUser(u.id)}
                              disabled={!!sentChallenge}
                              className="px-3 py-1.5 bg-chess-green hover:bg-chess-green-d text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {sentChallenge === u.id ? '⏳' : '⚔️ Challenge'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 text-chess-light">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-sm">Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── History tab ── */}
              {tab === 'history' && (
                loading ? <SkeletonRows count={5} /> :
                games.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-3">♜</p>
                    <p className="text-chess-text font-medium">No games yet</p>
                    <p className="text-chess-light text-sm mt-1">Challenge a player to get started</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {games.map(g => {
                      const isWhite  = String(g.white?.id) === String(user?.id);
                      const opp      = isWhite ? g.black : g.white;
                      const myResult = g.result === 'draw' ? 'draw'
                        : (g.result === 'white' && isWhite) || (g.result === 'black' && !isWhite)
                        ? 'win' : 'loss';
                      const rStyle = {
                        win:  'text-chess-green bg-chess-green/10',
                        loss: 'text-chess-red bg-chess-red/10',
                        draw: 'text-chess-light bg-chess-hover',
                      }[myResult];

                      return (
                        <div key={g.id} className="flex items-center gap-3 bg-chess-card rounded-xl p-3.5 hover:bg-chess-hover transition-colors">
                          <span className={`text-xs font-bold font-mono w-10 text-center py-1.5 rounded-lg flex-shrink-0 ${rStyle}`}>
                            {myResult === 'win' ? 'Win' : myResult === 'loss' ? 'Loss' : '½'}
                          </span>
                          <span className="text-chess-light">{isWhite ? '♔' : '♚'}</span>
                          <span className="flex-1 min-w-0 text-sm text-chess-text truncate">
                            vs {opp?.username ?? '?'}
                          </span>
                          <span className="rating-badge flex-shrink-0">{opp?.rating}</span>
                          <div className="text-right flex-shrink-0">
                            <p className="text-chess-light text-xs font-mono">{g.timeControl}</p>
                            <p className="text-chess-light text-xs">{new Date(g.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}