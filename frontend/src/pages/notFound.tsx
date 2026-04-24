import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-chess-bg flex flex-col items-center justify-center text-center p-6">
      {/* Animated board squares background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none grid grid-cols-8">
        {Array.from({ length: 64 }, (_, i) => (
          <div
            key={i}
            className={`${(Math.floor(i / 8) + i) % 2 === 0 ? 'bg-white' : 'bg-transparent'}`}
          />
        ))}
      </div>

      <div className="relative z-10">
        <p className="text-8xl mb-4 opacity-80" style={{ filter: 'drop-shadow(0 0 30px rgba(201,162,39,.4))' }}>
          ♟
        </p>
        <h1 className="font-display text-7xl text-chess-gold font-bold">404</h1>
        <p className="text-chess-text text-xl mt-3 mb-2">Page not found</p>
        <p className="text-chess-light text-sm mb-8 max-w-sm">
          Looks like this square is empty. The page you're looking for doesn't exist or has moved.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/"
            className="px-6 py-2.5 bg-chess-green hover:bg-chess-green-d text-white rounded-lg font-medium transition-colors"
          >
            Back to Home
          </Link>
          <Link
            to="/leaderboard"
            className="px-6 py-2.5 bg-chess-card border border-chess-border text-chess-text rounded-lg hover:bg-chess-hover transition-colors"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}