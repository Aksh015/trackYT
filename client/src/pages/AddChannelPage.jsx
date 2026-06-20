import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import channelService from '../services/channelService';

export default function AddChannelPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await channelService.addChannel(url);
      navigate('/channels', {
        state: { message: res.data.message },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add channel. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-black mb-2">Add Channel</h1>
      <p className="text-ink-500 text-sm mb-8">
        Paste a YouTube channel URL and we'll start monitoring it for changes.
      </p>

      <div className="card p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="channel-url" className="block text-sm font-semibold mb-2">
              Channel URL
            </label>
            <input
              id="channel-url"
              type="url"
              className="input text-base py-3"
              placeholder="https://youtube.com/@MrBeast"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="text-xs text-ink-400 mt-2">
              Supported formats: youtube.com/@handle or youtube.com/channel/UC...
            </p>
          </div>

          <div className="bg-cream-100 rounded-lg p-4 border border-cream-300">
            <h4 className="text-sm font-semibold mb-2">What we'll track:</h4>
            <ul className="text-sm text-ink-600 space-y-1">
              <li>🎬 New video uploads</li>
              <li>✏️ Video title changes</li>
              <li>🖼️ Thumbnail swaps</li>
              <li>📛 Channel name changes</li>
              <li>👤 Profile picture updates</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resolving channel...
              </span>
            ) : (
              '+ Start Monitoring'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
