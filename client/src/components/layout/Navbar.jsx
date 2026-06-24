import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TrackYTLogo from '../TrackYTLogo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/dashboard', label: 'Feed' },
    { path: '/channels', label: 'Channels' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-bg-base/90 backdrop-blur-sm border-b-2 border-ink-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-1.5 no-underline">
            <TrackYTLogo size={32} variant="navbar" />
            <span className="text-xl font-extrabold tracking-tight text-ink-900">
              Track<span className="text-primary">YT</span>
            </span>
          </Link>

          {/* Nav Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold no-underline transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-ink-900 text-white'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full border border-emerald-500 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                  Free
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-ink-900 flex items-center justify-center text-white text-sm font-bold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-ink-500 hover:text-ink-900 cursor-pointer bg-transparent border-none transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost text-sm no-underline">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-primary text-sm no-underline">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {isAuthenticated && (
        <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1 rounded-full text-xs font-semibold no-underline whitespace-nowrap transition-all ${
                isActive(link.path)
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-600 hover:bg-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
