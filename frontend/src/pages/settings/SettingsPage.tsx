import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { User, Building2, Bell, Shield, Save, Key, ArrowRight, CreditCard, Camera, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import UsageDashboard from '@/components/UsageDashboard';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users as UsersIcon } from 'lucide-react';
import { ImageCropperModal } from '@/components/common/ImageCropperModal';
import TemplateManager from '@/components/TemplateManager';

// Profile update schema
const profileSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Password change schema
const passwordSchema = z.object({
    current_password: z.string().min(8, 'Password must be at least 8 characters'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
    const { user, refreshUser } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'analytics' | 'billing' | 'templates'>('profile');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Avatar upload states
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropperModalOpen, setCropperModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors },
        setValue: setProfileValue,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            avatar_url: user?.avatar_url || '',
        },
    });

    // Update form values if user changes
    useEffect(() => {
        if (user) {
            setProfileValue('first_name', user.first_name);
            setProfileValue('last_name', user.last_name);
            setProfileValue('email', user.email);
            setProfileValue('avatar_url', user.avatar_url || '');
        }
    }, [user, setProfileValue]);

    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        reset: resetPassword,
        formState: { errors: passwordErrors },
    } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
        queryKey: ['profile-analytics'],
        queryFn: async () => {
            const res = await apiClient.get('/candidates/profile-analytics/views');
            return res.data;
        },
        enabled: activeTab === 'analytics' && user?.role === 'candidate',
    });

    const onUpdateProfile = async (data: ProfileFormData) => {
        setIsUpdating(true);
        try {
            // Only send valid fields for UserUpdate
            const updateData = {
                first_name: data.first_name,
                last_name: data.last_name,
                avatar_url: data.avatar_url,
            };
            await apiClient.put('/auth/me', updateData);
            toast.success('Profile updated successfully!');
            await refreshUser();
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const onChangePassword = async (data: PasswordFormData) => {
        setIsUpdating(true);
        try {
            await apiClient.post('/users/change-password', {
                current_password: data.current_password,
                new_password: data.new_password,
            });
            toast.success('Password changed successfully!');
            resetPassword();
        } catch (error) {
            toast.error('Failed to change password');
        } finally {
            setIsUpdating(false);
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
            setProfileValue('avatar_url', response.data.avatar_url);
        } catch (err) {
            toast.error("Failed to upload image");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="card space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'profile'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="font-medium">Profile</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'security'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Security</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'notifications'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="font-medium">Notifications</span>
                        </button>
                        {['agency_admin', 'recruiter'].includes(user?.role || '') && (
                            <button
                                onClick={() => setActiveTab('templates')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'templates'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Mail className="w-5 h-5" />
                                <span className="font-medium">Email Templates</span>
                            </button>
                        )}
                        {['agency_admin', 'super_admin'].includes(user?.role || '') && (
                            <button
                                onClick={() => navigate('/settings/billing')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'billing'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5" />
                                <span className="font-medium">Billing & Subscription</span>
                            </button>
                        )}
                        {user?.role === 'candidate' && (
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'analytics'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <BarChart3 className="w-5 h-5" />
                                <span className="font-medium">Profile Analytics</span>
                            </button>
                        )}
                    </div>

                    {/* Agency Info */}
                    <div className="card mt-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Agency</p>
                                <p className="font-medium text-gray-900">{user?.agency_name || 'Your Agency'}</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-3">
                            <div>
                                <span className="font-medium text-gray-700">Role:</span>{' '}
                                <span className="text-gray-900 font-bold">
                                    {user?.role.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                            
                            {/* Profile Picture Section */}
                            <div className="flex items-center space-x-6 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-white relative">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-3xl font-bold">
                                                {user?.first_name[0]}{user?.last_name[0]}
                                            </span>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wider text-[10px]">Identity Image</label>
                                    <input
                                        {...registerProfile('avatar_url')}
                                        type="text"
                                        className="input text-sm bg-white"
                                        placeholder="Or paste a link directly..."
                                    />
                                    <p className="text-[10px] text-gray-400 font-bold">CLICK THE CIRCLE TO UPLOAD A NEW PHOTO</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            {...registerProfile('first_name')}
                                            type="text"
                                            className="input"
                                            placeholder="John"
                                        />
                                        {profileErrors.first_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {profileErrors.first_name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            {...registerProfile('last_name')}
                                            type="text"
                                            className="input"
                                            placeholder="Doe"
                                        />
                                        {profileErrors.last_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {profileErrors.last_name.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        {...registerProfile('email')}
                                        type="email"
                                        className="input bg-gray-50"
                                        disabled
                                        placeholder="john@example.com"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Email is managed by your administrator.</p>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="btn-primary flex items-center space-x-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* Change Password */}
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
                                <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            {...registerPassword('current_password')}
                                            type="password"
                                            className="input"
                                            placeholder="••••••••"
                                        />
                                        {passwordErrors.current_password && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {passwordErrors.current_password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            {...registerPassword('new_password')}
                                            type="password"
                                            className="input"
                                            placeholder="••••••••"
                                        />
                                        {passwordErrors.new_password && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {passwordErrors.new_password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            {...registerPassword('confirm_password')}
                                            type="password"
                                            className="input"
                                            placeholder="••••••••"
                                        />
                                        {passwordErrors.confirm_password && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {passwordErrors.confirm_password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-200">
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="btn-primary flex items-center space-x-2"
                                        >
                                            <Key className="w-4 h-4" />
                                            <span>{isUpdating ? 'Changing...' : 'Change Password'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <UsageDashboard />
                        </div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div className="card">
                            <TemplateManager />
                        </div>
                    )}

                    {/* Analytics Tab (Candidate Only) */}
                    {activeTab === 'analytics' && user?.role === 'candidate' && (
                        <div className="space-y-6">
                            <div className="card bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative border-0">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <BarChart3 className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold mb-6 text-white">Profile Insights</h2>
                                    
                                    {isLoadingAnalytics ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-gray-300 font-medium tracking-wide text-sm uppercase">Views This Week</h3>
                                                    <TrendingUp className={`w-5 h-5 ${analyticsData?.change_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                                                </div>
                                                <div className="text-5xl font-black mb-2">{analyticsData?.views_this_week || 0}</div>
                                                <div className={`text-sm font-medium flex items-center gap-1 ${analyticsData?.change_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {analyticsData?.change_percentage >= 0 ? '↑' : '↓'} {Math.abs(analyticsData?.change_percentage || 0)}% from last week
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <UsersIcon className="w-5 h-5 text-blue-400" />
                                                    <h3 className="text-gray-300 font-medium tracking-wide text-sm uppercase">Top Viewers</h3>
                                                </div>
                                                {analyticsData?.top_viewers?.length > 0 ? (
                                                    <ul className="space-y-3">
                                                        {analyticsData.top_viewers.map((viewer: any, idx: number) => (
                                                            <li key={idx} className="flex justify-between items-center text-sm">
                                                                <span className="text-white truncate pr-4 opacity-90">{viewer.company || "Anonymous Company"}</span>
                                                                <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold w-[24px] text-center">{viewer.count}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">No detailed viewer data available for this period.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
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
