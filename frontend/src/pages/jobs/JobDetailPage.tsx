import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useJob, useUpdateJob, useDeleteJob, useUpdateJobStatus } from '@/hooks/use-jobs';
import { useAuthStore } from '@/store/auth';
import { useApplications } from '@/hooks/use-applications';
import {
  ArrowLeft, Edit, Trash2, Save, X, MapPin, Briefcase,
  Banknote, Eye, Users, Calendar, CheckCircle, Pause, XCircle,
  Wifi, Clock, CalendarDays, Share2, BookmarkPlus, BookmarkCheck, Building2,
  ChevronRight, Send, FileText, Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { JobStatus, EmploymentType } from '@/types/api';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { useSavedJobs } from '@/hooks/use-saved-jobs';

function InterviewPrepSection({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ questions: string[]; tips: string[] } | null>(null);

  const load = async () => {
    if (data) { setOpen(true); return; }
    setLoading(true);
    try {
      // We fetch prep against the job itself (using a stub application_id = job_id)
      // The backend will fall back to generic questions if no real application exists
      const res = await apiClient.get(`/candidate-portal/interview-prep/${jobId}`);
      setData(res.data);
      setOpen(true);
    } catch {
      toast.error('Could not generate interview prep');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={open ? () => setOpen(false) : load}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">AI Interview Prep</p>
            <p className="text-xs text-gray-400">Practice questions tailored to this role</p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && data && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Likely Interview Questions</p>
            <ol className="space-y-2">
              {data.questions.map((q, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed">{q}</span>
                </li>
              ))}
            </ol>
          </div>
          {data.tips.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tips</p>
              <ul className="space-y-1.5">
                {data.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="px-5 pb-4 border-t border-gray-50 pt-4 flex items-center gap-2 text-sm text-indigo-600">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Generating questions…
        </div>
      )}
    </div>
  );
}


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

const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship', freelance: 'Freelance',
};
const typeColors: Record<string, string> = {
  full_time: 'bg-blue-50 text-blue-700 border-blue-100',
  part_time: 'bg-purple-50 text-purple-700 border-purple-100',
  contract: 'bg-orange-50 text-orange-700 border-orange-100',
  temporary: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  internship: 'bg-green-50 text-green-700 border-green-100',
  freelance: 'bg-pink-50 text-pink-700 border-pink-100',
};
const statusColors: Record<JobStatus, string> = {
  draft: 'badge-gray', active: 'badge-green', paused: 'badge-yellow',
  closed: 'badge-gray', filled: 'badge-blue', expired: 'badge-red',
};

function ApplyModal({ jobId, jobTitle, onClose }: { jobId: string; jobTitle: string; onClose: () => void }) {
  const { user } = useAuthStore();
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    if (!user?.id) { toast.error('Please log in to apply'); return; }
    setSubmitting(true);
    try {
      await apiClient.post(`/jobs/${jobId}/apply`, {
        candidate_id: user.id,
        cover_letter: coverLetter || undefined,
      });
      toast.success('Application submitted successfully!');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit application';
      toast.error(typeof msg === 'string' ? msg : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-semibold text-gray-900">Apply for this position</h2>
            <p className="text-sm text-gray-500 mt-0.5">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Your profile will be shared</p>
              <p className="text-xs text-blue-600 mt-0.5">
                The recruiter will see your profile, CV, and skills. Make sure your profile is up to date.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the recruiter why you're a great fit for this role..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button
            onClick={handleApply}
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const { user } = useAuthStore();
  const isCandidate = user?.role === 'candidate';
  const { savedIds, toggle: toggleSave } = useSavedJobs(isCandidate);

  const { data: job, isLoading } = useJob(id!);
  const { data: applicationsData } = useApplications({ job_id: id });
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const updateStatus = useUpdateJobStatus();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: job ? {
      title: job.title,
      employment_type: job.employment_type,
      location_city: job.city || '',
      location_province: job.province || '',
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
    if (id) { await updateJob.mutateAsync({ id, data }); setIsEditing(false); }
  };

  const handleDelete = async () => {
    if (id) {
      await deleteJob.mutateAsync(id);
      if (user?.role === 'client') navigate('/company/jobs');
      else navigate(-1);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setValue('skills', [...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  if (isLoading) {
    return (
      <div className={`${isCandidate ? 'min-h-screen bg-gray-50' : ''} flex items-center justify-center h-96`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading job details…</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="card text-center py-16">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
        <p className="text-sm text-gray-500 mt-1">This job may have been removed or you don't have access.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const isClosed = job.closing_date && isPast(new Date(job.closing_date));
  const isClosingSoon = job.closing_date && !isClosed &&
    new Date(job.closing_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  /* ─── CANDIDATE VIEW ─────────────────────────────────────── */
  if (isCandidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Back nav */}
        <div className="bg-white border-b px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {/* Hero card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {job.title.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${typeColors[job.employment_type] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                    {employmentTypeLabels[job.employment_type]}
                  </span>
                  {job.status === 'active' && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                      Actively Hiring
                    </span>
                  )}
                  {isClosingSoon && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Closing Soon
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Key details row */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Location</p>
                  <p className="text-sm font-medium text-gray-800">
                    {job.city || job.location || 'Not specified'}
                    {job.province ? `, ${job.province}` : ''}
                  </p>
                </div>
              </div>

              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                  <Banknote className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Salary</p>
                    <p className="text-sm font-medium text-gray-800">
                      {job.salary_currency || 'ZAR'} {job.salary_min?.toLocaleString() || '0'}
                      {job.salary_max ? `–${job.salary_max.toLocaleString()}` : '+'}
                    </p>
                  </div>
                </div>
              )}

              {job.closing_date && (
                <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${isClosed ? 'bg-red-50' : isClosingSoon ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <CalendarDays className={`w-4 h-4 flex-shrink-0 ${isClosed ? 'text-red-500' : isClosingSoon ? 'text-orange-500' : 'text-gray-500'}`} />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Closing Date</p>
                    <p className={`text-sm font-medium ${isClosed ? 'text-red-700' : isClosingSoon ? 'text-orange-700' : 'text-gray-800'}`}>
                      {isClosed ? 'Closed' : format(new Date(job.closing_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {job.is_remote && (
                <div className="flex items-center gap-2.5 bg-green-50 rounded-xl px-3 py-2.5">
                  <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Work Mode</p>
                    <p className="text-sm font-medium text-green-800">Remote Available</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Posted</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Ref</p>
                  <p className="text-sm font-medium text-gray-800">{job.reference}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => !isClosed && setShowApplyModal(true)}
                disabled={!!isClosed || job.status !== 'active'}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isClosed || job.status !== 'active'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                }`}
              >
                <Send className="w-4 h-4" />
                {isClosed ? 'Applications Closed' : job.status !== 'active' ? 'Not Accepting Applications' : 'Apply Now'}
              </button>
              <button
                onClick={() => id && toggleSave(id)}
                className={`p-3 rounded-xl transition-colors ${id && savedIds.has(id) ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                title={id && savedIds.has(id) ? 'Remove from saved' : 'Save job'}
              >
                {id && savedIds.has(id) ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.filter((s: string) => s.trim()).map((skill: string) => (
                  <span key={skill} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">About the Role</h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (Array.isArray(job.requirements) ? job.requirements.length > 0 : job.requirements) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Requirements</h2>
              {Array.isArray(job.requirements) ? (
                <ul className="space-y-2">
                  {(job.requirements as string[]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.requirements as string}</div>
              )}
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (Array.isArray(job.responsibilities) ? job.responsibilities.length > 0 : job.responsibilities) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Responsibilities</h2>
              {Array.isArray(job.responsibilities) ? (
                <ul className="space-y-2">
                  {(job.responsibilities as string[]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.responsibilities as string}</div>
              )}
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (Array.isArray(job.benefits) ? job.benefits.length > 0 : job.benefits) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Benefits &amp; Perks</h2>
              {Array.isArray(job.benefits) ? (
                <ul className="space-y-2">
                  {(job.benefits as string[]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.benefits as string}</div>
              )}
            </div>
          )}

          {/* Interview Prep AI — shown only after applying */}
          <InterviewPrepSection jobId={id!} />

          {/* Sticky bottom apply bar */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-gray-100 -mx-4 px-4 py-4 mt-6">
            <button
              onClick={() => !isClosed && setShowApplyModal(true)}
              disabled={!!isClosed || job.status !== 'active'}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                isClosed || job.status !== 'active'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
              }`}
            >
              <Send className="w-4 h-4" />
              {isClosed ? 'Applications Closed' : 'Apply for this Position'}
            </button>
          </div>
        </div>

        {showApplyModal && (
          <ApplyModal jobId={id!} jobTitle={job.title} onClose={() => setShowApplyModal(false)} />
        )}
      </div>
    );
  }

  /* ─── RECRUITER / ADMIN VIEW ─────────────────────────────── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600 mt-1">Ref: {job.reference}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => { reset({ title: job.title, employment_type: job.employment_type, location_city: job.city || '', location_province: job.province || '', description: job.description, requirements: job.requirements || '', responsibilities: job.responsibilities || '', benefits: job.benefits || '', skills: job.skills || [], salary_min: job.salary_min || undefined, salary_max: job.salary_max || undefined }); setIsEditing(true); }}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" /><span>Edit</span>
              </button>
              <button onClick={() => navigate(`/jobs/${id}/kanban`)} className="btn-primary flex items-center space-x-2">
                <Users className="w-4 h-4" /><span>Kanban Board</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center space-x-2">
                <X className="w-4 h-4" /><span>Cancel</span>
              </button>
              <button onClick={handleSubmit(handleSave)} className="btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" /><span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Status &amp; Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <span className={`badge ${statusColors[job.status]} text-base`}>{job.status.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-1"><Users className="w-4 h-4" /><span className="text-sm">Applications</span></div>
                  <p className="text-2xl font-bold text-gray-900">{Number(job.applications_count) || 0}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-1"><Eye className="w-4 h-4" /><span className="text-sm">Views</span></div>
                  <p className="text-2xl font-bold text-gray-900">{Number(job.views_count) || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Change Status</h3>
              <div className="space-y-2">
                {job.status !== 'active' && (
                  <button onClick={() => updateStatus.mutateAsync({ id: id!, status: 'active' })} className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" /><span>Activate Job</span>
                  </button>
                )}
                {job.status === 'active' && (
                  <button onClick={() => updateStatus.mutateAsync({ id: id!, status: 'paused' })} className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-2">
                    <Pause className="w-4 h-4" /><span>Pause Job</span>
                  </button>
                )}
                {['active', 'paused'].includes(job.status) && (
                  <button onClick={() => updateStatus.mutateAsync({ id: id!, status: 'closed' })} className="w-full btn-secondary flex items-center justify-center space-x-2">
                    <XCircle className="w-4 h-4" /><span>Close Job</span>
                  </button>
                )}
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full btn-danger flex items-center justify-center space-x-2">
                  <Trash2 className="w-4 h-4" /><span>Delete Job</span>
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Dates</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-gray-900 font-medium">{format(new Date(job.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-gray-900 font-medium">{format(new Date(job.updated_at), 'MMM d, yyyy')}</p>
              </div>
              {job.closing_date && (
                <div>
                  <p className="text-sm text-gray-600">Closing Date</p>
                  <p className={`font-medium ${isClosed ? 'text-red-600' : isClosingSoon ? 'text-orange-600' : 'text-gray-900'}`}>
                    {format(new Date(job.closing_date), 'MMM d, yyyy')}
                    {isClosed && ' (Closed)'}
                    {isClosingSoon && !isClosed && ' (Closing soon)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {isEditing ? (
            <form onSubmit={handleSubmit(handleSave)} className="card space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Job Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input {...register('title')} type="text" className="input" />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                  <select {...register('location_province')} className="input">
                    {['Western Cape','Gauteng','KwaZulu-Natal','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input {...register('location_city')} type="text" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
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
                  <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="input flex-1" placeholder="Add a skill" />
                  <button type="button" onClick={addSkill} className="btn-primary">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="badge badge-blue flex items-center space-x-1">
                      <span>{skill}</span>
                      <button type="button" onClick={() => setValue('skills', skills.filter(s => s !== skill))} className="ml-1 hover:text-red-600">×</button>
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
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Employment Type</p>
                    <p className="text-gray-900">{employmentTypeLabels[job.employment_type]}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                    <p className="text-gray-900">{job.city}, {job.province}</p>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Salary Range</p>
                      <p className="text-gray-900">{job.salary_currency || 'ZAR'} {job.salary_min?.toLocaleString() || '0'}{job.salary_max && ` - ${job.salary_max.toLocaleString()}`}</p>
                    </div>
                  )}
                  {job.experience_level && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Experience Level</p>
                      <p className="text-gray-900">{job.experience_level}</p>
                    </div>
                  )}
                </div>
                {job.skills && job.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => <span key={skill} className="badge badge-blue">{skill}</span>)}
                    </div>
                  </div>
                )}
              </div>
              {job.description && <div className="card"><h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3><p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p></div>}
              {job.requirements && (Array.isArray(job.requirements) ? (job.requirements as string[]).length > 0 : true) && (
                <div className="card"><h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                  {Array.isArray(job.requirements) ? <ul className="space-y-1.5">{(job.requirements as string[]).map((r,i)=><li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2"/><span>{r}</span></li>)}</ul> : <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{job.requirements as string}</p>}
                </div>
              )}
              {job.responsibilities && (Array.isArray(job.responsibilities) ? (job.responsibilities as string[]).length > 0 : true) && (
                <div className="card"><h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
                  {Array.isArray(job.responsibilities) ? <ul className="space-y-1.5">{(job.responsibilities as string[]).map((r,i)=><li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2"/><span>{r}</span></li>)}</ul> : <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{job.responsibilities as string}</p>}
                </div>
              )}
              {job.benefits && (Array.isArray(job.benefits) ? (job.benefits as string[]).length > 0 : true) && (
                <div className="card"><h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h3>
                  {Array.isArray(job.benefits) ? <ul className="space-y-1.5">{(job.benefits as string[]).map((r,i)=><li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-2"/><span>{r}</span></li>)}</ul> : <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{job.benefits as string}</p>}
                </div>
              )}
              {applicationsData && applicationsData.applications.length > 0 && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                    <button onClick={() => navigate(`/jobs/${id}/kanban`)} className="text-sm text-blue-600 hover:underline">Kanban Board →</button>
                  </div>
                  <div className="space-y-3">
                    {applicationsData.applications.slice(0, 5).map((app) => (
                      <button key={app.id} onClick={() => navigate(`/applications/${app.id}`)} className="w-full block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">Application #{app.id.slice(0, 8)}</p>
                          <span className="text-xs text-gray-500">{format(new Date(app.created_at), 'MMM d')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete "{job.title}"? This action cannot be undone.</p>
            <div className="flex items-center justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={deleteJob.isPending} className="btn-danger">
                {deleteJob.isPending ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
