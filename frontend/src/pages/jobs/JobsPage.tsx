import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobs } from '@/hooks/use-jobs';
import { useAuthStore } from '@/store/auth';
import { Plus, Search, Briefcase, MapPin, DollarSign, Eye, Users } from 'lucide-react';
import { JobStatus, EmploymentType } from '@/types/api';

const statusColors: Record<JobStatus, string> = {
    draft: 'badge-gray',
    active: 'badge-green',
    paused: 'badge-yellow',
    closed: 'badge-gray',
    filled: 'badge-blue',
    expired: 'badge-red',
};

const employmentTypeLabels: Record<EmploymentType, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    temporary: 'Temporary',
    internship: 'Internship',
    freelance: 'Freelance',
};

export default function JobsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('');
    const { user } = useAuthStore();
    const isCandidate = user?.role === 'candidate';

    const { data, isLoading } = useJobs({
        search,
        status: statusFilter,
        employment_type: employmentTypeFilter,
        limit: 20,
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{isCandidate ? 'Discover Jobs' : 'Jobs'}</h1>
                    <p className="text-gray-600 mt-1">{isCandidate ? 'Find and apply for exciting opportunities' : 'Manage your job postings'}</p>
                </div>
                {!isCandidate && (
                    <Link to="/jobs/create" className="btn-primary flex items-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Post New Job</span>
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                        <option value="filled">Filled</option>
                    </select>

                    {/* Employment type filter */}
                    <select
                        value={employmentTypeFilter}
                        onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                        className="input"
                    >
                        <option value="">All Types</option>
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="temporary">Temporary</option>
                        <option value="internship">Internship</option>
                    </select>
                </div>
            </div>

            {/* Jobs list */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : !data?.jobs || data.jobs.length === 0 ? (
                <div className="card text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-6">
                        {isCandidate ? 'Try adjusting your search criteria.' : 'Get started by posting your first job.'}
                    </p>
                    {!isCandidate && (
                        <Link to="/jobs/create" className="btn-primary inline-flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Post New Job</span>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {data.jobs.map((job) => (
                        <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            className="card hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                        <span className={`badge ${statusColors[job.status]}`}>
                                            {job.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center space-x-1">
                                            <Briefcase className="w-4 h-4" />
                                            <span>{employmentTypeLabels[job.employment_type]}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <MapPin className="w-4 h-4" />
                                            <span>{job.location_city}, {job.location_province}</span>
                                        </div>
                                        {job.salary_min && (
                                            <div className="flex items-center space-x-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span>
                                                    {job.salary_currency} {job.salary_min.toLocaleString()}
                                                    {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {job.skills && job.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {job.skills.slice(0, 5).map((skill) => (
                                                <span key={skill} className="badge badge-blue">
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.skills.length > 5 && (
                                                <span className="badge badge-gray">
                                                    +{job.skills.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end space-y-2 ml-4">
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <div className="flex items-center space-x-1">
                                            <Users className="w-4 h-4" />
                                            <span>{job.applications_count}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Eye className="w-4 h-4" />
                                            <span>{job.views_count}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        Ref: {job.reference}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination info */}
            {data && data.total > 0 && (
                <div className="text-center text-sm text-gray-600">
                    Showing {data.jobs.length} of {data.total} jobs
                </div>
            )}
        </div>
    );
}
