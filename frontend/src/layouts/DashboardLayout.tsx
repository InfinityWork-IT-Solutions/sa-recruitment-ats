import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
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
    Bookmark,
    PartyPopper,
    Sun,
    Moon,
} from 'lucide-react';
import { useState } from 'react';
import NotificationCenter from '@/components/NotificationCenter';

const getNavigation = (role?: string) => {
    if (role === 'candidate') {
        return [
            { name: 'Dashboard', href: '/candidate-dashboard', icon: LayoutDashboard },
            { name: 'Profile', href: '/candidate/profile', icon: User },
            { name: 'Jobs', href: '/candidate/jobs', icon: Briefcase },
            { name: 'My Applications', href: '/candidate/applications', icon: FileText },
            { name: 'Saved Jobs', href: '/candidate/saved-jobs', icon: Bookmark },
            { name: 'Offers', href: '/candidate/offers', icon: PartyPopper },
            { name: 'Assessments', href: '/candidate/assessments', icon: Video },
            { name: 'Settings', href: '/settings', icon: Settings },
        ];
    }

    if (role === 'client' || role === 'agency_admin') {
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

    if (role === 'recruiter') {
        return [
            { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
            { name: 'Jobs', href: '/company/jobs', icon: Briefcase },
            { name: 'Candidates', href: '/company/candidates', icon: Users },
            { name: 'Applications', href: '/company/applications', icon: FileText },
            { name: 'Interviews', href: '/company/interviews', icon: Calendar },
            { name: 'Offers', href: '/company/offers', icon: Gift },
            { name: 'Analytics', href: '/company/analytics', icon: BarChart3 },
            { name: 'Video Reviews', href: '/company/video-screenings', icon: Video },
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
    const { theme, cycleTheme } = useThemeStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-transparent dark:bg-gray-900 transition-colors duration-200">
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
          fixed inset-y-0 left-0 z-50 w-64 border-r border-white/20 dark:border-gray-700
          bg-white/80 dark:bg-gray-800 backdrop-blur-xl
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 dark:border-gray-700">
                        <Link
                            to={
                                user?.role === 'candidate' ? '/candidate-dashboard'
                                : user?.role === 'super_admin' ? '/admin/dashboard'
                                : '/company/dashboard'
                            }
                            className="flex items-center space-x-2"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">R</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">RecruitPro</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                                            ? 'bg-blue-600/10 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'text-gray-700 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-gray-700/50'
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
                    <div className="border-t border-white/20 dark:border-gray-700 p-4">
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
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
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
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800 backdrop-blur-xl border-b border-white/20 dark:border-gray-700 h-16 flex items-center px-6 transition-colors duration-200">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-4"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1" />

                    {/* Theme cycle toggle */}
                    <button
                        onClick={cycleTheme}
                        title={theme === 'light' ? 'Switch to dark mode' : theme === 'dark' ? 'Switch to glass mode' : 'Switch to light mode'}
                        className="mr-3 p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        {theme === 'light'  && <Moon className="w-5 h-5" />}
                        {theme === 'dark'   && <Sun className="w-5 h-5 text-amber-400" />}
                        {theme === 'glass'  && <Sparkles className="w-5 h-5 text-purple-400" />}
                    </button>

                    {/* Notifications */}
                    <div className="mr-4">
                        <NotificationCenter />
                    </div>

                    {/* User badge (role) & Profile Link */}
                    <div className="flex items-center space-x-4">
                        {user?.role && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full font-bold">
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

                {/* Page content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
