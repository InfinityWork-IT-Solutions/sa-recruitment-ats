import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplications, useUpdateApplication } from '@/hooks/use-applications';
import { Search, Filter, FileText, ArrowUpDown, CheckSquare, Square, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ApplicationStatus } from '@/types/api';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

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

const ALL_STATUSES: ApplicationStatus[] = [
    'applied', 'screening', 'shortlisted', 'interview_scheduled',
    'interviewed', 'offer_pending', 'offer_made', 'offer_accepted',
    'hired', 'rejected', 'withdrawn',
];

// Inline status badge that opens a dropdown
function StatusDropdown({ appId, current, onChanged }: { appId: string; current: ApplicationStatus; onChanged: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const changeStatus = async (next: ApplicationStatus) => {
        if (next === current) { setOpen(false); return; }
        setLoading(true);
        try {
            await apiClient.patch(`/applications/${appId}/status`, { status: next });
            toast.success(`Status updated to ${statusLabels[next]}`);
            onChanged();
        } catch {
            toast.error('Failed to update status');
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                disabled={loading}
                className={`inline-flex items-center gap-1 badge ${statusColors[current] || 'badge-gray'} cursor-pointer hover:opacity-80`}
            >
                {statusLabels[current] || current}
                <ChevronDown className="w-3 h-3" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 max-h-72 overflow-y-auto">
                        {ALL_STATUSES.map(s => (
                            <button
                                key={s}
                                onClick={() => changeStatus(s)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${s === current ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                            >
                                {s === current && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                                {s !== current && <span className="w-3.5 h-3.5" />}
                                {statusLabels[s]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function ApplicationsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    const { data, isLoading, refetch } = useApplications({
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

    const applications = data?.applications || [];
    const allSelected = applications.length > 0 && selectedIds.size === applications.length;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(applications.map(a => a.id)));
        }
    };

    const bulkUpdateStatus = async (status: ApplicationStatus) => {
        if (selectedIds.size === 0) return;
        setBulkLoading(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    apiClient.patch(`/applications/${id}/status`, { status })
                )
            );
            toast.success(`${selectedIds.size} application${selectedIds.size > 1 ? 's' : ''} updated to ${statusLabels[status]}`);
            setSelectedIds(new Set());
            refetch();
        } catch {
            toast.error('Some updates failed — please try again');
        } finally {
            setBulkLoading(false);
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
                        <span className="font-medium">Filter:</span>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input max-w-xs"
                    >
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{statusLabels[s]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk action toolbar — only visible when rows selected */}
            {selectedIds.size > 0 && (
                <div className="card bg-blue-50 border-blue-200 flex items-center gap-4 py-3 px-4">
                    <span className="text-sm font-semibold text-blue-900">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            disabled={bulkLoading}
                            onClick={() => bulkUpdateStatus('shortlisted')}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 flex items-center gap-1.5"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Shortlist
                        </button>
                        <button
                            disabled={bulkLoading}
                            onClick={() => bulkUpdateStatus('interview_scheduled')}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 disabled:opacity-60 flex items-center gap-1.5"
                        >
                            Schedule Interview
                        </button>
                        <button
                            disabled={bulkLoading}
                            onClick={() => bulkUpdateStatus('rejected')}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 disabled:opacity-60 flex items-center gap-1.5"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-auto text-sm text-gray-500 hover:text-gray-700"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            {/* Applications Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : !applications.length ? (
                <div className="card text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-600">Applications will appear here once candidates start applying.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-600">
                                            {allSelected
                                                ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                                : <Square className="w-4 h-4" />
                                            }
                                        </button>
                                    </th>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('status')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Status</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.map((application) => (
                                    <tr
                                        key={application.id}
                                        className={`hover:bg-gray-50 ${selectedIds.has(application.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-4">
                                            <button onClick={() => toggleSelect(application.id)} className="text-gray-400 hover:text-blue-600">
                                                {selectedIds.has(application.id)
                                                    ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                                    : <Square className="w-4 h-4" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(application.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/candidates/${application.candidate_id}`}
                                                className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                                    {(application as any).candidate_photo
                                                        ? <img src={(application as any).candidate_photo} alt="" className="w-full h-full object-cover" />
                                                        : (application.candidate_name
                                                            ? application.candidate_name.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                                                            : '?')
                                                    }
                                                </div>
                                                <span>{application.candidate_name || <span className="text-gray-400 italic text-xs">Unknown</span>}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                to={`/jobs/${application.job_id}`}
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                                {application.job_title || <span className="text-gray-400 italic text-xs">Untitled Job</span>}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusDropdown
                                                appId={application.id}
                                                current={application.status as ApplicationStatus}
                                                onChanged={refetch}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {application.match_score != null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${application.match_score >= 75 ? 'bg-green-500' : application.match_score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                            style={{ width: `${application.match_score}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-semibold ${application.match_score >= 75 ? 'text-green-600' : application.match_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                        {application.match_score}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {(application as any).source?.replace(/_/g, ' ') || 'Direct'}
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
                        {applications.map((application) => (
                            <div key={application.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <StatusDropdown
                                        appId={application.id}
                                        current={application.status as ApplicationStatus}
                                        onChanged={refetch}
                                    />
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(application.created_at), 'MMM d')}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-900 font-medium">{application.candidate_name}</p>
                                    <p className="text-gray-600">{application.job_title || `Job #${application.job_id.slice(0, 8)}`}</p>
                                </div>
                                <Link
                                    to={`/applications/${application.id}`}
                                    className="mt-2 text-sm text-blue-600 font-medium"
                                >
                                    View →
                                </Link>
                            </div>
                        ))}
                    </div>

                    {data?.total && data.total > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Showing {applications.length} of {data.total} applications
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
