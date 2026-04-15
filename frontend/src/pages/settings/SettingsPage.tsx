import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { User, Building2, Bell, Shield, Save, Key, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users as UsersIcon } from 'lucide-react';

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
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'analytics'>('profile');
    const [isUpdating, setIsUpdating] = useState(false);

    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            avatar_url: user?.avatar_url || '',
        },
    });

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
            await apiClient.put('/auth/me', data);
            toast.success('Profile updated successfully!');
            // Reload user data in store
            useAuthStore.getState().refreshUser();
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
                            <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 group hover:border-blue-200 transition-all">
                                <span className="font-medium text-gray-700">Managed Clients:</span>{' '}
                                <Link to="/clients" className="text-blue-600 font-black flex items-center group-hover:scale-105 transition-transform">
                                    {user?.managed_clients_count || 0}
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                </Link>
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
                            <div className="flex items-center space-x-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shadow-md ring-4 ring-white">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-3xl font-bold">
                                                {user?.first_name[0]}{user?.last_name[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="block text-sm font-semibold text-gray-900">Profile Picture URL</label>
                                    <input
                                        {...registerProfile('avatar_url')}
                                        type="text"
                                        className="input text-sm"
                                        placeholder="https://example.com/your-photo.jpg"
                                    />
                                    <p className="text-xs text-gray-500">Provide a link to your photo (JPEG, PNG) for identity recognition.</p>
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
                                        className="input"
                                        placeholder="john@example.com"
                                    />
                                    {profileErrors.email && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                                    )}
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

                            {/* Two-Factor Authentication */}
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    Two-Factor Authentication
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    Add an extra layer of security to your account
                                </p>
                                <button className="btn-secondary">Enable 2FA</button>
                            </div>

                            {/* Danger Zone */}
                            <div className="card border-red-200 bg-red-50">
                                <h2 className="text-xl font-semibold text-red-700 mb-2">
                                    Danger Zone
                                </h2>
                                <p className="text-red-600 mb-4 text-sm">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
                                            toast.error('Account deletion requested. Please contact support to finalize.');
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Notification Preferences
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    New Applications
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    Receive notifications when candidates apply to your jobs
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    Interview Reminders
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    Get reminded about upcoming interviews
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    Weekly Reports
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    Receive weekly summary of your recruitment activity
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    Marketing Emails
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    Receive updates about new features and tips
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                                        Browser Notifications
                                    </h3>
                                    <button className="btn-secondary">Enable Browser Notifications</button>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button className="btn-primary flex items-center space-x-2">
                                        <Save className="w-4 h-4" />
                                        <span>Save Preferences</span>
                                    </button>
                                </div>
                            </div>
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
        </div>
    );
}
