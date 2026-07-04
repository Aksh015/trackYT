import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import channelService from '../services/channelService';
import billingService from '../services/billingService';
import PricingCards from '../components/PricingCards';

export default function BillingPage() {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [channelCount, setChannelCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const syncBackend = async () => {
        try {
          // In a real prod environment, webhooks handle this. 
          // Since this is localhost/sandbox, webhooks can't reach us, so we manually sync.
          await billingService.mockSuccess();
        } catch (err) {
          console.error('Failed to sync backend upgrade:', err);
        }
      };
      syncBackend();

      alert('Subscription successful! Your account is now upgraded to Premium.');
      if (user) {
        updateUser({ ...user, planType: 'PREMIUM' });
      }
      searchParams.delete('success');
      setSearchParams(searchParams);
    }
    if (searchParams.get('canceled') === 'true') {
      alert('Checkout canceled.');
      searchParams.delete('canceled');
      setSearchParams(searchParams);
    }
    const fetchChannelCount = async () => {
      try {
        const res = await channelService.getChannels();
        setChannelCount(res.data.data.channels.length);
      } catch (err) {
        console.error('Failed to fetch channels for billing:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannelCount();
  }, []);

  const isPro = user?.planType?.toUpperCase() === 'PREMIUM';
  const planType = isPro ? 'PREMIUM' : 'FREE';
  const planLimit = isPro ? 'unlimited' : 3;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="skeleton h-12 w-48 mb-4"></div>
        <div className="skeleton h-6 w-64 mb-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="skeleton h-96 rounded-3xl"></div>
          <div className="skeleton h-96 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in py-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1 text-red-500 font-bold tracking-tight">
          your plan 🧾
        </div>
        <h1 className="text-4xl font-black mb-3 text-ink-900 tracking-tight">Billing</h1>
        <p className="text-ink-600 font-medium">
          You're tracking <strong>{channelCount}</strong> of {planLimit} channels on the <strong className="text-ink-900">{planType === 'FREE' ? 'Free' : 'Pro'}</strong> plan.
        </p>
      </div>

      <PricingCards currentPlan={planType} isLoggedIn={true} />


    </div>
  );
}
