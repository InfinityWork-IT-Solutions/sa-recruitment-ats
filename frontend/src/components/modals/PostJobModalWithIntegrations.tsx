import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, MapPin, DollarSign, Clock, Building, CheckCircle, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { saveJobDraft, loadJobDraft, clearJobDraft } from '@/hooks/useJobDraftRestore';
import { LinkedInLogo, IndeedLogo, PNetLogo } from '@/components/logos/PlatformLogos';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

const JOB_CATEGORIES = [
  { value: 'it', label: 'IT & Software' },
  { value: 'finance', label: 'Finance & Accounting' },
  { value: 'health', label: 'Healthcare' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'marketing', label: 'Marketing & Sales' },
  { value: 'education', label: 'Education' },
  { value: 'legal', label: 'Legal' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'construction', label: 'Construction' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'admin', label: 'Administration' },
  { value: 'creative', label: 'Creative & Design' },
  { value: 'other', label: 'Other' },
];

const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  company_name: z.string().min(2, 'Company name is required'),
  location: z.string().min(2, 'Location is required'),
  category: z.string().default('other'),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  work_mode: z.enum(['remote', 'hybrid', 'on-site']),
  salary_min: z.number().min(0, 'Minimum salary required'),
  salary_max: z.number().min(0, 'Maximum salary required'),
  experience_min: z.number().min(0),
  experience_max: z.number().min(0),
  closing_date: z.string().optional(),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().min(20, 'Requirements must be at least 20 characters'),
  skills: z.string().min(5, 'At least one skill required'),
  benefits: z.string().optional(),
  // Integration platforms
  post_to_pnet: z.boolean().optional(),
  post_to_indeed: z.boolean().optional(),
  post_to_linkedin: z.boolean().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => Promise<void>;
  isTemplate?: boolean;
  integrations?: {
    pnet: { connected: boolean; enabled: boolean };
    indeed: { connected: boolean; enabled: boolean };
    linkedin: { connected: boolean; enabled: boolean };
  };
}

export default function PostJobModal({ isOpen, onClose, onSubmit, integrations }: PostJobModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [salaryBenchmark, setSalaryBenchmark] = useState<any>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      job_type: 'full-time',
      work_mode: 'hybrid',
      category: 'other',
      experience_min: 0,
      experience_max: 5,
      post_to_pnet: true,
      post_to_indeed: true,
      post_to_linkedin: true,
    },
  });

  // Restore draft when modal opens (user returning from integrations page)
  useEffect(() => {
    if (!isOpen) return;
    const draft = loadJobDraft();
    if (draft) {
      reset(draft.formData as JobFormData);
      setStep(draft.step);
      clearJobDraft();
      toast.success('Your job draft has been restored — you left off at step ' + draft.step);
    }
  }, [isOpen]);

  const handleGoToIntegrations = (platform: string) => {
    saveJobDraft(getValues() as Record<string, any>, step);
    const returnTo = encodeURIComponent(window.location.pathname);
    navigate(`/company/settings/integrations?returnTo=${returnTo}&platform=${platform}`);
  };

  const handleGenerateJD = async (andAdvance = false) => {
    const title = getValues('title');
    if (!title?.trim()) return toast.error('Enter a job title first');
    setAiGenerating(true);
    try {
      const res = await apiClient.post('/ai/generate-job-description', {
        title,
        skills: getValues('skills') || '',
        experience_level: (getValues('experience_min') ?? 0) >= 6 ? 'senior' : (getValues('experience_min') ?? 0) >= 3 ? 'mid' : 'junior',
        location: getValues('location') || 'South Africa',
      });
      const d = res.data;
      if (d.description) setValue('description', d.description, { shouldValidate: true });
      if (d.requirements) setValue('requirements', d.requirements, { shouldValidate: true });
      if (d.benefits) setValue('benefits', d.benefits);
      if (d.skills) setValue('skills', d.skills, { shouldValidate: true });
      toast.success('Job description generated — review and edit below');
      if (andAdvance) setStep(2);
    } catch {
      toast.error('AI generation failed — try again');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGetMarketRate = async () => {
    const title = getValues('title');
    if (!title?.trim()) return toast.error('Enter a job title first');
    setSalaryLoading(true);
    try {
      const res = await apiClient.get('/ai/salary-benchmark', {
        params: {
          job_title: title,
          location: getValues('location') || 'South Africa',
          experience_years: getValues('experience_min') ?? 0,
        },
      });
      setSalaryBenchmark(res.data);
      if (res.data.min_annual) setValue('salary_min', Math.round(res.data.min_annual / 12), { shouldValidate: true });
      if (res.data.max_annual) setValue('salary_max', Math.round(res.data.max_annual / 12), { shouldValidate: true });
      toast.success('Salary benchmark loaded!');
    } catch {
      toast.error('Failed to fetch salary data');
    } finally {
      setSalaryLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleFormSubmit = async (data: JobFormData) => {
    try {
      await onSubmit(data);
      clearJobDraft();
      onClose();
    } catch (error) {
      console.error('Error submitting job:', error);
    }
  };

  const handleClose = () => {
    clearJobDraft();
    onClose();
  };

  // Count selected platforms
  const selectedPlatforms = [
    watch('post_to_pnet'),
    watch('post_to_indeed'),
    watch('post_to_linkedin'),
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Post a New Job</h2>
            <p className="text-blue-100 text-sm mt-1">
              Step {step} of 4: {
                step === 1 ? 'Basic Info' : 
                step === 2 ? 'Job Details' : 
                step === 3 ? 'Requirements' :
                'Publish to Job Boards'
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 h-2">
          <div
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Step 1: Quick Setup + AI Generation */}
            {step === 1 && (
              <div className="space-y-5">
                {/* AI Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900">AI Job Description Generator</p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Fill in the title, company and location below — then click <strong>"Generate with AI"</strong> and our AI will write the full description, requirements and skills for you. You can edit everything before posting.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Title — most prominent */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('title')}
                      type="text"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>}
                  </div>

                  {/* Location */}
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
                        placeholder="e.g. Cape Town, Western Cape"
                      />
                    </div>
                    {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Work Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                    <select {...register('work_mode')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="on-site">On-site</option>
                    </select>
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <select {...register('job_type')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Category <span className="text-red-500">*</span></label>
                  <select {...register('category')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    {JOB_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Primary CTA — AI Generate */}
                <button
                  type="button"
                  onClick={() => handleGenerateJD(true)}
                  disabled={aiGenerating || !watch('title')?.trim()}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-base hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-200 transition-all"
                >
                  {aiGenerating
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Writing your job description...</>
                    : <><Sparkles className="w-5 h-5" />Generate Job Description with AI</>
                  }
                </button>
                <p className="text-center text-xs text-gray-400">
                  — or —{' '}
                  <button type="button" onClick={() => setStep(2)} className="text-blue-600 hover:underline font-medium">
                    fill in manually
                  </button>
                </p>
              </div>
            )}

            {/* Step 2: Job Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Job Details</h3>

                {/* Salary Range */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Salary Range (ZAR/month) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGetMarketRate}
                      disabled={salaryLoading}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-60"
                    >
                      {salaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                      {salaryLoading ? 'Loading...' : 'Get Market Rate'}
                    </button>
                  </div>
                  {salaryBenchmark && (
                    <div className="mb-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-xs text-green-800">
                      Market range: <strong>R{Number(salaryBenchmark.min_monthly || 0).toLocaleString()} – R{Number(salaryBenchmark.max_monthly || 0).toLocaleString()}/mo</strong>
                      {salaryBenchmark.competitiveness_tip && <span className="ml-1 text-green-600">· {salaryBenchmark.competitiveness_tip}</span>}
                    </div>
                  )}
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

                {/* Closing Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Closing Date <span className="text-gray-400 font-normal">(optional — defaults to 30 days)</span>
                  </label>
                  <input
                    {...register('closing_date')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Job Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Job Description <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateJD(false)}
                      disabled={aiGenerating}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-60"
                    >
                      {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {aiGenerating ? 'Generating...' : 'Regenerate with AI'}
                    </button>
                  </div>
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

                {/* Benefits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits (Optional)
                  </label>
                  <textarea
                    {...register('benefits')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Medical aid, pension, remote work, flexible hours..."
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
                    placeholder="React, TypeScript, Node.js, PostgreSQL"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separate skills with commas. Used for AI matching.
                  </p>
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Multi-Platform Publishing */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📢 Publish to Job Boards</h3>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> Your job will be posted to selected platforms. When candidates click "Apply", 
                    they'll be redirected back to RecruitPro SA to complete their application. You'll manage all applications in one place!
                  </p>
                </div>

                <div className="space-y-4">
                  {/* RecruitPro SA (Always checked) */}
                  <div className="border-2 border-green-500 bg-green-50 rounded-xl p-5">
                    <div className="flex items-start space-x-4">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">RecruitPro SA</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Always included - Job posted on your company career page
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                        INCLUDED
                      </span>
                    </div>
                  </div>

                  {/* PNet */}
                  <label className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                    watch('post_to_pnet') ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        {...register('post_to_pnet')}
                        disabled={!integrations?.pnet?.connected}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <PNetLogo size={36} className="rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-bold text-gray-900 text-lg">PNet</h4>
                          {!integrations?.pnet?.connected && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                              NOT CONNECTED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          South Africa's #1 job board - Reach thousands of local candidates
                        </p>
                        {!integrations?.pnet?.connected && (
                          <button
                            type="button"
                            onClick={() => handleGoToIntegrations('pnet')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                          >
                            Connect PNet in Settings →
                          </button>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Indeed */}
                  <label className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                    watch('post_to_indeed') ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        {...register('post_to_indeed')}
                        disabled={!integrations?.indeed?.connected}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <IndeedLogo size={36} className="rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-bold text-gray-900 text-lg">Indeed</h4>
                          {!integrations?.indeed?.connected && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                              NOT CONNECTED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          World's #1 job site - Global reach with millions of candidates
                        </p>
                        {!integrations?.indeed?.connected && (
                          <button
                            type="button"
                            onClick={() => handleGoToIntegrations('indeed')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                          >
                            Connect Indeed in Settings →
                          </button>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* LinkedIn */}
                  <label className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                    watch('post_to_linkedin') ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        {...register('post_to_linkedin')}
                        disabled={!integrations?.linkedin?.connected}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <LinkedInLogo size={36} className="rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-bold text-gray-900 text-lg">LinkedIn Jobs</h4>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                            PREMIUM
                          </span>
                          {!integrations?.linkedin?.connected && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                              NOT CONNECTED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Professional network - Target experienced professionals
                        </p>
                        {!integrations?.linkedin?.connected && (
                          <button
                            type="button"
                            onClick={() => handleGoToIntegrations('linkedin')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                          >
                            Connect LinkedIn in Settings →
                          </button>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-2">📊 Publishing Summary</h4>
                  <p className="text-sm text-gray-700">
                    Your job will be posted to <strong>{selectedPlatforms + 1} platform{selectedPlatforms !== 0 ? 's' : ''}</strong>:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    <li>✓ RecruitPro SA (Always included)</li>
                    {watch('post_to_pnet') && <li>✓ PNet</li>}
                    {watch('post_to_indeed') && <li>✓ Indeed</li>}
                    {watch('post_to_linkedin') && <li>✓ LinkedIn</li>}
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
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>

              {step < 4 ? (
                step === 1 ? null : (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Next Step →
                </button>
                )
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      try {
                        await onSubmit({
                          ...getValues(),
                          post_to_pnet: false,
                          post_to_indeed: false,
                          post_to_linkedin: false,
                        } as JobFormData);
                        clearJobDraft();
                        onClose();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.detail || 'Failed to post job. Please try again.');
                      }
                    }}
                    className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    Post Here Only
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{isSubmitting ? 'Publishing...' : `Post to ${selectedPlatforms + 1} Platform${selectedPlatforms !== 0 ? 's' : ''}`}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
