import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Briefcase, Target, Clock, Download, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'predictions'>('overview');
    const [periodDays, setPeriodDays] = useState(30);

    const { data: dashboard } = useQuery({
        queryKey: ['dashboard-metrics', periodDays],
        queryFn: () => analyticsService.getDashboard(periodDays),
    });

    const { data: applicationsOverTime } = useQuery({
        queryKey: ['applications-over-time', periodDays],
        queryFn: () => analyticsService.getApplicationsOverTime(periodDays),
    });

    const { data: applicationsByStatus } = useQuery({
        queryKey: ['applications-by-status'],
        queryFn: () => analyticsService.getApplicationsByStatus(),
    });

    const { data: topJobs } = useQuery({
        queryKey: ['top-jobs'],
        queryFn: () => analyticsService.getTopJobs(10),
    });

    const { data: sourceEffectiveness } = useQuery({
        queryKey: ['source-effectiveness'],
        queryFn: () => analyticsService.getSourceEffectiveness(),
    });

    const { data: predictions, isLoading: predictionsLoading } = useQuery({
        queryKey: ['analytics-predictions'],
        queryFn: () => apiClient.get('/analytics/predictions').then(r => r.data),
        enabled: activeTab === 'predictions',
        retry: false,
    });

    const handleExportApplications = async () => {
        try {
            const blob = await analyticsService.exportApplicationsCSV();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleExportCandidates = async () => {
        try {
            const blob = await analyticsService.exportCandidatesExcel();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `candidates-${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-1">Insights and performance metrics</p>
                </div>
                <div className="flex items-center space-x-3">
                    {activeTab === 'overview' && (
                        <>
                            <select
                                value={periodDays}
                                onChange={(e) => setPeriodDays(Number(e.target.value))}
                                className="input"
                            >
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={90}>Last 90 days</option>
                                <option value={365}>Last year</option>
                            </select>
                            <button
                                onClick={handleExportApplications}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export CSV</span>
                            </button>
                            <button
                                onClick={handleExportCandidates}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export Excel</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('predictions')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'predictions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI Predictions
                </button>
            </div>

            {activeTab === 'overview' && (<>
            {/* Key Metrics */}
            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Jobs</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboard.active_jobs}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Applications</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboard.applications_this_period}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Target className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Placements</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboard.placements}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center space-x-4">
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Avg Time to Hire</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {dashboard.avg_time_to_hire_days?.toFixed(1) || 0} days
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Applications Over Time */}
            {applicationsOverTime && applicationsOverTime.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={applicationsOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Applications"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Applications by Status */}
                {applicationsByStatus && applicationsByStatus.length > 0 && (
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Status</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={applicationsByStatus}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {applicationsByStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Source Effectiveness */}
                {sourceEffectiveness && sourceEffectiveness.length > 0 && (
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Effectiveness</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sourceEffectiveness}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="source" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                                <Bar dataKey="hired" fill="#10b981" name="Hired" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Top Performing Jobs */}
            {topJobs && topJobs.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Jobs</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Job Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Applications
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topJobs.map((job: any) => (
                                    <tr key={job.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                            <div className="text-xs text-gray-500">{job.reference}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {job.applications_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {job.views_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${job.status === 'active' ? 'badge-green' :
                                                    job.status === 'filled' ? 'badge-blue' :
                                                        'badge-gray'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
                            <TrendingUp className={`w-5 h-5 ${(dashboard.success_rate_percentage || 0) > 15 ? 'text-green-500' : 'text-gray-400'
                                }`} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {dashboard.success_rate_percentage?.toFixed(1) || 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Placements / Total Applications
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Total Candidates</h3>
                        <p className="text-3xl font-bold text-gray-900">{dashboard.total_candidates}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {dashboard.active_candidates} active
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Total Jobs</h3>
                        <p className="text-3xl font-bold text-gray-900">{dashboard.total_jobs}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {dashboard.active_jobs} active
                        </p>
                    </div>
                </div>
            )}
            </>)}

            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
                <div className="space-y-6">
                    {/* Banner */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-6 h-6" />
                            <h2 className="text-xl font-bold">AI-Powered Predictions</h2>
                        </div>
                        <p className="text-purple-100 text-sm">
                            Based on your historical data, our AI forecasts key recruitment outcomes to help you plan ahead.
                        </p>
                    </div>

                    {predictionsLoading ? (
                        <div className="flex items-center justify-center py-20 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                            <span className="text-gray-500">Generating AI predictions...</span>
                        </div>
                    ) : predictions ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Time to Fill */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Time to Fill</h3>
                                </div>
                                <p className="text-4xl font-bold text-blue-600 mb-1">
                                    {predictions.time_to_fill_days ?? '—'}<span className="text-lg text-gray-400 ml-1">days</span>
                                </p>
                                <p className="text-xs text-gray-500 mb-4">Estimated for current open roles</p>
                                <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{predictions.time_to_fill_rationale || 'Based on your historical hiring velocity.'}</p>
                            </div>

                            {/* Salary Recommendation */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Salary Competitiveness</h3>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    {predictions.salary_competitive ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 text-yellow-500" />
                                    )}
                                    <p className={`text-xl font-bold ${predictions.salary_competitive ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {predictions.salary_competitive ? 'Competitive' : 'Below Market'}
                                    </p>
                                </div>
                                {predictions.salary_adjustment_pct && (
                                    <p className="text-sm text-gray-500 mb-4">Suggested adjustment: <strong>+{predictions.salary_adjustment_pct}%</strong></p>
                                )}
                                <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">{predictions.salary_rationale || 'Based on SA market benchmarks for your role types.'}</p>
                            </div>

                            {/* Best Source */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Target className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Best Performing Source</h3>
                                </div>
                                <p className="text-3xl font-bold text-purple-600 mb-1 capitalize">
                                    {predictions.best_source ?? '—'}
                                </p>
                                <p className="text-xs text-gray-500 mb-4">Highest quality-to-hire ratio</p>
                                <p className="text-sm text-gray-600 bg-purple-50 rounded-lg p-3">{predictions.best_source_rationale || 'Based on your hire outcomes by source channel.'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Not enough data yet</h3>
                            <p className="text-gray-500 text-sm">Complete more hires and interviews to unlock AI predictions.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
