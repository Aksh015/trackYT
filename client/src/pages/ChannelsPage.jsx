import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import channelService from '../services/channelService';
import { timeAgo } from '../utils/formatters';

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await channelService.getChannels();
        setChannels(res.data.data.channels);
      } catch (err) {
        console.error('Failed to fetch channels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Stop monitoring "${name}"? This will remove all tracking data.`)) return;
    try {
      await channelService.removeChannel(id);
      setChannels((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert('Failed to remove channel: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Channels</h1>
          <p className="text-ink-500 text-sm mt-1">
            {channels.length} channel{channels.length !== 1 ? 's' : ''} being monitored
          </p>
        </div>
        <Link to="/channels/add" className="btn btn-primary no-underline">
          + Add Channel
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
              <div className="skeleton h-3 w-full mt-2" />
            </div>
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="border-dashed-dark p-12 text-center">
          <div className="text-4xl mb-3">📡</div>
          <h3 className="font-bold text-lg mb-2">No channels yet</h3>
          <p className="text-ink-500 text-sm mb-5">
            Add your first YouTube channel to start monitoring.
          </p>
          <Link to="/channels/add" className="btn btn-primary no-underline">
            + Add your first channel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch, i) => (
            <div
              key={ch._id}
              className="card p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-ink-200 shrink-0">
                  {ch.profilePicURL ? (
                    <img src={ch.profilePicURL} alt={ch.channelName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-cream-200 flex items-center justify-center text-lg font-bold">
                      {ch.channelName?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/channels/${ch._id}`}
                    className="font-bold text-sm hover:text-accent-500 transition-colors no-underline text-ink-900 block truncate"
                  >
                    {ch.channelName}
                  </Link>
                  <p className="text-xs text-ink-400 truncate">
                    {ch.channelHandle || ch.channelId}
                  </p>
                </div>
              </div>

              {ch.description && (
                <p className="text-xs text-ink-500 mb-3 line-clamp-2">
                  {ch.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                <span className="text-xs text-ink-400">
                  {ch.lastCheckedAt
                    ? `Checked ${timeAgo(ch.lastCheckedAt)}`
                    : 'Not checked yet'}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/channels/${ch._id}`}
                    className="text-xs font-semibold text-accent-500 hover:text-accent-600 no-underline"
                  >
                    Details →
                  </Link>
                  <button
                    onClick={() => handleRemove(ch._id, ch.channelName)}
                    className="text-xs text-ink-400 hover:text-rose-500 cursor-pointer bg-transparent border-none transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
