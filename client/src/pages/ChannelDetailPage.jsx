import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import channelService from '../services/channelService';
import { eventService, analyticsService } from '../services/analyticsService';
import { timeAgo, formatDate, eventTypeLabel, eventTypeBadgeClass, eventTypeIcon, truncate } from '../utils/formatters';

export default function ChannelDetailPage() {
  const { id } = useParams();
  const [channel, setChannel] = useState(null);
  const [events, setEvents] = useState([]);
  const [aiReport, setAiReport] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await channelService.getChannel(id);
        setChannel(res.data.data.channel);

        const eventsRes = await eventService.getChannelEvents(res.data.data.channel.channelId);
        setEvents(eventsRes.data.data.events);
      } catch (err) {
        console.error('Failed to fetch channel:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const fetchAISummary = async (refresh = false) => {
    if (!channel) return;
    setAiLoading(true);
    try {
      const res = await analyticsService.getAISummary(channel.channelId, refresh);
      setAiReport(res.data.data.report);
      setUpgradeRequired(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setUpgradeRequired(true);
      } else {
        console.error('Failed to fetch AI summary:', err);
      }
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (channel && activeTab === 'ai') {
      fetchAISummary();
    }
  }, [channel, activeTab]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="border-dashed-dark p-12 text-center">
        <h2 className="text-xl font-bold mb-2">Channel not found</h2>
        <Link to="/channels" className="text-accent-500 no-underline">← Back to channels</Link>
      </div>
    );
  }

  const tabs = [
    { key: 'events', label: 'Events Timeline' },
    { key: 'ai', label: 'AI Insights' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Channel Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-ink-900 shrink-0">
            {channel.profilePicURL ? (
              <img src={channel.profilePicURL} alt={channel.channelName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cream-200 flex items-center justify-center text-2xl font-bold">
                {channel.channelName?.[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{channel.channelName}</h1>
            <p className="text-ink-400 text-sm">
              {channel.channelHandle || channel.channelId}
            </p>
            {channel.description && (
              <p className="text-ink-500 text-sm mt-2 whitespace-pre-line">{channel.description}</p>
            )}
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-xs text-ink-400">
              Tracking since {formatDate(channel.createdAt)}
            </span>
            {channel.lastCheckedAt && (
              <span className="text-xs text-ink-400">
                Last checked {timeAgo(channel.lastCheckedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mt-5 pt-5 border-t border-ink-100">
          <StatBox label="Total Events" value={events.length} />
          <StatBox label="New Videos" value={events.filter((e) => e.eventType === 'NEW_VIDEO').length} />
          <StatBox label="Title Changes" value={events.filter((e) => e.eventType === 'TITLE_CHANGED').length} />
          <StatBox label="Thumb Changes" value={events.filter((e) => e.eventType === 'THUMBNAIL_CHANGED').length} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer border-none ${
              activeTab === tab.key
                ? 'bg-ink-900 text-white'
                : 'bg-white text-ink-600 hover:bg-cream-100 border border-ink-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="border-dashed-dark p-8 text-center">
              <p className="text-ink-500">No events detected yet. Check back after the next monitoring cycle.</p>
            </div>
          ) : (
            events.map((event, i) => (
              <div key={event._id} className="card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-base">
                    {eventTypeIcon(event.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`event-badge ${eventTypeBadgeClass(event.eventType)}`}>
                        {eventTypeLabel(event.eventType)}
                      </span>
                      <span className="time-badge">{timeAgo(event.detectedAt)}</span>
                    </div>
                    <div className="text-sm text-ink-700 mt-1">
                      <EventDetail event={event} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">🤖 AI Activity Summary</h3>
            <button
              onClick={() => fetchAISummary(true)}
              disabled={aiLoading}
              className="btn btn-outline text-sm"
            >
              {aiLoading ? 'Generating...' : '↻ Regenerate'}
            </button>
          </div>

          {aiLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
              <div className="skeleton h-4 w-4/6" />
            </div>
          ) : upgradeRequired ? (
            <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl shadow-inner">
                ✨
              </div>
              <h4 className="text-xl font-bold mb-2 text-indigo-900">Upgrade to Premium</h4>
              <p className="text-indigo-700 mb-5 text-sm">
                Free users can only generate 1 fresh AI report per month. Upgrade to Premium for unlimited on-demand AI reports and insights!
              </p>
              <button 
                onClick={() => setUpgradeRequired(false)}
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 border-none shadow-sm"
              >
                Close
              </button>
            </div>
          ) : aiReport ? (
            <div>
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
                {aiReport.summary}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-ink-100">
                <MiniStat label="Videos" value={aiReport.stats?.totalVideos || 0} />
                <MiniStat label="Title Changes" value={aiReport.stats?.titleChanges || 0} />
                <MiniStat label="Thumb Changes" value={aiReport.stats?.thumbnailChanges || 0} />
                <MiniStat label="Avg Gap" value={`${aiReport.stats?.avgUploadGapDays || 0}d`} />
              </div>
              <p className="text-xs text-ink-400 mt-4">
                Generated {timeAgo(aiReport.generatedAt)} • Period: {formatDate(aiReport.periodStart)} – {formatDate(aiReport.periodEnd)}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-ink-500 mb-4">No AI summary generated yet.</p>
              <button onClick={() => fetchAISummary(true)} className="btn btn-primary">
                🤖 Generate Summary
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="flex-1 text-center p-3 bg-cream-50 rounded-lg">
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-ink-400 font-medium">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center p-2 bg-cream-50 rounded-lg">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-ink-400">{label}</div>
    </div>
  );
}

function EventDetail({ event }) {
  switch (event.eventType) {
    case 'NEW_VIDEO':
      return <span>Uploaded: <strong>"{truncate(event.newValue?.title, 60)}"</strong></span>;
    case 'TITLE_CHANGED':
      return (
        <span>
          <span className="text-ink-400 line-through">{truncate(event.oldValue?.title, 40)}</span>
          {' → '}
          <strong>{truncate(event.newValue?.title, 40)}</strong>
        </span>
      );
    case 'THUMBNAIL_CHANGED':
      return <span>Changed thumbnail{event.metadata?.title ? ` for "${truncate(event.metadata.title, 40)}"` : ''}</span>;
    case 'CHANNEL_RENAMED':
      return <span>{event.oldValue?.channelName} → <strong>{event.newValue?.channelName}</strong></span>;
    case 'PROFILE_PICTURE_CHANGED':
      return <span>Updated profile picture</span>;
    default:
      return <span>{event.eventType}</span>;
  }
}
