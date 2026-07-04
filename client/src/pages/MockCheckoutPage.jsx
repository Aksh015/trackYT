import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CreditCard, ShieldCheck } from 'lucide-react';
import billingService from '../services/billingService';
import { useAuth } from '../contexts/AuthContext';

export default function MockCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const handlePay = async () => {
    try {
      setLoading(true);
      // Call our fake webhook
      await billingService.mockSuccess();
      
      // Update local user state
      updateUser({ ...user, planType: 'PREMIUM' });
      
      // Redirect back with success!
      navigate('/billing?success=true');
    } catch (err) {
      console.error('Failed to process mock payment', err);
      alert('Mock payment failed');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/billing?canceled=true');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cream-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 border-[3px] border-ink-900 rounded-3xl shadow-[8px_8px_0px_0px_#111827]">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-500 mb-4">
            <Sparkles className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-black text-ink-900 tracking-tight">TrackYT Pro</h2>
          <p className="mt-2 text-sm text-ink-600 font-medium">
            Test Mode Checkout
          </p>
        </div>

        <div className="bg-cream-100 rounded-xl p-6 border-2 border-dashed border-ink-200">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-ink-800">Pro Plan (Monthly)</span>
            <span className="font-black text-xl">$10.00</span>
          </div>
          <div className="flex items-center text-sm text-ink-500 gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            No real card required. This is a simulation.
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-4">
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border-[3px] border-ink-900 rounded-full shadow-[4px_4px_0px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] active:translate-y-1 active:shadow-none text-white bg-emerald-500 hover:bg-emerald-600 font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            {loading ? 'Processing...' : 'Pay $10.00 & Upgrade'}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border-2 border-transparent rounded-full text-sm font-bold text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition-colors"
          >
            Cancel and return
          </button>
        </div>
      </div>
    </div>
  );
}
