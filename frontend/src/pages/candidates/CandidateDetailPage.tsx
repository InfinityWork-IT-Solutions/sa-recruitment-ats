import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCandidate, useUploadResume, useDeleteCandidate } from '@/hooks/use-candidates';
import { useApplications } from '@/hooks/use-applications';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    Upload,
    FileText,
    Trash2,
    Edit,
    Linkedin,
    GraduationCap,
    DollarSign,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { ApplicationStatus } from '@/types/api';
import SendEmailModal from '@/components/SendEmailModal';
import { useAuthStore } from '@/store/auth';

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

export default function CandidateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);

    const { data: candidate, isLoading } = useCandidate(id!);
    const { data: applicationsData } = useApplications({ candidate_id: id });
    const uploadResume = useUploadResume();
    const deleteCandidate = useDeleteCandidate();
    const { user } = useAuthStore();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && id) {
            await uploadResume.mutateAsync({ id, file });
        }
    };

    const handleDelete = async () => {
        if (id) {
            await deleteCandidate.mutateAsync(id);
            navigate('/candidates');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="card text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Candidate not found</h3>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to={user?.role === 'client' ? '/company/candidates' : '/candidates'} className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {candidate.first_name} {candidate.last_name}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {candidate.current_job_title || 'Candidate Profile'}
                        </p>
                    </div>
                </div>
                {user?.role !== 'client' && user?.role !== 'candidate' && (
                    <div className="flex items-center space-x-3">
                        <button className="btn-secondary flex items-center space-x-2">
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn-danger flex items-center space-x-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Profile */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Avatar & Basic Info */}
                    <div className="card text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl font-bold text-blue-600">
                                {candidate.first_name[0]}{candidate.last_name[0]}
                            </span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {candidate.first_name} {candidate.last_name}
                        </h2>
                        {candidate.current_job_title && (
                            <p className="text-gray-600 mt-1">{candidate.current_job_title}</p>
                        )}
                        {candidate.current_company && (
                            <p className="text-sm text-gray-500">{candidate.current_company}</p>
                        )}
                        <span className={`badge ${statusColors[candidate.status as ApplicationStatus]} mt-3`}>
                            {candidate.status}
                        </span>
                    </div>

                    {/* Contact Information */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 text-sm">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <button 
                                    onClick={() => setShowEmailModal(true)}
                                    className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                                >
                                    {candidate.email}
                                    <span className="text-[10px] bg-blue-50 px-1.5 py-0.5 rounded uppercase font-bold">Template</span>
                                </button>
                            </div>
                            {candidate.phone && (
                                <div className="flex items-center space-x-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <a href={`tel:${candidate.phone}`} className="text-gray-700">
                                        {candidate.phone}
                                    </a>
                                </div>
                            )}
                            {(candidate.city || candidate.province) && (
                                <div className="flex items-center space-x-3 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                        {candidate.city}
                                        {candidate.city && candidate.province && ', '}
                                        {candidate.province}
                                    </span>
                                </div>
                            )}
                            {candidate.linkedin_url && (
                                <div className="flex items-center space-x-3 text-sm">
                                    <Linkedin className="w-4 h-4 text-gray-400" />
                                    <a
                                        href={candidate.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        LinkedIn Profile
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resume */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Resume</h3>
                        {candidate.resume_filename ? (
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {candidate.resume_filename}
                                        </p>
                                        <p className="text-xs text-gray-500">Uploaded resume</p>
                                    </div>
                                </div>
                                {candidate.resume_url && (
                                    <a
                                        href={candidate.resume_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 flex items-center justify-center space-x-2 border border-blue-200 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="font-bold">Download CV</span>
                                    </a>
                                )}
                                {user?.role !== 'client' && user?.role !== 'candidate' && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn-secondary w-full flex items-center justify-center space-x-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>Replace Resume</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            user?.role !== 'client' && user?.role !== 'candidate' ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn-primary w-full flex items-center justify-center space-x-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Resume</span>
                                </button>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No resume uploaded yet
                                </div>
                            )
                        )}
                        {user?.role !== 'client' && user?.role !== 'candidate' && (
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        )}
                    </div>

                    {/* Stats */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Applications</span>
                                <span className="text-lg font-semibold text-gray-900">
                                    {candidate.applications_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Interviews</span>
                                <span className="text-lg font-semibold text-gray-900">
                                    {candidate.interviews_count}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Placements</span>
                                <span className="text-lg font-semibold text-green-600">
                                    {candidate.placements_count}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column - Details & Applications */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Professional Details */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                                    <Briefcase className="w-4 h-4" />
                                    <span className="text-sm font-medium">Experience</span>
                                </div>
                                <p className="text-gray-900">{candidate.years_of_experience} years</p>
                            </div>

                            {candidate.education_level && (
                                <div>
                                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                                        <GraduationCap className="w-4 h-4" />
                                        <span className="text-sm font-medium">Education</span>
                                    </div>
                                    <p className="text-gray-900">{candidate.education_level}</p>
                                </div>
                            )}

                            {(candidate.expected_salary_min || candidate.expected_salary_max) && (
                                <div>
                                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-sm font-medium">Expected Salary</span>
                                    </div>
                                    <p className="text-gray-900">
                                        R{candidate.expected_salary_min?.toLocaleString() || '0'}
                                        {candidate.expected_salary_max &&
                                            ` - R${candidate.expected_salary_max.toLocaleString()}`
                                        }
                                    </p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-medium">Added</span>
                                </div>
                                <p className="text-gray-900">
                                    {format(new Date(candidate.created_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Skills */}
                        {candidate.skills && candidate.skills.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-600 mb-3">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.map((skill) => (
                                        <span key={skill} className="badge badge-blue">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Applications */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications</h3>
                        {applicationsData && applicationsData.applications.length > 0 ? (
                            <div className="space-y-3">
                                {applicationsData.applications.map((application) => (
                                    <Link
                                        key={application.id}
                                        to={`/applications/${application.id}`}
                                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Job Application</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Applied {format(new Date(application.created_at), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            <span className={`badge ${statusColors[application.status]}`}>
                                                {application.status}
                                            </span>
                                        </div>
                                        {application.match_score !== null && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                    <span>Match Score</span>
                                                    <span>{application.match_score}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${application.match_score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No applications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Candidate?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete {candidate.first_name} {candidate.last_name}? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteCandidate.isPending}
                                className="btn-danger"
                            >
                                {deleteCandidate.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modals */}
            <SendEmailModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                recipientId={candidate.id}
                recipientName={`${candidate.first_name} ${candidate.last_name}`}
                recipientEmail={candidate.email}
                recipientType="candidate"
            />
        </div>
    );
}
