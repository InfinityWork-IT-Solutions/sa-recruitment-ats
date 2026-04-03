import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import { Link } from 'react-router-dom';
import {
    Briefcase,
    Users,
    FileText,
    TrendingUp,
    Clock,
    Target,
    ArrowRight,
    Building2,
} from 'lucide-react';

export default function DashboardPage() {
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: () => analyticsService.getDashboard(30),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    const stats = [
        {
            name: 'Active Jobs',
            value: metrics?.active_jobs || 0,
            total: metrics?.total_jobs || 0,
            icon: Briefcase,
            color: 'bg-blue-500',
            link: '/jobs',
        },
        {
            name: 'Active Candidates',
            value: metrics?.active_candidates || 0,
            total: metrics?.total_candidates || 0,
            icon: Users,
            color: 'bg-green-500',
            link: '/candidates',
        },
        {
            name: 'Applications',
            value: metrics?.applications_this_period || 0,
            subtitle: `${metrics?.period_days || 30} days`,
            icon: FileText,
            color: 'bg-indigo-500',
            link: '/applications',
        },
        {
            name: 'Managed Clients',
            value: metrics?.total_clients || 0,
            icon: Building2,
            color: 'bg-orange-500',
            link: '/clients',
        },
    ];

    const performanceMetrics = [
        {
            name: 'Average Time to Hire',
            value: `${metrics?.avg_time_to_hire_days?.toFixed(1) || 0} days`,
            icon: Clock,
            trend: 'neutral',
        },
        {
            name: 'Success Rate',
            value: `${metrics?.success_rate_percentage?.toFixed(1) || 0}%`,
            icon: TrendingUp,
            trend: (metrics?.success_rate_percentage || 0) > 15 ? 'up' : 'neutral',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's your recruitment overview.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.name}
                            to={stat.link}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-gray-600 text-sm font-medium">{stat.name}</p>
                            <div className="flex items-baseline mt-2">
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                {stat.total && (
                                    <p className="ml-2 text-sm text-gray-500">/ {stat.total}</p>
                                )}
                            </div>
                            {stat.subtitle && (
                                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {performanceMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div
                            key={metric.name}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <Icon className="w-6 h-6 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600">{metric.name}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                                </div>
                                {metric.trend === 'up' && (
                                    <div className="text-green-500 text-sm font-medium flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        Good
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/jobs/create"
                        className="flex items-center justify-center space-x-2 bg-blue-50 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Briefcase className="w-5 h-5" />
                        <span className="font-medium">Post New Job</span>
                    </Link>
                    <Link
                        to="/candidates/create"
                        className="flex items-center justify-center space-x-2 bg-green-50 text-green-600 py-3 px-4 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Add Candidate</span>
                    </Link>
                    <Link
                        to="/analytics"
                        className="flex items-center justify-center space-x-2 bg-purple-50 text-purple-600 py-3 px-4 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">View Analytics</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
