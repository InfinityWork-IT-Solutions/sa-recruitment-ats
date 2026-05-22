import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import {
  ArrowLeft, MapPin, Banknote, Calendar, Clock, CheckCircle2,
  Send, Eye, Sparkles, PartyPopper, XCircle, Briefcase,
  ChevronRight, FileText, Phone, Mail,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AppDetail {
  id: string;
  job_id: string;
  job_title: string | null;
  job_location: string | null;
  status: string;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  interview_scheduled_at: string | null;
  offer_amount: number | null;
  offer_currency: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  applied:              { label: 'Applied',             color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    icon: Send },
  screening:            { label: 'Under Review',        color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Eye },
  shortlisted:          { label: 'Shortlisted',         color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Sparkles },
  interview_scheduled:  { label: 'Interview Scheduled', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: Calendar },
  interviewed:          { label: 'Interviewed',         color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: CheckCircle2 },
  offer_pending:        { label: 'Offer Pending',       color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: PartyPopper },
  offer_made:           { label: 'Offer Received',      color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: PartyPopper },
  offer_accepted:       { label: 'Offer Accepted',      color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: CheckCircle2 },
  hired:                { label: 'Hired',               color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: CheckCircle2 },
  rejected:             { label: 'Not Selected',        color: 'text-red-600',    bg: 'bg-red-50 border-red-200',      icon: XCircle },
  withdrawn:            { label: 'Withdrawn',           color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',    icon: XCircle },
};

const TIMELINE_STAGES = ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'offer_made', 'hired'];

function stageIndex(status: string): number {
  const map: Record<string, number> = {
    applied: 0, screening: 1, shortlisted: 2,
    interview_scheduled: 3, interviewed: 3,
    offer_pending: 4, offer_made: 4, offer_accepted: 4,
    hired: 5,
    rejected: -1, withdrawn: -1,
  };
  return map[status] ?? 0;
}

export default function CandidateApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/candidate-portal/my-applications')
      .then(r => {
        const found = r.data.find((a: AppDetail) => a.id === id);
        setApp(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!app) return (
    <div className="text-center py-20">
      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">Application not found.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Go back
      </button>
    </div>
  );

  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG['applied'];
  const StatusIcon = cfg.icon;
  const isRejected = ['rejected', 'withdrawn'].includes(app.status);
  const currentStage = stageIndex(app.status);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> Back to Applications
      </button>

      {/* Hero status card */}
      <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{app.job_title ?? 'Job Application'}</h1>
            {app.job_location && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />{app.job_location}
              </p>
            )}
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </div>
          </div>
          <Link
            to={`/jobs/${app.job_id}`}
            className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
          >
            View Job <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Progress timeline (hidden for rejected/withdrawn) */}
      {!isRejected && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Application Progress</p>
          <div className="flex items-center gap-0">
            {TIMELINE_STAGES.map((stage, i) => {
              const done = currentStage >= i;
              const active = currentStage === i;
              const labels = ['Applied', 'Reviewing', 'Shortlisted', 'Interview', 'Offer', 'Hired'];
              return (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      done ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                    } ${active ? 'ring-4 ring-blue-100' : ''}`}>
                      {done && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <p className={`text-[9px] mt-1 font-semibold text-center leading-tight ${done ? 'text-blue-700' : 'text-gray-400'}`}>
                      {labels[i]}
                    </p>
                  </div>
                  {i < TIMELINE_STAGES.length - 1 && (
                    <div className={`h-0.5 flex-1 -mt-4 ${currentStage > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected message */}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Application not successful</p>
              <p className="text-sm text-red-600 mt-1">
                Thank you for your interest. The recruiter has moved forward with other candidates. Keep applying — the right opportunity is out there!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Details</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Applied</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Last update</p>
              <p className="text-sm font-semibold text-gray-800">
                {format(new Date(app.updated_at), 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {app.match_score != null && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Match Score</p>
                <p className={`text-sm font-bold ${app.match_score >= 75 ? 'text-green-600' : app.match_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {app.match_score}%
                </p>
              </div>
            </div>
          )}

          {app.interview_scheduled_at && (
            <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Interview</p>
                <p className="text-sm font-semibold text-indigo-800">
                  {format(new Date(app.interview_scheduled_at), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
            </div>
          )}

          {app.offer_amount && (
            <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3 col-span-2">
              <Banknote className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Offer Amount</p>
                <p className="text-lg font-bold text-green-700">
                  {app.offer_currency ?? 'ZAR'} {app.offer_amount.toLocaleString()} / month
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What happens next */}
      {!isRejected && currentStage < 5 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What happens next?</p>
          <div className="space-y-2.5">
            {[
              currentStage < 1 && 'The recruiter will review your application and CV.',
              currentStage < 2 && 'If shortlisted, you will be notified here and by email.',
              currentStage < 3 && 'An interview will be scheduled — check your notifications.',
              currentStage === 3 && 'After your interview, the team will deliberate and respond.',
              currentStage === 4 && 'Review your offer carefully before accepting.',
            ].filter(Boolean).slice(0, 3).map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link to={`/jobs/${app.job_id}`} className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3 rounded-xl">
          <Briefcase className="w-4 h-4" /> View Job Posting
        </Link>
        <Link to="/candidate/applications" className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> All Applications
        </Link>
      </div>
    </div>
  );
}
