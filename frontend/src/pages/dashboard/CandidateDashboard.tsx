import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  Briefcase, Bookmark, BookmarkCheck, Search, MapPin, Banknote,
  Clock, ChevronRight, Sparkles, TrendingUp, FileText, Wifi, CalendarDays,
  AlertCircle, Bell, CircleDashed, CheckCircle2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDistanceToNow, format, isPast } from 'date-fns';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  applied:              { label: 'Applied',        color: 'bg-blue-100 text-blue-700' },
  screening:            { label: 'Screening',       color: 'bg-yellow-100 text-yellow-700' },
  shortlisted:          { label: 'Shortlisted',     color: 'bg-purple-100 text-purple-700' },
  interview_scheduled:  { label: 'Interview',       color: 'bg-indigo-100 text-indigo-700' },
  interviewed:          { label: 'Interviewed',     color: 'bg-violet-100 text-violet-700' },
  offer_pending:        { label: 'Offer Pending',   color: 'bg-orange-100 text-orange-700' },
  offer_made:           { label: 'Offer Received',  color: 'bg-green-100 text-green-700' },
  offer_accepted:       { label: 'Offer Accepted',  color: 'bg-emerald-100 text-emerald-700' },
  hired:                { label: 'Hired',           color: 'bg-green-200 text-green-800' },
  rejected:             { label: 'Not Selected',    color: 'bg-red-100 text-red-700' },
  withdrawn:            { label: 'Withdrawn',       color: 'bg-gray-100 text-gray-500' },
};

const EMP_TYPE_LABEL: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship', freelance: 'Freelance',
};

export default function CandidateDashboard() {
  const { user } = useAuthStore();

  const [apps, setApps] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [completeness, setCompleteness] = useState<{ score: number; missing: string[] } | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    apiClient.get('/candidate-portal/my-applications')
      .then(r => setApps(r.data))
      .catch(() => {})
      .finally(() => setLoadingApps(false));

    apiClient.get('/candidate-portal/saved-jobs')
      .then(r => setSavedJobs(r.data))
      .catch(() => {})
      .finally(() => setLoadingSaved(false));

    apiClient.get('/candidate-portal/profile-completeness')
      .then(r => setCompleteness(r.data))
      .catch(() => {});

    apiClient.get('/candidate-portal/job-alerts')
      .then(r => setAlerts(r.data))
      .catch(() => {});

    apiClient.get('/jobs', { params: { status: 'active', limit: 5 } })
      .then(r => setRecommendedJobs((r.data?.jobs ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const activeApps = apps.filter(a => !['rejected', 'withdrawn', 'hired'].includes(a.status));
  const interviewApps = apps.filter(a => a.status === 'interview_scheduled');
  const offerApps = apps.filter(a => ['offer_made', 'offer_pending'].includes(a.status));

  const stats = [
    { label: 'Applications', value: apps.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', accent: 'border-l-blue-500', link: '/candidate/applications' },
    { label: 'Active', value: activeApps.length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', accent: 'border-l-green-500', link: '/candidate/applications' },
    { label: 'Saved Jobs', value: loadingSaved ? '…' : savedJobs.length, icon: Bookmark, color: 'text-purple-600', bg: 'bg-purple-50', accent: 'border-l-purple-500', link: '/candidate/saved-jobs' },
    { label: 'Job Alerts', value: alerts.length, icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50', accent: 'border-l-orange-400', link: '/candidate/profile' },
  ];

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your job search overview.</p>
        </div>
        <Link
          to="/candidate/jobs"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
        >
          <Search className="w-4 h-4" /> Find Jobs
        </Link>
      </div>

      {/* Profile completeness */}
      {completeness && completeness.score < 100 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-amber-900">
                  Profile {completeness.score}% complete — boost your visibility
                </p>
                <Link to="/candidate/profile" className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap ml-3">
                  Complete now →
                </Link>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-400 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
              {completeness.missing.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {completeness.missing.slice(0, 4).map(m => (
                    <span key={m} className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      + {m}
                    </span>
                  ))}
                  {completeness.missing.length > 4 && (
                    <span className="text-[10px] text-amber-600">+{completeness.missing.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile complete confirmation */}
      {completeness && completeness.score === 100 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800">Your profile is 100% complete — recruiters can find you.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className={`bg-white rounded-2xl p-4 border border-gray-100 border-l-4 ${s.accent} shadow-sm hover:shadow-md transition-all group`}
          >
            <div className={`${s.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loadingApps && s.label !== 'Saved Jobs' && s.label !== 'Job Alerts' ? '…' : s.value}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5 group-hover:text-gray-700 transition-colors">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Applications — left col */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" /> My Applications
            </h2>
            <Link to="/candidate/applications" className="text-xs text-blue-600 font-semibold hover:underline">
              View all →
            </Link>
          </div>

          {loadingApps ? (
            <div className="space-y-3 p-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="py-10 text-center">
              <CircleDashed className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No applications yet</p>
              <Link to="/candidate/jobs" className="text-xs text-blue-600 font-semibold mt-1 inline-block hover:underline">
                Browse jobs →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {apps.slice(0, 5).map((app) => {
                const st = STATUS_LABEL[app.status] ?? { label: app.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <Link
                    key={app.id}
                    to="/candidate/applications"
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{app.job_title || 'Job'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {app.job_location && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{app.job_location}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${st.color}`}>
                      {st.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="lg:col-span-2 space-y-4">
          {/* Offers / Interviews alert */}
          {(offerApps.length > 0 || interviewApps.length > 0) && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
              <h3 className="font-semibold text-green-800 text-sm mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Action Required
              </h3>
              {offerApps.map(a => (
                <p key={a.id} className="text-xs text-green-700 mb-1">
                  🎉 You have an offer for <strong>{a.job_title}</strong>
                </p>
              ))}
              {interviewApps.map(a => (
                <p key={a.id} className="text-xs text-green-700 mb-1">
                  📅 Interview scheduled for <strong>{a.job_title}</strong>
                </p>
              ))}
              <Link to="/candidate/applications" className="text-xs font-semibold text-green-700 hover:underline mt-1 inline-block">
                View details →
              </Link>
            </div>
          )}

          {/* Saved Jobs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <Bookmark className="w-4 h-4 text-gray-400" /> Saved Jobs
              </h2>
              <Link to="/candidate/saved-jobs" className="text-xs text-blue-600 font-semibold hover:underline">
                View all →
              </Link>
            </div>
            {loadingSaved ? (
              <div className="p-4 space-y-2">
                {[1,2].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : savedJobs.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400">No saved jobs yet</p>
                <Link to="/candidate/jobs" className="text-xs text-blue-600 font-semibold mt-1 inline-block hover:underline">Browse jobs →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {savedJobs.slice(0, 3).map((sj) => (
                  <Link
                    key={sj.id}
                    to={`/jobs/${sj.job_id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{sj.job?.title ?? 'Job'}</p>
                      <p className="text-xs text-gray-400">{sj.job?.city ?? ''}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Job Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-400" /> Job Alerts
              </h2>
            </div>
            {alerts.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-xs text-gray-400 mb-2">No active job alerts</p>
                <Link
                  to="/candidate/profile"
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                >
                  Set up alerts →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <p className="text-xs text-gray-700 font-medium">{a.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended For You — full card design matching the jobs page */}
      {recommendedJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-blue-500" /> Recommended For You
            </h2>
            <Link to="/candidate/jobs" className="text-xs text-blue-600 font-semibold hover:underline">
              View all jobs →
            </Link>
          </div>
          <div className="space-y-3">
            {recommendedJobs.map((job) => {
              const isClosed = job.closing_date && isPast(new Date(job.closing_date));
              const isClosingSoon = job.closing_date && !isClosed &&
                new Date(job.closing_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
              const isSaved = savedJobs.some((sj: any) => sj.job_id === job.id);

              return (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="group block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {job.title.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-[15px] leading-snug">
                          {job.title}
                        </h3>
                        {isClosingSoon && !isClosed && (
                          <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                            Closing soon
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                        {(job.city || job.location) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location || `${job.city || ''}${job.province ? ', ' + job.province : ''}`}
                          </span>
                        )}
                        {job.is_remote && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Wifi className="w-3 h-3" /> Remote
                          </span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            {job.salary_currency || 'ZAR'} {job.salary_min?.toLocaleString() || '0'}
                            {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : '+'}
                          </span>
                        )}
                        {job.closing_date && (
                          <span className={`flex items-center gap-1 ${isClosed ? 'text-red-500' : isClosingSoon ? 'text-orange-500' : ''}`}>
                            <CalendarDays className="w-3 h-3" />
                            {isClosed ? 'Closed' : `Closes ${format(new Date(job.closing_date), 'dd MMM yyyy')}`}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-2.5 line-clamp-2">
                          {job.description.slice(0, 200)}{job.description.length > 200 ? '…' : ''}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {job.employment_type && (
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100">
                            {EMP_TYPE_LABEL[job.employment_type] ?? job.employment_type}
                          </span>
                        )}
                        {job.skills?.filter((s: string) => s.trim()).slice(0, 5).map((skill: string) => (
                          <span key={skill} className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                            {skill}
                          </span>
                        ))}
                        {(job.skills?.length ?? 0) > 5 && (
                          <span className="text-[10px] text-gray-400 font-medium">+{(job.skills?.length ?? 0) - 5} more</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'text-purple-600 bg-purple-50' : 'text-gray-300'}`}>
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </div>
                      {job.match_score != null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${job.match_score >= 75 ? 'bg-green-100 text-green-700' : job.match_score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                          {job.match_score}% match
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
