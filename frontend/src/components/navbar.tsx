import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
// import Avatar from './Avatar';
// import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { to: '/',            label: 'Play',        icon: '♟' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="h-14 bg-chess-panel border-b border-chess-border flex items-center px-4 gap-2 flex-shrink-0 z-50 relative">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-3 flex-shrink-0">
        <span className="text-2xl leading-none">♞</span>
        <span className="font-display text-chess-gold text-xl font-bold leading-none hidden sm:block">
          PlayChess
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ to, label, icon }) => {
          const active = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-chess-green/15 text-chess-green'
                  : 'text-chess-light hover:text-chess-text hover:bg-chess-card'
              }`}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Right side */}
      {user && (
        <div className="flex items-center gap-1">
          {/* <NotificationBell onOpen={() => navigate('/?tab=friends')} /> */}

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-chess-card transition-colors"
            >
              {/* <Avatar username={user.username} avatar={user.avatar} size="sm" /> */}
              <div className="hidden sm:block text-left">
                <p className="text-chess-text text-sm font-medium leading-none">{user.username}</p>
                {/* <p className="text-chess-green font-mono text-xs mt-0.5">{user.rating}</p> */}
              </div>
              <svg
                className={`w-3.5 h-3.5 text-chess-light transition-transform ml-0.5 ${menuOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-chess-panel border border-chess-border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,.5)] z-50 py-1.5 slide-up overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-chess-border mb-1">
                    <p className="text-chess-text font-semibold text-sm">{user.username}</p>
                    <p className="text-chess-light text-xs mt-0.5">{user.email}</p>
                  </div>

                  <Link
                    to={`/profile/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-chess-text hover:bg-chess-hover transition-colors"
                  >
                    <span className="w-5 text-center">👤</span> Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-chess-text hover:bg-chess-hover transition-colors"
                  >
                    <span className="w-5 text-center">⚙️</span> Settings
                  </Link>

                  <div className="border-t border-chess-border my-1.5" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-chess-red hover:bg-chess-red/10 transition-colors"
                  >
                    <span className="w-5 text-center text-base">⏎</span> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}