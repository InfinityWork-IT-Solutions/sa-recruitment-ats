// frontend/src/pages/company/CompanyProfile.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Building, Users, Briefcase, Settings, Edit, Camera,
  MapPin, Mail, Globe, Plus, TrendingUp,
  Eye, CheckCircle, Save, FileText, Phone, User, Bell
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth';
import { ImageCropperModal } from '../../components/common/ImageCropperModal';
import { Link, useNavigate } from 'react-router-dom';

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

export default function CompanyProfile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    industry: '',
    website: '',
    company_size: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_position: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { data: companyData, refetch } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/client-companies/me/profile');
      return res.data;
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['company-analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/client-companies/profile-analytics/views');
      return res.data;
    }
  });

  const { data: jobsData } = useQuery({
    queryKey: ['company-profile-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/jobs?limit=20');
      return res.data;
    },
    enabled: activeTab === 'jobs',
  });

  const { data: teamData } = useQuery({
    queryKey: ['company-profile-team'],
    queryFn: async () => {
      const res = await apiClient.get('/team/members');
      return res.data;
    },
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['company-subscription', user?.agency_id],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/current', {
        params: { agency_id: user!.agency_id },
      });
      return res.data;
    },
    enabled: !!user?.agency_id,
    retry: false,
  });

  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState("");

  // Sync state with data, but don't overwrite if we have a local optimistic update
  useEffect(() => {
    if (companyData) {
      if (!companyLogo || !companyLogo.startsWith('blob:')) {
        setCompanyLogo(companyData.logo_url || null);
      }
      if (!isEditingDescription) {
        setTempDescription(companyData.description || "");
      }
      setSettingsForm({
        name: companyData.name || '',
        industry: companyData.industry || '',
        website: companyData.website || '',
        company_size: companyData.company_size || '',
        contact_name: companyData.contact_name || '',
        contact_email: companyData.contact_email || '',
        contact_phone: companyData.contact_phone || '',
        contact_position: companyData.contact_position || '',
        city: companyData.city || '',
        province: companyData.province || '',
        postal_code: companyData.postal_code || '',
        country: companyData.country || 'South Africa',
      });
    }
  }, [companyData, isEditingDescription]);

  const company = {
    name: companyData?.name || 'Company Name',
    industry: companyData?.industry || 'Unspecified Industry',
    email: companyData?.contact_email || 'No email provided',
    website: companyData?.website || '',
    location: `${companyData?.city || ''}${companyData?.province ? `, ${companyData.province}` : ''}` || 'Location not set',
    size: companyData?.company_size || 'Size not set',
    founded: 'N/A',
    logo: companyLogo,
    description: companyData?.description || '',
    stats: {
      activeJobs: analytics?.active_jobs || 0,
      totalApplications: analytics?.total_applications || 0,
      scheduledInterviews: analytics?.scheduled_interviews || 0,
      teamMembers: teamData?.seats?.used ?? teamData?.total ?? 0,
      profileViews: analytics?.profile_views || 0,
      profileViewsChange: analytics?.profile_views_change || 0,
      jobViewsThisWeek: analytics?.job_views || 0
    },
    subscription: {
      plan: subscriptionData?.plan?.name ?? teamData?.seats?.plan ?? 'Professional',
      seats: subscriptionData?.seats_allocated ?? teamData?.seats?.total ?? 5,
      seatsUsed: subscriptionData?.seats_used ?? teamData?.seats?.used ?? 0,
      renewalDate: subscriptionData?.current_period_end
        ? new Date(subscriptionData.current_period_end).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Not set',
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Profile completion calculation
  const getProfileCompletion = () => {
    const checks = {
      hasLogo: !!companyLogo,
      hasDescription: company.description.length > 100,
      hasActiveJobs: company.stats.activeJobs > 0,
      hasTeamMembers: company.stats.teamMembers > 0,
      hasWebsite: !!company.website
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      percentage: Math.round((completed / total) * 100),
      missing: {
        logo: !checks.hasLogo,
        description: !checks.hasDescription,
        jobs: !checks.hasActiveJobs,
        team: !checks.hasTeamMembers,
        website: !checks.hasWebsite
      }
    };
  };

  const completion = getProfileCompletion();

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageSrc(reader.result as string);
        setCropperModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperModalOpen(false);
    setSelectedImageSrc(null);

    // Optimistic update
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setCompanyLogo(croppedUrl);
    
    // Convert Blob to File
    const file = new File([croppedBlob], `logo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    const reader = new FileReader();
    reader.onloadend = () => {
        if(user) localStorage.setItem(`user_avatar_${user.id}`, reader.result as string); // Universal Header
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      await apiClient.post('/client-companies/upload-logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Logo uploaded successfully");
      useAuthStore.getState().refreshUser();
    } catch (err) {
      toast.error("Failed to upload logo");
      // Optionally rollback optimistic update
    }
  };

  const handleSaveDescription = async () => {
    try {
        await apiClient.put('/client-companies/me/profile', { description: tempDescription });
        toast.success("Description saved!");
        setIsEditingDescription(false);
        refetch();
    } catch {
        toast.error("Failed to save description");
    }
  };

  // Get company initials
  const getInitials = () => {
    if (!company.name) return "C";
    const words = company.name.split(' ').filter(w => w.trim());
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase() || "C";
  };

  // Company Logo Component (reusable)
  const CompanyLogo = ({ size = 'large', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) => {
    const sizes = {
      small: 'w-10 h-10 text-sm',
      medium: 'w-16 h-16 text-xl',
      large: 'w-32 h-32 text-4xl'
    };

    if (companyLogo) {
      return (
        <img
          src={companyLogo}
          alt={company.name}
          onError={() => setCompanyLogo(null)}
          className={`${sizes[size]} ${className} rounded-2xl object-cover shadow-lg bg-white overflow-hidden text-[10px] flex items-center justify-center`}
        />
      );
    }

    return (
      <div className={`${sizes[size]} ${className} bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg`}>
        {getInitials()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Completion Banner */}
      {completion.percentage < 100 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl font-bold">{completion.percentage}%</span>
                  </div>
                  <div>
                    <p className="font-semibold">Company Profile Strength: {completion.percentage}%</p>
                    <p className="text-sm text-blue-100">Complete your profile to attract 3x more quality candidates!</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <span>Missing:</span>
                {completion.missing.logo && <span className="px-2 py-1 bg-white/20 rounded">Logo</span>}
                {completion.missing.description && <span className="px-2 py-1 bg-white/20 rounded">Description</span>}
                {completion.missing.jobs && <span className="px-2 py-1 bg-white/20 rounded">Post Jobs</span>}
              </div>
            </div>
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            {/* Left: Logo + Info */}
            <div className="flex items-start space-x-6">
              {/* Company Logo with Upload */}
              <div className="relative group">
                <CompanyLogo size="large" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Company Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-xl text-gray-600 mt-1">{company.industry}</p>

                <div className="flex items-center flex-wrap gap-6 mt-4 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{company.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <a href={`https://${company.website}`} className="text-sm text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{company.location}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {company.subscription.plan.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {company.size}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col space-y-2">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Post New Job</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Jobs</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{company.stats.activeJobs}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Applications</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{company.stats.totalApplications}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Interviews</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{company.stats.scheduledInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Team Members</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{company.stats.teamMembers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 font-medium transition-all ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Company Description */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">About {company.name}</h2>
                {!isEditingDescription ? (
                  <button
                    onClick={() => {
                      setIsEditingDescription(true);
                      setTempDescription(company.description);
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingDescription(false);
                        setTempDescription(company.description);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingDescription ? (
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Tell candidates about your company, culture, values, and what makes you a great place to work..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{company.description}</p>
              )}

              {!isEditingDescription && company.description.length < 100 && (
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Tip:</strong> A compelling company description (200+ words) attracts 50% more quality candidates!
                  </p>
                </div>
              )}
            </div>

            {/* Company Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Company Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Industry</label>
                  <p className="text-lg text-gray-900 mt-1">{company.industry}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Size</label>
                  <p className="text-lg text-gray-900 mt-1">{company.size}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Founded</label>
                  <p className="text-lg text-gray-900 mt-1">{company.founded}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-lg text-gray-900 mt-1">{company.location}</p>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Plan</label>
                  <p className="text-lg font-bold text-blue-600 mt-1">{company.subscription.plan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Team Seats</label>
                  <p className="text-lg text-gray-900 mt-1">
                    {company.subscription.seatsUsed} / {company.subscription.seats} used
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(company.subscription.seatsUsed / company.subscription.seats) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Renewal Date</label>
                  <p className="text-lg text-gray-900 mt-1">{company.subscription.renewalDate}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Job Postings</h2>
                <button
                  onClick={() => navigate('/company/jobs')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post New Job</span>
                </button>
              </div>

              {(() => {
                const jobs: any[] = jobsData?.jobs || jobsData || [];
                if (jobs.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No jobs posted yet</p>
                      <p className="text-sm mt-2">Post your first job to start receiving applications!</p>
                      <button
                        onClick={() => navigate('/company/jobs')}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Create Your First Job Posting
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {jobs.map((job: any) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-all">
                        <div>
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              job.status === 'active' ? 'bg-green-100 text-green-700' :
                              job.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                              job.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                              'bg-red-100 text-red-700'
                            }`}>{job.status}</span>
                            <span>{job.applicants_count ?? 0} applicants</span>
                            {job.location && <span>{job.location}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/jobs/${job.id}/kanban`)}
                            className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Pipeline
                          </button>
                          <button
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate('/company/jobs')}
                      className="w-full py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all text-sm"
                    >
                      Manage All Jobs →
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                <button
                  onClick={() => navigate('/company/team')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage Team</span>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Team Seats:</strong> {company.subscription.seatsUsed} of {company.subscription.seats} seats used.
                  <Link to="/company/settings/billing" className="underline ml-2">Upgrade to add more seats</Link>
                </p>
              </div>

              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No team members yet</p>
                <p className="text-sm mt-2">Invite your HR team to collaborate on hiring!</p>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Profile Analytics */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Profile Views This Week</p>
                      <div className="flex items-baseline space-x-3 mt-2">
                        <p className="text-4xl font-bold text-blue-600">{Number(company.stats.profileViews) || 0}</p>
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-semibold">+{Number(company.stats.profileViewsChange) || 0}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Candidates viewing your company</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Eye className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Job Views This Week</p>
                      <div className="flex items-baseline space-x-3 mt-2">
                        <p className="text-4xl font-bold text-green-600">{Number(company.stats.jobViewsThisWeek) || 0}</p>
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-semibold">+12%</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Total job post impressions</p>
                    </div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
                <button
                  disabled={isSavingSettings}
                  onClick={async () => {
                    setIsSavingSettings(true);
                    try {
                      await apiClient.put('/client-companies/me/profile', {
                        name: settingsForm.name,
                        industry: settingsForm.industry,
                        website: settingsForm.website,
                        company_size: settingsForm.company_size,
                        contact_name: settingsForm.contact_name,
                        contact_email: settingsForm.contact_email,
                        contact_phone: settingsForm.contact_phone,
                        contact_position: settingsForm.contact_position,
                        city: settingsForm.city,
                        province: settingsForm.province,
                        postal_code: settingsForm.postal_code,
                        country: settingsForm.country,
                      });
                      toast.success('Company profile updated!');
                      refetch();
                    } catch {
                      toast.error('Failed to update profile');
                    } finally {
                      setIsSavingSettings(false);
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-60"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={settingsForm.industry}
                    onChange={e => setSettingsForm(f => ({ ...f, industry: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="text"
                    value={settingsForm.website}
                    onChange={e => setSettingsForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="e.g. yourcompany.co.za"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                  <select
                    value={settingsForm.company_size}
                    onChange={e => setSettingsForm(f => ({ ...f, company_size: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-500">201–500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Contact Information</h3>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Internal only · hidden from candidates
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Contact Name</span>
                    </label>
                    <input
                      type="text"
                      value={settingsForm.contact_name}
                      onChange={e => setSettingsForm(f => ({ ...f, contact_name: e.target.value }))}
                      placeholder="e.g. Jane Smith"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Position / Title</span>
                    </label>
                    <input
                      type="text"
                      value={settingsForm.contact_position}
                      onChange={e => setSettingsForm(f => ({ ...f, contact_position: e.target.value }))}
                      placeholder="e.g. HR Manager"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Contact Email</span>
                    </label>
                    <input
                      type="email"
                      value={settingsForm.contact_email}
                      onChange={e => setSettingsForm(f => ({ ...f, contact_email: e.target.value }))}
                      placeholder="e.g. hr@yourcompany.co.za"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Contact Phone</span>
                    </label>
                    <input
                      type="tel"
                      value={settingsForm.contact_phone}
                      onChange={e => setSettingsForm(f => ({ ...f, contact_phone: e.target.value }))}
                      placeholder="e.g. +27 11 000 0000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Office Address */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Office Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={settingsForm.city}
                      onChange={e => setSettingsForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Johannesburg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                    <select
                      value={settingsForm.province}
                      onChange={e => setSettingsForm(f => ({ ...f, province: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select province</option>
                      {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={settingsForm.postal_code}
                      onChange={e => setSettingsForm(f => ({ ...f, postal_code: e.target.value }))}
                      placeholder="e.g. 2000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={settingsForm.country}
                      onChange={e => setSettingsForm(f => ({ ...f, country: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings shortcut */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Control which in-app and email alerts you receive for applications, interviews, and AI matches.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/company/settings', { state: { tab: 'notifications' } })}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all whitespace-nowrap"
                >
                  Manage alerts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      {selectedImageSrc && (
          <ImageCropperModal
            isOpen={cropperModalOpen}
            onClose={() => {
                setCropperModalOpen(false);
                setSelectedImageSrc(null);
            }}
            imageSrc={selectedImageSrc}
            onCropComplete={handleCropComplete}
            aspectRatio={1} // Keep it square since it's displayed as a logo/avatar
          />
      )}
    </div>
  );
}
