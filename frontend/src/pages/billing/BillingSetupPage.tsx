/**
 * BillingSetupPage — shown immediately after company registration.
 * Collects the client's payment method via PayFast (card tokenisation).
 * No charge today — first billing fires after the 14-day trial.
 */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Shield, CreditCard, CheckCircle, Clock, Zap,
  Users, TrendingUp, AlertCircle, Loader2
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

const PLAN_DETAILS: Record<string, {
  label: string; price: string; color: string;
  features: string[]; seats: number;
}> = {
  starter: {
    label: 'Starter',
    price: 'R2,030/mo',
    color: 'blue',
    seats: 3,
    features: [
      'Up to 3 team seats',
      'AI candidate matching',
      'Job board integrations (PNet, Indeed)',
      'Candidate pipeline & ATS',
      'Email & SMS notifications',
    ],
  },
  professional: {
    label: 'Professional',
    price: 'R4,199/mo',
    color: 'purple',
    seats: 10,
    features: [
      'Up to 10 team seats',
      'Everything in Starter',
      'Video screening interviews',
      'Advanced analytics & reports',
      'LinkedIn Jobs integration',
      'AI Decision Queue (semi-auto mode)',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Custom',
    color: 'indigo',
    seats: 999,
    features: [
      'Unlimited seats',
      'Everything in Professional',
      'White-label & custom branding',
      'Dedicated account manager',
      'SLA & priority support',
      'API access',
    ],
  },
};

export default function BillingSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planName = searchParams.get('plan') || 'professional';
  const plan = PLAN_DETAILS[planName] ?? PLAN_DETAILS.professional;

  const [loading, setLoading] = useState(false);
  const [payfastData, setPayfastData] = useState<{
    payfast_payment_url: string;
    payfast_payment_data: Record<string, string>;
    trial_end_date: string;
    trial_days: number;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Auto-submit to PayFast once we have the redirect data
  useEffect(() => {
    if (payfastData && formRef.current) {
      formRef.current.submit();
    }
  }, [payfastData]);

  const handleSetupBilling = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/subscriptions/create', {
        plan_name: planName,
        billing_cycle: 'monthly',
      });
      setPayfastData(res.data);
      // formRef useEffect will auto-submit to PayFast
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to initiate billing. Please try again.';
      toast.error(msg);
      setLoading(false);
    }
  };

  const trialEndDate = payfastData
    ? new Date(payfastData.trial_end_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-blue-600',
    indigo: 'from-indigo-500 to-purple-600',
  };
  const gradient = colorMap[plan.color] ?? colorMap.purple;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">

      {/* Hidden PayFast redirect form — auto-submitted when payfastData arrives */}
      {payfastData && (
        <form
          ref={formRef}
          method="POST"
          action={payfastData.payfast_payment_url}
          style={{ display: 'none' }}
        >
          {Object.entries(payfastData.payfast_payment_data).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-green-500/30">
            <CheckCircle className="w-4 h-4" />
            Account created! One last step…
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Set Up Your Billing</h1>
          <p className="text-slate-400">
            Add your card details — <strong className="text-white">no charge today</strong>.
            Your first bill is only due after your 14-day free trial ends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${gradient} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4`}>
              {plan.label} Plan
            </div>
            <p className="text-3xl font-black text-white mb-1">{plan.price}</p>
            <p className="text-slate-400 text-sm mb-5">Billed after 14-day trial</p>
            <ul className="space-y-2.5">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Trial + billing info */}
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-white">14-Day Free Trial</p>
                  <p className="text-xs text-green-300">Full access, no charge</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                Explore every feature for 14 days completely free. Your card won't be charged
                until your trial ends.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">What happens next</p>
              {[
                { icon: CreditCard, text: 'Enter card details securely on PayFast', sub: 'No charge today' },
                { icon: Zap, text: 'Instant access to your full dashboard', sub: '14-day trial begins' },
                { icon: TrendingUp, text: 'Auto-billed after trial ends', sub: 'Cancel anytime before' },
              ].map(({ icon: Icon, text, sub }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{text}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-400 bg-white/5 rounded-xl p-3 border border-white/10">
              <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              Card details are processed securely by <strong className="text-white ml-1">PayFast</strong> — South Africa's leading payment gateway. We never store your card number.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={handleSetupBilling}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-base hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 transition-all shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Redirecting to PayFast…</>
            ) : (
              <><CreditCard className="w-5 h-5" />Set Up Billing — No Charge Today</>
            )}
          </button>

          <button
            onClick={() => navigate('/company/dashboard')}
            className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Skip for now — I'll set up billing later
          </button>
        </div>

        <p className="text-center text-xs text-slate-500">
          By continuing you agree to our{' '}
          <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>.
          You can cancel your subscription at any time.
        </p>
      </div>
    </div>
  );
}
