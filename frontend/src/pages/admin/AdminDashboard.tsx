import { useState, useEffect } from 'react';
import {
  Users, Briefcase, DollarSign, TrendingUp,
  Building, UserCheck, CheckCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../lib/api-client';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
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
  
  // Mock data for trends since we don't have it from backend yet
  const revenueData = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 65000 },
    { name: 'May', revenue: 72000 },
    { name: 'Jun', revenue: 68000 },
    { name: 'Jul', revenue: 85000 },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Terminal</h1>
            <p className="text-gray-500 mt-1">Platform-wide oversight and orchestrator</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={async () => {
                const res = await apiClient.post('/admin/trigger-job-match');
                if (res.status === 200) alert('Matching engine synchronising...');
              }}
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
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Users */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-12 h-12 bg-blue-100/50 rounded-xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Global Network</h3>
          <p className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">
            {stats?.totalUsers.toLocaleString()}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">
            <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              <Building className="w-2.5 h-2.5" /> <span>{stats?.totalAgencies} Agency Groups</span>
            </div>
            <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              <UserCheck className="w-2.5 h-2.5" /> <span>{stats?.totalCandidates} Total Talent</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              <CheckCircle className="w-2.5 h-2.5" /> <span>{stats?.talentConsent} Subscribed</span>
            </div>
          </div>
        </div>
        
        {/* Active Jobs */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-12 h-12 bg-purple-100/50 rounded-xl flex items-center justify-center text-purple-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full">+8%</span>
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Markets</h3>
          <p className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">
            {stats?.activeJobs.toLocaleString()}
          </p>
          <p className="text-[11px] font-medium text-gray-500 mt-4">
            Out of <span className="text-purple-600 font-bold">{stats?.totalJobs}</span> total opportunities posted
          </p>
        </div>
        
        {/* Monthly Revenue */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-12 h-12 bg-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full">+24%</span>
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Platform Revenue</h3>
          <p className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">
            R{stats?.monthlyRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-4 text-[11px] font-medium text-gray-500">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>{stats?.activeSubscriptions} active premium clients</span>
          </div>
        </div>
        
        {/* Total Applications */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-12 h-12 bg-orange-100/50 rounded-xl flex items-center justify-center text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full">+31%</span>
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Talent Velocity</h3>
          <p className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">
            {stats?.totalApplications.toLocaleString()}
          </p>
          <p className="text-[11px] font-medium text-gray-500 mt-4 italic">
            Applications processed this cycle
          </p>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Revenue Chart */}
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Revenue Projection</h3>
            <select className="bg-gray-50 border-none text-xs font-bold px-3 py-1.5 rounded-lg text-gray-600 ring-1 ring-gray-200">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
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
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
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
    </div>
  );
}
