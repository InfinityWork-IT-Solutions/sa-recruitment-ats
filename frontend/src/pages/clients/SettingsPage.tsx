import { useState, useEffect } from 'react';
import {
    Building, CreditCard, Bell, Save, Edit,
    User, Shield, Globe, MapPin, Mail, Check
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import UsageDashboard from '@/components/UsageDashboard';

interface CompanyProfile {
    company_name: string;
    website?: string;
    industry?: string;
    company_size?: string;
    location?: string;
    description?: string;
}

export default function SettingsPage() {
    const { user, refreshUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'company' | 'profile' | 'billing' | 'notifications'>('profile');
    const [saving, setSaving] = useState(false);
    const [editingUser, setEditingUser] = useState(false);

    const [userData, setUserData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        avatar_url: user?.avatar_url || '',
    });

    const [companyData, setCompanyData] = useState<CompanyProfile>({
        company_name: 'TechCorp',
        website: 'https://techcorp.com',
        industry: 'technology',
        company_size: '51-200',
        location: 'London, United Kingdom',
        description: 'Leading technology company focused on innovation and excellence.',
    });

    useEffect(() => {
        if (user) {
            setUserData({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                avatar_url: user.avatar_url || '',
            });
        }
    }, [user]);

    const handleSaveUser = async () => {
        setSaving(true);
        try {
            await apiClient.put('/auth/me', userData);
            toast.success('Identity updated successfully!');
            await refreshUser();
            setEditingUser(false);
        } catch (error) {
            toast.error('Failed to update identity');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Settings</h1>
                        <p className="text-gray-500 font-bold mt-1">Manage your professional identity and workspace preferences</p>
                    </div>
                    {user?.is_verified ? (
                        <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl border border-blue-100">
                            <Shield className="w-4 h-4 fill-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest">Verified Account</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-2xl border border-orange-100">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Verification Pending</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Navigation */}
                    <div className="lg:col-span-1 space-y-4">
                        <nav className="space-y-2">
                             <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl font-black transition-all ${activeTab === 'profile'
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                <span className="text-xs uppercase tracking-widest">My Identity</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('company')}
                                className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl font-black transition-all ${activeTab === 'company'
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                    }`}
                            >
                                <Building className="w-5 h-5" />
                                <span className="text-xs uppercase tracking-widest">Company Branding</span>
                            </button>
                           
                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl font-black transition-all ${activeTab === 'billing'
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5" />
                                <span className="text-xs uppercase tracking-widest">Billing & Security</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl font-black transition-all ${activeTab === 'notifications'
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                    }`}
                            >
                                <Bell className="w-5 h-5" />
                                <span className="text-xs uppercase tracking-widest">Notifications</span>
                            </button>
                        </nav>

                        <div className="p-6 bg-gradient-to-br from-gray-900 to-black rounded-3xl text-white shadow-2xl">
                             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                                <Shield className="w-5 h-5" />
                             </div>
                             <h4 className="font-black text-sm uppercase tracking-widest mb-2">High Security Mode</h4>
                             <p className="text-xs text-gray-400 font-bold leading-relaxed">Your account is hardened with mandatory verification and administrative oversight.</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                         {activeTab === 'profile' && (
                             <div className="space-y-8">
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                     <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                                        <div className="absolute inset-0 bg-black/10"></div>
                                     </div>
                                     <div className="px-10 pb-10">
                                         <div className="relative -mt-20 mb-10 flex items-end space-x-8">
                                             <div className="w-40 h-40 rounded-[35px] bg-white p-1 shadow-2xl overflow-hidden ring-[12px] ring-white">
                                                  {user?.avatar_url ? (
                                                      <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-[28px]" />
                                                  ) : (
                                                      <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-5xl font-black">
                                                          {user?.first_name[0]}{user?.last_name[0]}
                                                      </div>
                                                  )}
                                             </div>
                                             <div className="pb-4">
                                                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{user?.first_name} {user?.last_name}</h2>
                                                  <p className="text-blue-600 font-black text-sm uppercase tracking-widest mt-1">{user?.role.replace('_', ' ')}</p>
                                             </div>
                                         </div>

                                         <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                                             <div>
                                                 <h3 className="text-xl font-black text-gray-900 tracking-tight">Identity Details</h3>
                                                 <p className="text-gray-400 text-sm font-bold">Personal recognition across the system</p>
                                             </div>
                                             {!editingUser ? (
                                                 <button onClick={() => setEditingUser(true)} className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                                                     Edit Identity
                                                 </button>
                                             ) : (
                                                 <div className="flex space-x-3">
                                                      <button onClick={() => setEditingUser(false)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                                                      <button onClick={handleSaveUser} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-50">
                                                          {saving ? 'Syncing...' : 'Save Changes'}
                                                      </button>
                                                 </div>
                                             )}
                                         </div>

                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                              <div className="space-y-2">
                                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">First Name</label>
                                                  <input 
                                                      type="text" 
                                                      value={userData.first_name}
                                                      onChange={(e) => setUserData({...userData, first_name: e.target.value})}
                                                      disabled={!editingUser}
                                                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                  />
                                              </div>
                                              <div className="space-y-2">
                                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Last Name</label>
                                                  <input 
                                                      type="text" 
                                                      value={userData.last_name}
                                                      onChange={(e) => setUserData({...userData, last_name: e.target.value})}
                                                      disabled={!editingUser}
                                                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                  />
                                              </div>
                                              <div className="md:col-span-2 space-y-2">
                                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Profile Picture URL</label>
                                                  <input 
                                                      type="text" 
                                                      value={userData.avatar_url}
                                                      onChange={(e) => setUserData({...userData, avatar_url: e.target.value})}
                                                      disabled={!editingUser}
                                                      placeholder="https://images.unsplash.com/your-profile-photo"
                                                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                  />
                                                  <p className="text-[10px] text-gray-400 font-bold ml-1">Provide a high-quality photo URL for team recognition.</p>
                                              </div>
                                         </div>
                                     </div>
                                </div>
                             </div>
                         )}

                         {activeTab === 'company' && (
                             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
                                 <div className="mb-10">
                                     <h3 className="text-xl font-black text-gray-900 tracking-tight">Company Branding</h3>
                                     <p className="text-gray-400 text-sm font-bold">Manage public listing and candidate-facing info</p>
                                 </div>
                                 
                                 <div className="space-y-8">
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Company Name</label>
                                          <input 
                                              type="text" 
                                              value={companyData.company_name}
                                              disabled={true}
                                              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-400 cursor-not-allowed"
                                          />
                                      </div>
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Branding Website</label>
                                          <div className="relative">
                                              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                              <input 
                                                  type="text" 
                                                  value={companyData.website}
                                                  disabled={true}
                                                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-400 cursor-not-allowed"
                                              />
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-8">
                                          <div className="space-y-2">
                                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Primary Location</label>
                                              <div className="relative">
                                                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                                  <input 
                                                      type="text" 
                                                      value={companyData.location}
                                                      disabled={true}
                                                      className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-400 cursor-not-allowed"
                                                  />
                                              </div>
                                          </div>
                                          <div className="space-y-2">
                                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Operational Context</label>
                                              <input 
                                                  type="text" 
                                                  value={companyData.industry}
                                                  disabled={true}
                                                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-400 cursor-not-allowed"
                                              />
                                          </div>
                                      </div>
                                 </div>

                                 <div className="mt-12 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center space-x-6">
                                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                          <Mail className="w-8 h-8 text-white" />
                                      </div>
                                      <div>
                                          <h4 className="font-black text-sm uppercase tracking-widest text-blue-900 mb-1">Centralized Governance</h4>
                                          <p className="text-xs text-blue-700 font-bold leading-relaxed">Company branding is managed by System Administrators to ensure platform integrity. Contact support to update core branding.</p>
                                      </div>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'billing' && (
                             <div className="space-y-6">
                                 <UsageDashboard />
                                 
                                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 text-center">
                                     <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                         <Shield className="w-10 h-10 text-gray-200" />
                                     </div>
                                     <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Security Hardening</h3>
                                     <p className="text-gray-400 font-bold max-w-md mx-auto mb-10">Advanced billing panels are currently being hardened. AI Usage tracking is the first module deployed.</p>
                                     <div className="inline-flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/30 animate-pulse">
                                         <Check className="w-4 h-4" />
                                         <span>Security Validated</span>
                                     </div>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'notifications' && (
                             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 text-center">
                                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                     <Shield className="w-10 h-10 text-gray-200" />
                                 </div>
                                 <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Notifications Logic</h3>
                                 <p className="text-gray-400 font-bold max-w-md mx-auto mb-10">Notification settings are scheduled for deployment in the next sprint.</p>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
}
