import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building, CreditCard, Bell, Save, Edit,
    User, Shield, Globe, MapPin, Mail, Check, Camera,
    Briefcase, Star, Calendar, DollarSign, Info, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import UsageDashboard from '@/components/UsageDashboard';
import { ImageCropperModal } from '@/components/common/ImageCropperModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Notification settings component for the client portal
// ---------------------------------------------------------------------------

type NotifPrefs = {
    inapp_new_application: boolean;
    inapp_application_status: boolean;
    inapp_ai_match: boolean;
    inapp_interview: boolean;
    inapp_offer: boolean;
    inapp_billing: boolean;
    inapp_system: boolean;
    email_new_application: boolean;
    email_application_status: boolean;
    email_ai_match: boolean;
    email_interview: boolean;
    email_offer: boolean;
    email_billing: boolean;
    email_system: boolean;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

const CLIENT_NOTIFICATION_ROWS: Array<{
    key: keyof NotifPrefs;
    emailKey: keyof NotifPrefs;
    label: string;
    description: string;
    icon: React.ReactNode;
}> = [
    {
        key: 'inapp_new_application',
        emailKey: 'email_new_application',
        label: 'New Application',
        description: 'When a candidate applies to one of your job postings',
        icon: <Briefcase className="w-5 h-5 text-blue-500" />,
    },
    {
        key: 'inapp_ai_match',
        emailKey: 'email_ai_match',
        label: 'AI Top Match Alert',
        description: 'When the AI finds a high-scoring candidate match for your job',
        icon: <Star className="w-5 h-5 text-yellow-500" />,
    },
    {
        key: 'inapp_interview',
        emailKey: 'email_interview',
        label: 'Interview Updates',
        description: 'Interview scheduled, rescheduled or cancelled',
        icon: <Calendar className="w-5 h-5 text-green-500" />,
    },
    {
        key: 'inapp_offer',
        emailKey: 'email_offer',
        label: 'Offer Updates',
        description: 'Offer accepted, declined or countered by a candidate',
        icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
    },
    {
        key: 'inapp_billing',
        emailKey: 'email_billing',
        label: 'Billing & Subscription',
        description: 'Invoices, seat changes and payment confirmations',
        icon: <CreditCard className="w-5 h-5 text-orange-500" />,
    },
    {
        key: 'inapp_system',
        emailKey: 'email_system',
        label: 'System Announcements',
        description: 'Platform updates, maintenance windows and feature releases',
        icon: <Info className="w-5 h-5 text-gray-400" />,
    },
];

function ClientNotificationSettings() {
    const qc = useQueryClient();

    const { data: prefs, isLoading } = useQuery<NotifPrefs>({
        queryKey: ['notification-preferences'],
        queryFn: async () => {
            const res = await apiClient.get('/notifications/preferences');
            return res.data;
        },
    });

    const mutation = useMutation({
        mutationFn: async (patch: Partial<NotifPrefs>) => {
            const res = await apiClient.put('/notifications/preferences', patch);
            return res.data;
        },
        onSuccess: (data) => qc.setQueryData(['notification-preferences'], data),
        onError: () => toast.error('Failed to save notification preference'),
    });

    const handleToggle = (field: keyof NotifPrefs, value: boolean) => {
        mutation.mutate({ [field]: value });
    };

    if (isLoading || !prefs) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center space-x-3 mb-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Notification Preferences</h3>
                </div>
                <p className="text-sm text-gray-500 mb-8">Control which events trigger notifications and how you receive them.</p>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_90px_90px] gap-4 mb-3 px-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">In-App</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Email</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {CLIENT_NOTIFICATION_ROWS.map((row) => (
                        <div key={row.key} className="grid grid-cols-[1fr_90px_90px] gap-4 items-center py-5 px-1">
                            <div className="flex items-start space-x-3">
                                <div className="mt-0.5 flex-shrink-0">{row.icon}</div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{row.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{row.description}</p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <Toggle
                                    checked={prefs[row.key]}
                                    onChange={(v) => handleToggle(row.key, v)}
                                />
                            </div>
                            <div className="flex justify-center">
                                <Toggle
                                    checked={prefs[row.emailKey]}
                                    onChange={(v) => handleToggle(row.emailKey, v)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                    Changes are saved instantly. Email notifications are sent to <span className="font-bold">your registered email address</span>.
                </p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------

interface CompanyProfile {
    company_name: string;
    website?: string;
    industry?: string;
    company_size?: string;
    city?: string;
    province?: string;
    country?: string;
    postal_code?: string;
    description?: string;
    // Contact details — internal only, never exposed to candidates
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_position?: string;
}

export default function SettingsPage() {
    const { user, refreshUser } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'company' | 'profile' | 'billing' | 'notifications'>('profile');
    const [saving, setSaving] = useState(false);
    const [editingUser, setEditingUser] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropperModalOpen, setCropperModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

    const [userData, setUserData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: (user as any)?.phone || '',
        avatar_url: user?.avatar_url || '',
    });

    const [companyData, setCompanyData] = useState<CompanyProfile>({
        company_name: '',
        website: '',
        industry: '',
        company_size: '',
        city: '',
        province: '',
        country: 'South Africa',
        postal_code: '',
        description: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_position: '',
    });

    const [editingCompany, setEditingCompany] = useState(false);

    useEffect(() => {
        if (user) {
            setUserData({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: (user as any).phone || '',
                avatar_url: user.avatar_url || '',
            });
            fetchCompanyProfile();
        }
    }, [user]);

    const fetchCompanyProfile = async () => {
        try {
            const response = await apiClient.get('/client-companies/me/profile');
            if (response.data) {
                const d = response.data;
                setCompanyData({
                    company_name: d.name || '',
                    website: d.website || '',
                    industry: d.industry || '',
                    company_size: d.company_size || '',
                    city: d.city || '',
                    province: d.province || '',
                    country: d.country || 'South Africa',
                    postal_code: d.postal_code || '',
                    description: d.description || '',
                    contact_name: d.contact_name || '',
                    contact_email: d.contact_email || '',
                    contact_phone: d.contact_phone || '',
                    contact_position: d.contact_position || '',
                });
            }
        } catch (error) {
            console.error('Error fetching company profile:', error);
        }
    };

    const handleSaveUser = async () => {
        setSaving(true);
        try {
            await apiClient.put('/auth/me', {
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone: userData.phone,
                avatar_url: userData.avatar_url,
            });
            toast.success('Identity updated successfully!');
            await refreshUser();
            setEditingUser(false);
        } catch (error) {
            toast.error('Failed to update identity');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCompany = async () => {
        setSaving(true);
        try {
            await apiClient.put('/client-companies/me/profile', {
                name: companyData.company_name,
                website: companyData.website,
                industry: companyData.industry,
                company_size: companyData.company_size,
                city: companyData.city,
                province: companyData.province,
                country: companyData.country,
                postal_code: companyData.postal_code,
                description: companyData.description,
                contact_name: companyData.contact_name,
                contact_email: companyData.contact_email,
                contact_phone: companyData.contact_phone,
                contact_position: companyData.contact_position,
            });
            toast.success('Company profile updated!');
            setEditingCompany(false);
            fetchCompanyProfile();
        } catch (error) {
            toast.error('Failed to update company profile');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

        const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post('/auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Profile picture updated!");
            await refreshUser();
            setUserData(prev => ({ ...prev, avatar_url: response.data.avatar_url }));
        } catch (err) {
            toast.error("Failed to upload image");
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
                                onClick={() => navigate('/company/settings/billing')}
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
                                             <div className="relative group w-40 h-40">
                                                 <div className="w-40 h-40 rounded-[35px] bg-white p-1 shadow-2xl overflow-hidden ring-[12px] ring-white">
                                                      {user?.avatar_url ? (
                                                          <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-[28px]" />
                                                      ) : (
                                                          <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-5xl font-black">
                                                              {user?.first_name[0]}{user?.last_name[0]}
                                                          </div>
                                                      )}
                                                 </div>
                                                 <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute inset-0 bg-black/40 rounded-[35px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"
                                                 >
                                                     <Camera className="w-10 h-10" />
                                                 </button>
                                                 <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                 />
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
                                              <div className="space-y-2">
                                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                                  <div className="relative">
                                                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                                      <input
                                                          type="email"
                                                          value={userData.email}
                                                          disabled
                                                          className="w-full pl-16 pr-6 py-4 bg-gray-100 border-none rounded-2xl font-bold text-gray-500 cursor-not-allowed transition-all"
                                                      />
                                                  </div>
                                                  <p className="text-[10px] text-gray-400 font-bold ml-1">Email is managed by your administrator.</p>
                                              </div>
                                              <div className="space-y-2">
                                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                                                  <input
                                                      type="tel"
                                                      value={userData.phone}
                                                      onChange={(e) => setUserData({...userData, phone: e.target.value})}
                                                      disabled={!editingUser}
                                                      placeholder="+27 82 000 0000"
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
                                                  <p className="text-[10px] text-gray-400 font-bold ml-1">Or click the photo above to upload directly.</p>
                                              </div>
                                         </div>
                                     </div>
                                </div>
                             </div>
                         )}

                         {activeTab === 'company' && (
                              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
                                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                                      <div>
                                          <h3 className="text-xl font-black text-gray-900 tracking-tight">Company Branding</h3>
                                          <p className="text-gray-400 text-sm font-bold">Manage public listing and candidate-facing info</p>
                                      </div>
                                      {!editingCompany ? (
                                          <button onClick={() => setEditingCompany(true)} className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                                              Edit Profile
                                          </button>
                                      ) : (
                                          <div className="flex space-x-3">
                                               <button onClick={() => setEditingCompany(false)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                                               <button onClick={handleSaveCompany} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-50">
                                                   {saving ? 'Syncing...' : 'Save Changes'}
                                               </button>
                                          </div>
                                      )}
                                  </div>
                                  
                                  <div className="space-y-8">

                                       {/* ── Basic Info ── */}
                                       <div className="space-y-2">
                                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Company Name</label>
                                           <input
                                               type="text"
                                               value={companyData.company_name}
                                               onChange={(e) => setCompanyData({...companyData, company_name: e.target.value})}
                                               disabled={!editingCompany}
                                               className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                           />
                                       </div>

                                       <div className="grid grid-cols-2 gap-8">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Industry</label>
                                               <input
                                                   type="text"
                                                   value={companyData.industry}
                                                   onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                                                   disabled={!editingCompany}
                                                   placeholder="e.g. Technology, Finance"
                                                   className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                               />
                                           </div>
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Company Size</label>
                                               <select
                                                   value={companyData.company_size}
                                                   onChange={(e) => setCompanyData({...companyData, company_size: e.target.value})}
                                                   disabled={!editingCompany}
                                                   className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all appearance-none"
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

                                       <div className="space-y-2">
                                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Website</label>
                                           <div className="relative">
                                               <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                               <input
                                                   type="text"
                                                   value={companyData.website}
                                                   onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                                                   disabled={!editingCompany}
                                                   placeholder="https://yourcompany.co.za"
                                                   className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                               />
                                           </div>
                                       </div>

                                       <div className="space-y-2">
                                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Company Description</label>
                                           <textarea
                                               value={companyData.description}
                                               onChange={(e) => setCompanyData({...companyData, description: e.target.value})}
                                               disabled={!editingCompany}
                                               rows={4}
                                               className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all resize-none"
                                               placeholder="Describe your company's mission and values..."
                                           />
                                       </div>

                                       {/* ── Contact Information (internal — not shown to candidates) ── */}
                                       <div className="pt-4 border-t border-gray-50">
                                           <div className="flex items-center space-x-2 mb-6">
                                               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Contact Information</h4>
                                               <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Internal only · hidden from candidates</span>
                                           </div>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Person Name</label>
                                                   <input
                                                       type="text"
                                                       value={companyData.contact_name}
                                                       onChange={(e) => setCompanyData({...companyData, contact_name: e.target.value})}
                                                       disabled={!editingCompany}
                                                       placeholder="Jane Smith"
                                                       className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                   />
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Position / Title</label>
                                                   <input
                                                       type="text"
                                                       value={companyData.contact_position}
                                                       onChange={(e) => setCompanyData({...companyData, contact_position: e.target.value})}
                                                       disabled={!editingCompany}
                                                       placeholder="HR Manager"
                                                       className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                   />
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Email</label>
                                                   <div className="relative">
                                                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                                       <input
                                                           type="email"
                                                           value={companyData.contact_email}
                                                           onChange={(e) => setCompanyData({...companyData, contact_email: e.target.value})}
                                                           disabled={!editingCompany}
                                                           placeholder="hr@yourcompany.co.za"
                                                           className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                       />
                                                   </div>
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Phone</label>
                                                   <input
                                                       type="tel"
                                                       value={companyData.contact_phone}
                                                       onChange={(e) => setCompanyData({...companyData, contact_phone: e.target.value})}
                                                       disabled={!editingCompany}
                                                       placeholder="+27 11 000 0000"
                                                       className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                   />
                                               </div>
                                           </div>
                                       </div>

                                       {/* ── Address ── */}
                                       <div className="pt-4 border-t border-gray-50">
                                           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Office Address</h4>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">City</label>
                                                   <div className="relative">
                                                       <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                                       <input
                                                           type="text"
                                                           value={companyData.city}
                                                           onChange={(e) => setCompanyData({...companyData, city: e.target.value})}
                                                           disabled={!editingCompany}
                                                           placeholder="Johannesburg"
                                                           className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                       />
                                                   </div>
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Province</label>
                                                   <select
                                                       value={companyData.province}
                                                       onChange={(e) => setCompanyData({...companyData, province: e.target.value})}
                                                       disabled={!editingCompany}
                                                       className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all appearance-none"
                                                   >
                                                       <option value="">Select province</option>
                                                       <option>Gauteng</option>
                                                       <option>Western Cape</option>
                                                       <option>KwaZulu-Natal</option>
                                                       <option>Eastern Cape</option>
                                                       <option>Limpopo</option>
                                                       <option>Mpumalanga</option>
                                                       <option>North West</option>
                                                       <option>Northern Cape</option>
                                                       <option>Free State</option>
                                                   </select>
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Postal Code</label>
                                                   <input
                                                       type="text"
                                                       value={companyData.postal_code}
                                                       onChange={(e) => setCompanyData({...companyData, postal_code: e.target.value})}
                                                       disabled={!editingCompany}
                                                       placeholder="2000"
                                                       className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                   />
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Country</label>
                                                   <input
                                                       type="text"
                                                       value={companyData.country}
                                                       onChange={(e) => setCompanyData({...companyData, country: e.target.value})}
                                                       disabled={!editingCompany}
                                                       placeholder="South Africa"
                                                       className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                   />
                                               </div>
                                           </div>
                                       </div>

                                  </div>
                              </div>
                         )}

                         {activeTab === 'billing' && (
                             <div className="space-y-6">
                                 <UsageDashboard />
                                 
                                 <div className="bg-blue-600/5 p-8 rounded-3xl border border-blue-100 flex items-center justify-between">
                                      <div className="flex items-center space-x-6">
                                          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                                              <Shield className="w-7 h-7 text-white" />
                                          </div>
                                          <div>
                                              <h4 className="font-black text-sm uppercase tracking-widest text-blue-900 mb-1">Authenticated Account</h4>
                                              <p className="text-xs text-blue-700 font-bold">Your subscription is active and managed via the primary billing gateway.</p>
                                          </div>
                                      </div>
                                      <div className="bg-green-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">
                                          Live
                                      </div>
                                 </div>
                             </div>
                         )}

                         {activeTab === 'notifications' && (
                             <ClientNotificationSettings />
                         )}
                    </div>
                </div>
            </div>

            {/* Cropper Modal */}
            {selectedImageSrc && (
                <ImageCropperModal
                    isOpen={cropperModalOpen}
                    onClose={() => {
                        setCropperModalOpen(false);
                        setSelectedImageSrc(null);
                    }}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1}
                />
            )}
        </div>
    );
}
