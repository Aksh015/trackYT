import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/formatters';
import { Camera, Loader2, Save, User, Mail, Calendar, Zap, Clock, Database, DollarSign, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicURL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      if (username !== user.username) {
        formData.append('username', username);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (formData.entries().next().done) {
        setIsLoading(false);
        return;
      }

      const { authService } = await import('../services/authService');
      const response = await authService.updateProfile(formData);

      if (response.success) {
        updateUser(response.data.user);
        setAvatarFile(null);
        setMessage('Profile updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = user?.planType?.toUpperCase() === 'PREMIUM';
  const hasChanges = username !== user?.username || avatarFile !== null;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-ink-900">Settings</h1>
        <p className="text-ink-500 mt-1 font-medium">Manage your account and preferences.</p>
      </div>

      {/* ── Profile Card ─────────────────────────────── */}
      <form onSubmit={handleSaveProfile}>
        <div className="card mb-6">

          {/* Card Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-ink-900">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-black text-lg tracking-tight">Profile</h2>
          </div>

          {/* Feedback Messages */}
          {message && (
            <div className="mb-5 p-3 bg-emerald-50 border-2 border-emerald-500 rounded-lg text-emerald-700 text-sm font-semibold flex items-center gap-2">
              <span className="text-emerald-500">✓</span> {message}
            </div>
          )}
          {error && (
            <div className="mb-5 p-3 bg-rose-50 border-2 border-rose-500 rounded-lg text-rose-700 text-sm font-semibold">
              ✗ {error}
            </div>
          )}

          {/* Avatar + Fields */}
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div
                className="relative w-28 h-28 rounded-2xl bg-ink-900 flex items-center justify-center text-white text-4xl font-black cursor-pointer overflow-hidden border-4 border-ink-900 group"
                style={{ boxShadow: '4px 4px 0px 0px #111' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase() || 'U'
                )}
                <div className="absolute inset-0 bg-ink-900/70 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1">
                  <Camera className="w-7 h-7 text-white" />
                  <span className="text-white text-xs font-bold">Change</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              {avatarFile && (
                <span className="text-xs font-semibold text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded-full">
                  New photo selected
                </span>
              )}
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-ink-600 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input font-semibold"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-ink-600 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input bg-ink-100 text-ink-500 cursor-not-allowed pr-20"
                    disabled
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-ink-400 border border-ink-200 bg-white px-1.5 py-0.5 rounded">
                    Locked
                  </span>
                </div>
                <p className="text-xs text-ink-400 mt-1.5">Email address cannot be changed.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 mt-6 border-t-2 border-ink-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Calendar className="w-4 h-4" />
              <span>Member since <span className="font-semibold text-ink-700">{formatDate(user?.createdAt)}</span></span>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── Plan Badge ───────────────────────────────── */}
      <div className="card mb-6" style={{ borderColor: isPremium ? '#F59E0B' : '#111', boxShadow: isPremium ? '6px 6px 0px 0px #F59E0B' : '6px 6px 0px 0px #111' }}>
        <div className="flex items-center gap-3 mb-4 pb-4 border-b-2" style={{ borderColor: isPremium ? '#FDE24F' : '#eee' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isPremium ? '#FDE24F' : '#111' }}>
            <Zap className="w-4 h-4" style={{ color: isPremium ? '#111' : 'white' }} />
          </div>
          <h2 className="font-black text-lg tracking-tight">Your Plan</h2>
          <span
            className="ml-auto px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2"
            style={isPremium
              ? { background: '#FDE24F', borderColor: '#F59E0B', color: '#111' }
              : { background: '#111', borderColor: '#111', color: '#fff' }
            }
          >
            {isPremium ? '⚡ Pro' : 'Free'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-bg-base rounded-lg border-2 border-ink-200">
            <p className="text-xs font-black uppercase tracking-widest text-ink-400 mb-0.5">Channels</p>
            <p className="font-black text-ink-900">{isPremium ? 'Unlimited' : '3 max'}</p>
          </div>
          <div className="p-3 bg-bg-base rounded-lg border-2 border-ink-200">
            <p className="text-xs font-black uppercase tracking-widest text-ink-400 mb-0.5">AI Summaries</p>
            <p className="font-black text-ink-900">{isPremium ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      {/* ── About Card ───────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-ink-900">
          <div className="w-8 h-8 rounded-lg bg-ink-900 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-black text-lg tracking-tight">About TrackYT</h2>
        </div>
        <p className="text-sm text-ink-600 mb-5 leading-relaxed">
          <strong className="text-ink-900">TrackYT</strong> is an AI-powered YouTube channel monitoring platform.
          It tracks new videos, title changes, thumbnail swaps, channel renames, and profile picture updates.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Clock className="w-4 h-4" />, label: 'Monitoring', value: 'Every hour' },
            { icon: <Zap className="w-4 h-4" />, label: 'AI Engine', value: 'Gemini Flash' },
            { icon: <Database className="w-4 h-4" />, label: 'Data Source', value: 'YouTube + RSS' },
            { icon: <DollarSign className="w-4 h-4" />, label: 'Plans', value: 'Free & Pro' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="neo-card-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-ink-400">{label}</p>
                <p className="font-black text-sm text-ink-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────────── */}
      <div className="card border-rose-500" style={{ boxShadow: '6px 6px 0px 0px #F43F5E' }}>
        <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-rose-200">
          <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-black text-lg tracking-tight text-rose-500">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-sm text-ink-900">Log out of TrackYT</p>
            <p className="text-xs text-ink-400 mt-0.5">You'll need your email and password to log back in.</p>
          </div>
          <button
            onClick={logout}
            className="btn btn-outline border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}
