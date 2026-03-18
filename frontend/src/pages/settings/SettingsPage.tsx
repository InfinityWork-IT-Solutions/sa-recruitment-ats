import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { User, Building2, Bell, Shield, Save, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-client';

// Profile update schema
const profileSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
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
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
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

    const onUpdateProfile = async (data: ProfileFormData) => {
        setIsUpdating(true);
        try {
            await apiClient.put('/users/me', data);
            toast.success('Profile updated successfully!');
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
                    </div>

                    {/* Agency Info */}
                    <div className="card mt-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Agency</p>
                                <p className="font-medium text-gray-900">Your Agency</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                            <div>
                                <span className="font-medium">Role:</span>{' '}
                                <span className="text-gray-900">
                                    {user?.role.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium">Status:</span>{' '}
                                <span className="text-green-600">Active</span>
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
                </div>
            </div>
        </div>
    );
}
