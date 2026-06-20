import { useState, useEffect } from 'react';
import { eventService } from '../services/analyticsService';
import channelService from '../services/channelService';
import { formatDate, eventTypeLabel, eventTypeBadgeClass, eventTypeIcon, truncate, timeAgo } from '../utils/formatters';

import EventCard from '../components/EventCard';

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsRes, channelsRes] = await Promise.all([
          eventService.getEvents({ page, limit: 50 }),
          channelService.getChannels(),
        ]);
        setEvents(eventsRes.data.data.events);
        setPagination(eventsRes.data.data.pagination);
        setChannels(channelsRes.data.data.channels);
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = formatDate(event.detectedAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {});

  const getChannelName = (channelId) => {
    return channels.find((c) => c.channelId === channelId)?.channelName || channelId;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black">Timeline</h1>
        <p className="text-ink-500 text-sm mt-1">
          A chronological history of all detected changes across your channels.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="skeleton h-5 w-32 mb-3" />
              <div className="space-y-2">
                <div className="skeleton h-32 w-full rounded-2xl" />
                <div className="skeleton h-32 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="border-dashed-dark p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-bold text-lg mb-2">No events yet</h3>
          <p className="text-ink-500 text-sm">Events will appear here as we detect changes in your channels.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-ink-900 hidden sm:block" />

          {Object.entries(groupedEvents).map(([date, dayEvents], groupIndex) => (
            <div key={date} className="mb-8 animate-fade-in-up" style={{ animationDelay: `${groupIndex * 0.08}s` }}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-ink-900 text-white flex items-center justify-center text-sm font-bold relative z-10 shrink-0 shadow-[4px_4px_0px_0px_#FFE4A0] border-2 border-ink-900">
                  📅
                </div>
                <h2 className="text-xl font-black">{date}</h2>
                <span className="text-xs text-ink-500 font-bold bg-white px-2 py-1 border-2 border-ink-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {dayEvents.length} change{dayEvents.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Events for this date */}
              <div className="sm:ml-16 space-y-4">
                {dayEvents.map((event) => (
                  <EventCard key={event._id} event={event} channelName={getChannelName(event.channelId)} />
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-outline text-sm disabled:opacity-30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                ← Newer
              </button>
              <span className="text-sm font-bold text-ink-900">Page {page} of {pagination.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="btn btn-outline text-sm disabled:opacity-30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Older →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
