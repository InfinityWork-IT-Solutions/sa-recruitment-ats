import { useState, useEffect } from 'react';
import {
  Search, Filter, MoreVertical, Ban, CheckCircle, Mail, Shield, Briefcase,
  Building, User, FileText, Download, X, Plus, Phone, Globe, Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

type TabType = 'users' | 'companies' | 'jobs' | 'candidates' | 'applications';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'candidate', 'client', 'super_admin'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white/60 p-1.5 rounded-2xl border border-gray-100 backdrop-blur-md max-w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSearchQuery('');
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
        
        {/* Filters & Search */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-gray-100">
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Industry</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Website</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
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
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No client companies found.</td>
                    </tr>
                  ) : companies.map((comp: any) => (
                    <tr key={comp.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-sm">
                            <Building className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-gray-900 tracking-tight">{comp.name}</div>
                            <div className="text-[10px] text-gray-400 font-bold">{comp.contact_email || 'No email contact'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-600 font-medium capitalize">{comp.industry || 'General Industry'}</td>
                      <td className="px-8 py-6 text-xs text-blue-500 font-bold underline">
                        {comp.website ? (
                          <a href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noreferrer">
                            {comp.website}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-500">
                        {comp.city ? `${comp.city}, ${comp.country || 'SA'}` : 'N/A'}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          comp.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          {comp.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'jobs' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Opportunity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiring Company</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created Date</th>
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
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No job opportunities posted.</td>
                    </tr>
                  ) : jobs.map((job: any) => (
                    <tr key={job.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
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
                      <td className="px-8 py-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          job.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          job.status === 'draft' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                        {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'candidates' && (
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
                    <tr key={cand.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
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
            )}

            {activeTab === 'applications' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Applied Opportunity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-8 py-10 bg-white">
                          <div className="h-10 bg-gray-100 rounded-2xl w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400 font-medium">No application records found.</td>
                    </tr>
                  ) : applications.map((app: any) => (
                    <tr key={app.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-8 py-6 text-sm font-black text-gray-900 tracking-tight">{app.candidate_name}</td>
                      <td className="px-8 py-6 text-sm text-gray-700 font-bold">{app.job_title}</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          app.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                          'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                        {new Date(app.applied_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
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
