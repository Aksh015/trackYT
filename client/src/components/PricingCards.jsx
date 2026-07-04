import { useState } from 'react';
import { Link } from 'react-router-dom';
import { load } from '@cashfreepayments/cashfree-js';
import billingService from '../services/billingService';
import { useAuth } from '../contexts/AuthContext';

export default function PricingCards({ currentPlan = null, isLoggedIn = false }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);

  const handleDowngrade = async () => {
    try {
      setDowngradeLoading(true);
      await billingService.mockDowngrade();
      updateUser({ ...user, planType: 'FREE' });
      alert('Downgraded to Free plan.');
    } catch (err) {
      console.error('Failed to downgrade:', err);
      alert('Failed to downgrade.');
    } finally {
      setDowngradeLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const res = await billingService.createCheckoutSession();
      if (res.data.data.payment_session_id) {
        const cashfree = await load({ mode: "sandbox" });
        cashfree.checkout({
          paymentSessionId: res.data.data.payment_session_id,
        });
      } else if (res.data.data.url) {
        // Fallback for mock checkout
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      alert('Failed to start checkout. Please ensure Cashfree is configured.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-8">
      {/* Free Card */}
      <div className="bg-cream-50 border-[3px] border-ink-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_#111827] flex flex-col relative transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#111827] animate-fade-in-up">
        {currentPlan === 'FREE' && (
          <div className="absolute top-6 right-6 border-[2px] border-ink-900 rounded px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white">
            Current
          </div>
        )}
        <h3 className="text-3xl font-black mb-3 text-ink-900">Free</h3>
        <p className="text-ink-600 mb-6 font-medium">For keeping an eye on a rival or two.</p>
        <div className="mb-8 text-ink-900">
          <span className="text-5xl font-black">$0</span>
        </div>
        
        <ul className="space-y-4 mb-10 flex-1 font-semibold text-ink-800">
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span>Track up to <strong>3 channels</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span><strong>1 AI report</strong> per month</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span>Daily automated tracking</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span>Title & thumbnail change history</span>
          </li>
        </ul>

        {currentPlan === 'PREMIUM' ? (
          <button 
            onClick={handleDowngrade}
            disabled={downgradeLoading}
            className="w-full py-3 bg-white text-ink-900 border-[3px] border-ink-900 rounded-full font-black text-lg hover:bg-cream-100 transition-colors mt-auto shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {downgradeLoading ? 'Please wait...' : 'Switch to Free (Test)'}
          </button>
        ) : isLoggedIn ? (
          <div className="text-sm font-bold text-ink-400 mt-auto pt-4 border-t-2 border-ink-200">
            Included by default
          </div>
        ) : (
          <Link to="/signup" className="block text-center w-full py-3 border-[3px] border-ink-900 rounded-full font-black text-lg hover:bg-cream-100 transition-colors bg-white mt-auto shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-none">
            Start free
          </Link>
        )}
      </div>

      {/* Pro Card */}
      <div className="bg-[#FFD147] border-[3px] border-ink-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_#111827] flex flex-col relative transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#111827] animate-fade-in-up stagger-1">
        {currentPlan !== 'PREMIUM' && (
          <div className="absolute -top-4 -right-2 bg-ink-900 text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] rotate-3">
            Most Popular
          </div>
        )}
        {currentPlan === 'PREMIUM' && (
          <div className="absolute top-6 right-6 border-[2px] border-ink-900 rounded px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white">
            Current
          </div>
        )}
        
        <h3 className="text-3xl font-black mb-3 text-ink-900">Pro</h3>
        <p className="text-ink-800 mb-6 font-medium">For watching your whole niche.</p>
        <div className="mb-8 flex items-baseline gap-1 text-ink-900">
          <span className="text-4xl font-black text-ink-900 tracking-tight">₹799</span>
          <span className="font-bold text-lg">/ mo</span>
        </div>
        
        <ul className="space-y-4 mb-10 flex-1 font-semibold text-ink-900">
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span>Track <strong>unlimited channels</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span><strong>Unlimited</strong> AI reports</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span><strong>Hourly</strong> automated tracking</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 font-black">✓</span>
            <span>Cancel anytime, no lock-in</span>
          </li>
        </ul>

        {currentPlan === 'PREMIUM' ? (
          <div className="text-sm font-bold text-ink-800 mt-auto pt-4 border-t-2 border-ink-900/10">
            You are on the Pro plan!
          </div>
        ) : isLoggedIn ? (
          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3 bg-[#FF3B30] text-white border-[3px] border-ink-900 rounded-full font-black text-lg hover:bg-red-600 transition-colors mt-auto shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : 'Upgrade to Pro →'}
          </button>
        ) : (
          <Link to="/signup" className="block text-center w-full py-3 bg-[#FF3B30] text-white border-[3px] border-ink-900 rounded-full font-black text-lg hover:bg-red-600 transition-colors mt-auto shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-none">
            Go Pro →
          </Link>
        )}
      </div>
    </div>
  );
}
