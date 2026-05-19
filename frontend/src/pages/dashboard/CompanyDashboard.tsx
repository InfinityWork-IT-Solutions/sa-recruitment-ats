import PostJobModal from '@/components/modals/PostJobModalWithIntegrations';
import ConfigureAIAgentModal from '@/components/modals/ConfigureAIAgentModal';
import { useCreateJob } from '@/hooks/use-jobs';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Settings as SettingsIcon, Plus, Briefcase, Users, TrendingUp, Sparkles } from 'lucide-react';

export default function ClientDashboard() {
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showAIAgentModal, setShowAIAgentModal] = useState(false);
  const [integrations, setIntegrations] = useState({
    pnet: { connected: false, enabled: false },
    indeed: { connected: false, enabled: false },
    linkedin: { connected: false, enabled: false }
  });

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await apiClient.get('/integrations');
        const data = response.data || [];
        const statusMap = {
          pnet: { connected: false, enabled: false },
          indeed: { connected: false, enabled: false },
          linkedin: { connected: false, enabled: false }
        };
        
        data.forEach((item: any) => {
          if (item.platform in statusMap) {
            statusMap[item.platform as keyof typeof statusMap] = {
              connected: item.connected,
              enabled: item.connected
            };
          }
        });
        
        setIntegrations(statusMap);
      } catch (error) {
        console.error('Error fetching integrations:', error);
      }
    };
    
    fetchIntegrations();
  }, []);

  // Mock data - replace with real API calls
  const stats = {
    activeJobs: 5,
    applicants: 48,
    topMatches: 12,
    interviews: 8,
  };

  const topCandidates = [
    {
      id: 1,
      name: 'Sizwe Khoza',
      title: 'DevOps Engineer',
      matchScore: 98,
      timeAgo: '10 min ago',
      avatar: 'S',
      color: 'bg-blue-600',
    },
    {
      id: 2,
      name: 'Lerato Mokoena',
      title: 'Fullstack Dev',
      matchScore: 85,
      timeAgo: '1 hour ago',
      avatar: 'L',
      color: 'bg-purple-600',
    },
    {
      id: 3,
      name: 'David Smith',
      title: 'Frontend Manager',
      matchScore: 92,
      timeAgo: '2 hours ago',
      avatar: 'D',
      color: 'bg-green-600',
    },
  ];

  const createJob = useCreateJob();

  const handlePostJob = async (modalData: any) => {
    try {
      const apiData = {
          ...modalData,
          experience_level: modalData.experience_min >= 6 ? 'senior_level' : modalData.experience_min >= 3 ? 'mid_level' : 'entry_level',
          years_of_experience_min: modalData.experience_min,
          years_of_experience_max: modalData.experience_max,
          is_remote: modalData.work_mode === 'remote',
          remote_type: modalData.work_mode,
          skills: modalData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
          employment_type: modalData.job_type.replace('-', '_'),
          show_salary: true
      };
      
      await createJob.mutateAsync(apiData);
      setShowPostJobModal(false);
      alert('Job posted successfully across selected platforms!');
    } catch (error) {
      console.error('Error posting job:', error);
    }
  };

  const handleSaveAIAgent = async (config: any) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/ai-agent/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      // Show success message
      alert('AI Agent activated! Automated outreach will begin shortly.');

      // Refresh dashboard data
      // refreshData();
    } catch (error) {
      console.error('Error saving AI agent config:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

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
                onClick={() => window.location.href = '/analytics'}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <SettingsIcon className="w-5 h-5" />
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
          {/* Active Jobs */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-green-600 text-sm font-semibold flex items-center">
                +12% ↗
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-1">ACTIVE JOBS</div>
            <div className="text-3xl font-bold text-gray-900">{stats.activeJobs}</div>
          </div>

          {/* Applicants */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-green-600 text-sm font-semibold flex items-center">
                +15% ↗
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-1">APPLICANTS</div>
            <div className="text-3xl font-bold text-gray-900">{stats.applicants}</div>
          </div>

          {/* Top Matches */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-semibold flex items-center">
                +42% ↗
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-1">TOP MATCHES</div>
            <div className="text-3xl font-bold text-gray-900">{stats.topMatches}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: AI Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <span>AI Intelligent Feed</span>
                </h2>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
                {topCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${candidate.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                        {candidate.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.title} • {candidate.timeAgo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{candidate.matchScore}%</div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all">
                Go to Applicant Tracking →
              </button>
            </div>
          </div>

          {/* Right Column: AI Agent */}
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

            {/* Platform Suggestion */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">Platform Suggestion</h3>
              <p className="text-sm text-gray-600 mb-4">
                Candidates with <strong>React</strong> skills are currently in high demand.
                We suggest adjusting the salary range for your Senior Developer role to increase visibility.
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                Apply Recommendation →
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Interviews Scheduled</span>
                  <span className="font-bold text-gray-900">{stats.interviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-bold text-green-600">67%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Time to Hire</span>
                  <span className="font-bold text-gray-900">18 days</span>
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
