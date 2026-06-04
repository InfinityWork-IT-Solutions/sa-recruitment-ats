import PostJobModal from '@/components/modals/PostJobModalWithIntegrations';
import { useJobDraftRestore } from '@/hooks/useJobDraftRestore';
import ConfigureAIAgentModal from '@/components/modals/ConfigureAIAgentModal';
import { useCreateJob } from '@/hooks/use-jobs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Plus, Briefcase, Users, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-500',
  'bg-pink-600', 'bg-teal-600', 'bg-indigo-600', 'bg-red-600',
];

interface DashboardStats {
  active_jobs: number;
  applications_this_period: number;
  placements: number;
  avg_time_to_hire_days: number;
  success_rate_percentage: number;
}

interface TopApplication {
  id: string;
  candidate_name: string | null;
  job_title: string | null;
  match_score: number | null;
  created_at: string;
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  useJobDraftRestore(() => setShowPostJobModal(true));
  const [showAIAgentModal, setShowAIAgentModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topApplications, setTopApplications] = useState<TopApplication[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [integrations, setIntegrations] = useState({
    pnet: { connected: false, enabled: false },
    indeed: { connected: false, enabled: false },
    linkedin: { connected: false, enabled: false }
  });

  const fetchDashboardData = async () => {
    setLoadingStats(true);
    setLoadingFeed(true);
    try {
      const [statsRes, appsRes] = await Promise.all([
        apiClient.get('/analytics/dashboard'),
        apiClient.get('/applications/', { params: { sort_by: 'match_score', sort_order: 'desc', limit: 5 } }),
      ]);
      setStats(statsRes.data);
      const apps = Array.isArray(appsRes.data)
        ? appsRes.data
        : (appsRes.data?.applications || appsRes.data?.results || []);
      setTopApplications(apps.filter((a: TopApplication) => a.match_score != null));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingStats(false);
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    apiClient.get('/integrations')
      .then(r => {
        const data = r.data || [];
        const statusMap = {
          pnet: { connected: false, enabled: false },
          indeed: { connected: false, enabled: false },
          linkedin: { connected: false, enabled: false }
        };
        data.forEach((item: any) => {
          if (item.platform in statusMap) {
            statusMap[item.platform as keyof typeof statusMap] = { connected: item.connected, enabled: item.connected };
          }
        });
        setIntegrations(statusMap);
      })
      .catch(() => {});
  }, []);

  const createJob = useCreateJob();

  const handlePostJob = async (modalData: any) => {
    try {
      const splitLines = (s: string) => (s || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
      const apiData = {
        ...modalData,
        closing_date: modalData.closing_date ? new Date(modalData.closing_date).toISOString() : undefined,
        experience_level: modalData.experience_min >= 6 ? 'senior_level' : modalData.experience_min >= 3 ? 'mid_level' : 'entry_level',
        years_of_experience_min: modalData.experience_min,
        years_of_experience_max: modalData.experience_max,
        is_remote: modalData.work_mode === 'remote',
        remote_type: modalData.work_mode,
        skills: modalData.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? [],
        requirements: splitLines(modalData.requirements),
        benefits: splitLines(modalData.benefits),
        employment_type: modalData.job_type?.replace('-', '_') ?? 'full_time',
        salary_min: modalData.salary_min || null,
        salary_max: modalData.salary_max || null,
        show_salary: !!(modalData.salary_min || modalData.salary_max),
      };
      await (createJob.mutateAsync as Function)(apiData);
      setShowPostJobModal(false);
      toast.success('Job posted successfully!');
      fetchDashboardData();
    } catch {
      toast.error('Failed to post job. Please try again.');
    }
  };

  const handleSaveAIAgent = async (_config: any) => {
    toast('AI Agent automation is coming soon!', { icon: '🤖' });
    setShowAIAgentModal(false);
  };

  const avatarColor = (name: string) =>
    AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  const initials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Command Center</h1>
              <p className="text-gray-600 mt-1">Monitor hiring progress and candidate matching.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/analytics')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <TrendingUp className="w-5 h-5" />
                <span>View Analytics</span>
              </button>
              <button
                onClick={() => setShowPostJobModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Post New Job</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">ACTIVE JOBS</div>
            <div className="text-3xl font-bold text-gray-900">
              {loadingStats ? 0 : (stats?.active_jobs ?? 0)}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">APPLICATIONS (30 DAYS)</div>
            <div className="text-3xl font-bold text-gray-900">
              {loadingStats ? 0 : (stats?.applications_this_period ?? 0)}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">PLACEMENTS (30 DAYS)</div>
            <div className="text-3xl font-bold text-gray-900">
              {loadingStats ? 0 : (stats?.placements ?? 0)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: AI Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <span>Top Matches</span>
                </h2>
                <button
                  onClick={fetchDashboardData}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {loadingFeed ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : topApplications.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No scored applications yet</p>
                  <p className="text-sm mt-1">Match scores appear once AI processes applications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${avatarColor(app.candidate_name ?? '')} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                          {initials(app.candidate_name)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{app.candidate_name ?? 'Unknown'}</h3>
                          <p className="text-sm text-gray-600">{app.job_title ?? 'No role'} • {timeAgo(app.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{app.match_score}%</div>
                        <div className="text-xs text-gray-500">Match Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/applications')}
                className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all"
              >
                Go to Applicant Tracking →
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Automate Outreach Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Automate Your Outreach</h3>
              <p className="text-blue-100 text-sm mb-6">
                Let our AI invite the top matches to interview automatically based on your criteria.
              </p>
              <button
                onClick={() => setShowAIAgentModal(true)}
                className="w-full px-4 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center space-x-2"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Configure AI Agent</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Placements (30 days)</span>
                  <span className="font-bold text-gray-900">
                    {loadingStats ? 0 : (stats?.placements ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-bold text-green-600">
                    {loadingStats ? 0 : `${stats?.success_rate_percentage ?? 0}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Time to Hire</span>
                  <span className="font-bold text-gray-900">
                    {loadingStats ? 0 : `${stats?.avg_time_to_hire_days ?? 0} days`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PostJobModal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
        onSubmit={handlePostJob}
        integrations={integrations}
      />

      <ConfigureAIAgentModal
        isOpen={showAIAgentModal}
        onClose={() => setShowAIAgentModal(false)}
        onSave={handleSaveAIAgent}
      />
    </div>
  );
}
