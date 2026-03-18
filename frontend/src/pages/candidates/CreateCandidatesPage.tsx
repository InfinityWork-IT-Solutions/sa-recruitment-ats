import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateCandidate } from '@/hooks/use-candidates';
import { ArrowLeft, Loader2 } from 'lucide-react';

const candidateSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    current_job_title: z.string().optional(),
    current_company: z.string().optional(),
    years_of_experience: z.number().min(0).default(0),
    education_level: z.string().optional(),
    skills: z.array(z.string()).default([]),
    expected_salary_min: z.number().min(0).optional(),
    expected_salary_max: z.number().min(0).optional(),
    linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    source: z.string().optional(),
    consent_to_contact: z.boolean().default(true),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

export default function CreateCandidatePage() {
    const navigate = useNavigate();
    const [skillInput, setSkillInput] = useState('');
    const createCandidate = useCreateCandidate();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CandidateFormData>({
        resolver: zodResolver(candidateSchema),
        defaultValues: {
            skills: [],
            years_of_experience: 0,
            consent_to_contact: true,
        },
    });

    const skills = watch('skills') || [];

    const onSubmit = async (data: CandidateFormData) => {
        try {
            const candidate = await createCandidate.mutateAsync(data);
            navigate(`/candidates/${candidate.id}`);
        } catch (error) {
            // Error handled by mutation
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
                <Link to="/candidates" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Add New Candidate</h1>
                    <p className="text-gray-600 mt-1">Enter candidate details to add them to your database</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-8">
                {/* Personal Information */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('first_name')}
                                type="text"
                                className="input"
                                placeholder="John"
                            />
                            {errors.first_name && (
                                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('last_name')}
                                type="text"
                                className="input"
                                placeholder="Doe"
                            />
                            {errors.last_name && (
                                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className="input"
                                placeholder="john.doe@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                {...register('phone')}
                                type="tel"
                                className="input"
                                placeholder="+27 82 555 1234"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                {...register('city')}
                                type="text"
                                className="input"
                                placeholder="Cape Town"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                            <select {...register('province')} className="input">
                                <option value="">Select province...</option>
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
                </div>

                {/* Professional Information */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Job Title
                            </label>
                            <input
                                {...register('current_job_title')}
                                type="text"
                                className="input"
                                placeholder="Senior Software Engineer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Company
                            </label>
                            <input
                                {...register('current_company')}
                                type="text"
                                className="input"
                                placeholder="Tech Corp"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Years of Experience
                            </label>
                            <input
                                {...register('years_of_experience', { valueAsNumber: true })}
                                type="number"
                                min="0"
                                className="input"
                                placeholder="5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Education Level
                            </label>
                            <select {...register('education_level')} className="input">
                                <option value="">Select education level...</option>
                                <option value="High School">High School</option>
                                <option value="Diploma">Diploma</option>
                                <option value="Bachelor's Degree">Bachelor's Degree</option>
                                <option value="Honours Degree">Honours Degree</option>
                                <option value="Master's Degree">Master's Degree</option>
                                <option value="PhD">PhD</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
                    <div className="flex space-x-2 mb-3">
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                            className="input flex-1"
                            placeholder="Type a skill and press Enter or click Add"
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

                {/* Salary Expectations */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Salary Expectations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Minimum Expected Salary (ZAR)
                            </label>
                            <input
                                {...register('expected_salary_min', { valueAsNumber: true })}
                                type="number"
                                min="0"
                                className="input"
                                placeholder="50000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum Expected Salary (ZAR)
                            </label>
                            <input
                                {...register('expected_salary_max', { valueAsNumber: true })}
                                type="number"
                                min="0"
                                className="input"
                                placeholder="80000"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                LinkedIn URL
                            </label>
                            <input
                                {...register('linkedin_url')}
                                type="url"
                                className="input"
                                placeholder="https://linkedin.com/in/johndoe"
                            />
                            {errors.linkedin_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.linkedin_url.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Source
                            </label>
                            <select {...register('source')} className="input">
                                <option value="">How did you find this candidate?</option>
                                <option value="referral">Referral</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="job_board">Job Board</option>
                                <option value="direct_application">Direct Application</option>
                                <option value="headhunted">Headhunted</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* POPIA Consent */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <label className="flex items-start space-x-3">
                                <input
                                    {...register('consent_to_contact')}
                                    type="checkbox"
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-900">
                                        POPIA Consent <span className="text-red-500">*</span>
                                    </span>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Candidate has given consent to be contacted for job opportunities and to process their personal information in accordance with POPIA (Protection of Personal Information Act).
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <Link to="/candidates" className="btn-secondary">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={createCandidate.isPending}
                        className="btn-primary flex items-center space-x-2"
                    >
                        {createCandidate.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <span>Create Candidate</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
