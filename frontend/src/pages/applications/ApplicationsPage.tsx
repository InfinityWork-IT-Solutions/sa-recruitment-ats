import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplications } from '@/hooks/use-applications';
import { Search, Filter, FileText, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ApplicationStatus } from '@/types/api';

const statusColors: Record<ApplicationStatus, string> = {
    applied: 'badge-gray',
    screening: 'badge-blue',
    shortlisted: 'badge-purple',
    interview_scheduled: 'badge-yellow',
    interviewed: 'badge-orange',
    offer_pending: 'badge-indigo',
    offer_made: 'badge-pink',
    offer_accepted: 'badge-green',
    hired: 'badge-green',
    rejected: 'badge-red',
    withdrawn: 'badge-gray',
};

const statusLabels: Record<ApplicationStatus, string> = {
    applied: 'Applied',
    screening: 'Screening',
    shortlisted: 'Shortlisted',
    interview_scheduled: 'Interview Scheduled',
    interviewed: 'Interviewed',
    offer_pending: 'Offer Pending',
    offer_made: 'Offer Made',
    offer_accepted: 'Offer Accepted',
    hired: 'Hired',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
};

export default function ApplicationsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading } = useApplications({
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 50,
    });

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">All Applications</h1>
                <p className="text-gray-600 mt-1">View and manage all job applications</p>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                        <Filter className="w-5 h-5" />
                        <span className="font-medium">Filters:</span>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input max-w-xs"
                    >
                        <option value="">All Statuses</option>
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview_scheduled">Interview Scheduled</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="offer_pending">Offer Pending</option>
                        <option value="offer_made">Offer Made</option>
                        <option value="offer_accepted">Offer Accepted</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                        <option value="withdrawn">Withdrawn</option>
                    </select>
                </div>
            </div>

            {/* Applications Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : !data?.applications || data.applications.length === 0 ? (
                <div className="card text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-600">Applications will appear here once candidates start applying to jobs.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('created_at')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Date Applied</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Candidate
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Job
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('status')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Status</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Match Score
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Source
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.applications.map((application) => (
                                    <tr key={application.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(application.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/candidates/${application.candidate_id}`}
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                                {application.candidate_name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/jobs/${application.job_id}`}
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                                {application.job_title || `Job #${application.job_id.slice(0, 8)}`}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${statusColors[application.status]}`}>
                                                {statusLabels[application.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {application.match_score !== null ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${application.match_score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium">{application.match_score}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {application.source.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/applications/${application.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 p-4">
                        {data.applications.map((application) => (
                            <Link
                                key={application.id}
                                to={`/applications/${application.id}`}
                                className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`badge ${statusColors[application.status]}`}>
                                        {statusLabels[application.status]}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(application.created_at), 'MMM d')}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-900 font-medium">
                                        Candidate: {application.candidate_name}
                                    </p>
                                    <p className="text-gray-600">
                                        Job: {application.job_title || `Job #${application.job_id.slice(0, 8)}`}
                                    </p>
                                    {application.match_score !== null && (
                                        <div className="flex items-center space-x-2 mt-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${application.match_score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium">{application.match_score}%</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination info */}
                    {data.total > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Showing {data.applications.length} of {data.total} applications
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
