import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { User, Building2, Bell, Shield, Save, Key, ArrowRight, CreditCard, Camera, Mail, Briefcase, Star, Calendar, DollarSign, Info, SmartphoneNfc, CheckCircle2, XCircle, Sun, Moon, Sparkles, Palette } from 'lucide-react';
import { useThemeStore, type Theme } from '@/store/theme';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import { QRCodeSVG } from 'qrcode.react';
import UsageDashboard from '@/components/UsageDashboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// ---------------------------------------------------------------------------
// Notification settings panel (shared by recruiter / admin / candidate)
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

type NotifRow = {
    key: keyof NotifPrefs;
    emailKey: keyof NotifPrefs;
    label: string;
    description: string;
    icon: React.ReactNode;
    roles: string[];
};

const NOTIFICATION_ROWS: NotifRow[] = [
    {
        key: 'inapp_new_application',
        emailKey: 'email_new_application',
        label: 'New Application',
        description: 'When a candidate applies to one of your jobs',
        icon: <Briefcase className="w-5 h-5 text-blue-500" />,
        roles: ['agency_admin', 'recruiter', 'client'],
    },
    {
        key: 'inapp_application_status',
        emailKey: 'email_application_status',
        label: 'Application Status Updates',
        description: 'When your application moves to a new stage',
        icon: <ArrowRight className="w-5 h-5 text-purple-500" />,
        roles: ['candidate'],
    },
    {
        key: 'inapp_ai_match',
        emailKey: 'email_ai_match',
        label: 'AI Match Alerts',
        description: 'Top candidate matches found for your jobs / new jobs that match your skills',
        icon: <Star className="w-5 h-5 text-yellow-500" />,
        roles: ['agency_admin', 'recruiter', 'client', 'candidate'],
    },
    {
        key: 'inapp_interview',
        emailKey: 'email_interview',
        label: 'Interview Scheduled',
        description: 'When an interview is confirmed or updated',
        icon: <Calendar className="w-5 h-5 text-green-500" />,
        roles: ['agency_admin', 'recruiter', 'client', 'candidate'],
    },
    {
        key: 'inapp_offer',
        emailKey: 'email_offer',
        label: 'Offer Updates',
        description: 'When an offer is made, accepted, or declined',
        icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
        roles: ['agency_admin', 'recruiter', 'client', 'candidate'],
    },
    {
        key: 'inapp_billing',
        emailKey: 'email_billing',
        label: 'Billing & Subscription',
        description: 'Invoices, plan changes and payment events',
        icon: <CreditCard className="w-5 h-5 text-orange-500" />,
        roles: ['agency_admin', 'client', 'super_admin'],
    },
    {
        key: 'inapp_system',
        emailKey: 'email_system',
        label: 'System Announcements',
        description: 'Platform updates and maintenance notices',
        icon: <Info className="w-5 h-5 text-gray-400" />,
        roles: ['agency_admin', 'recruiter', 'client', 'candidate', 'super_admin'],
    },
];

function NotificationSettingsPanel({ role }: { role?: string }) {
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
        onSuccess: (data) => {
            qc.setQueryData(['notification-preferences'], data);
        },
        onError: () => toast.error('Failed to save notification preference'),
    });

    const handleToggle = (field: keyof NotifPrefs, value: boolean) => {
        mutation.mutate({ [field]: value });
    };

    const visibleRows = NOTIFICATION_ROWS.filter((r) => !role || r.roles.includes(role));

    if (isLoading || !prefs) {
        return (
            <div className="card flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="card">
                <div className="flex items-center space-x-3 mb-1">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">Choose which events you want to be notified about and how.</p>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_80px_80px] gap-4 mb-3 px-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">In-App</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Email</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {visibleRows.map((row) => (
                        <div key={row.key} className="grid grid-cols-[1fr_80px_80px] gap-4 items-center py-4 px-1">
                            <div className="flex items-start space-x-3">
                                <div className="mt-0.5 flex-shrink-0">{row.icon}</div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{row.label}</p>
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

            {role === 'super_admin' && (
                <div className="card bg-blue-50 border border-blue-100">
                    <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Admin feed</p>
                            <p className="text-sm text-blue-700">As a super admin, the notification bell shows all platform-wide activity in addition to your personal notifications.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Two-Factor Authentication card
// ---------------------------------------------------------------------------

function TwoFactorCard({ mfaEnabled, onToggle }: { mfaEnabled: boolean; onToggle: () => void }) {
    const [step, setStep] = useState<'idle' | 'setup' | 'disable'>('idle');
    const [otpauthUrl, setOtpauthUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const startSetup = async () => {
        setLoading(true);
        try {
            const res = await apiClient.post('/auth/mfa/setup');
            setOtpauthUrl(res.data.otpauth_url);
            setSecret(res.data.secret);
            setStep('setup');
        } catch {
            toast.error('Failed to initialise 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const confirmSetup = async () => {
        if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
        setLoading(true);
        try {
            await apiClient.post('/auth/mfa/verify-setup', { code });
            toast.success('Two-factor authentication enabled');
            setStep('idle');
            setCode('');
            onToggle();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const confirmDisable = async () => {
        if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
        setLoading(true);
        try {
            await apiClient.delete('/auth/mfa/disable', { data: { code } });
            toast.success('Two-factor authentication disabled');
            setStep('idle');
            setCode('');
            onToggle();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mfaEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <SmartphoneNfc className={`w-5 h-5 ${mfaEnabled ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Two-Factor Authentication (2FA)</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {mfaEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
            </div>

            {step === 'idle' && (
                <button
                    onClick={mfaEnabled ? () => setStep('disable') : startSetup}
                    disabled={loading}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                        mfaEnabled
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                >
                    {loading ? 'Loading...' : mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
            )}

            {step === 'setup' && (
                <div className="space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                        <p className="font-semibold mb-1">Step 1 — Scan this QR code</p>
                        <p>Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app and scan the code below.</p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-white border-2 border-gray-200 rounded-xl inline-block">
                            <QRCodeSVG value={otpauthUrl} size={180} />
                        </div>
                        <details className="text-xs text-gray-500 text-center">
                            <summary className="cursor-pointer hover:text-gray-700">Can't scan? Enter key manually</summary>
                            <p className="mt-2 font-mono bg-gray-100 px-3 py-2 rounded-lg tracking-widest select-all">{secret}</p>
                        </details>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Step 2 — Enter the 6-digit code to confirm
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="input text-center text-2xl font-bold tracking-[0.4em]"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setStep('idle'); setCode(''); }} className="flex-1 btn-secondary">Cancel</button>
                        <button onClick={confirmSetup} disabled={loading || code.length !== 6} className="flex-1 btn-primary disabled:opacity-50">
                            {loading ? 'Verifying...' : 'Activate 2FA'}
                        </button>
                    </div>
                </div>
            )}

            {step === 'disable' && (
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-800">
                        Enter your current authenticator code to disable 2FA.
                    </div>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="input text-center text-2xl font-bold tracking-[0.4em]"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => { setStep('idle'); setCode(''); }} className="flex-1 btn-secondary">Cancel</button>
                        <button onClick={confirmDisable} disabled={loading || code.length !== 6} className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
                            {loading ? 'Disabling...' : 'Disable 2FA'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------

export default function SettingsPage() {
    const { user, refreshUser } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'analytics' | 'billing' | 'templates' | 'appearance'>('profile');
    const { theme, setTheme } = useThemeStore();
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
                        {['agency_admin', 'recruiter', 'client'].includes(user?.role || '') && (
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
                        {['agency_admin', 'super_admin', 'client'].includes(user?.role || '') && (
                            <button
                                onClick={() => setActiveTab('billing')}
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
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'appearance'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Palette className="w-5 h-5" />
                            <span className="font-medium">Appearance</span>
                        </button>
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
                            {/* Two-Factor Authentication */}
                            <TwoFactorCard
                                mfaEnabled={!!user?.mfa_enabled}
                                onToggle={refreshUser}
                            />

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

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <NotificationSettingsPanel role={user?.role} />
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
                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="card space-y-8">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-1">Appearance</h2>
                                <p className="text-sm text-gray-500">Choose how RecruitPro looks for you. Your preference is saved locally.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Light */}
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                                        theme === 'light' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {/* Preview */}
                                    <div className="bg-gray-50 p-3 h-36">
                                        <div className="flex gap-2 h-full">
                                            <div className="w-10 bg-white rounded-lg border border-gray-200 flex flex-col gap-1.5 p-1.5">
                                                {[1,2,3,4].map(i => <div key={i} className={`h-1.5 rounded-full ${i === 2 ? 'bg-blue-500 w-full' : 'bg-gray-200 w-4/5'}`} />)}
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="bg-white rounded-lg border border-gray-200 h-6 w-full" />
                                                <div className="bg-white rounded-lg border border-gray-200 flex-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sun className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-semibold text-gray-800">Light</span>
                                        </div>
                                        {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                    </div>
                                </button>

                                {/* Dark */}
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                                        theme === 'dark' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="bg-slate-900 p-3 h-36">
                                        <div className="flex gap-2 h-full">
                                            <div className="w-10 bg-slate-800 rounded-lg border border-slate-700 flex flex-col gap-1.5 p-1.5">
                                                {[1,2,3,4].map(i => <div key={i} className={`h-1.5 rounded-full ${i === 2 ? 'bg-blue-500 w-full' : 'bg-slate-600 w-4/5'}`} />)}
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="bg-slate-800 rounded-lg border border-slate-700 h-6 w-full" />
                                                <div className="bg-slate-800 rounded-lg border border-slate-700 flex-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Moon className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-semibold text-slate-200">Dark</span>
                                        </div>
                                        {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                    </div>
                                </button>

                                {/* Glass */}
                                <button
                                    onClick={() => setTheme('glass')}
                                    className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
                                        theme === 'glass' ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="p-3 h-36" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#1a1a4e)' }}>
                                        <div className="flex gap-2 h-full">
                                            <div className="w-10 rounded-lg border flex flex-col gap-1.5 p-1.5" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                                                {[1,2,3,4].map(i => <div key={i} className={`h-1.5 rounded-full ${i === 2 ? 'bg-purple-400 w-full' : 'w-4/5'}`} style={i !== 2 ? { background: 'rgba(255,255,255,0.2)' } : {}} />)}
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="rounded-lg border h-6 w-full" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                                                <div className="rounded-lg border flex-1" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 border-t flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm font-semibold text-white">Glass</span>
                                        </div>
                                        {theme === 'glass' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                                    </div>
                                </button>
                            </div>

                            <p className="text-xs text-gray-400">
                                Glass mode applies a frosted glassmorphism effect over a deep gradient background.
                            </p>
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
