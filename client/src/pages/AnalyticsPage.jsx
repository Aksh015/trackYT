import { useState, useEffect } from 'react';
import channelService from '../services/channelService';
import { analyticsService } from '../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#0EA5E9', '#F43F5E'];

export default function AnalyticsPage() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await channelService.getChannels();
        setChannels(res.data.data.channels);
        if (res.data.data.channels.length > 0) {
          setSelectedChannel(res.data.data.channels[0]);
        }
      } catch (err) {
        console.error('Failed to fetch channels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await analyticsService.getAnalytics(selectedChannel.channelId);
        setAnalytics(res.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedChannel]);

  if (loading) {
    return (
      <div>
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-black mb-4">Analytics</h1>
        <div className="border-dashed-dark p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-bold text-lg mb-2">No data yet</h3>
          <p className="text-ink-500 text-sm">Add channels first to see analytics.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const uploadsData = analytics?.uploadsPerMonth || [];
  const eventsData = analytics?.eventsPerDay || [];

  // Aggregate events by type for pie chart
  const pieData = analytics?.stats
    ? Object.entries(analytics.stats).map(([key, val]) => ({
        name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        value: val,
      })).filter((d) => d.value > 0)
    : [];

  // Group eventsPerDay into line chart format
  const lineChartData = eventsData.reduce((acc, item) => {
    const existing = acc.find((d) => d.date === item.date);
    if (existing) {
      existing[item.type] = (existing[item.type] || 0) + item.count;
    } else {
      acc.push({ date: item.date, [item.type]: item.count });
    }
    return acc;
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Analytics</h1>
          <p className="text-ink-500 text-sm mt-1">Charts and insights for your channels.</p>
        </div>
      </div>

      {/* Channel selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {channels.map((ch) => (
          <button
            key={ch._id}
            onClick={() => setSelectedChannel(ch)}
            className={`badge-pill whitespace-nowrap ${
              selectedChannel?._id === ch._id ? 'active' : ''
            }`}
          >
            {ch.channelName}
          </button>
        ))}
      </div>

      {analyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="New Videos" value={analytics?.stats?.NEW_VIDEO || 0} color="#10B981" />
            <StatCard label="Title Changes" value={analytics?.stats?.TITLE_CHANGED || 0} color="#F59E0B" />
            <StatCard label="Thumb Changes" value={analytics?.stats?.THUMBNAIL_CHANGED || 0} color="#8B5CF6" />
            <StatCard label="Renames" value={analytics?.stats?.CHANNEL_RENAMED || 0} color="#0EA5E9" />
            <StatCard label="Avg Upload Gap" value={`${analytics?.avgUploadGapDays || 0}d`} color="#F43F5E" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Uploads per month */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4">📊 Uploads Per Month</h3>
              {uploadsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={uploadsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#E63B2E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-ink-400 text-sm">
                  No upload data yet
                </div>
              )}
            </div>

            {/* Event distribution */}
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-4">🥧 Event Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend fontSize={12} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-ink-400 text-sm">
                  No event data yet
                </div>
              )}
            </div>

            {/* Events over time */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-bold text-sm mb-4">📈 Activity Over Time</h3>
              {lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="NEW_VIDEO" stroke="#10B981" strokeWidth={2} dot={false} name="New Videos" />
                    <Line type="monotone" dataKey="TITLE_CHANGED" stroke="#F59E0B" strokeWidth={2} dot={false} name="Title Changes" />
                    <Line type="monotone" dataKey="THUMBNAIL_CHANGED" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Thumb Changes" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-ink-400 text-sm">
                  Not enough data yet — check back after a few monitoring cycles
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs text-ink-400 font-medium mt-1">{label}</div>
    </div>
  );
}
