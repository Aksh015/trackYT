import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { load } from '@cashfreepayments/cashfree-js';
import channelService from '../services/channelService';
import billingService from '../services/billingService';

export default function AddChannelPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const res = await billingService.createCheckoutSession();
      if (res.data.data.payment_session_id) {
        const cashfree = await load({ mode: "sandbox" });
        cashfree.checkout({
          paymentSessionId: res.data.data.payment_session_id,
        });
      } else if (res.data.data.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      alert('Failed to start checkout. Please ensure Cashfree is configured.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUpgradeRequired(false);
    setLoading(true);

    try {
      const res = await channelService.addChannel(url);
      navigate('/channels', {
        state: { message: res.data.message },
      });
    } catch (err) {
      if (err.response?.status === 403) {
        setUpgradeRequired(true);
      } else {
        setError(err.response?.data?.message || 'Failed to add channel. Please check the URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-black mb-2">Add Channel</h1>
      <p className="text-ink-500 text-sm mb-8">
        Paste a YouTube channel URL and we'll start monitoring it for changes.
      </p>

      {upgradeRequired ? (
        <div className="bg-[#FFD147] border-[3px] border-ink-900 rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_#111827] animate-fade-in-up">
          <div className="w-16 h-16 bg-white border-[3px] border-ink-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-[4px_4px_0px_0px_#111827]">
            ✨
          </div>
          <h2 className="text-2xl font-black mb-2 text-ink-900">Upgrade to Premium</h2>
          <p className="text-ink-800 mb-6 text-sm font-medium">
            You've reached the 3-channel limit on the Free plan. Upgrade to Premium to track unlimited channels, get instant webhook updates, 15-minute full syncs, and unlimited AI reports.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setUpgradeRequired(false)} 
              className="px-6 py-2.5 bg-white border-[3px] border-ink-900 text-ink-900 font-black rounded-full hover:bg-cream-100 transition-colors shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-none"
            >
              Maybe Later
            </button>
            <button 
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="px-6 py-2.5 bg-[#FF3B30] text-white border-[3px] border-ink-900 rounded-full font-black hover:bg-red-600 transition-colors shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? 'Please wait...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm font-medium">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="channel-url" className="block text-sm font-semibold mb-2">
              Channel URL
            </label>
            <input
              id="channel-url"
              type="url"
              className="input text-base py-3"
              placeholder="https://youtube.com/@MrBeast"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="text-xs text-ink-400 mt-2">
              Supported formats: youtube.com/@handle or youtube.com/channel/UC...
            </p>
          </div>

          <div className="bg-cream-100 rounded-lg p-4 border border-cream-300">
            <h4 className="text-sm font-semibold mb-2">What we'll track:</h4>
            <ul className="text-sm text-ink-600 space-y-1">
              <li>🎬 New video uploads</li>
              <li>✏️ Video title changes</li>
              <li>🖼️ Thumbnail swaps</li>
              <li>📛 Channel name changes</li>
              <li>👤 Profile picture updates</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resolving channel...
              </span>
            ) : (
              '+ Start Monitoring'
            )}
          </button>
        </form>
      </div>
      )}
    </div>
  );
}
