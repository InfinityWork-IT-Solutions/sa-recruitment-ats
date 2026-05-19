import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Ban, CheckCircle, Mail, Shield, Briefcase, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all'); // 'all', 'companies', 'candidates'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsers();
  }, [filter, searchQuery]);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/users?type=${filter}&search=${searchQuery}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load system users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user? Access will be revoked immediately.')) return;
    
    try {
      await apiClient.post(`/admin/users/${userId}/suspend`);
      toast.success('User access suspended');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };
  
  const handleActivateUser = async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/activate`);
      toast.success('User access restored');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">User Authority</h1>
            <p className="text-gray-500 mt-1">Manage global access and permissions</p>
          </div>
          <button className="bg-blue-600 text-white rounded-2xl px-6 py-3 font-black text-sm tracking-tight shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all">
            + New Global Admin
          </button>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 md:w-48 bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="all">Every Account</option>
                <option value="candidate">Candidates (Job Seekers)</option>
                <option value="client">Companies</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Users Grid/Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
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
                ) : users.map((user: any) => (
                  <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden transition-transform ${
                            user.user_type === 'candidate' ? 'bg-purple-100 text-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.1)]' :
                            user.user_type === 'super_admin' ? 'bg-red-100 text-red-600' :
                            user.user_type === 'agency_admin' ? 'bg-blue-100 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.1)]' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              (user.name || '?').charAt(0)
                            )}
                          </div>
                          {user.is_verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
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
                                        {user.company_name || user.agency_name || 'System Guest'}
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
                        <button className="p-2.5 bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all border border-gray-100">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Enhanced Summary Info */}
          <div className="bg-gray-50/80 px-8 py-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Records</span>
                    <span className="text-sm font-black text-gray-900">{users.filter(u => u.status === 'active').length} Accounts</span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verified Identity</span>
                    <span className="text-sm font-black text-gray-900">{users.filter(u => u.is_verified).length} Secure IDs</span>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                {[1, 2, 3].map(p => (
                  <button key={p} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${p === 1 ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-2 ring-blue-100' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100 hover:border-gray-200'}`}>
                    {p}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
