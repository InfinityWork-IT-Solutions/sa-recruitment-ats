import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Plus, Briefcase, Users, TrendingUp, Calendar,
  Sparkles, UserPlus, CreditCard, AlertCircle, Clock, CheckCircle, XCircle,
  LayoutTemplate
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PostJobModal from '@/components/modals/PostJobModalWithIntegrations';
import { useJobDraftRestore } from '@/hooks/useJobDraftRestore';
import ConfigureAIAgentModal from '@/components/modals/ConfigureAIAgentModal';
import InviteTeamMemberModal from '@/components/modals/InviteTeamMemberModal';
import OnboardingWizard from '@/components/OnboardingWizard';
import apiClient from '@/lib/api-client';

export default function CompleteDashboard() {
  const navigate = useNavigate();
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  useJobDraftRestore(() => setShowPostJobModal(true));
  const [showAIAgentModal, setShowAIAgentModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [decisions, setDecisions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_dismissed'));
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState({ used: 0, total: 5, available: 5, plan: 'Professional' });
  const [salaryBenchmark, setSalaryBenchmark] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchIntegrations();
    fetchPendingDecisions();
    fetchRecentJobs();
    fetchTeamMembers();
    apiClient.get('/client-companies/me/profile').then(r => setCompanyProfile(r.data)).catch(() => {});
  }, []);

  const fetchPendingDecisions = async () => {
    try {
      const response = await apiClient.get('/decisions/pending');
      setDecisions(response.data);
    } catch (error) {
      console.error('Error fetching decisions:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const response = await apiClient.get('/jobs?limit=3&status=active');
      const data = response.data;
      setRecentJobs((data.jobs || data || []).slice(0, 3));
    } catch {
      // silently leave empty
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await apiClient.get('/team/members');
      const members = Array.isArray(res.data) ? res.data : (res.data.members || []);
      setTeamMembers(members);
      const total = res.data.seats_total ?? 5;
      const used = members.length;
      setTeamStats({
        used,
        total,
        available: Math.max(0, total - used),
        plan: res.data.plan ?? 'Professional',
      });
      // fetch salary benchmark for the most in-demand skill if we have jobs
      if (res.data.top_skill) {
        apiClient.get(`/ai/salary-benchmark?job_title=${encodeURIComponent(res.data.top_skill)}&location=South Africa&experience_years=3`)
          .then(r => setSalaryBenchmark(r.data)).catch(() => {});
      }
    } catch {
      // leave defaults
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.get('/integrations/');
      const data = response.data;
      
      const formatted = {
        pnet: { connected: data.some((i: any) => i.platform === 'pnet' && i.status === 'active'), enabled: true },
        indeed: { connected: data.some((i: any) => i.platform === 'indeed' && i.status === 'active'), enabled: true },
        linkedin: { connected: data.some((i: any) => i.platform === 'linkedin' && i.status === 'active'), enabled: true },
      };
      setIntegrations(formatted);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  // Stats derived from real data only — never show fake numbers
  const stats = {
    activeJobs: dashboardData?.active_jobs ?? 0,
    totalApplicants: dashboardData?.total_applicants ?? 0,
    topMatches: decisions?.totals?.total_pending ?? 0,
    scheduledInterviews: dashboardData?.scheduled_interviews ?? 0,
    shortlisted: dashboardData?.shortlisted ?? 0,
    offered: dashboardData?.offered ?? 0,
  };

  const recentActivity: any[] = dashboardData?.recent_activity || [];

  const topCandidates = decisions?.all_decisions?.slice(0, 4).map((d: any, idx: number) => ({
    id: d.decision_id,
    name: d.candidate_name,
    title: d.job_title,
    matchScore: d.ai_confidence,
    location: d.proposed_action?.details?.location || 'South Africa',
    skills: d.proposed_action?.details?.skills || 'Skills analyzed by AI',
    avatar: d.candidate_name.split(' ').map((n: string) => n[0]).join(''),
    color: ['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-pink-600'][idx % 4]
  })) || [];


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

      await apiClient.post('/jobs', apiData);
      toast.success('Job posted successfully across selected platforms!');
      setShowPostJobModal(false);
      fetchDashboardData();
      fetchRecentJobs();
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    }
  };

  const handleSaveAIAgent = async (config: any) => {
    try {
      await apiClient.post('/ai-agent/configure', config);
      toast.success('AI Agent activated! Automated outreach will begin shortly.');
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving AI agent config:', error);
      toast.error('Failed to activate AI agent.');
    }
  };

  const handleInviteTeamMember = async (data: any) => {
    try {
      await apiClient.post('/team/invite', data);
      toast.success('Invitation sent successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to send invitation.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Command Center</h1>
              <p className="text-gray-600 mt-1">Monitor hiring progress and candidate matching AI.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/company/analytics')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Analytics</span>
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
        {/* Onboarding Wizard */}
        {showOnboarding && (
          <OnboardingWizard
            onDismiss={() => setShowOnboarding(false)}
            hasLogo={!!companyProfile?.logo_url}
            hasJobs={stats.activeJobs > 0}
            hasTeam={(dashboardData?.team_members_count ?? 0) > 1}
          />
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Jobs */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Active Jobs</div>
            <div className="text-3xl font-bold text-gray-900">{Number(stats.activeJobs) || 0}</div>
          </div>

          {/* Applicants */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Applicants</div>
            <div className="text-3xl font-bold text-gray-900">{Number(stats.totalApplicants) || 0}</div>
          </div>

          {/* Top Matches */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">AI Matches (85%+)</div>
            <div className="text-3xl font-bold text-gray-900">{Number(stats.topMatches) || 0}</div>
          </div>

          {/* Interviews */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Scheduled Interviews</div>
            <div className="text-3xl font-bold text-gray-900">{Number(stats.scheduledInterviews) || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* NEW: AI Decision Queue (Human-in-the-loop Semi-Auto mode) */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-xl shadow-lg border-2 border-blue-400 p-6 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Decision Queue</h2>
                    <p className="text-blue-100 text-sm">Semi-Auto Mode Active</p>
                  </div>
                </div>
                
                <p className="mb-6 text-blue-50 text-sm max-w-lg">
                  The AI has analyzed your applicants and prepared recommendations. 
                  Approve auto-rejections, video screenings, and fast-track interviews with one click.
                </p>
                
                <Link
                  to="/automation/decisions"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-bold shadow-md hover:bg-blue-50 transition-all transform hover:scale-105"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Review Recommendations
                </Link>
              </div>
            </div>

            {/* AI Intelligent Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <span>AI Intelligent Feed</span>
                </h2>
                <button 
                  onClick={fetchDashboardData}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {topCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${candidate.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                        {candidate.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {candidate.name}
                        </h3>
                        <p className="text-sm text-gray-600">{candidate.title} • {candidate.location}</p>
                        <p className="text-xs text-gray-500 mt-1">{candidate.skills}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{Number(candidate.matchScore) || 0}%</div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => navigate('/company/candidates')}
                className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all"
              >
                View All Candidates →
              </button>
            </div>

            {/* Active Jobs Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Active Jobs</h2>
                <button
                  onClick={() => navigate('/company/jobs')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View All →
                </button>
              </div>

              {recentJobs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">No active jobs yet</p>
                  <button
                    onClick={() => setShowPostJobModal(true)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Post Your First Job
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job: any) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-500">{job.applicants_count ?? 0} applicants</p>
                        </div>
                        <Link
                          to={`/jobs/${job.id}/kanban`}
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 text-sm"
                        >
                          <LayoutTemplate className="w-4 h-4" />
                          <span>Kanban</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>

              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Activity will appear here as your hiring progresses.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity: any, i: number) => (
                    <div key={activity.id ?? i} className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'match' ? 'bg-green-100' :
                        activity.type === 'application' ? 'bg-blue-100' :
                        activity.type === 'interview' ? 'bg-purple-100' :
                        'bg-yellow-100'
                      }`}>
                        {activity.type === 'match' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {activity.type === 'application' && <Users className="w-5 h-5 text-blue-600" />}
                        {activity.type === 'interview' && <Calendar className="w-5 h-5 text-purple-600" />}
                        {activity.type === 'shortlist' && <Clock className="w-5 h-5 text-yellow-600" />}
                        {!['match','application','interview','shortlist'].includes(activity.type) && <XCircle className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          {activity.message || (
                            <>
                              <strong>{activity.candidate}</strong>{' '}
                              {activity.type === 'match' ? `matched ${activity.score ?? ''}% for` :
                               activity.type === 'application' ? 'applied for' :
                               activity.type === 'interview' ? 'scheduled interview for' :
                               'shortlisted for'}{' '}
                              <strong>{activity.job}</strong>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time ?? activity.created_at}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Team Seat Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Team Seats</h3>
                <span className="text-sm text-gray-600">{teamStats.plan}</span>
              </div>

              {/* Seat Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    <strong className="text-gray-900">{teamStats.used}</strong> of{' '}
                    <strong className="text-gray-900">{teamStats.total}</strong> seats used
                  </span>
                  <span className={`text-sm font-semibold ${
                    teamStats.available > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {teamStats.available} available
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      teamStats.used / teamStats.total < 0.8 ? 'bg-green-500' :
                      teamStats.used / teamStats.total < 1 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${teamStats.total > 0 ? (teamStats.used / teamStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-3 mb-4">
                {teamMembers.slice(0, 4).map((member: any) => {
                  const initials = member.full_name
                    ? member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : (member.email?.[0] ?? '?').toUpperCase();
                  return (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{member.full_name || member.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{(member.role || 'member').replace('_', ' ')}</p>
                      </div>
                    </div>
                  );
                })}
                {teamMembers.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">No team members yet</p>
                )}
              </div>

              {/* Action Buttons */}
              {teamStats.available > 0 ? (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Team Member</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>All seats filled!</strong> Upgrade to add more team members.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/company/settings/billing')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Upgrade Plan</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate('/company/team')}
                className="w-full mt-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all text-sm"
              >
                Manage Team →
              </button>
            </div>

            {/* Automate Outreach */}
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
                  <span className="text-sm text-gray-600">Shortlisted</span>
                  <span className="font-bold text-gray-900">{Number(stats.shortlisted) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Offered</span>
                  <span className="font-bold text-green-600">{Number(stats.offered) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-bold text-green-600">
                    {stats.totalApplicants > 0
                      ? `${Math.round((stats.shortlisted / stats.totalApplicants) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Time to Hire</span>
                  <span className="font-bold text-gray-900">
                    {dashboardData?.avg_time_to_hire_days
                      ? `${dashboardData.avg_time_to_hire_days} days`
                      : '0 days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Suggestion — salary benchmark */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-purple-900 mb-2">Market Insight</h3>
                  {salaryBenchmark ? (
                    <p className="text-sm text-purple-800 mb-3">
                      Market median for <strong>{salaryBenchmark.job_title || 'this role'}</strong> in SA is{' '}
                      <strong>R{Number(salaryBenchmark.median_monthly || 0).toLocaleString()}/mo</strong>.{' '}
                      {salaryBenchmark.competitiveness_tip}
                    </p>
                  ) : (
                    <p className="text-sm text-purple-800 mb-3">
                      Get real-time salary benchmarks for your open roles to stay competitive.
                    </p>
                  )}
                  <button
                    onClick={() => navigate('/company/jobs')}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                  >
                    View Jobs →
                  </button>
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

      <InviteTeamMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleInviteTeamMember}
        availableSeats={teamStats.available}
      />
    </div>
  );
}
