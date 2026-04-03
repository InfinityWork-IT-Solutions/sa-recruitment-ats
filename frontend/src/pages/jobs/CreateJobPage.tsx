import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateJob } from '@/hooks/use-jobs';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

// Form schema
const jobSchema = z.object({
    title: z.string().min(1, 'Job title is required'),
    employment_type: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance']),
    experience_level: z.enum(['entry_level', 'mid_level', 'senior_level', 'executive']).optional(),
    location_city: z.string().min(1, 'City is required'),
    location_province: z.string().min(1, 'Province is required'),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    requirements: z.string().optional(),
    responsibilities: z.string().optional(),
    benefits: z.string().optional(),
    years_of_experience_min: z.number().min(0).optional(),
    years_of_experience_max: z.number().min(0).optional(),
    education_level: z.string().optional(),
    skills: z.array(z.string()).default([]),
    salary_min: z.number().min(0).optional(),
    salary_max: z.number().min(0).optional(),
    client_company_id: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

const STEPS = [
    { id: 1, name: 'Basic Info', fields: ['title', 'employment_type', 'experience_level'] },
    { id: 2, name: 'Location & Details', fields: ['location_city', 'location_province', 'description'] },
    { id: 3, name: 'Requirements', fields: ['requirements', 'responsibilities', 'skills'] },
    { id: 4, name: 'Compensation', fields: ['salary_min', 'salary_max', 'benefits'] },
];

export default function CreateJobPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [skillInput, setSkillInput] = useState('');
    const createJob = useCreateJob();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            skills: [],
        },
    });

    const skills = watch('skills') || [];

    const onSubmit = async (data: JobFormData) => {
        try {
            const apiData = {
                ...data,
                location: `${data.location_city}, ${data.location_province}`,
                city: data.location_city,
                province: data.location_province,
            };
            // @ts-ignore - mapping the flattened form data to the expected API structure
            await createJob.mutateAsync(apiData);
            navigate('/jobs');
        } catch (error) {
            // Error handled by mutation
        }
    };

    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/jobs')}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Post New Job</h1>
                    <p className="text-gray-600 mt-1">Fill in the details to create a job posting</p>
                </div>
            </div>

            {/* Progress steps */}
            <div className="card">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                            <div className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep > step.id
                                            ? 'bg-green-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                                </div>
                                <div className="ml-3">
                                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {step.name}
                                    </p>
                                </div>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-1 mx-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="card">
                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Job Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('title')}
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Senior Python Developer"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employment Type <span className="text-red-500">*</span>
                                    </label>
                                    <select {...register('employment_type')} className="input">
                                        <option value="">Select type...</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="temporary">Temporary</option>
                                        <option value="internship">Internship</option>
                                        <option value="freelance">Freelance</option>
                                    </select>
                                    {errors.employment_type && <p className="mt-1 text-sm text-red-600">{errors.employment_type.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Experience Level
                                    </label>
                                    <select {...register('experience_level')} className="input">
                                        <option value="">Select level...</option>
                                        <option value="entry_level">Entry Level (0-2 years)</option>
                                        <option value="mid_level">Mid Level (3-5 years)</option>
                                        <option value="senior_level">Senior Level (6-10 years)</option>
                                        <option value="executive">Executive (10+ years)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location & Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900">Location & Details</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('location_city')}
                                        type="text"
                                        className="input"
                                        placeholder="e.g. London or Remote"
                                    />
                                    {errors.location_city && <p className="mt-1 text-sm text-red-600">{errors.location_city.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Province <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('location_province')}
                                        type="text"
                                        className="input"
                                        placeholder="e.g. London, UK or California, US"
                                    />
                                    {errors.location_province && <p className="mt-1 text-sm text-red-600">{errors.location_province.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Job Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    {...register('description')}
                                    rows={8}
                                    className="input"
                                    placeholder="Describe the role, company culture, and what makes this opportunity exciting..."
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Requirements */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900">Requirements & Responsibilities</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Requirements
                                </label>
                                <textarea
                                    {...register('requirements')}
                                    rows={5}
                                    className="input"
                                    placeholder="• 5+ years Python experience&#10;• Strong understanding of Django&#10;• Experience with PostgreSQL"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Responsibilities
                                </label>
                                <textarea
                                    {...register('responsibilities')}
                                    rows={5}
                                    className="input"
                                    placeholder="• Design and implement scalable backend services&#10;• Mentor junior developers&#10;• Collaborate with product team"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Required Skills
                                </label>
                                <div className="flex space-x-2 mb-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        className="input flex-1"
                                        placeholder="Type a skill and press Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="btn-primary"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill) => (
                                        <span key={skill} className="badge badge-blue flex items-center space-x-1">
                                            <span>{skill}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(skill)}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Compensation */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900">Compensation & Benefits</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimum Salary
                                    </label>
                                    <input
                                        {...register('salary_min', { valueAsNumber: true })}
                                        type="number"
                                        className="input"
                                        placeholder="50000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maximum Salary
                                    </label>
                                    <input
                                        {...register('salary_max', { valueAsNumber: true })}
                                        type="number"
                                        className="input"
                                        placeholder="80000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Benefits
                                </label>
                                <textarea
                                    {...register('benefits')}
                                    rows={6}
                                    className="input"
                                    placeholder="• Medical aid&#10;• Pension fund&#10;• Performance bonus&#10;• Remote work options"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </button>

                        <div className="text-sm text-gray-600">
                            Step {currentStep} of {STEPS.length}
                        </div>

                        {currentStep < STEPS.length ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <span>Next</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={createJob.isPending}
                                className="btn-primary flex items-center space-x-2"
                            >
                                {createJob.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Create Job</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
