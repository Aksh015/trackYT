import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TrackYTLogo from '../components/TrackYTLogo';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center animate-fade-in-up">
          {/* Hero Eye Logo */}
          <div className="flex justify-center mb-8">
            <TrackYTLogo size={120} variant="hero" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-ink-900 bg-white text-sm font-semibold mb-8">
            <span>👁️</span>
            <span>100% Free • No Paid APIs</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-ink-900 mb-6 leading-tight">
            Track every move<br />
            on <span className="text-accent-500">YouTube</span>
          </h1>

          <p className="text-lg sm:text-xl text-ink-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Monitor channels for new videos, title rewrites, thumbnail swaps,
            and channel rebrands. AI-powered insights delivered to your dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              className="btn btn-primary text-base px-8 py-3 no-underline"
            >
              ⚡ Start Tracking Free
            </Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="btn btn-outline text-base px-8 py-3 no-underline"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="card animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-ink-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Event types showcase */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-8">Everything we detect</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {eventTypes.map((et) => (
              <span key={et.label} className={`event-badge ${et.cls} text-sm px-4 py-2`}>
                {et.icon} {et.label}
              </span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-12 h-12 rounded-full bg-ink-900 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-ink-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 border-dashed-dark p-10 text-center bg-white">
          <h2 className="text-2xl font-bold mb-3">Ready to start monitoring?</h2>
          <p className="text-ink-500 mb-6">No credit card. No paid APIs. Free forever.</p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/signup'}
            className="btn btn-primary text-base px-8 py-3 no-underline"
          >
            🚀 Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: '🎬',
    title: 'New Video Alerts',
    desc: 'Instantly know when a channel uploads. Never miss a new video from your watchlist.',
  },
  {
    icon: '✏️',
    title: 'Title & Thumbnail Tracking',
    desc: 'Catch A/B tests in real-time. See exactly when titles or thumbnails change.',
  },
  {
    icon: '🤖',
    title: 'AI Activity Summaries',
    desc: 'Get smart summaries powered by Google Gemini. Understand upload patterns at a glance.',
  },
];

const eventTypes = [
  { label: 'New videos', icon: '🎬', cls: 'event-badge-new-video' },
  { label: 'Title changes', icon: '✏️', cls: 'event-badge-title-changed' },
  { label: 'Thumbnail changes', icon: '🖼️', cls: 'event-badge-thumbnail-changed' },
  { label: 'Channel renames', icon: '📛', cls: 'event-badge-channel-renamed' },
  { label: 'Avatar changes', icon: '👤', cls: 'event-badge-profile-pic' },
];

const steps = [
  {
    title: 'Add Channels',
    desc: 'Paste a YouTube channel URL. We resolve it and start monitoring automatically.',
  },
  {
    title: 'We Monitor Hourly',
    desc: 'Our cron job checks every channel every hour for any changes — completely hands-free.',
  },
  {
    title: 'Get Your Feed',
    desc: 'See all changes in a clean, chronological feed with AI-powered summaries.',
  },
];
