import { useState, useEffect } from 'react';
import { eventService } from '../services/analyticsService';
import channelService from '../services/channelService';
import { formatDate, eventTypeLabel, eventTypeBadgeClass, eventTypeIcon, truncate, timeAgo } from '../utils/formatters';

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
                <div className="skeleton h-12 w-full rounded-lg" />
                <div className="skeleton h-12 w-full rounded-lg" />
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
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-ink-200 hidden sm:block" />

          {Object.entries(groupedEvents).map(([date, dayEvents], groupIndex) => (
            <div key={date} className="mb-8 animate-fade-in-up" style={{ animationDelay: `${groupIndex * 0.08}s` }}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-ink-900 text-white flex items-center justify-center text-sm font-bold relative z-10 shrink-0">
                  📅
                </div>
                <h2 className="text-lg font-bold">{date}</h2>
                <span className="text-xs text-ink-400 font-medium">
                  {dayEvents.length} change{dayEvents.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Events for this date */}
              <div className="sm:ml-16 space-y-2">
                {dayEvents.map((event) => (
                  <div key={event._id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-ink-100 hover:border-ink-300 transition-colors">
                    <span className="text-lg">{eventTypeIcon(event.eventType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{getChannelName(event.channelId)}</span>
                        <span className={`event-badge ${eventTypeBadgeClass(event.eventType)}`}>
                          {eventTypeLabel(event.eventType)}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">
                        <TimelineEventText event={event} />
                      </p>
                    </div>
                    <span className="text-xs text-ink-400 shrink-0">{timeAgo(event.detectedAt)}</span>
                  </div>
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
                className="btn btn-outline text-sm disabled:opacity-30"
              >
                ← Newer
              </button>
              <span className="text-sm text-ink-500">Page {page} of {pagination.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="btn btn-outline text-sm disabled:opacity-30"
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

function TimelineEventText({ event }) {
  switch (event.eventType) {
    case 'NEW_VIDEO':
      return <>Uploaded "{truncate(event.newValue?.title, 50)}"</>;
    case 'TITLE_CHANGED':
      return <>Title: "{truncate(event.oldValue?.title, 30)}" → "{truncate(event.newValue?.title, 30)}"</>;
    case 'THUMBNAIL_CHANGED':
      return <>Changed a video thumbnail</>;
    case 'CHANNEL_RENAMED':
      return <>Renamed: {event.oldValue?.channelName} → {event.newValue?.channelName}</>;
    case 'PROFILE_PICTURE_CHANGED':
      return <>Updated profile picture</>;
    default:
      return <>{event.eventType}</>;
  }
}
