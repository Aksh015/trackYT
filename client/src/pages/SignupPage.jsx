import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(240); // 4 minutes

  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Timer effect for OTP step
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(username, email, password);
      if (data.requiresVerification) {
        setUserId(data.userId);
        setStep(2);
        setCountdown(240); // Reset timer
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(userId, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      if (err.response?.status === 429) {
        // Locked out
        setTimeout(() => {
          setStep(1);
          setOtp('');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.resendOtp({ userId });
      setCountdown(240);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="text-3xl">📡</span>
            <span className="text-2xl font-extrabold text-ink-900">
              Track<span className="text-accent-500">YT</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            {step === 1 ? 'Start monitoring YouTube channels for free' : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-semibold mb-1.5">Username</label>
                <input
                  id="signup-username"
                  type="text"
                  className="input"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold mb-1.5">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold mb-1.5">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  className="input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  '🚀 Create Account'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-otp" className="block text-sm font-semibold mb-1.5 text-center">Enter 6-Digit Code</label>
                <input
                  id="signup-otp"
                  type="text"
                  className="input text-center text-2xl tracking-[0.5em] font-mono py-4"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  pattern="\d{6}"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || countdown === 0}
                className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : countdown === 0 ? (
                  'Code Expired'
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="text-center mt-4 text-sm">
                {countdown > 0 ? (
                  <p className="text-ink-500 font-mono">Code expires in {formatTime(countdown)}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-semibold text-accent-500 hover:text-accent-600 transition-colors"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-ink-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent-500 hover:text-accent-600 no-underline">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
