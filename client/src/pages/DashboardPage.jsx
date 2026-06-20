import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/analyticsService';
import channelService from '../services/channelService';
import { timeAgo, eventTypeLabel, eventTypeBadgeClass, eventTypeIcon, truncate } from '../utils/formatters';

const FILTER_KINDS = [
  { key: null, label: 'All changes' },
  { key: 'NEW_VIDEO', label: 'New videos' },
  { key: 'TITLE_CHANGED', label: 'Title changes' },
  { key: 'THUMBNAIL_CHANGED', label: 'Thumbnail changes' },
  { key: 'CHANNEL_RENAMED', label: 'Channel renames' },
  { key: 'PROFILE_PICTURE_CHANGED', label: 'Avatar changes' },
];

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (activeFilter) params.eventType = activeFilter;
      if (activeChannel) params.channelId = activeChannel;

      const res = await eventService.getEvents(params);
      setEvents(res.data.data.events);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, activeChannel]);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await channelService.getChannels();
      setChannels(res.data.data.channels);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, activeChannel]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = () => {
    setPage(1);
    fetchEvents();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-accent-500 font-semibold text-sm mb-1">your watchlist 👀</p>
          <h1 className="text-3xl font-black">Feed</h1>
          <p className="text-ink-500 text-sm mt-1">
            New videos, title rewrites, thumbnail swaps, and channel rebrands across the channels you watch.
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-outline text-sm">
          ↻ Refresh feed
        </button>
      </div>

      {/* Main layout: sidebar + feed */}
      <div className="flex gap-6 items-start">
        {/* Left Sidebar — Filters */}
        <aside className="w-72 shrink-0 hidden lg:block">
          <div className="card p-5 sticky top-24">
            {/* KIND filter */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Kind</h3>
              <div className="flex flex-wrap gap-2">
                {FILTER_KINDS.map((f) => (
                  <button
                    key={f.key || 'all'}
                    onClick={() => setActiveFilter(f.key)}
                    className={`badge-pill ${activeFilter === f.key ? 'active' : ''}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CHANNELS filter */}
            {channels.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Channels</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveChannel(null)}
                    className={`badge-pill ${activeChannel === null ? 'active' : ''}`}
                  >
                    All
                  </button>
                  {channels.map((ch) => (
                    <button
                      key={ch.channelId}
                      onClick={() => setActiveChannel(ch.channelId)}
                      className={`badge-pill ${activeChannel === ch.channelId ? 'active' : ''}`}
                    >
                      {truncate(ch.channelName, 18)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Feed Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="flex gap-4">
                    <div className="skeleton w-32 h-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-3 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyFeed hasChannels={channels.length > 0} />
          ) : (
            <div className="space-y-4">
              {events.map((event, i) => (
                <EventCard key={event._id} event={event} index={i} channels={channels} />
              ))}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn btn-outline text-sm disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-ink-500">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page >= pagination.pages}
                    className="btn btn-outline text-sm disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, index, channels }) {
  const channel = channels.find((c) => c.channelId === event.channelId);
  const channelName = channel?.channelName || event.channelId;

  return (
    <div
      className="card p-5 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail or visual */}
        <EventVisual event={event} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-sm">{channelName}</span>
            <span className={`event-badge ${eventTypeBadgeClass(event.eventType)}`}>
              {eventTypeIcon(event.eventType)} {eventTypeLabel(event.eventType)}
            </span>
            <span className="time-badge">
              🕐 {timeAgo(event.detectedAt)}
            </span>
          </div>

          <EventDescription event={event} />
        </div>
      </div>
    </div>
  );
}

function EventVisual({ event }) {
  const thumbnailURL =
    event.newValue?.thumbnailURL ||
    event.metadata?.thumbnailURL ||
    event.oldValue?.thumbnailURL;

  const profilePicURL =
    event.newValue?.profilePicURL || event.oldValue?.profilePicURL;

  if (event.eventType === 'PROFILE_PICTURE_CHANGED' && profilePicURL) {
    return (
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-ink-200 shrink-0">
        <img src={profilePicURL} alt="Profile" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (thumbnailURL) {
    return (
      <div className="w-36 h-20 rounded-lg overflow-hidden border-2 border-ink-200 shrink-0">
        <img src={thumbnailURL} alt="Thumbnail" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded-lg bg-cream-100 border-2 border-ink-200 flex items-center justify-center text-2xl shrink-0">
      {eventTypeIcon(event.eventType)}
    </div>
  );
}

function EventDescription({ event }) {
  switch (event.eventType) {
    case 'NEW_VIDEO':
      return (
        <p className="text-sm text-ink-700">
          Uploaded: <span className="font-semibold">"{truncate(event.newValue?.title, 70)}"</span>
        </p>
      );
    case 'TITLE_CHANGED':
      return (
        <div className="text-sm space-y-0.5">
          <p className="text-ink-400">
            was: <span className="line-through">{truncate(event.oldValue?.title, 60)}</span>
          </p>
          <p className="text-ink-800">
            now: <span className="font-semibold">{truncate(event.newValue?.title, 60)}</span>
          </p>
        </div>
      );
    case 'THUMBNAIL_CHANGED':
      return (
        <p className="text-sm text-ink-700">
          Changed the thumbnail for a video
          {event.metadata?.title && (
            <span> — <span className="font-medium">"{truncate(event.metadata.title, 40)}"</span></span>
          )}
        </p>
      );
    case 'CHANNEL_RENAMED':
      return (
        <div className="text-sm space-y-0.5">
          <p className="text-ink-400">
            was: <span className="line-through">{event.oldValue?.channelName}</span>
          </p>
          <p className="text-ink-800">
            now: <span className="font-semibold">{event.newValue?.channelName}</span>
          </p>
        </div>
      );
    case 'PROFILE_PICTURE_CHANGED':
      return (
        <p className="text-sm text-ink-700">Changed their profile picture</p>
      );
    default:
      return <p className="text-sm text-ink-500">{event.eventType}</p>;
  }
}

function EmptyFeed({ hasChannels }) {
  return (
    <div className="border-dashed-dark p-12 text-center">
      <div className="text-4xl mb-3">
        {hasChannels ? '🔍' : '👻'}
      </div>
      <h3 className="font-bold text-lg mb-2">
        {hasChannels ? 'Nothing yet' : 'Nothing yet 👻'}
      </h3>
      <p className="text-ink-500 text-sm mb-5">
        {hasChannels
          ? 'No changes detected yet. We check every hour — check back soon!'
          : "Add a channel and we'll surface changes as they happen."}
      </p>
      <Link to="/channels/add" className="btn btn-primary no-underline">
        + Add a channel
      </Link>
    </div>
  );
}
