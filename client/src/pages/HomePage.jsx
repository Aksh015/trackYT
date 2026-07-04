import { Link } from 'react-router-dom';
import { Eye, Zap, Video, PenTool, Bot, Image as ImageIcon, Tag, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TrackYTLogo from '../components/TrackYTLogo';
import PricingCards from '../components/PricingCards';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center animate-fade-in-up">
          {/* Hero Eye Logo */}
          <div className="flex justify-center mb-8">
            <TrackYTLogo size={120} variant="hero" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-ink-900 bg-white text-sm font-semibold mb-8">
            <Eye className="w-4 h-4 text-primary" strokeWidth={3} />
            <span>Freemium • No Paid APIs</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-ink-900 mb-6 leading-tight">
            Track every move<br />
            on <span className="text-primary">YouTube</span>
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
              <Zap className="w-5 h-5" strokeWidth={3} />
              Start for Free
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
            {eventTypes.map((et, idx) => {
              const Icon = et.icon;
              return (
                <span key={et.label} className={`event-badge ${et.cls} text-sm px-4 py-2 border-2 border-ink-900 shadow-[2px_2px_0px_0px_#111]`}>
                  <Icon className="w-4 h-4 mr-1" strokeWidth={3} /> {et.label}
                </span>
              );
            })}
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

        {/* Pricing */}
        <div className="mt-24 mb-12 relative">
          <div className="absolute inset-0 bg-cream-100 transform -skew-y-2 z-0 scale-110"></div>
          <div className="relative z-10 py-12">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 text-ink-900">Simple, transparent pricing</h2>
            <p className="text-center text-ink-600 font-medium mb-12 max-w-xl mx-auto">Start for free, upgrade when you need more power.</p>
            <PricingCards isLoggedIn={isAuthenticated} />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 border-card shadow-[8px_8px_0px_0px_#111] p-10 text-center bg-white">
          <h2 className="text-2xl font-bold mb-3">Ready to start monitoring?</h2>
          <p className="text-ink-500 mb-6 font-medium">No credit card required. Start for free today.</p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/signup'}
            className="btn btn-primary text-base px-8 py-3 no-underline"
          >
            <Zap className="w-5 h-5" strokeWidth={3} />
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: <Video className="w-8 h-8 text-primary" strokeWidth={2} />,
    title: 'New Video Alerts',
    desc: 'Instantly know when a channel uploads. Never miss a new video from your watchlist.',
  },
  {
    icon: <PenTool className="w-8 h-8 text-secondary" strokeWidth={2} />,
    title: 'Title & Thumbnail Tracking',
    desc: 'Catch A/B tests in real-time. See exactly when titles or thumbnails change.',
  },
  {
    icon: <Bot className="w-8 h-8 text-tertiary" strokeWidth={2} />,
    title: 'AI Activity Summaries',
    desc: 'Get smart summaries powered by Google Gemini. Understand upload patterns at a glance.',
  },
];

const eventTypes = [
  { label: 'New videos', icon: Video, cls: 'event-badge-new-video' },
  { label: 'Title changes', icon: PenTool, cls: 'event-badge-title-changed' },
  { label: 'Thumbnail changes', icon: ImageIcon, cls: 'event-badge-thumbnail-changed' },
  { label: 'Channel renames', icon: Tag, cls: 'event-badge-channel-renamed' },
  { label: 'Avatar changes', icon: User, cls: 'event-badge-profile-pic' },
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
