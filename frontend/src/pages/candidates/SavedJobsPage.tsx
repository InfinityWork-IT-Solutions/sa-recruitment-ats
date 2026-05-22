import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Bookmark, MapPin, Banknote, Briefcase, Trash2, CalendarDays, ChevronRight, CircleDashed } from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship', freelance: 'Freelance',
};

export default function SavedJobsPage() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/candidate-portal/saved-jobs')
      .then(r => setSaved(r.data))
      .catch(() => toast.error('Failed to load saved jobs'))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (jobId: string) => {
    try {
      await apiClient.delete(`/candidate-portal/saved-jobs/${jobId}`);
      setSaved(prev => prev.filter(s => s.job_id !== jobId));
      toast.success('Removed from saved jobs');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-purple-600" /> Saved Jobs
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${saved.length} saved job${saved.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link to="/candidate/jobs" className="btn-primary text-sm">Find More Jobs</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : saved.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <CircleDashed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No saved jobs</h3>
            <p className="text-sm text-gray-400 mt-1 mb-5">Bookmark jobs you're interested in to find them here.</p>
            <Link to="/candidate/jobs" className="btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map((item) => {
              const job = item.job;
              if (!job) return null;
              const isClosed = job.closing_date && isPast(new Date(job.closing_date));
              return (
                <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-transparent hover:border-blue-100 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(job.title ?? 'J').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {job.title}
                        </Link>
                        <button
                          onClick={() => handleRemove(job.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                        {job.employment_type && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{TYPE_LABELS[job.employment_type] ?? job.employment_type}</span>}
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            {job.salary_currency ?? 'ZAR'} {job.salary_min?.toLocaleString() ?? '0'}
                            {job.salary_max ? `–${job.salary_max.toLocaleString()}` : '+'}
                          </span>
                        )}
                        {job.closing_date && (
                          <span className={`flex items-center gap-1 ${isClosed ? 'text-red-500' : ''}`}>
                            <CalendarDays className="w-3 h-3" />
                            {isClosed ? 'Closed' : `Closes ${format(new Date(job.closing_date), 'dd MMM yyyy')}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Saved {format(new Date(item.saved_at), 'dd MMM yyyy')}
                    </span>
                    <Link
                      to={`/jobs/${job.id}`}
                      className={`flex items-center gap-1 text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                        isClosed || job.status !== 'active'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isClosed ? 'Closed' : 'View & Apply'} <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
