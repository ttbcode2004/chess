import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/navbar';
import Avatar from '../components/avatar';
import { useAuthStore } from '../store/authStore';

const AVATAR_PRESETS = [
  '♔','♕','♖','♗','♘','♙','♚','♛','♜','♝','♞','♟',
];

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [username,    setUsername]    = useState(user?.username ?? '');
  const [avatar,      setAvatar]      = useState('');
  const [curPass,     setCurPass]     = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState<'profile' | 'security'>('profile');

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPass !== confirmPass) return toast.error('Passwords do not match');
    if (newPass?.length < 6)     return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      // await profileApi.update({ currentPassword: curPass, newPassword: newPass });
      toast.success('Password changed!');
      setCurPass(''); setNewPass(''); setConfirmPass('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-screen bg-chess-bg">
      <Navbar />
      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-5">

          <div>
            <h1 className="font-display text-3xl text-chess-gold">Settings</h1>
            <p className="text-chess-light text-sm mt-1">Manage your account preferences</p>
          </div>

          {/* Current profile preview */}
          <div className="bg-chess-panel border border-chess-border rounded-xl p-5 flex items-center gap-4">
            <Avatar username={user?.username ?? ''} avatar={undefined} size="lg" />
            <div>
              <p className="text-chess-text font-semibold text-lg">{user?.username}</p>
              <p className="text-chess-light text-sm">{user?.email}</p>
              {/* <span className="rating-badge mt-1 inline-block">{user?.rating}</span> */}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-chess-panel border border-chess-border rounded-xl overflow-hidden">
            <div className="flex border-b border-chess-border">
              {(['profile', 'security'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 capitalize ${
                    activeTab === t
                      ? 'text-chess-green border-chess-green'
                      : 'text-chess-light border-transparent hover:text-chess-text'
                  }`}
                >
                  {t === 'profile' ? '👤 Profile' : '🔒 Security'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* ── Profile tab ── */}
              {activeTab === 'profile' && (
                // <form onSubmit={saveProfile} className="space-y-5">
                <form className="space-y-5">
                  <div>
                    <label className="block text-xs text-chess-light mb-1.5 uppercase tracking-wider font-mono">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      minLength={3} maxLength={20}
                      className="w-full bg-chess-card border border-chess-border rounded-lg px-4 py-3 text-chess-text focus:outline-none focus:border-chess-green transition-colors text-sm"
                    />
                    <p className="text-chess-light text-xs mt-1">3–20 characters</p>
                  </div>

                  {/* Avatar picker */}
                  <div>
                    <label className="block text-xs text-chess-light mb-2 uppercase tracking-wider font-mono">
                      Avatar (choose a piece)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAvatar(a => a === p ? '' : p)}
                          className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                            avatar === p
                              ? 'bg-chess-green/20 border-2 border-chess-green'
                              : 'bg-chess-card border border-chess-border hover:border-chess-green/50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="px-3 h-10 rounded-lg bg-chess-card border border-chess-border text-chess-light text-xs hover:bg-chess-hover"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-chess-green hover:bg-chess-green-d text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                </form>
              )}

              {/* ── Security tab ── */}
              {activeTab === 'security' && (
                <form onSubmit={savePassword} className="space-y-4">
                  {[
                    { label: 'Current Password', val: curPass, set: setCurPass },
                    { label: 'New Password',      val: newPass, set: setNewPass },
                    { label: 'Confirm New Password', val: confirmPass, set: setConfirmPass },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs text-chess-light mb-1.5 uppercase tracking-wider font-mono">
                        {label}
                      </label>
                      <input
                        type="password"
                        value={val}
                        onChange={e => set(e.target.value)}
                        required
                        className="w-full bg-chess-card border border-chess-border rounded-lg px-4 py-3 text-chess-text focus:outline-none focus:border-chess-green transition-colors text-sm"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-chess-green hover:bg-chess-green-d text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Updating…' : 'Change Password'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-chess-panel border border-chess-red/30 rounded-xl p-5">
            <h3 className="text-chess-red font-semibold mb-1 text-sm">Danger Zone</h3>
            <p className="text-chess-light text-xs mb-3">Sign out of your account on this device.</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-chess-red/10 hover:bg-chess-red/20 text-chess-red border border-chess-red/30 rounded-lg text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}