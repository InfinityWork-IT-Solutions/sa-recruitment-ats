import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, ArrowRight } from 'lucide-react';

export default function BillingCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = searchParams.get('plan') || 'professional';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-yellow-400" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-white mb-2">Billing setup cancelled</h1>
          <p className="text-slate-400">
            No problem — your account is active and your 14-day trial is running.
            You'll need to set up billing before it expires to keep your access.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(`/billing/setup?plan=${plan}`)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-base hover:from-blue-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Try Again — Set Up Billing
          </button>

          <button
            onClick={() => navigate('/company/dashboard')}
            className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            Continue to dashboard for now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
