import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useJob, useUpdateJob, useDeleteJob, useUpdateJobStatus } from '@/hooks/use-jobs';
import { useApplications } from '@/hooks/use-applications';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Save,
    X,
    MapPin,
    Briefcase,
    DollarSign,
    Eye,
    Users,
    Calendar,
    CheckCircle,
    Pause,
    XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { JobStatus, EmploymentType } from '@/types/api';

const jobSchema = z.object({
    title: z.string().min(1, 'Job title is required'),
    employment_type: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance']),
    location_city: z.string().min(1, 'City is required'),
    location_province: z.string().min(1, 'Province is required'),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    requirements: z.string().optional(),
    responsibilities: z.string().optional(),
    benefits: z.string().optional(),
    skills: z.array(z.string()).default([]),
    salary_min: z.number().min(0).optional(),
    salary_max: z.number().min(0).optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

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

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [skillInput, setSkillInput] = useState('');

    const { data: job, isLoading } = useJob(id!);
    const { data: applicationsData } = useApplications({ job_id: id });
    const updateJob = useUpdateJob();
    const deleteJob = useDeleteJob();
    const updateStatus = useUpdateJobStatus();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: job ? {
            title: job.title,
            employment_type: job.employment_type,
            location_city: job.location_city,
            location_province: job.location_province,
            description: job.description,
            requirements: job.requirements || '',
            responsibilities: job.responsibilities || '',
            benefits: job.benefits || '',
            skills: job.skills || [],
            salary_min: job.salary_min || undefined,
            salary_max: job.salary_max || undefined,
        } : {},
    });

    const skills = watch('skills') || [];

    const handleSave = async (data: JobFormData) => {
        if (id) {
            await updateJob.mutateAsync({ id, data });
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (id) {
            await deleteJob.mutateAsync(id);
            navigate('/jobs');
        }
    };

    const handleStatusChange = async (newStatus: JobStatus) => {
        if (id) {
            await updateStatus.mutateAsync({ id, status: newStatus });
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setValue('skills', [...skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setValue('skills', skills.filter((s) => s !== skill));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="card text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/jobs" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                        <p className="text-gray-600 mt-1">Ref: {job.reference}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => {
                                    reset({
                                        title: job.title,
                                        employment_type: job.employment_type,
                                        location_city: job.location_city,
                                        location_province: job.location_province,
                                        description: job.description,
                                        requirements: job.requirements || '',
                                        responsibilities: job.responsibilities || '',
                                        benefits: job.benefits || '',
                                        skills: job.skills || [],
                                        salary_min: job.salary_min || undefined,
                                        salary_max: job.salary_max || undefined,
                                    });
                                    setIsEditing(true);
                                }}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                            </button>
                            <Link
                                to={`/jobs/${id}/kanban`}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <Users className="w-4 h-4" />
                                <span>View Pipeline</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={handleSubmit(handleSave)}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Quick Stats & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status & Quick Stats */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Status & Stats</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Status</p>
                                <span className={`badge ${statusColors[job.status]} text-base`}>
                                    {job.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm">Applications</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{job.applications_count}</p>
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                        <Eye className="w-4 h-4" />
                                        <span className="text-sm">Views</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{job.views_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Actions */}
                    {!isEditing && (
                        <div className="card">
                            <h3 className="font-semibold text-gray-900 mb-4">Change Status</h3>
                            <div className="space-y-2">
                                {job.status !== 'active' && (
                                    <button
                                        onClick={() => handleStatusChange('active')}
                                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Activate Job</span>
                                    </button>
                                )}
                                {job.status === 'active' && (
                                    <button
                                        onClick={() => handleStatusChange('paused')}
                                        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-2"
                                    >
                                        <Pause className="w-4 h-4" />
                                        <span>Pause Job</span>
                                    </button>
                                )}
                                {['active', 'paused'].includes(job.status) && (
                                    <button
                                        onClick={() => handleStatusChange('closed')}
                                        className="w-full btn-secondary flex items-center justify-center space-x-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>Close Job</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full btn-danger flex items-center justify-center space-x-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Job</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Dates</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Created</p>
                                <p className="text-gray-900 font-medium">
                                    {format(new Date(job.created_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Last Updated</p>
                                <p className="text-gray-900 font-medium">
                                    {format(new Date(job.updated_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                            {job.expires_at && (
                                <div>
                                    <p className="text-sm text-gray-600">Expires</p>
                                    <p className="text-gray-900 font-medium">
                                        {format(new Date(job.expires_at), 'MMM d, yyyy')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column - Job Details */}
                <div className="lg:col-span-2">
                    {isEditing ? (
                        /* Edit Mode */
                        <form onSubmit={handleSubmit(handleSave)} className="card space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Job Details</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Job Title <span className="text-red-500">*</span>
                                </label>
                                <input {...register('title')} type="text" className="input" />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employment Type <span className="text-red-500">*</span>
                                    </label>
                                    <select {...register('employment_type')} className="input">
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="temporary">Temporary</option>
                                        <option value="internship">Internship</option>
                                        <option value="freelance">Freelance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Province <span className="text-red-500">*</span>
                                    </label>
                                    <select {...register('location_province')} className="input">
                                        <option value="Western Cape">Western Cape</option>
                                        <option value="Gauteng">Gauteng</option>
                                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                                        <option value="Eastern Cape">Eastern Cape</option>
                                        <option value="Free State">Free State</option>
                                        <option value="Limpopo">Limpopo</option>
                                        <option value="Mpumalanga">Mpumalanga</option>
                                        <option value="North West">North West</option>
                                        <option value="Northern Cape">Northern Cape</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input {...register('location_city')} type="text" className="input" />
                                {errors.location_city && <p className="mt-1 text-sm text-red-600">{errors.location_city.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea {...register('description')} rows={6} className="input" />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                                <textarea {...register('requirements')} rows={4} className="input" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                                <textarea {...register('responsibilities')} rows={4} className="input" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                                <div className="flex space-x-2 mb-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        className="input flex-1"
                                        placeholder="Type a skill"
                                    />
                                    <button type="button" onClick={addSkill} className="btn-primary">
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill) => (
                                        <span key={skill} className="badge badge-blue flex items-center space-x-1">
                                            <span>{skill}</span>
                                            <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-600">
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (ZAR)</label>
                                    <input {...register('salary_min', { valueAsNumber: true })} type="number" className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (ZAR)</label>
                                    <input {...register('salary_max', { valueAsNumber: true })} type="number" className="input" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                                <textarea {...register('benefits')} rows={4} className="input" />
                            </div>
                        </form>
                    ) : (
                        /* View Mode */
                        <div className="space-y-6">
                            {/* Overview Card */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Overview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                            <Briefcase className="w-4 h-4" />
                                            <span className="text-sm font-medium">Employment Type</span>
                                        </div>
                                        <p className="text-gray-900">{employmentTypeLabels[job.employment_type]}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm font-medium">Location</span>
                                        </div>
                                        <p className="text-gray-900">{job.location_city}, {job.location_province}</p>
                                    </div>
                                    {(job.salary_min || job.salary_max) && (
                                        <div>
                                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="text-sm font-medium">Salary Range</span>
                                            </div>
                                            <p className="text-gray-900">
                                                {job.salary_currency} {job.salary_min?.toLocaleString() || '0'}
                                                {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                                            </p>
                                        </div>
                                    )}
                                    {job.experience_level && (
                                        <div>
                                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm font-medium">Experience Level</span>
                                            </div>
                                            <p className="text-gray-900">{job.experience_level}</p>
                                        </div>
                                    )}
                                </div>

                                {job.skills && job.skills.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-3">Required Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {job.skills.map((skill) => (
                                                <span key={skill} className="badge badge-blue">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                                </div>
                            </div>

                            {/* Requirements */}
                            {job.requirements && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                                    </div>
                                </div>
                            )}

                            {/* Responsibilities */}
                            {job.responsibilities && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
                                    </div>
                                </div>
                            )}

                            {/* Benefits */}
                            {job.benefits && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h3>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                                    </div>
                                </div>
                            )}

                            {/* Recent Applications */}
                            {applicationsData && applicationsData.applications.length > 0 && (
                                <div className="card">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                                        <Link to={`/jobs/${id}/kanban`} className="text-sm text-blue-600 hover:underline">
                                            View all in pipeline →
                                        </Link>
                                    </div>
                                    <div className="space-y-3">
                                        {applicationsData.applications.slice(0, 5).map((application) => (
                                            <Link
                                                key={application.id}
                                                to={`/applications/${application.id}`}
                                                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-900">Application #{application.id.slice(0, 8)}</p>
                                                    <span className="text-xs text-gray-500">
                                                        {format(new Date(application.created_at), 'MMM d')}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{job.title}"? This will also delete all associated applications. This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteJob.isPending}
                                className="btn-danger"
                            >
                                {deleteJob.isPending ? 'Deleting...' : 'Delete Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
