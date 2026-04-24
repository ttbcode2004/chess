import React, { useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (username.length < 3) return toast.error('Username must be at least 3 characters');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const { data } = await authApi.register({ username, email, password });
      setAuth(data.user, data.token);
      toast.success(`Welcome, ${data.user.username}! ♟`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-chess-bg flex items-center justify-center p-4">
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='30' height='30' fill='%23fff'/%3E%3Crect x='30' y='30' width='30' height='30' fill='%23fff'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-6xl block mb-3" style={{ filter: 'drop-shadow(0 0 20px rgba(129,182,76,.4))' }}>♟</span>
          <h1 className="font-display text-4xl text-chess-gold">PlayChess</h1>
          <p className="text-chess-light text-sm mt-1 tracking-widest uppercase font-mono text-xs">
            Join the community
          </p>
        </div>

        <div className="bg-chess-panel border border-chess-border rounded-2xl p-8 shadow-panel">
          <h2 className="text-xl font-semibold text-chess-text mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-chess-light mb-1.5 uppercase tracking-wider font-mono">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="grandmaster99"
                maxLength={20}
                className="w-full bg-chess-card border border-chess-border rounded-lg px-4 py-3 text-chess-text placeholder-chess-hover focus:outline-none focus:border-chess-green transition-colors text-sm"
              />
            </div>

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
                placeholder="Min. 6 characters"
                className="w-full bg-chess-card border border-chess-border rounded-lg px-4 py-3 text-chess-text placeholder-chess-hover focus:outline-none focus:border-chess-green transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chess-green hover:bg-chess-green-d text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-chess-light text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-chess-green hover:text-chess-green-d font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}