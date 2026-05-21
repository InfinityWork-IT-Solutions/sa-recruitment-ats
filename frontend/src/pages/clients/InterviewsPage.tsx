import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, User, Briefcase, CheckCircle, Star, ChevronDown,
  Plus, X, MessageSquare, Video, MapPin
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

interface InterviewApplication {
  id: string;
  candidate_name: string;
  candidate_id: string;
  job_title: string;
  job_id: string;
  status: string;
  interview_time?: string;
  match_score?: number;
  notes?: string;
}

function dateLabel(isoString: string) {
  const d = parseISO(isoString);
  if (isPast(d) && !isToday(d)) return 'Past';
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEEE, d MMM');
}

function groupByDate(apps: InterviewApplication[]) {
  const groups: Record<string, InterviewApplication[]> = {};
  apps.forEach(a => {
    const key = a.interview_time ? dateLabel(a.interview_time) : 'Unscheduled';
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });
  return groups;
}

export default function InterviewsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scheduleModal, setScheduleModal] = useState<InterviewApplication | null>(null);
  const [completeModal, setCompleteModal] = useState<InterviewApplication | null>(null);
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const res = await apiClient.get('/applications?status=interview_scheduled&limit=100');
      return (res.data.applications || res.data || []) as InterviewApplication[];
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, interview_time, notes }: { id: string; interview_time: string; notes: string }) =>
      apiClient.post(`/applications/${id}/schedule-interview`, { interview_time, notes }),
    onSuccess: () => {
      toast.success('Interview scheduled!');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setScheduleModal(null);
      setInterviewTime('');
      setInterviewNotes('');
    },
    onError: () => toast.error('Failed to schedule interview'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, rating, feedback }: { id: string; rating: number; feedback: string }) =>
      apiClient.post(`/applications/${id}/complete-interview`, { rating, feedback }),
    onSuccess: () => {
      toast.success('Interview marked as completed!');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setCompleteModal(null);
      setRating(3);
      setFeedback('');
    },
    onError: () => toast.error('Failed to complete interview'),
  });

  const interviews = data || [];
  const groups = groupByDate(interviews);
  const groupOrder = ['Today', 'Tomorrow', ...Object.keys(groups).filter(k => !['Today', 'Tomorrow', 'Past', 'Unscheduled'].includes(k)), 'Past', 'Unscheduled'];
  const orderedGroups = groupOrder.filter(k => groups[k]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
              <p className="text-gray-600 mt-1">
                {interviews.length} interview{interviews.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>
            <button
              onClick={() => navigate('/company/applications')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule from Applications
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No interviews scheduled</h3>
            <p className="text-gray-600 mb-6">
              Schedule interviews from the Applications page by moving candidates to "Interview Scheduled".
            </p>
            <button
              onClick={() => navigate('/company/applications')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              View Applications
            </button>
          </div>
        ) : (
          orderedGroups.map(label => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className={`text-base font-bold ${label === 'Today' ? 'text-blue-700' : label === 'Past' ? 'text-gray-400' : 'text-gray-900'}`}>
                  {label}
                </h2>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">{groups[label].length}</span>
              </div>

              <div className="space-y-3">
                {groups[label].map(app => (
                  <div
                    key={app.id}
                    className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all ${label === 'Past' ? 'opacity-70' : 'border-gray-100'} ${label === 'Today' ? 'border-blue-200 bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {app.candidate_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{app.candidate_name}</h3>
                            {app.match_score && app.match_score >= 70 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {app.match_score}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            {app.job_title}
                          </p>
                          {app.interview_time && (
                            <p className="text-sm text-blue-700 flex items-center gap-1.5 mt-1 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {format(parseISO(app.interview_time), "d MMM yyyy 'at' HH:mm")}
                            </p>
                          )}
                          {app.notes && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {app.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {label !== 'Past' && (
                          <button
                            onClick={() => {
                              setCompleteModal(app);
                              setRating(3);
                              setFeedback('');
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-semibold flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 font-medium"
                        >
                          View Application
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
              <button onClick={() => setScheduleModal(null)} className="p-1.5 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Scheduling for <strong>{scheduleModal.candidate_name}</strong> — {scheduleModal.job_title}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewTime}
                  onChange={e => setInterviewTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={interviewNotes}
                  onChange={e => setInterviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Location, format, what to prepare..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setScheduleModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={!interviewTime || scheduleMutation.isPending}
                onClick={() => scheduleMutation.mutate({ id: scheduleModal.id, interview_time: interviewTime, notes: interviewNotes })}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Interview Modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Complete Interview</h2>
              <button onClick={() => setCompleteModal(null)} className="p-1.5 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Recording outcome for <strong>{completeModal.candidate_name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1–5 stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${n <= rating ? 'bg-yellow-400 text-white shadow' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="How did the candidate perform? Any notable strengths or concerns..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCompleteModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={completeMutation.isPending}
                onClick={() => completeMutation.mutate({ id: completeModal.id, rating, feedback })}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {completeMutation.isPending ? 'Saving...' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
