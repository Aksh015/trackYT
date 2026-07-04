import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TrackYTLogo from '../TrackYTLogo';
import { Settings, LogOut, User, CreditCard, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navLinks = [
    { path: '/dashboard', label: 'Feed' },
    { path: '/channels', label: 'Channels' },
    { path: '/billing', label: 'Billing' },
  ];

  const isActive = (path) => location.pathname === path;
  const isPremium = user?.planType?.toUpperCase() === 'PREMIUM';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

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
              <div className="relative" ref={dropdownRef}>
                {/* Profile Trigger Button */}
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border-2 border-ink-900 bg-white hover:bg-ink-100 transition-all duration-200 cursor-pointer"
                  style={{ boxShadow: dropdownOpen ? '3px 3px 0px 0px #111' : '2px 2px 0px 0px #111' }}
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-ink-900 flex items-center justify-center text-white text-xs font-black overflow-hidden flex-shrink-0">
                    {user?.profilePicURL ? (
                      <img src={user.profilePicURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>

                  {/* Username */}
                  <span className="hidden sm:block text-xs font-black text-ink-900 truncate max-w-[80px]">{user?.username}</span>

                  <ChevronDown className={`w-3.5 h-3.5 text-ink-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 bg-white border-2 border-ink-900 rounded-xl overflow-hidden animate-fade-in"
                    style={{ boxShadow: '4px 4px 0px 0px #111' }}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b-2 border-ink-100 bg-bg-base">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-ink-900 flex items-center justify-center text-white text-sm font-black overflow-hidden flex-shrink-0">
                          {user?.profilePicURL ? (
                            <img src={user.profilePicURL} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            user?.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-black text-ink-900 truncate">{user?.username}</p>
                          <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1.5">
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 hover:text-ink-900 no-underline transition-colors"
                      >
                        <Settings className="w-4 h-4 text-ink-500" />
                        Settings
                      </Link>
                      <Link
                        to="/billing"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 hover:text-ink-900 no-underline transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-ink-500" />
                        Billing & Plans
                        {!isPremium && (
                          <span className="ml-auto text-[10px] font-black bg-primary text-white px-1.5 py-0.5 rounded-full">
                            Upgrade
                          </span>
                        )}
                        {isPremium && (
                          <span className="ml-auto text-[10px] font-black bg-amber-100 text-amber-600 border border-amber-300 px-1.5 py-0.5 rounded-full">
                            Pro
                          </span>
                        )}
                      </Link>
                    </div>

                    {/* Divider + Logout */}
                    <div className="border-t-2 border-ink-100 py-1.5">
                      <button
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
