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
  const [scanning, setScanning] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeChannels, setActiveChannels] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (activeFilters.length > 0) params.eventType = activeFilters.join(',');
      if (activeChannels.length > 0) params.channelId = activeChannels.join(',');

      const res = await eventService.getEvents(params);
      setEvents(res.data.data.events);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilters, activeChannels]);

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
  }, [activeFilters, activeChannels]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const [scanStatus, setScanStatus] = useState(null); // null | 'scanning' | 'success' | 'rate_limited' | 'error'

  const handleRefresh = async () => {
    setScanning(true);
    setScanStatus('scanning');
    try {
      await channelService.refreshChannels();
      setScanStatus('success');
      setPage(1);
      await fetchEvents();
      setTimeout(() => setScanStatus(null), 4000);
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      setScanStatus(serverMsg === 'rate_limited' ? 'rate_limited' : 'error');
      setTimeout(() => setScanStatus(null), 5000);
    } finally {
      setScanning(false);
    }
  };

  const getChannelName = (channelId) => {
    return channels.find((c) => c.channelId === channelId)?.channelName || channelId;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-accent-500 font-semibold text-sm mb-1">your watchlist 👀</p>
          <h1 className="text-3xl font-black">Feed</h1>
          <p className="text-ink-500 text-sm mt-1">
            New videos, title rewrites, thumbnail swaps, and channel rebrands across the channels you watch.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={scanning}
          className={`btn btn-outline text-sm ${scanning ? 'opacity-70 cursor-wait' : ''}`}
        >
          {scanning ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-ink-300 border-t-ink-900 rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            '↻ Refresh feed'
          )}
        </button>
      </div>

      {/* Scan status toast */}
      {scanStatus && (
        <div className="mb-5 animate-fade-in-up">
          {scanStatus === 'scanning' ? (
            <div className="relative overflow-hidden bg-white border-3 border-ink-900 rounded-2xl px-5 py-3.5 shadow-[4px_4px_0px_0px_#1A1A1A]">
              <div className="absolute inset-0 bg-gradient-to-r from-cream-200/40 via-transparent to-cream-200/40" style={{ animation: 'skeleton-shimmer 2s ease infinite' }} />
              <div className="relative flex items-center gap-3">
                <span className="inline-block w-4 h-4 border-2 border-ink-200 border-t-accent-500 rounded-full animate-spin shrink-0" />
                <span className="text-sm font-semibold text-ink-700">Checking all channels for updates</span>
              </div>
            </div>
          ) : scanStatus === 'success' ? (
            <div className="bg-white border-3 border-ink-900 rounded-2xl px-5 py-3.5 shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm font-semibold text-ink-800">Feed updated — you're all caught up</span>
              </div>
              <button onClick={() => setScanStatus(null)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-ink-100 text-ink-400 hover:text-ink-900 transition-colors bg-transparent border-none cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : scanStatus === 'rate_limited' ? (
            <div className="bg-white border-3 border-ink-900 rounded-2xl px-5 py-3.5 shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
                </div>
                <span className="text-sm font-semibold text-ink-800">Too many requests — try again in a couple minutes</span>
              </div>
              <button onClick={() => setScanStatus(null)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-ink-100 text-ink-400 hover:text-ink-900 transition-colors bg-transparent border-none cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <div className="bg-white border-3 border-ink-900 rounded-2xl px-5 py-3.5 shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <span className="text-sm font-semibold text-ink-800">Something went wrong — please try again</span>
              </div>
              <button onClick={() => setScanStatus(null)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-ink-100 text-ink-400 hover:text-ink-900 transition-colors bg-transparent border-none cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main layout: sidebar + feed */}
      <div className="flex gap-6 items-start">
        {/* Left Sidebar — Filters */}
        <aside className="w-72 shrink-0 hidden lg:block">
          <div className="card p-5 sticky top-24">
            {/* KIND filter */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Kind</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilters([])}
                  className={`badge-pill ${activeFilters.length === 0 ? 'active' : ''}`}
                >
                  All changes
                </button>
                {FILTER_KINDS.filter(f => f.key !== null).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      if (activeFilters.includes(f.key)) {
                        setActiveFilters(activeFilters.filter(k => k !== f.key));
                      } else {
                        setActiveFilters([...activeFilters, f.key]);
                      }
                    }}
                    className={`badge-pill ${activeFilters.includes(f.key) ? 'active' : ''}`}
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
                    onClick={() => setActiveChannels([])}
                    className={`badge-pill ${activeChannels.length === 0 ? 'active' : ''}`}
                  >
                    All
                  </button>
                  {channels.map((ch) => (
                    <button
                      key={ch.channelId}
                      onClick={() => {
                        if (activeChannels.includes(ch.channelId)) {
                          setActiveChannels(activeChannels.filter(c => c !== ch.channelId));
                        } else {
                          setActiveChannels([...activeChannels, ch.channelId]);
                        }
                      }}
                      className={`badge-pill ${activeChannels.includes(ch.channelId) ? 'active' : ''}`}
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
