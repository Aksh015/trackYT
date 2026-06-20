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

  const getChannelName = (channelId) => {
    return channels.find((c) => c.channelId === channelId)?.channelName || channelId;
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
            <EmptyFeed 
              hasChannels={channels.length > 0} 
              onClearFilters={() => {
                setActiveFilter(null);
                setActiveChannel(null);
                setPage(1);
              }}
            />
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event._id} event={event} channelName={getChannelName(event.channelId)} />
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

import EventCard from '../components/EventCard';

function EmptyFeed({ hasChannels, onClearFilters }) {
  if (hasChannels) {
    return (
      <div className="bg-[#FCF8EC] border-[4px] border-ink-900 border-dashed rounded-3xl p-16 text-center shadow-[8px_8px_0px_0px_#1A1A1A]">
        <h3 className="font-bold text-2xl mb-2">No matching events</h3>
        <p className="text-ink-600 mb-6 font-medium">Nothing in your feed matches the current filters.</p>
        <button onClick={onClearFilters} className="px-6 py-2 bg-[#FCF8EC] border-[3px] border-ink-900 rounded-full font-bold text-ink-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FCF8EC] border-[4px] border-ink-900 border-dashed rounded-3xl p-16 text-center shadow-[8px_8px_0px_0px_#1A1A1A]">
      <div className="text-5xl mb-4">👻</div>
      <h3 className="font-black text-2xl mb-2">Nothing yet</h3>
      <p className="text-ink-600 font-medium mb-6">
        Add a channel and we'll surface changes as they happen.
      </p>
      <Link to="/channels/add" className="inline-block px-6 py-2 bg-[#FF5A4F] border-[3px] border-ink-900 rounded-full font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform no-underline">
        + Add a channel
      </Link>
    </div>
  );
}
