import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { SocketProvider } from './contexts/socketContext';
import type React from 'react';

import Login       from './pages/login';
import Register    from './pages/register';
import Dashboard   from './pages/dashboard';
import Game        from './pages/game';
import Leaderboard from './pages/leaderBoard';
import Profile     from './pages/profile';
import Settings    from './pages/settings';
import NotFound    from './pages/notFound';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}
function GuestOnly({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return !token ? children : <Navigate to="/" replace />;
}

function AuthedApp() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/"                    element={<Dashboard />} />
        <Route path="/game/:id"            element={<Game />} />
        <Route path="/leaderboard"         element={<Leaderboard />} />
        <Route path="/profile/:username"   element={<Profile />} />
        <Route path="/settings"            element={<Settings />} />
        <Route path="/404"                 element={<NotFound />} />
        <Route path="*"                    element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <BrowserRouter>
      {token ? (
        <Routes>
          <Route path="/*" element={<RequireAuth><AuthedApp /></RequireAuth>} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="*"         element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}