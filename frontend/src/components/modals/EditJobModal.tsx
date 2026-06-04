import React, { useEffect } from 'react';
import { X, Briefcase, MapPin, DollarSign, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

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
  company_name: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  category: z.string().default('other'),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'full_time', 'part_time']),
  work_mode: z.enum(['remote', 'hybrid', 'on-site', 'on_site']),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  experience_min: z.number().min(0).default(0),
  experience_max: z.number().min(0).default(5),
  closing_date: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requirements: z.string().optional(),
  skills: z.string().optional(),
  benefits: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  job: any;
}

export default function EditJobModal({ isOpen, onClose, onSubmit, job }: EditJobModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  const [salaryBenchmark, setSalaryBenchmark] = React.useState<any>(null);
  const [salaryLoading, setSalaryLoading] = React.useState(false);

  useEffect(() => {
    if (job && isOpen) {
      const empType = job.employment_type || job.job_type || 'full-time';
      const workMode = job.remote_type || (job.is_remote ? 'remote' : 'on-site');
      const reqArray = Array.isArray(job.requirements) ? job.requirements : [];
      const benefitsArray = Array.isArray(job.benefits) ? job.benefits : [];
      const skillsArray = Array.isArray(job.skills) ? job.skills : [];

      reset({
        title: job.title || '',
        company_name: job.company_name || '',
        location: job.location || '',
        category: job.category || 'other',
        job_type: empType.replace('_', '-') as any,
        work_mode: workMode.replace('_', '-') as any,
        salary_min: job.salary_min ?? null,
        salary_max: job.salary_max ?? null,
        experience_min: job.years_of_experience_min ?? job.experience_min ?? 0,
        experience_max: job.years_of_experience_max ?? job.experience_max ?? 5,
        closing_date: job.closing_date ? new Date(job.closing_date).toISOString().split('T')[0] : '',
        description: job.description || '',
        requirements: reqArray.join('\n'),
        skills: skillsArray.join(', '),
        benefits: benefitsArray.join('\n'),
      });
    }
  }, [job, isOpen, reset]);

  if (!isOpen) return null;

  const handleGetMarketRate = async () => {
    const title = watch('title');
    if (!title?.trim()) return toast.error('Enter a job title first');
    setSalaryLoading(true);
    try {
      const res = await apiClient.get('/ai/salary-benchmark', {
        params: { job_title: title, location: watch('location') || 'South Africa', experience_years: watch('experience_min') ?? 0 },
      });
      setSalaryBenchmark(res.data);
      if (res.data.min_annual) setValue('salary_min', Math.round(res.data.min_annual / 12));
      if (res.data.max_annual) setValue('salary_max', Math.round(res.data.max_annual / 12));
      toast.success('Salary benchmark loaded!');
    } catch {
      toast.error('Failed to fetch salary data');
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleFormSubmit = async (data: JobFormData) => {
    const splitLines = (s: string) => (s || '').split('\n').map(l => l.trim()).filter(Boolean);
    const apiData = {
      title: data.title,
      location: data.location,
      category: data.category,
      description: data.description,
      requirements: splitLines(data.requirements || ''),
      benefits: splitLines(data.benefits || ''),
      skills: (data.skills || '').split(',').map(s => s.trim()).filter(Boolean),
      employment_type: (data.job_type || 'full-time').replace('-', '_'),
      is_remote: data.work_mode === 'remote',
      remote_type: data.work_mode,
      years_of_experience_min: data.experience_min,
      years_of_experience_max: data.experience_max,
      salary_min: data.salary_min || null,
      salary_max: data.salary_max || null,
      show_salary: !!(data.salary_min || data.salary_max),
      closing_date: data.closing_date ? new Date(data.closing_date).toISOString() : undefined,
    };
    try {
      await onSubmit(apiData);
      onClose();
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Briefcase className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Edit Job</h2>
              <p className="text-blue-100 text-sm mt-0.5">All fields are pre-filled — change only what you need</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title <span className="text-red-500">*</span></label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('title')}
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Location + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('location')}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Cape Town, Western Cape"
                  />
                </div>
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                <select {...register('category')} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                  {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Work Mode + Job Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                <select {...register('work_mode')} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="on-site">On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <select {...register('job_type')} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Salary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Salary Range (ZAR/month)</label>
                <button type="button" onClick={handleGetMarketRate} disabled={salaryLoading}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-60">
                  {salaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                  {salaryLoading ? 'Loading...' : 'Get Market Rate'}
                </button>
              </div>
              {salaryBenchmark && (
                <div className="mb-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-xs text-green-800">
                  Market range: <strong>R{Number(salaryBenchmark.min_monthly || 0).toLocaleString()} – R{Number(salaryBenchmark.max_monthly || 0).toLocaleString()}/mo</strong>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input {...register('salary_min', { valueAsNumber: true })} type="number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Min (e.g. 25000)" />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input {...register('salary_max', { valueAsNumber: true })} type="number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Max (e.g. 45000)" />
                </div>
              </div>
            </div>

            {/* Experience + Closing Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input {...register('experience_min', { valueAsNumber: true })} type="number" min="0"
                      className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="Min" />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input {...register('experience_max', { valueAsNumber: true })} type="number" min="0"
                      className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="Max" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Closing Date</label>
                <input {...register('closing_date')} type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Description <span className="text-red-500">*</span></label>
              <textarea {...register('description')} rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the role and responsibilities..." />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
              <textarea {...register('requirements')} rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="One requirement per line..." />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
              <input {...register('skills')} type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="React, TypeScript, Node.js (comma-separated)" />
              <p className="text-xs text-gray-400 mt-1">Separate skills with commas</p>
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Benefits <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea {...register('benefits')} rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Medical aid, pension, remote work... (one per line)" />
            </div>
          </div>

          <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

