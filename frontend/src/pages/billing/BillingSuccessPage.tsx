import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Calendar, Zap } from 'lucide-react';

export default function BillingSuccessPage() {
  const navigate = useNavigate();

  // Trial end = today + 14 days
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-white mb-2">You're all set!</h1>
          <p className="text-slate-400">
            Your card has been saved and your 14-day free trial has started.
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-white">Trial ends on {trialEnd}</p>
              <p className="text-xs text-slate-400">You'll be billed automatically after this date</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-white">Full access enabled</p>
              <p className="text-xs text-slate-400">All features unlocked for the duration of your trial</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/company/dashboard')}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl font-black text-base hover:from-green-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
        >
          Go to Your Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
