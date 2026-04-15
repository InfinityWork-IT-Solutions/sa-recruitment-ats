import { useState, useEffect } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle, XCircle,
  BarChart2, DollarSign, Zap, ArrowUp
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface UsageData {
  plan: string;
  billing_period: {
    start: string;
    end: string;
  };
  cv_parses: {
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
  };
  ai_matches: {
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
  };
  ai_searches: {
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
  };
  estimated_cost: number;
}

export default function UsageDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await apiClient.get('/usage/current');
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'green';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <p>Failed to load usage data</p>
      </div>
    );
  }

  const UsageCard = ({ 
    title, 
    icon: Icon, 
    usage: usageData, 
    description 
  }: { 
    title: string; 
    icon: any; 
    usage: { limit: number; used: number; remaining: number; percentage: number }; 
    description: string;
  }) => {
    const color = getUsageColor(usageData.percentage);
    const isNearLimit = usageData.percentage >= 80;
    const isAtLimit = usageData.percentage >= 100;

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              color === 'red' ? 'bg-red-100' :
              color === 'orange' ? 'bg-orange-100' :
              color === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <Icon className={`w-6 h-6 ${
                color === 'red' ? 'text-red-600' :
                color === 'orange' ? 'text-orange-600' :
                color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          {isNearLimit && (
            <AlertTriangle className={`w-5 h-5 ${
              isAtLimit ? 'text-red-600' : 'text-orange-500'
            }`} />
          )}
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl font-bold text-gray-900">{usageData.used}</span>
            <span className="text-gray-500 ml-2">/ {usageData.limit === -1 ? '∞' : usageData.limit}</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Remaining</p>
            <p className={`text-2xl font-bold ${
              usageData.remaining === 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {usageData.limit === -1 ? '∞' : usageData.remaining}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(usageData.percentage)}`}
              style={{ width: `${Math.min(usageData.percentage, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {usageData.percentage}% used
          </p>
        </div>

        {isAtLimit && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-left">
            <div className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Limit Reached!</p>
                <p className="text-sm text-red-700">
                  Plan limit reached for {title.toLowerCase()}.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isAtLimit && isNearLimit && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded text-left">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Approaching Limit</p>
                <p className="text-sm text-orange-700">
                  {usageData.remaining} {title.toLowerCase()} left.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isNearLimit && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded text-left">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Looking Good!</p>
                <p className="text-sm text-green-700">
                  Capacity is healthy.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">AI Usage Dashboard</h2>
            <p className="text-blue-100 font-bold opacity-80">
              Billing Period: {formatDate(usage.billing_period.start)} - {formatDate(usage.billing_period.end)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
            <p className="text-xs font-black uppercase tracking-widest text-blue-100 mb-1">Current Plan</p>
            <p className="text-2xl font-black uppercase tracking-tight">{usage.plan}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Estimated AI Cost</p>
            <p className="text-4xl font-black text-gray-900 tracking-tighter">
              R{usage.estimated_cost.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 font-bold">Already included in your monthly subscription</p>
          </div>
        </div>
        <button className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center justify-center space-x-2">
          <ArrowUp className="w-4 h-4" />
          <span>Upgrade Tier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <UsageCard
          title="CV Parses"
          icon={BarChart2}
          usage={usage.cv_parses}
          description="AI parsing of resumes"
        />
        <UsageCard
          title="AI Matches"
          icon={Zap}
          usage={usage.ai_matches}
          description="Fit analysis runs"
        />
        <UsageCard
          title="AI Searches"
          icon={TrendingUp}
          usage={usage.ai_searches}
          description="Semantic find queries"
        />
      </div>
    </div>
  );
}
