/**
 * TrialBanner — shown at the top of every dashboard page during the trial period.
 * Counts down to trial expiry and prompts the user to set up billing.
 * Disappears once billing is active or the user dismisses it.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, CreditCard, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';

export default function TrialBanner() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{
    is_trial: boolean;
    days_remaining: number;
    has_billing: boolean;
    trial_ends_at: string | null;
  } | null>(null);

  useEffect(() => {
    // Only fetch for agency admins
    if (!user?.agency_id) return;
    fetchTrialStatus();
  }, [user?.agency_id]);

  const fetchTrialStatus = async () => {
    try {
      const res = await apiClient.get('/subscriptions/trial-status');
      setTrialInfo(res.data);
    } catch {
      // Silently ignore — don't break the page if this fails
    }
  };

  if (dismissed) return null;
  if (!trialInfo) return null;
  if (!trialInfo.is_trial) return null;       // Not on trial
  if (trialInfo.has_billing) return null;      // Billing already set up

  const { days_remaining } = trialInfo;
  const isExpiringSoon = days_remaining <= 3;
  const isExpired = days_remaining <= 0;

  if (isExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-semibold flex-1">
          Your 14-day free trial has ended. Set up billing to restore full access.
        </p>
        <button
          onClick={() => navigate('/billing/setup')}
          className="flex items-center gap-1.5 bg-white text-red-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-50 transition-all shrink-0"
        >
          <CreditCard className="w-4 h-4" />
          Set Up Billing
        </button>
      </div>
    );
  }

  return (
    <div className={`${isExpiringSoon ? 'bg-amber-500' : 'bg-blue-600'} text-white px-4 py-2.5 flex items-center gap-3`}>
      <Clock className="w-4 h-4 shrink-0" />
      <p className="text-sm font-medium flex-1">
        {isExpiringSoon
          ? <><strong>⚠️ {days_remaining} day{days_remaining !== 1 ? 's' : ''} left</strong> in your free trial — set up billing to avoid interruption.</>
          : <><strong>{days_remaining} days</strong> remaining in your free trial. No charge until {new Date(trialInfo.trial_ends_at!).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })}.</>
        }
      </p>
      <button
        onClick={() => navigate('/billing/setup')}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0"
      >
        <CreditCard className="w-3.5 h-3.5" />
        Set Up Billing
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/60 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
