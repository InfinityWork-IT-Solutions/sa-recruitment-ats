import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building, CreditCard, Bell, Save, Edit,
    User, Shield, Globe, MapPin, Mail, Check, Camera
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import UsageDashboard from '@/components/UsageDashboard';
import { ImageCropperModal } from '@/components/common/ImageCropperModal';

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
        avatar_url: user?.avatar_url || '',
    });

    const [companyData, setCompanyData] = useState<CompanyProfile>({
        company_name: '',
        website: '',
        industry: '',
        company_size: '',
        location: '',
        description: '',
    });

    const [editingCompany, setEditingCompany] = useState(false);

    useEffect(() => {
        if (user) {
            setUserData({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                avatar_url: user.avatar_url || '',
            });
            fetchCompanyProfile();
        }
    }, [user]);

    const fetchCompanyProfile = async () => {
        try {
            const response = await apiClient.get('/client-companies/me/profile');
            if (response.data) {
                setCompanyData({
                    company_name: response.data.name,
                    website: response.data.website || '',
                    industry: response.data.industry || '',
                    company_size: response.data.company_size || '',
                    location: response.data.city ? `${response.data.city}, ${response.data.country || 'South Africa'}` : '',
                    description: response.data.description || '',
                });
            }
        } catch (error) {
            console.error('Error fetching company profile:', error);
        }
    };

    const handleSaveUser = async () => {
        setSaving(true);
        try {
            // Only send valid fields for UserUpdate
            const updateData = {
                first_name: userData.first_name,
                last_name: userData.last_name,
                avatar_url: userData.avatar_url,
            };
            await apiClient.put('/auth/me', updateData);
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
            const updateData = {
                name: companyData.company_name,
                website: companyData.website,
                industry: companyData.industry,
                company_size: companyData.company_size,
                description: companyData.description,
                city: companyData.location?.split(',')[0].trim() || ''
            };
            await apiClient.put('/client-companies/me/profile', updateData);
            toast.success('Company branding updated!');
            setEditingCompany(false);
            fetchCompanyProfile();
        } catch (error) {
            toast.error('Failed to update company branding');
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
                                       <div className="space-y-2">
                                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Branding Website</label>
                                           <div className="relative">
                                               <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                               <input 
                                                   type="text" 
                                                   value={companyData.website}
                                                   onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                                                   disabled={!editingCompany}
                                                   className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
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
                                                       onChange={(e) => setCompanyData({...companyData, location: e.target.value})}
                                                       disabled={!editingCompany}
                                                       className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                                   />
                                               </div>
                                           </div>
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Operational Context</label>
                                               <input 
                                                   type="text" 
                                                   value={companyData.industry}
                                                   onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                                                   disabled={!editingCompany}
                                                   className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                               />
                                           </div>
                                       </div>
                                       <div className="grid grid-cols-2 gap-8">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Company Size</label>
                                               <select 
                                                   value={companyData.company_size}
                                                   onChange={(e) => setCompanyData({...companyData, company_size: e.target.value})}
                                                   disabled={!editingCompany}
                                                   className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all appearance-none"
                                               >
                                                   <option value="">Select Size</option>
                                                   <option value="1-10">1-10 employees</option>
                                                   <option value="11-50">11-50 employees</option>
                                                   <option value="51-200">51-200 employees</option>
                                                   <option value="201-500">201-500 employees</option>
                                                   <option value="500+">500+ employees</option>
                                               </select>
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
