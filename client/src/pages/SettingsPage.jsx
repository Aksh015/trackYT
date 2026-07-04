import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/formatters';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-6">Settings</h1>

      {/* Profile Section */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ink-900 flex items-center justify-center text-white text-xl font-bold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-lg">{user?.username}</p>
              <p className="text-ink-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-ink-100">
            <p className="text-sm text-ink-400">
              Member since {formatDate(user?.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">About TrackYT</h2>
        <div className="space-y-3 text-sm text-ink-600">
          <p>
            <strong>TrackYT</strong> is an AI-powered YouTube channel monitoring platform.
            It tracks new videos, title changes, thumbnail swaps, channel renames, and profile picture updates.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-cream-50 rounded-lg">
              <p className="font-semibold text-ink-900">Monitoring</p>
              <p className="text-xs text-ink-400">Every hour via cron</p>
            </div>
            <div className="p-3 bg-cream-50 rounded-lg">
              <p className="font-semibold text-ink-900">AI Engine</p>
              <p className="text-xs text-ink-400">Google Gemini Flash</p>
            </div>
            <div className="p-3 bg-cream-50 rounded-lg">
              <p className="font-semibold text-ink-900">Data Source</p>
              <p className="text-xs text-ink-400">YouTube API + RSS</p>
            </div>
            <div className="p-3 bg-cream-50 rounded-lg">
              <p className="font-semibold text-ink-900">Cost</p>
              <p className="text-xs text-ink-400">Free & Pro plans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-rose-500/30">
        <h2 className="font-bold text-lg mb-4 text-rose-500">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Log out</p>
            <p className="text-xs text-ink-400">You'll need to log in again.</p>
          </div>
          <button onClick={logout} className="btn btn-outline text-sm border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
