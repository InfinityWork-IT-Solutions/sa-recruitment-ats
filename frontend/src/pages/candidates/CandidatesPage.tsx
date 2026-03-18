import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCandidates } from '@/hooks/use-candidates';
import { Plus, Search, User, MapPin, Briefcase, Mail, Phone, Star } from 'lucide-react';
import { CandidateStatus } from '@/types/api';

const statusColors: Record<CandidateStatus, string> = {
    active: 'badge-green',
    passive: 'badge-blue',
    placed: 'badge-purple',
    not_interested: 'badge-gray',
    blacklisted: 'badge-red',
};

const statusLabels: Record<CandidateStatus, string> = {
    active: 'Active',
    passive: 'Passive',
    placed: 'Placed',
    not_interested: 'Not Interested',
    blacklisted: 'Blacklisted',
};

export default function CandidatesPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [cityFilter, setCityFilter] = useState<string>('');

    const { data, isLoading } = useCandidates({
        search,
        status: statusFilter,
        city: cityFilter,
        limit: 20,
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
                    <p className="text-gray-600 mt-1">Manage your candidate database</p>
                </div>
                <Link to="/candidates/create" className="btn-primary flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Candidate</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search candidates..."
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
                        <option value="active">Active</option>
                        <option value="passive">Passive</option>
                        <option value="placed">Placed</option>
                        <option value="not_interested">Not Interested</option>
                    </select>

                    {/* City filter */}
                    <input
                        type="text"
                        placeholder="Filter by city..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="input"
                    />
                </div>
            </div>

            {/* Candidates list */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : !data?.candidates || data.candidates.length === 0 ? (
                <div className="card text-center py-12">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first candidate.</p>
                    <Link to="/candidates/create" className="btn-primary inline-flex items-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Add Candidate</span>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.candidates.map((candidate) => (
                        <Link
                            key={candidate.id}
                            to={`/candidates/${candidate.id}`}
                            className="card hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start space-x-4">
                                {/* Avatar */}
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl font-bold text-blue-600">
                                        {candidate.first_name[0]}{candidate.last_name[0]}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {candidate.first_name} {candidate.last_name}
                                        </h3>
                                        <span className={`badge ${statusColors[candidate.status]}`}>
                                            {statusLabels[candidate.status]}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                        {candidate.current_job_title && (
                                            <div className="flex items-center space-x-1">
                                                <Briefcase className="w-4 h-4" />
                                                <span>
                                                    {candidate.current_job_title}
                                                    {candidate.current_company && ` at ${candidate.current_company}`}
                                                </span>
                                            </div>
                                        )}
                                        {(candidate.city || candidate.province) && (
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>
                                                    {candidate.city}
                                                    {candidate.city && candidate.province && ', '}
                                                    {candidate.province}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-1">
                                            <Mail className="w-4 h-4" />
                                            <span>{candidate.email}</span>
                                        </div>
                                        {candidate.phone && (
                                            <div className="flex items-center space-x-1">
                                                <Phone className="w-4 h-4" />
                                                <span>{candidate.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    {candidate.skills && candidate.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {candidate.skills.slice(0, 6).map((skill) => (
                                                <span key={skill} className="badge badge-blue">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length > 6 && (
                                                <span className="badge badge-gray">
                                                    +{candidate.skills.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>{candidate.years_of_experience} years experience</span>
                                        <span>•</span>
                                        <span>{candidate.applications_count} applications</span>
                                        <span>•</span>
                                        <span>{candidate.interviews_count} interviews</span>
                                        {candidate.placements_count > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center space-x-1 text-green-600">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>{candidate.placements_count} placements</span>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Expected salary */}
                                {candidate.expected_salary_min && (
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm text-gray-600">Expected Salary</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            R{candidate.expected_salary_min.toLocaleString()}
                                            {candidate.expected_salary_max &&
                                                ` - R${candidate.expected_salary_max.toLocaleString()}`
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination info */}
            {data && data.total > 0 && (
                <div className="text-center text-sm text-gray-600">
                    Showing {data.candidates.length} of {data.total} candidates
                </div>
            )}
        </div>
    );
}
