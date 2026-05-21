import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    FileText,
    Building2,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Sparkles,
    Video,
    CreditCard,
    Calendar,
    Gift,
    MailWarning,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import NotificationCenter from '@/components/NotificationCenter';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-client';

const getNavigation = (role?: string) => {
    if (role === 'candidate') {
        return [
            { name: 'Profile', href: '/candidate/profile', icon: User },
            { name: 'Dashboard', href: '/candidate-dashboard', icon: LayoutDashboard },
            { name: 'Assessments', href: '/candidate/assessments', icon: Video },
            { name: 'Jobs', href: '/candidate/jobs', icon: Briefcase },
            { name: 'Applications', href: '/candidate/applications', icon: FileText },
            { name: 'Settings', href: '/settings', icon: Settings },
        ];
    }
    
    if (role === 'client') {
        return [
            { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
            { name: 'Company Profile', href: '/company/profile', icon: Building2 },
            { name: 'Jobs', href: '/company/jobs', icon: Briefcase },
            { name: 'Candidates', href: '/company/candidates', icon: Users },
            { name: 'Applications', href: '/company/applications', icon: FileText },
            { name: 'Interviews', href: '/company/interviews', icon: Calendar },
            { name: 'Offers', href: '/company/offers', icon: Gift },
            { name: 'Team', href: '/company/team', icon: User },
            { name: 'Analytics', href: '/company/analytics', icon: BarChart3 },
            { name: 'Video Reviews', href: '/company/video-screenings', icon: Video },
            { name: 'AI Decision Queue', href: '/automation/decisions', icon: Sparkles },
            { name: 'Billing', href: '/settings/billing', icon: CreditCard },
            { name: 'Settings', href: '/settings', icon: Settings },
        ];
    }

    if (role === 'super_admin') {
        return [
            { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Analytics Hub', href: '/admin/analytics', icon: BarChart3 },
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Companies', href: '/admin/companies', icon: Building2 },
            { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
            { name: 'Applications', href: '/admin/applications', icon: FileText },
            { name: 'Video Reviews', href: '/company/video-screenings', icon: Video },
            { name: 'AI Decision Queue', href: '/automation/decisions', icon: Sparkles },
            { name: 'Billing & Payments', href: '/settings/billing', icon: CreditCard },
            { name: 'Settings', href: '/settings', icon: Settings },
        ];
    }
    
    return [];
};

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [resending, setResending] = useState(false);

    const handleResendVerification = async () => {
        setResending(true);
        try {
            await apiClient.post('/auth/resend-verification');
            toast.success('Verification email sent — check your inbox!');
        } catch {
            toast.error('Failed to send email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                        <Link 
                            to={user?.role === 'candidate' ? '/candidate-dashboard' : user?.role === 'client' ? '/company/dashboard' : '/admin/dashboard'} 
                            className="flex items-center space-x-2"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">R</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">RecruitPro</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {getNavigation(user?.role).map((item) => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                                {(user?.avatar_url || localStorage.getItem(`user_avatar_${user?.id}`)) ? (
                                    <img src={user?.avatar_url || localStorage.getItem(`user_avatar_${user?.id}`) || ""} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-semibold flex items-center justify-center w-full h-full">
                                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1" />
                    
                    {/* Notifications */}
                    <div className="mr-4">
                        <NotificationCenter />
                    </div>

                    {/* User badge (role) & Profile Link */}
                    <div className="flex items-center space-x-4">
                        {user?.role && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">
                                {user.role.replace('_', ' ').toUpperCase()}
                            </span>
                        )}
                        
                        <Link 
                            to={user?.role === 'candidate' ? '/candidate/profile' : '/settings'}
                            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition-all shadow-sm overflow-hidden"
                            title="My Profile"
                        >
                            {(user?.avatar_url || localStorage.getItem(`user_avatar_${user?.id}`)) ? (
                                <img src={user?.avatar_url || localStorage.getItem(`user_avatar_${user?.id}`) || ""} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-semibold flex items-center justify-center w-full h-full">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </span>
                            )}
                        </Link>
                    </div>
                </header>

                {/* Unverified email banner */}
                {user && user.is_verified === false && (
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-amber-800 text-sm">
                            <MailWarning className="w-4 h-4 shrink-0" />
                            <span>
                                <strong>Your email address is not verified.</strong>{' '}
                                Please check your inbox for the verification link.
                            </span>
                        </div>
                        <button
                            onClick={handleResendVerification}
                            disabled={resending}
                            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors shrink-0 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                            {resending ? 'Sending…' : 'Resend email'}
                        </button>
                    </div>
                )}

                {/* Page content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
