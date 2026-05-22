import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import {
  MapPin, Clock, Banknote, ChevronRight, CircleDashed,
  CheckCircle2, Calendar, PartyPopper, XCircle, Sparkles,
  Send, Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AppItem {
  id: string;
  job_id: string;
  job_title: string;
  job_location: string | null;
  status: string;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  interview_scheduled_at: string | null;
  offer_amount: number | null;
  offer_currency: string | null;
}

const STAGES = [
  { key: 'applied',              label: 'Applied',        icon: Send,          color: 'border-blue-300 bg-blue-50', dot: 'bg-blue-500' },
  { key: 'screening',            label: 'Screening',      icon: Eye,           color: 'border-yellow-300 bg-yellow-50', dot: 'bg-yellow-500' },
  { key: 'shortlisted',         label: 'Shortlisted',    icon: Sparkles,      color: 'border-purple-300 bg-purple-50', dot: 'bg-purple-500' },
  { key: 'interview_scheduled', label: 'Interview',      icon: Calendar,      color: 'border-indigo-300 bg-indigo-50', dot: 'bg-indigo-500' },
  { key: 'offer_made',          label: 'Offer',          icon: PartyPopper,   color: 'border-green-300 bg-green-50', dot: 'bg-green-500' },
  { key: 'rejected',            label: 'Not Selected',   icon: XCircle,       color: 'border-red-200 bg-red-50', dot: 'bg-red-400' },
];

// Map several similar statuses into the correct stage bucket
function bucketStatus(status: string): string {
  const map: Record<string, string> = {
    applied: 'applied',
    screening: 'screening',
    shortlisted: 'shortlisted',
    interview_scheduled: 'interview_scheduled',
    interviewed: 'interview_scheduled',
    offer_pending: 'offer_made',
    offer_made: 'offer_made',
    offer_accepted: 'offer_made',
    hired: 'offer_made',
    rejected: 'rejected',
    withdrawn: 'rejected',
  };
  return map[status] ?? 'applied';
}

export default function ApplicationTrackerPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/candidate-portal/my-applications')
      .then(r => setApps(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const buckets = STAGES.reduce<Record<string, AppItem[]>>((acc, s) => {
    acc[s.key] = apps.filter(a => bucketStatus(a.status) === s.key);
    return acc;
  }, {});

  const total = apps.filter(a => !['rejected', 'withdrawn'].includes(a.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'Loading…' : `${total} active application${total !== 1 ? 's' : ''} across ${apps.length} total`}
          </p>
        </div>
        <Link to="/candidate/jobs" className="btn-primary text-sm flex items-center gap-2">
          Find More Jobs
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <CircleDashed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No applications yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-5">Start applying to jobs to track your progress here.</p>
          <Link to="/candidate/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      ) : (
        /* Kanban board */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => {
              const cards = buckets[stage.key] ?? [];
              const StageIcon = stage.icon;
              return (
                <div
                  key={stage.key}
                  className="w-64 flex-shrink-0"
                >
                  {/* Stage header */}
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${stage.color} mb-3`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.dot}`} />
                    <StageIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-bold text-gray-700 flex-1">{stage.label}</span>
                    <span className="text-xs font-bold text-gray-500 bg-white/60 rounded-full px-1.5 py-0.5">
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {cards.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-[11px] text-gray-400">Nothing here</p>
                      </div>
                    ) : cards.map((app) => (
                      <Link
                        key={app.id}
                        to={`/candidate/applications/${app.id}`}
                        className="block bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md hover:border-blue-200 transition-all"
                      >
                        {/* Company avatar + title */}
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(app.job_title ?? 'J').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                              {app.job_title ?? 'Job'}
                            </p>
                            {app.job_location && (
                              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{app.job_location}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Match score */}
                        {app.match_score != null && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${app.match_score >= 75 ? 'bg-green-500' : app.match_score >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                style={{ width: `${app.match_score}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-bold ${app.match_score >= 75 ? 'text-green-600' : app.match_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {app.match_score}%
                            </span>
                          </div>
                        )}

                        {/* Interview date */}
                        {app.interview_scheduled_at && (
                          <div className="flex items-center gap-1.5 mb-2 bg-indigo-50 rounded-lg px-2 py-1">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            <span className="text-[11px] text-indigo-700 font-medium">
                              {new Date(app.interview_scheduled_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}

                        {/* Offer */}
                        {app.offer_amount && (
                          <div className="flex items-center gap-1.5 mb-2 bg-green-50 rounded-lg px-2 py-1">
                            <Banknote className="w-3 h-3 text-green-600" />
                            <span className="text-[11px] text-green-700 font-semibold">
                              {app.offer_currency ?? 'ZAR'} {app.offer_amount.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
                          </span>
                          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-0.5">
                            Details <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
