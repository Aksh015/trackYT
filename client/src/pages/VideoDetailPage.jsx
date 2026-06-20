import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import videoService from '../services/videoService';
import { formatDate } from '../utils/formatters';

export default function VideoDetailPage() {
  const { channelId, videoId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const res = await videoService.getVideoHistory(channelId, videoId);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch video history:', err);
      } finally {
        // Add a small artificial delay so the skeleton loader doesn't just flash glitchily if the network is too fast
        setTimeout(() => {
          setLoading(false);
        }, 400);
      }
    };
    fetchVideoData();
  }, [channelId, videoId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pb-12 animate-pulse">
        <div className="mb-6">
          <div className="w-24 h-4 bg-[#F2ECD9] rounded"></div>
        </div>

        {/* Header Skeleton */}
        <div className="neo-card p-6 mb-8 flex flex-col md:flex-row gap-6 items-start bg-[#FCF8EC]">
          <div className="w-full md:w-80 h-48 bg-[#F2ECD9] rounded-xl border-4 border-ink-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
          <div className="flex-1 space-y-4 w-full pt-2">
            <div className="h-4 bg-[#F2ECD9] rounded w-1/4"></div>
            <div className="h-8 bg-[#F2ECD9] rounded w-3/4"></div>
            <div className="h-4 bg-[#F2ECD9] rounded w-1/3"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="neo-card-sm h-24 bg-[#F2ECD9] bg-opacity-50"></div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="neo-card h-96 bg-[#F2ECD9] bg-opacity-50"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 flex flex-col items-center">
        <div className="text-xl font-bold mb-4">Video not found</div>
        <Link to="/" className="btn btn-primary">Back to feed</Link>
      </div>
    );
  }

  const { currentDetails, stats, events, metrics } = data;
  
  // Calculate some derived stats based on the latest time series point
  const latestStats = stats[stats.length - 1] || { views: 0, likes: 0, comments: 0 };
  const viewCount = latestStats.views;
  const likeCount = latestStats.likes;
  const commentCount = latestStats.comments;
  
  const likeRate = viewCount > 0 ? ((likeCount / viewCount) * 100).toFixed(2) : '0.00';
  const commentRate = viewCount > 0 ? ((commentCount / viewCount) * 100).toFixed(2) : '0.00';
  
  // If we have publishedAt in the database we could use it, otherwise fall back to first tracked date
  const firstTracked = stats[0]?.timestamp ? new Date(stats[0].timestamp) : new Date();
  const daysTracked = Math.max(1, Math.ceil((new Date() - firstTracked) / (1000 * 60 * 60 * 24)));
  const viewsPerDay = Math.round(viewCount / daysTracked);

  const publishedAtDate = currentDetails.publishedAt ? new Date(currentDetails.publishedAt) : null;

  // Filter out the unique titles from events + current
  const titleEvents = events.filter(e => e.eventType === 'TITLE_CHANGED');
  const titleHistory = [
    { title: currentDetails.title, date: 'current' },
    ...titleEvents.map(e => ({ title: e.oldValue.title, date: formatDate(e.detectedAt) }))
  ];

  // Prepare chart data
  const chartData = stats.map(s => ({
    time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: s.timestamp,
    views: s.views,
  }));

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <Link to="/" className="text-sm font-bold text-ink-600 hover:text-ink-900 flex items-center gap-2 transition-colors">
          ← Back to feed
        </Link>
      </div>

      {/* Header Card */}
      <div className="neo-card p-6 mb-8 flex flex-col md:flex-row gap-6 items-start">
        {currentDetails.thumbnailURL && (
          <img 
            src={currentDetails.thumbnailURL} 
            alt="Thumbnail" 
            className="w-full md:w-80 rounded-xl border-4 border-ink-900 object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
          />
        )}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-black mb-3">
            <a 
              href={`https://youtube.com/watch?v=${videoId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline transition-colors block"
            >
              {currentDetails.title}
            </a>
          </h1>
          <p className="text-ink-500 font-medium mb-4">
            {publishedAtDate ? (
              <>Published on <span className="font-bold text-ink-900">{formatDate(publishedAtDate)}</span> • Tracked since {formatDate(firstTracked)}</>
            ) : (
              <>Tracked since {formatDate(firstTracked)}</>
            )}
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-bold">
            <span className="flex items-center gap-1">👁 {viewCount.toLocaleString()}</span>
            <span className="flex items-center gap-1">👍 {likeCount.toLocaleString()}</span>
            <span className="flex items-center gap-1">💬 {commentCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatCard title="VIEWS" value={viewCount >= 1000 ? (viewCount/1000).toFixed(1) + 'K' : viewCount} sub="" />
        <StatCard title="LIKES" value={likeCount} sub="" />
        <StatCard title="COMMENTS" value={commentCount} sub="" />
        <StatCard title="LIKE RATE" value={`${likeRate}%`} sub="likes ÷ views" />
        <StatCard title="COMMENT RATE" value={`${commentRate}%`} sub="comments ÷ views" />
        
        <StatCard title="VIEWS / DAY" value={viewsPerDay >= 1000 ? (viewsPerDay/1000).toFixed(1) + 'K' : viewsPerDay} sub="since tracking" />
        <StatCard title="DAYS TRACKED" value={daysTracked} sub={`since ${formatDate(firstTracked)}`} />
        <StatCard title="TITLE EDITS" value={metrics.totalTitleEdits} sub="" />
        <StatCard title="THUMBNAIL SWAPS" value={metrics.totalThumbSwaps} sub="" />
        <StatCard title="A/B TESTS" value="0" sub="" />
      </div>

      {/* Title History */}
      {titleHistory.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-black mb-4">Title history <span className="text-ink-400 text-base">({titleHistory.length})</span></h2>
          <div className="space-y-3">
            {titleHistory.map((item, idx) => (
              <div key={idx} className="neo-card-sm flex justify-between items-center gap-4">
                <p className="font-bold text-lg">{item.title}</p>
                <span className="text-sm font-medium text-ink-500 shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Views Over Time Chart */}
      {chartData.length > 0 && (
        <div>
          <h2 className="text-xl font-black mb-4">Views over time</h2>
          <div className="neo-card p-6 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDDDDD" />
                <XAxis dataKey="time" axisLine={true} tickLine={false} tick={{ fill: '#777', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={true} tickLine={false} tick={{ fill: '#777', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}K` : val} />
                <RechartsTooltip 
                  contentStyle={{ border: '3px solid #1A1A1A', borderRadius: '8px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#E63B2E' }}
                />
                
                {/* Draw vertical lines for events */}
                {events.map((e, idx) => (
                  <ReferenceLine 
                    key={idx} 
                    x={new Date(e.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                    stroke={e.eventType === 'TITLE_CHANGED' ? '#3B82F6' : '#10B981'} 
                    strokeDasharray="3 3"
                  />
                ))}

                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#FF5A4F" 
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6, fill: '#1A1A1A', stroke: '#FFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="flex gap-4 mt-4 text-xs font-bold text-ink-500">
              <div className="flex items-center gap-1">
                <div className="w-4 border-t-2 border-dashed border-blue-500"></div> Title change
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 border-t-2 border-dashed border-emerald-500"></div> Thumbnail swap
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, sub }) {
  return (
    <div className="neo-card-sm flex flex-col justify-center">
      <p className="text-[10px] font-black tracking-wider text-ink-500 mb-1">{title}</p>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className="text-[10px] font-bold text-ink-400">{sub || '\u00A0'}</p>
    </div>
  );
}
