import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Briefcase, DollarSign, TrendingUp,
  Building, UserCheck, CheckCircle, ArrowUpRight, ArrowDownRight, Eye,
  Download, Settings as SettingsIcon, Plus, BarChart3, LayoutDashboard,
  Layers, Share2, Filter, Award, Target, HelpCircle, BarChart as BarIcon, PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../lib/api-client';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  totalAgencies: number;
  totalCandidates: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  talentConsent: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>(
    location.pathname === '/admin/analytics' ? 'analytics' : 'overview'
  );
  
  useEffect(() => {
    if (location.pathname === '/admin/analytics') {
      setActiveTab('analytics');
    } else if (location.pathname === '/admin/dashboard') {
      setActiveTab('overview');
    }
  }, [location.pathname]);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      const data = response.data;
      setStats(data.stats);
      setRecentActivity(data.recent_activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Loading Admin Control Center...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Analytics and Charts Mock Data
  // ----------------------------------------------------
  const revenueData = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 65000 },
    { name: 'May', revenue: 72000 },
    { name: 'Jun', revenue: 68000 },
    { name: 'Jul', revenue: 85000 },
  ];

  const applicationsOverTime = [
    { name: 'Jan', count: 1200 },
    { name: 'Feb', count: 1600 },
    { name: 'Mar', count: 1400 },
    { name: 'Apr', count: 2200 },
    { name: 'May', count: 3100 },
    { name: 'Jun', count: 2800 },
    { name: 'Jul', count: 4892 },
  ];

  const topCompanies = [
    { name: 'TechCorp', applications: 45, hires: 12, rate: 92 },
    { name: 'StartupX', applications: 32, hires: 8, rate: 88 },
    { name: 'BigCo', applications: 28, hires: 5, rate: 85 },
    { name: 'Apex Solutions', applications: 22, hires: 4, rate: 80 },
    { name: 'AlphaTech', applications: 19, hires: 3, rate: 78 },
  ];

  const popularJobs = [
    { title: 'Senior Developer', company: 'TechCorp', applications: 45, status: 'Active', category: 'Engineering' },
    { title: 'Product Manager', company: 'StartupX', applications: 38, status: 'Active', category: 'Management' },
    { title: 'UI/UX Designer', company: 'BigCo', applications: 32, status: 'Reviewing', category: 'Design' },
    { title: 'Data Scientist', company: 'Apex Solutions', applications: 27, status: 'Active', category: 'Data' },
    { title: 'DevOps Engineer', company: 'AlphaTech', applications: 24, status: 'Pending', category: 'Engineering' },
  ];

  const candidateSources = [
    { name: 'LinkedIn', value: 2201, color: '#2563eb' },
    { name: 'Indeed', value: 1223, color: '#0ea5e9' },
    { name: 'Referrals', value: 734, color: '#10b981' },
    { name: 'Direct/Site', value: 489, color: '#f59e0b' },
    { name: 'Other', value: 245, color: '#8b5cf6' },
  ];

  const funnelSteps = [
    { stage: 'Applied', count: 4892, percentage: 100, color: 'bg-blue-600', description: 'Total application submissions' },
    { stage: 'Shortlisted', count: 3180, percentage: 65, color: 'bg-sky-500', description: 'Screened by system / AI match' },
    { stage: 'Interviewing', count: 1712, percentage: 35, color: 'bg-emerald-500', description: 'Interviews & video screenings' },
    { stage: 'Offered', count: 587, percentage: 12, color: 'bg-amber-500', description: 'Employment offers extended' },
    { stage: 'Placed', count: 391, percentage: 8, color: 'bg-rose-500', description: 'Successful placements' },
  ];

  const detailedRevenue = [
    { name: 'Jan', actual: 45000, projected: 45000 },
    { name: 'Feb', actual: 52000, projected: 50000 },
    { name: 'Mar', actual: 48000, projected: 55000 },
    { name: 'Apr', actual: 65000, projected: 60000 },
    { name: 'May', actual: 72000, projected: 65000 },
    { name: 'Jun', actual: 68000, projected: 70000 },
    { name: 'Jul', actual: 85000, projected: 75000 },
    { name: 'Aug', projected: 90000 },
    { name: 'Sep', projected: 98000 },
    { name: 'Oct', projected: 105000 },
    { name: 'Nov', projected: 112000 },
    { name: 'Dec', projected: 120000 },
  ];

  const inactiveUsers = Math.max(0, (stats?.totalUsers ?? 0) - ((stats?.totalCandidates ?? 0) + (stats?.totalAgencies ?? 0)));
  const closedJobs = Math.max(0, (stats?.totalJobs ?? 0) - (stats?.activeJobs ?? 0));
  
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]} />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Platform-wide oversight and analytics control center</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={async () => {
                const res = await apiClient.post('/admin/trigger-job-match');
                if (res.status === 200) toast.success('Matching engine synchronising...');
              }}
              title="Automatically run the matching engine to pair active candidates with relevant job opportunities"
              className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 shadow-sm border border-blue-200/50"
            >
              Synchronize Active Talent
            </button>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-semibold text-gray-600 tracking-wider uppercase">System Engines Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Switcher */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-200/60 mb-8 max-w-md">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]'
              : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard Overview
        </button>
        <button
          onClick={() => navigate('/admin/analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]'
              : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics Hub
        </button>
      </div>
      
      {/* Stats Grid - Shared at the top */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Users */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 p-6 border border-gray-100 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div>
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-100/50 rounded-xl flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-gray-900 text-sm font-black uppercase tracking-wider">Total Users</span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                View <Eye className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-gray-900 tracking-tighter">
                {stats?.totalUsers ?? 0}
              </span>
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12%
                <span className="text-gray-400 font-medium text-[9px] lowercase tracking-normal ml-0.5">from last month</span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 space-y-1.5 text-xs text-gray-500 font-medium relative">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {stats?.totalCandidates ?? 0} Candidates
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {stats?.totalAgencies ?? 0} Companies
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 ${inactiveUsers > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${inactiveUsers > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></span>
                {inactiveUsers} Inactive
              </span>
            </div>
          </div>
        </div>
        
        {/* Active Jobs */}
        <div 
          onClick={() => navigate('/admin/jobs')}
          className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-purple-200 transition-all duration-300 p-6 border border-gray-100 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div>
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100/50 rounded-xl flex items-center justify-center text-purple-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-gray-900 text-sm font-black uppercase tracking-wider">Active Jobs</span>
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 group-hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                View <Eye className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-gray-900 tracking-tighter">
                {stats?.activeJobs ?? 0}
              </span>
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8%
                <span className="text-gray-400 font-medium text-[9px] lowercase tracking-normal ml-0.5">from last month</span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 space-y-1.5 text-xs text-gray-500 font-medium relative">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                {stats?.totalJobs ?? 0} Total Postings
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {stats?.activeJobs ?? 0} Active Postings
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                {closedJobs} Closed / Filled
              </span>
            </div>
          </div>
        </div>
        
        {/* Monthly Revenue */}
        <div 
          onClick={() => navigate('/settings/billing')}
          className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 p-6 border border-gray-100 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div>
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-gray-900 text-sm font-black uppercase tracking-wider">Monthly Revenue</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                View <Eye className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-gray-900 tracking-tighter">
                R{(stats?.monthlyRevenue ?? 0).toLocaleString()}
              </span>
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +24%
                <span className="text-gray-400 font-medium text-[9px] lowercase tracking-normal ml-0.5">from last month</span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 space-y-1.5 text-xs text-gray-500 font-medium relative">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {stats?.activeSubscriptions ?? 0} Active Clients
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                R{stats?.activeSubscriptions ? Math.round(stats.monthlyRevenue / stats.activeSubscriptions).toLocaleString() : 0} Avg / Account
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                0 Overdue Payments
              </span>
            </div>
          </div>
        </div>
        
        {/* Total Applications */}
        <div 
          onClick={() => navigate('/admin/applications')}
          className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 p-6 border border-gray-100 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div>
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-100/50 rounded-xl flex items-center justify-center text-orange-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-gray-900 text-sm font-black uppercase tracking-wider">Total Applications</span>
              </div>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 group-hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-0.5">
                View <Eye className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-gray-900 tracking-tighter">
                {stats?.totalApplications ?? 0}
              </span>
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +31%
                <span className="text-gray-400 font-medium text-[9px] lowercase tracking-normal ml-0.5">from last cycle</span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 space-y-1.5 text-xs text-gray-500 font-medium relative">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                {stats?.totalApplications ?? 0} Processed
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                85% Match Accuracy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                0 Bottlenecks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Rendering based on selected sub-tab */}
      {activeTab === 'overview' ? (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Revenue Projection</h3>
                <select className="bg-gray-50 border-none text-xs font-bold px-3 py-1.5 rounded-lg text-gray-600 ring-1 ring-gray-200">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* User Distribution */}
            <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-8 tracking-tight">Global Distribution</h3>
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Agencies</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 bg-blue-50 px-2 py-0.5 rounded shadow-sm">{stats?.totalAgencies}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2.5 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)] transition-all duration-1000" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Candidates</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 bg-purple-50 px-2 py-0.5 rounded shadow-sm">{stats?.totalCandidates}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-2.5 rounded-full shadow-[0_0_8px_rgba(147,51,234,0.3)] transition-all duration-1000" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Seats</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 bg-emerald-50 px-2 py-0.5 rounded shadow-sm">{stats?.activeSubscriptions}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all flex items-center gap-1.5"
                >
                  View All <span className="text-sm font-black">→</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Top Companies */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
                  🏆 Top Companies
                </h3>
                <button 
                  onClick={() => navigate('/admin/companies')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{company.name}</p>
                        <p className="text-xs text-gray-500">{company.hires} hires • {company.applications} applications</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-gray-600">+{company.rate}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Jobs */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
                  🔥 Trending Jobs
                </h3>
                <button 
                  onClick={() => navigate('/admin/jobs')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-4">
                {popularJobs.map((job, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.company} • {job.applications} applications</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-blue-600">⭐ Trending</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mb-10 bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/admin/users')}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Create User</span>
                <span className="text-[10px] text-gray-500 mt-1">Provision new account</span>
              </button>
              
              <button 
                onClick={() => navigate('/admin/companies')}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Add Company</span>
                <span className="text-[10px] text-gray-500 mt-1">Onboard new client</span>
              </button>
              
              <button 
                onClick={() => navigate('/admin/applications')}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Export Data</span>
                <span className="text-[10px] text-gray-500 mt-1">Download system data</span>
              </button>
              
              <button 
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Settings</span>
                <span className="text-[10px] text-gray-500 mt-1">Platform config</span>
              </button>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">System Events</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-xl">Download Full Log</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentActivity.map((activity: any, index: number) => (
                <div key={index} className="group flex items-start space-x-4 p-5 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 border border-transparent hover:border-gray-100">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6 ${
                    activity.type === 'signup' ? 'bg-emerald-100/50 text-emerald-600' :
                    activity.type === 'subscription' ? 'bg-blue-100/50 text-blue-600' :
                    activity.type === 'job' ? 'bg-purple-100/50 text-purple-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {activity.type === 'signup' && <UserCheck className="w-6 h-6" />}
                    {activity.type === 'subscription' && <DollarSign className="w-6 h-6" />}
                    {activity.type === 'job' && <Briefcase className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-gray-900">{activity.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activity.timestamp}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ----------------------------------------------------
           ANALYTICS HUB TAB VIEW
           ---------------------------------------------------- */
        <div className="space-y-8">
          {/* Row 1: Applications Over Time & Candidate Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Applications Over Time AreaChart */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <LineIcon className="w-5 h-5 text-blue-600" />
                    Applications Over Time
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Track growth in total applicant submissions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    +48% YoY
                  </span>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={applicationsOverTime}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      name="Applications"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorApps)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Candidate Sources Donut/PieChart */}
            <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mb-1">
                  <PieIcon className="w-5 h-5 text-blue-600" />
                  Candidate Sources
                </h3>
                <p className="text-xs text-gray-400 mb-6">Distribution channels of job seekers</p>
                <div className="h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={candidateSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {candidateSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} candidates`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900">4,892</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-gray-600">
                {candidateSources.map((src, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: src.color }}></span>
                    <span className="truncate">{src.name}</span>
                    <span className="text-gray-400 font-bold ml-auto">{Math.round((src.value / 4892) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Conversion Funnel (Visual Glassmorphic Flow) */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <div className="mb-8">
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Recruitment Conversion Funnel
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Pipeline throughput conversion rates from Applied to Hired</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {funnelSteps.map((step, idx) => {
                const prevStep = idx > 0 ? funnelSteps[idx - 1] : null;
                const dropRate = prevStep ? Math.round((step.count / prevStep.count) * 100) : 100;
                
                return (
                  <div key={idx} className="relative flex flex-col justify-between p-5 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300">
                    <div>
                      {/* Badge / Step # */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Stage 0{idx + 1}
                        </span>
                        {idx > 0 && (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            {dropRate}% conversion
                          </span>
                        )}
                      </div>

                      {/* Header */}
                      <h4 className="font-extrabold text-gray-900 text-sm tracking-tight">{step.stage}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed font-medium min-h-[30px]">{step.description}</p>
                    </div>

                    <div className="mt-6 space-y-2">
                      {/* Progress bar representing conversion width */}
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full ${step.color}`} style={{ width: `${step.percentage}%` }}></div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-gray-900 tracking-tight">{step.count.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{step.percentage}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 3: Top Performing Companies & Most Popular Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Performing Companies BarChart */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="mb-6">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Top Performing Companies
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Comparing companies by application volume & hire count</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCompanies} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="applications" name="Applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hires" name="Placements" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Popular Jobs Leaderboard */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      Popular Job Listings
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Job postings drawing maximum applicant traffic</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/jobs')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {popularJobs.map((job, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{job.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span>{job.company}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{job.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-gray-900">{job.applications}</span>
                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Apps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Detailed Monthly Revenue & Growth AreaChart */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Monthly Revenue Expansion
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Actual client subscription revenues paired with projections</p>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Target: R1.5M ARR
              </span>
            </div>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detailedRevenue}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => `R${(val as number).toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value) => [`R${(value as number).toLocaleString()}`]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    name="Actual Subscription Revenue"
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projected" 
                    name="Target Projections"
                    stroke="#6366f1" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorProjected)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
