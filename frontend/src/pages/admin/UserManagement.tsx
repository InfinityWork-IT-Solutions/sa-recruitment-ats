import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Filter, MoreVertical, Ban, CheckCircle, Mail, Shield, Briefcase,
  Building, User, FileText, Download, X, Plus, Phone, Globe, Lock,
  Eye, Copy, Trash2, CheckSquare, Square, ChevronDown, LayoutDashboard,
  LayoutList, LayoutGrid
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import StatusBadge from '../../components/common/StatusBadge';

type TabType = 'users' | 'companies' | 'jobs' | 'candidates' | 'applications';

export default function UserManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive activeTab from route path
  const activeTab = (() => {
    const path = location.pathname;
    if (path.includes('/admin/companies')) return 'companies';
    if (path.includes('/admin/jobs')) return 'jobs';
    if (path.includes('/admin/applications')) return 'applications';
    if (path.includes('/admin/candidates')) return 'candidates';
    return 'users';
  })();

  const setActiveTab = (tab: TabType) => {
    if (tab === 'users') navigate('/admin/users');
    else if (tab === 'companies') navigate('/admin/companies');
    else if (tab === 'jobs') navigate('/admin/jobs');
    else if (tab === 'applications') navigate('/admin/applications');
    else if (tab === 'candidates') navigate('/admin/candidates');
  };

  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'candidate', 'client', 'super_admin'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Job filtering and bulk actions
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [jobLocationFilter, setJobLocationFilter] = useState('all');
  const [jobCompanyFilter, setJobCompanyFilter] = useState('all');
  const [jobDateFilter, setJobDateFilter] = useState('all');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  // Company filtering
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Application filtering
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  // New Global User Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'super_admin', // 'super_admin', 'client', 'candidate'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, userFilter, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await apiClient.get(`/admin/users?type=${userFilter}&search=${searchQuery}`);
        setUsers(response.data.users || []);
      } else if (activeTab === 'companies') {
        const response = await apiClient.get('/admin/companies');
        let data = response.data.companies || [];
        if (searchQuery) {
          data = data.filter((c: any) => 
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.city?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setCompanies(data);
      } else if (activeTab === 'jobs') {
        const response = await apiClient.get('/admin/jobs');
        let data = response.data.jobs || [];
        if (searchQuery) {
          data = data.filter((j: any) => 
            j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.location?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setJobs(data);
      } else if (activeTab === 'candidates') {
        const response = await apiClient.get('/admin/candidates');
        let data = response.data.candidates || [];
        if (searchQuery) {
          data = data.filter((c: any) => 
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.current_job_title?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setCandidates(data);
      } else if (activeTab === 'applications') {
        const response = await apiClient.get('/admin/applications');
        let data = response.data.applications || [];
        if (searchQuery) {
          data = data.filter((a: any) => 
            a.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setApplications(data);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user? Access will be revoked immediately.')) return;
    try {
      await apiClient.post(`/admin/users/${userId}/suspend`);
      toast.success('User access suspended');
      fetchData();
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/activate`);
      toast.success('User access restored');
      fetchData();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleExportData = () => {
    let dataToExport: any[] = [];
    let filename = `recruitpro_${activeTab}_export.json`;

    if (activeTab === 'users') dataToExport = users;
    else if (activeTab === 'companies') dataToExport = companies;
    else if (activeTab === 'jobs') dataToExport = jobs;
    else if (activeTab === 'candidates') dataToExport = candidates;
    else if (activeTab === 'applications') dataToExport = applications;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${dataToExport.length} records successfully!`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/admin/users', newUserData);
      toast.success('New user account provisioned successfully!');
      setShowAddModal(false);
      setNewUserData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        role: 'super_admin'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Job-specific actions
  const handleSelectAllJobs = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(j => j.id));
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleBulkActivateJobs = async () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job');
      return;
    }
    try {
      await Promise.all(
        selectedJobs.map(jobId => apiClient.post(`/admin/jobs/${jobId}/activate`))
      );
      toast.success(`Activated ${selectedJobs.length} job(s)`);
      setSelectedJobs([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to activate jobs');
    }
  };

  const handleBulkDeactivateJobs = async () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job');
      return;
    }
    try {
      await Promise.all(
        selectedJobs.map(jobId => apiClient.post(`/admin/jobs/${jobId}/deactivate`))
      );
      toast.success(`Deactivated ${selectedJobs.length} job(s)`);
      setSelectedJobs([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to deactivate jobs');
    }
  };

  const handleBulkDeleteJobs = async () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job');
      return;
    }
    if (!confirm(`Delete ${selectedJobs.length} job(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      await Promise.all(
        selectedJobs.map(jobId => apiClient.delete(`/admin/jobs/${jobId}`))
      );
      toast.success(`Deleted ${selectedJobs.length} job(s)`);
      setSelectedJobs([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete jobs');
    }
  };

  const tabs: { value: TabType; label: string; icon: any }[] = [
    { value: 'users', label: 'Accounts', icon: User },
    { value: 'companies', label: 'Companies', icon: Building },
    { value: 'jobs', label: 'Jobs', icon: Briefcase },
    { value: 'candidates', label: 'Candidates', icon: Globe },
    { value: 'applications', label: 'Applications', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'System Directory', icon: <LayoutDashboard className="w-4 h-4" /> }
        ]} />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">System Directory</h1>
            <p className="text-gray-500 mt-1">Platform-wide resource synchronization and management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 rounded-2xl px-5 py-3 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm"
              title="Export Current Tab Data"
            >
              <Download className="w-4 h-4" />
              <span>Export Tab Data</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-2xl px-6 py-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Controls Row: Tab Selection & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Tab Selection */}
          <div className="flex flex-wrap gap-2 bg-white/60 p-1.5 rounded-2xl border border-gray-100 backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setActiveTab(tab.value);
                    setSearchQuery('');
                    setSelectedJobs([]);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title="List View"
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Jobs Tab: Quick Stats */}
        {activeTab === 'jobs' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Total Jobs</p>
              <p className="text-2xl font-black text-gray-900">{jobs.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Active</p>
              <p className="text-2xl font-black text-green-600">{jobs.filter(j => j.status === 'active').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Closed</p>
              <p className="text-2xl font-black text-gray-400">{jobs.filter(j => j.status === 'closed').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Draft</p>
              <p className="text-2xl font-black text-amber-600">{jobs.filter(j => j.status === 'draft').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Companies</p>
              <p className="text-2xl font-black text-blue-600">{new Set(jobs.map(j => j.company_id)).size}</p>
            </div>
          </div>
        )}

        {/* Users Tab: Quick Stats */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Total Users</p>
              <p className="text-2xl font-black text-gray-900">{users.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Candidates</p>
              <p className="text-2xl font-black text-purple-600">{users.filter(u => u.user_type === 'candidate').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Companies</p>
              <p className="text-2xl font-black text-blue-600">{users.filter(u => u.user_type === 'client').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Admins</p>
              <p className="text-2xl font-black text-red-600">{users.filter(u => u.user_type === 'super_admin').length}</p>
            </div>
          </div>
        )}

        {/* Companies Tab: Quick Stats */}
        {activeTab === 'companies' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Total Companies</p>
              <p className="text-2xl font-black text-gray-900">{companies.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Active</p>
              <p className="text-2xl font-black text-green-600">{companies.filter(c => c.is_active).length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Inactive</p>
              <p className="text-2xl font-black text-gray-400">{companies.filter(c => !c.is_active).length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Industries</p>
              <p className="text-2xl font-black text-blue-600">{new Set(companies.map(c => c.industry)).size}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Locations</p>
              <p className="text-2xl font-black text-orange-600">{new Set(companies.map(c => c.city)).size}</p>
            </div>
          </div>
        )}

        {/* Candidates Tab: Quick Stats */}
        {activeTab === 'candidates' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Total Candidates</p>
              <p className="text-2xl font-black text-gray-900">{candidates.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Locations</p>
              <p className="text-2xl font-black text-green-600">{new Set(candidates.map(c => c.city)).size}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Avg Experience</p>
              <p className="text-2xl font-black text-blue-600">
                {candidates.length > 0 
                  ? Math.round(candidates.reduce((sum: number, c: any) => sum + (c.years_of_experience || 0), 0) / candidates.length)
                  : 0} yrs
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Registered</p>
              <p className="text-2xl font-black text-purple-600">
                {candidates.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Job Titles</p>
              <p className="text-2xl font-black text-orange-600">{new Set(candidates.map(c => c.current_job_title)).size}</p>
            </div>
          </div>
        )}

        {/* Applications Tab: Quick Stats */}
        {activeTab === 'applications' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Total Applications</p>
              <p className="text-2xl font-black text-gray-900">{applications.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-amber-600">{applications.filter(a => a.status === 'pending').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Accepted</p>
              <p className="text-2xl font-black text-green-600">{applications.filter(a => a.status === 'accepted').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Rejected</p>
              <p className="text-2xl font-black text-red-600">{applications.filter(a => a.status === 'rejected').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Reviewing</p>
              <p className="text-2xl font-black text-blue-600">{applications.filter(a => a.status === 'shortlisted').length}</p>
            </div>
          </div>
        )}
        
        {/* Filters & Search */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                />
              </div>
              
              {activeTab === 'users' && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="flex-1 md:w-48 bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">Every Account</option>
                    <option value="super_admin">Super Admins</option>
                    <option value="client">Companies</option>
                    <option value="candidate">Candidates</option>
                  </select>
                </div>
              )}
            </div>

            {/* Jobs Filters Row */}
            {activeTab === 'jobs' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>

                <select
                  value={jobLocationFilter}
                  onChange={(e) => setJobLocationFilter(e.target.value)}
                  className="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  <option value="cape-town">Cape Town</option>
                  <option value="johannesburg">Johannesburg</option>
                  <option value="remote">Remote</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={jobDateFilter}
                  onChange={(e) => setJobDateFilter(e.target.value)}
                  className="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </select>

                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => {
                      setJobStatusFilter('all');
                      setJobLocationFilter('all');
                      setJobDateFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900 font-bold"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Data Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'users' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identify</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Subscription Tier</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Context</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-10 bg-white">
                          <div className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No accounts found matching filter/query.</td>
                    </tr>
                  ) : users.map((user: any) => (
                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden transition-transform ${
                            user.user_type === 'candidate' ? 'bg-purple-100 text-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.1)]' :
                            user.user_type === 'super_admin' ? 'bg-red-100 text-red-600' :
                            user.user_type === 'client' ? 'bg-blue-100 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.1)]' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              (user.name || '?').charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <div className="text-sm font-black text-gray-900 tracking-tight">{user.name}</div>
                               <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{user.user_type}</span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         {user.subscription_tier ? (
                           <div className={`inline-flex flex-col items-center px-4 py-2 rounded-2xl border ${
                             user.subscription_tier === 'premium' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-200/20' :
                             user.subscription_tier === 'standard' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                             'bg-orange-50 text-orange-700 border-orange-200'
                           }`}>
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{user.subscription_tier}</span>
                             <span className="text-[8px] font-bold opacity-60 uppercase mt-0.5">Active Workspace</span>
                           </div>
                         ) : (
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">No Subscription</span>
                         )}
                      </td>
                      <td className="px-8 py-6">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {user.user_type === 'super_admin' ? (
                                  <div className="flex items-center gap-1.5 text-red-600">
                                      <Shield className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Global Terminal Access</span>
                                  </div>
                              ) : (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                      {user.company_name ? <Building className="w-3.5 h-3.5 text-orange-500" /> : <Briefcase className="w-3.5 h-3.5 text-blue-500" />}
                                      <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">
                                          {user.company_name || 'System Guest'}
                                      </span>
                                  </div>
                              )}
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-5">
                               {user.status === 'active' ? 'Full Read/Write Access' : 'Restricted (Suspended)'}
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-500 tracking-tight">
                         <div className="flex flex-col">
                           <span>{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                           <span className="text-[9px] uppercase tracking-widest mt-0.5 opacity-50">UTC Timestamp</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                              className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 border border-rose-100"
                              title="Suspend Account"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 border border-emerald-100"
                              title="Activate Account"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'companies' && (
              viewMode === 'list' ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Industry</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Subscription</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Jobs</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={7} className="px-8 py-10 bg-white">
                            <div className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : companies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">No client companies found.</td>
                      </tr>
                    ) : companies.map((comp: any) => (
                      <tr key={comp.id} onClick={() => navigate(`/admin/companies/${comp.id}`)} className="group hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-sm">
                              <Building className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-900 tracking-tight">{comp.name}</div>
                              <div className="text-[10px] text-gray-400 font-bold">{comp.contact_email || 'No contact'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-600 font-medium capitalize">{comp.industry || 'General'}</td>
                        <td className="px-8 py-6 text-xs font-bold text-gray-500">
                          {comp.city ? `${comp.city}, ${comp.country || 'SA'}` : 'N/A'}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                            Pro
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-sm font-black text-gray-900">0</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <StatusBadge status={comp.is_active ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600" title="View" onClick={(e) => { e.stopPropagation(); navigate(`/admin/companies/${comp.id}`); }}>
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-red-100 rounded-lg transition text-red-600" title="Delete" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-white p-6 rounded-3xl border border-gray-100 h-40 w-full"></div>
                    ))
                  ) : companies.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400 font-medium">No client companies found.</div>
                  ) : companies.map((comp: any) => (
                    <div 
                      key={comp.id} 
                      onClick={() => navigate(`/admin/companies/${comp.id}`)}
                      className="group bg-white rounded-3xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
                            <Building className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-base font-black text-gray-900 tracking-tight">{comp.name}</div>
                            <div className="text-xs text-gray-400 font-bold">{comp.contact_email || 'No contact'}</div>
                          </div>
                        </div>
                        <StatusBadge status={comp.is_active ? 'active' : 'inactive'} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-50">
                        <div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Industry</div>
                          <div className="text-sm font-bold text-gray-700 capitalize">{comp.industry || 'General'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Location</div>
                          <div className="text-sm font-bold text-gray-700">{comp.city || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'jobs' && (
              <>
                {/* Bulk Actions Bar */}
                {selectedJobs.length > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-blue-900">
                        {selectedJobs.length} job(s) selected
                      </p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleBulkActivateJobs}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-bold uppercase transition"
                        >
                          Activate
                        </button>
                        <button 
                          onClick={handleBulkDeactivateJobs}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-bold uppercase transition"
                        >
                          Deactivate
                        </button>
                        <button 
                          onClick={handleBulkDeleteJobs}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-bold uppercase transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Jobs Table */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <button 
                          onClick={handleSelectAllJobs}
                          className="p-1 hover:bg-gray-200 rounded transition"
                        >
                          {selectedJobs.length === jobs.length && jobs.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Opportunity</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiring Company</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Applications</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Views</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={9} className="px-8 py-10 bg-white">
                            <div className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : jobs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-gray-400 font-medium">No job opportunities posted.</td>
                      </tr>
                    ) : jobs.map((job: any) => (
                      <tr key={job.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="px-4 py-6">
                          <button 
                            onClick={() => handleSelectJob(job.id)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                          >
                            {selectedJobs.includes(job.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-black text-gray-900 tracking-tight">{job.title}</div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-700 font-bold">{job.company_name}</td>
                        <td className="px-8 py-6 text-xs text-gray-500 font-bold">{job.location || 'N/A'}</td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-sm font-black text-blue-600">{job.applications_count || 0}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-sm font-black text-gray-600">{job.views_count || 0}</span>
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                          {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
                              title="View Job"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
                              title="Duplicate Job"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Delete this job? This action cannot be undone.')) {
                                  handleBulkDeleteJobs();
                                }
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {activeTab === 'candidates' && (
              viewMode === 'list' ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate Profile</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Role</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Experience</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="px-8 py-10 bg-white">
                            <div className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : candidates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No candidates registered.</td>
                      </tr>
                    ) : candidates.map((cand: any) => (
                      <tr key={cand.id} onClick={() => navigate(`/candidates/${cand.id}`)} className="group hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold text-sm">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-900 tracking-tight">{cand.name}</div>
                              <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {cand.email} | <Phone className="w-3 h-3" /> {cand.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-600 font-bold">{cand.current_job_title || 'N/A'}</td>
                        <td className="px-8 py-6 text-center text-xs text-gray-900 font-black">{cand.years_of_experience ?? 0} Years</td>
                        <td className="px-8 py-6 text-xs text-gray-500 font-bold">{cand.city ? `${cand.city}, ${cand.country || 'SA'}` : 'N/A'}</td>
                        <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                          {new Date(cand.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-white p-6 rounded-3xl border border-gray-100 h-40 w-full"></div>
                    ))
                  ) : candidates.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400 font-medium">No candidates registered.</div>
                  ) : candidates.map((cand: any) => (
                    <div 
                      key={cand.id} 
                      onClick={() => navigate(`/candidates/${cand.id}`)}
                      className="group bg-white rounded-3xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-black text-gray-900 tracking-tight truncate">{cand.name}</div>
                          <div className="text-xs text-gray-500 font-bold truncate mt-0.5">{cand.current_job_title || 'No Role specified'}</div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-6 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                          <Mail className="w-4 h-4 text-gray-400" /> {cand.email}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200">
                            {cand.years_of_experience ?? 0} YOE
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            {cand.city || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'applications' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Title</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-8 py-10 bg-white">
                          <div className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">No application records found.</td>
                    </tr>
                  ) : applications.map((app: any) => (
                    <tr key={app.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xs">
                            {(app.candidate_name || '?').charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{app.candidate_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-gray-900">{app.job_title}</td>
                      <td className="px-8 py-6 text-sm text-gray-600">
                        {app.company_name || 'N/A'}
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={app.status || 'pending'} />
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                        {new Date(app.applied_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-green-100 rounded-lg transition text-green-600" title="Accept">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-red-100 rounded-lg transition text-red-600" title="Reject">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 overflow-hidden">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Provision System Account</h2>
                <p className="text-xs text-gray-500">Create a secure administrative, candidate, or company user</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newUserData.first_name}
                    onChange={(e) => setNewUserData({...newUserData, first_name: e.target.value})}
                    placeholder="Mpumelelo"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newUserData.last_name}
                    onChange={(e) => setNewUserData({...newUserData, last_name: e.target.value})}
                    placeholder="Magagula"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="admin@recruitpro.co.za"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                      placeholder="+27 82 123 4567"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Authorized Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'super_admin', label: 'Super Admin', color: 'rose' },
                    { value: 'client', label: 'Company User', color: 'blue' },
                    { value: 'candidate', label: 'Candidate', color: 'purple' },
                  ].map((roleOpt) => {
                    const isSelected = newUserData.role === roleOpt.value;
                    return (
                      <button
                        key={roleOpt.value}
                        type="button"
                        onClick={() => setNewUserData({...newUserData, role: roleOpt.value})}
                        className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                          isSelected
                            ? 'bg-gray-900 border-gray-900 text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {roleOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-xs uppercase tracking-wider hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Provisioning...' : 'Confirm Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
