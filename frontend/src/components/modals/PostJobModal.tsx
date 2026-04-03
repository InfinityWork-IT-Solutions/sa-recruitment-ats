import { useState } from 'react';
import { X, Briefcase, MapPin, DollarSign, Clock, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const jobSchema = z.object({
    title: z.string().min(3, 'Job title must be at least 3 characters'),
    company_name: z.string().min(2, 'Company name is required'),
    location: z.string().min(2, 'Location is required'),
    job_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
    work_mode: z.enum(['remote', 'hybrid', 'on-site']),
    salary_min: z.number().min(0, 'Minimum salary required'),
    salary_max: z.number().min(0, 'Maximum salary required'),
    experience_min: z.number().min(0),
    experience_max: z.number().min(0),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    requirements: z.string().min(20, 'Requirements must be at least 20 characters'),
    skills: z.string().min(5, 'At least one skill required'),
    benefits: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface PostJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: JobFormData) => Promise<void>;
}

export default function PostJobModal({ isOpen, onClose, onSubmit }: PostJobModalProps) {
    const [step, setStep] = useState(1);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        trigger,
    } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            job_type: 'full-time',
            work_mode: 'hybrid',
            experience_min: 0,
            experience_max: 5,
        },
    });

    if (!isOpen) return null;

    const handleFormSubmit = async (data: JobFormData) => {
        try {
            await onSubmit(data);
            onClose();
        } catch (error) {
            console.error('Error submitting job:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Post a New Job</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Job Details' : 'Requirements'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-100 h-2">
                    <div
                        className="bg-blue-600 h-2 transition-all duration-300"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        {/* Step 1: Basic Information */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>

                                {/* Job Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Job Title <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            {...register('title')}
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Senior Software Engineer"
                                        />
                                    </div>
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                                    )}
                                </div>

                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            {...register('company_name')}
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Your company name"
                                        />
                                    </div>
                                    {errors.company_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                                    )}
                                </div>

                                {/* Location & Work Mode */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Location <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('location')}
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g. London, UK or Remote"
                                            />
                                        </div>
                                        {errors.location && (
                                            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Work Mode <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('work_mode')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="remote">Remote</option>
                                            <option value="hybrid">Hybrid</option>
                                            <option value="on-site">On-site</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Job Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Job Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
                                            <label
                                                key={type}
                                                className="cursor-pointer flex items-center space-x-2 border-2 border-gray-200 rounded-lg p-3 hover:border-blue-500 transition-all"
                                            >
                                                <input
                                                    type="radio"
                                                    value={type}
                                                    {...register('job_type')}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium capitalize">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Job Details */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Job Details</h3>

                                {/* Salary Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Salary Range <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('salary_min', { valueAsNumber: true })}
                                                type="number"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Min (e.g. 300000)"
                                            />
                                            {errors.salary_min && (
                                                <p className="mt-1 text-sm text-red-600">{errors.salary_min.message}</p>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('salary_max', { valueAsNumber: true })}
                                                type="number"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Max (e.g. 600000)"
                                            />
                                            {errors.salary_max && (
                                                <p className="mt-1 text-sm text-red-600">{errors.salary_max.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Experience Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Years of Experience <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('experience_min', { valueAsNumber: true })}
                                                type="number"
                                                min="0"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Min (e.g. 3)"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('experience_max', { valueAsNumber: true })}
                                                type="number"
                                                min="0"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Max (e.g. 7)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Job Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Job Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                                    )}
                                </div>

                                {/* Benefits (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Benefits (Optional)
                                    </label>
                                    <textarea
                                        {...register('benefits')}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Medical aid, pension, remote work, flexible hours, gym membership..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Requirements */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements & Skills</h3>

                                {/* Requirements */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Requirements <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('requirements')}
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="List the must-have requirements for this role..."
                                    />
                                    {errors.requirements && (
                                        <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                                    )}
                                </div>

                                {/* Skills */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Required Skills <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('skills')}
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="React, TypeScript, Node.js, PostgreSQL (comma separated)"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Separate multiple skills with commas. These will be used for AI matching.
                                    </p>
                                    {errors.skills && (
                                        <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                                    )}
                                </div>

                                {/* Preview Card */}
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                    <h4 className="font-bold text-blue-900 mb-3">✨ AI Matching Preview</h4>
                                    <p className="text-sm text-blue-800">
                                        Based on your job details, our AI will automatically match candidates with:
                                    </p>
                                    <ul className="mt-3 space-y-2 text-sm text-blue-700">
                                        <li>✓ Skills matching your requirements</li>
                                        <li>✓ {watch('experience_min')}-{watch('experience_max')} years of experience</li>
                                        <li>✓ Located in or near {watch('location') || 'your specified location'}</li>
                                        <li>✓ Salary expectations within {watch('salary_min')?.toLocaleString()} - {watch('salary_max')?.toLocaleString()}</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <div>
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all"
                                >
                                    ← Back
                                </button>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all"
                            >
                                Cancel
                            </button>

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        let fields: any = [];
                                        if (step === 1) fields = ['title', 'company_name', 'location', 'job_type', 'work_mode'];
                                        if (step === 2) fields = ['salary_min', 'salary_max', 'experience_min', 'experience_max', 'description', 'benefits'];
                                        const valid = await trigger(fields);
                                        if (valid) setStep(step + 1);
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                                >
                                    Next Step →
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Posting Job...' : '✓ Post Job'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
