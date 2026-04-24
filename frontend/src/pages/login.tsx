import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleLogin() {
    console.log("CLICK LOGIN");
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }
    

    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });

      setAuth(data.user, data.token);

      // 🔥 lưu localStorage (QUAN TRỌNG)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Login success');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-chess-bg flex items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='30' height='30' fill='%23fff'/%3E%3Crect x='30' y='30' width='30' height='30' fill='%23fff'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl block mb-3" style={{ filter: 'drop-shadow(0 0 20px rgba(129,182,76,.4))' }}>♞</span>
          <h1 className="font-display text-4xl text-chess-gold">PlayChess</h1>
          <p className="text-chess-light text-sm mt-1 tracking-widest uppercase font-mono text-xs">
            Real-time Multiplayer
          </p>
        </div>

        {/* Card */}
        <div className="bg-chess-panel border border-chess-border rounded-2xl p-8 shadow-panel">
          <h2 className="text-xl font-semibold text-chess-text mb-6">Sign in to play</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-chess-light mb-1.5 uppercase tracking-wider font-mono">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-chess-card border border-chess-border rounded-lg px-4 py-3 text-chess-text placeholder-chess-hover focus:outline-none focus:border-chess-green transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-chess-light mb-1.5 uppercase tracking-wider font-mono">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-chess-card border border-chess-border rounded-lg px-4 py-3 text-chess-text placeholder-chess-hover focus:outline-none focus:border-chess-green transition-colors text-sm"
              />
            </div>

            <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-chess-green hover:bg-chess-green-d text-black font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
          </div>

          <p className="text-center text-chess-light text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-chess-green hover:text-chess-green-d font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}