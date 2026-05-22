import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApplication, useScreenApplication, useScheduleInterview, useCompleteInterview, useMakeOffer, useHireCandidate, useRejectApplication } from '@/hooks/use-applications';
import {
    ArrowLeft,
    User,
    Briefcase,
    Calendar,
    Star,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    MessageSquare,
    Award,
    Mail,
    Sparkles,
    Send,
    Trash2,
    ClipboardList,
} from 'lucide-react';
import EmailCandidateModal from '@/components/EmailCandidateModal';
import { format } from 'date-fns';
import { ApplicationStatus } from '@/types/api';
import { useAuthStore } from '@/store/auth';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
    strong_hire: { label: 'Strong Hire', color: 'bg-green-100 text-green-800' },
    hire: { label: 'Hire', color: 'bg-blue-100 text-blue-800' },
    maybe: { label: 'Maybe', color: 'bg-yellow-100 text-yellow-800' },
    no_hire: { label: 'No Hire', color: 'bg-red-100 text-red-800' },
};

const statusColors: Record<ApplicationStatus, string> = {
    applied: 'bg-gray-100 text-gray-800',
    screening: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-purple-100 text-purple-800',
    interview_scheduled: 'bg-yellow-100 text-yellow-800',
    interviewed: 'bg-orange-100 text-orange-800',
    offer_pending: 'bg-indigo-100 text-indigo-800',
    offer_made: 'bg-pink-100 text-pink-800',
    offer_accepted: 'bg-green-100 text-green-800',
    hired: 'bg-green-200 text-green-900',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800',
};

type ActionModal =
    | { type: 'screen' }
    | { type: 'interview' }
    | { type: 'complete_interview' }
    | { type: 'offer' }
    | { type: 'reject' }
    | { type: 'hire' }
    | null;

export default function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState<ActionModal>(null);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'scorecards'>('details');
    const [comments, setComments] = useState<any[]>([]);
    const [scorecards, setScorecards] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const commentEndRef = useRef<HTMLDivElement>(null);

    // Form states
    const [screenData, setScreenData] = useState({ passed: true, score: 0, notes: '' });
    const [interviewData, setInterviewData] = useState({ interview_time: '', notes: '' });
    const [completeInterviewData, setCompleteInterviewData] = useState({ rating: 0, feedback: '' });
    const [offerData, setOfferData] = useState({ amount: 0, notes: '' });
    const [rejectData, setRejectData] = useState({ reason: '', notes: '' });

    const { data: application, isLoading } = useApplication(id!);

    useEffect(() => {
        if (!id) return;
        apiClient.get(`/applications/${id}/comments`).then(r => setComments(r.data || [])).catch(() => {});
        apiClient.get(`/applications/${id}/scorecards`).then(r => setScorecards(r.data || [])).catch(() => {});
    }, [id]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setCommentLoading(true);
        try {
            const res = await apiClient.post(`/applications/${id}/comments`, { content: newComment });
            setComments(prev => [...prev, res.data]);
            setNewComment('');
            setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch {
            toast.error('Failed to add comment');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await apiClient.delete(`/applications/${id}/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch {
            toast.error('Failed to delete comment');
        }
    };

    const screenMutation = useScreenApplication();
    const scheduleInterviewMutation = useScheduleInterview();
    const completeInterviewMutation = useCompleteInterview();
    const offerMutation = useMakeOffer();
    const hireMutation = useHireCandidate();
    const rejectMutation = useRejectApplication();
    const { user } = useAuthStore();

    const handleScreen = async () => {
        if (id) {
            await screenMutation.mutateAsync({ id, data: screenData });
            setActiveModal(null);
        }
    };

    const handleScheduleInterview = async () => {
        if (id) {
            await scheduleInterviewMutation.mutateAsync({ id, data: interviewData });
            setActiveModal(null);
        }
    };

    const handleCompleteInterview = async () => {
        if (id) {
            await completeInterviewMutation.mutateAsync({ id, data: completeInterviewData });
            setActiveModal(null);
        }
    };

    const handleMakeOffer = async () => {
        if (id) {
            await offerMutation.mutateAsync({ id, data: offerData });
            setActiveModal(null);
        }
    };

    const handleHire = async () => {
        if (id) {
            await hireMutation.mutateAsync(id);
            setActiveModal(null);
        }
    };

    const handleReject = async () => {
        if (id) {
            await rejectMutation.mutateAsync({ id, data: rejectData });
            setActiveModal(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="card text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Application not found</h3>
            </div>
        );
    }

    const canScreen = application.status === 'applied' || application.status === 'screening';
    const canScheduleInterview = ['screening', 'shortlisted'].includes(application.status);
    const canCompleteInterview = application.status === 'interview_scheduled' || application.status === 'interviewed';
    const canMakeOffer = ['interviewed', 'offer_pending'].includes(application.status);
    const canHire = application.status === 'offer_accepted';
    const canReject = !['hired', 'rejected', 'withdrawn'].includes(application.status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
                        <p className="text-gray-600 mt-1">
                            Applied {format(new Date(application.created_at), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[application.status]}`}>
                    {application.status.replace(/_/g, ' ').toUpperCase()}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* AI Auto-Shortlist Banner */}
                    {application.match_score != null && application.match_score >= 90 &&
                        application.status === 'shortlisted' &&
                        application.screening_notes?.includes('Auto-shortlisted by AI') && (
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white flex items-start gap-3">
                            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm">
                                    ⚡ AI Auto-Shortlisted ({application.match_score}% match)
                                </p>
                                <p className="text-blue-100 text-xs mt-0.5">
                                    This candidate was automatically shortlisted by AI. Click "Schedule Interview" below to proceed.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setEmailModalOpen(true)}
                                className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 flex items-center justify-center space-x-2 border border-blue-200 transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="font-bold">Email Candidate</span>
                            </button>
                            {user?.role !== 'client' && canScreen && (
                                <button
                                    onClick={() => setActiveModal({ type: 'screen' })}
                                    className="w-full btn-primary flex items-center justify-center space-x-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Screen Application</span>
                                </button>
                            )}
                            {canScheduleInterview && (
                                <button
                                    onClick={() => setActiveModal({ type: 'interview' })}
                                    className="w-full btn-primary flex items-center justify-center space-x-2"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Schedule Interview</span>
                                </button>
                            )}
                            {user?.role !== 'client' && canCompleteInterview && (
                                <button
                                    onClick={() => setActiveModal({ type: 'complete_interview' })}
                                    className="w-full btn-primary flex items-center justify-center space-x-2"
                                >
                                    <Star className="w-4 h-4" />
                                    <span>Complete Interview</span>
                                </button>
                            )}
                            {user?.role !== 'client' && canMakeOffer && (
                                <button
                                    onClick={() => setActiveModal({ type: 'offer' })}
                                    className="w-full btn-primary flex items-center justify-center space-x-2"
                                >
                                    <DollarSign className="w-4 h-4" />
                                    <span>Make Offer</span>
                                </button>
                            )}
                            {user?.role !== 'client' && canHire && (
                                <button
                                    onClick={() => setActiveModal({ type: 'hire' })}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                                >
                                    <Award className="w-4 h-4" />
                                    <span>Hire Candidate</span>
                                </button>
                            )}
                            {user?.role !== 'client' && canReject && (
                                <button
                                    onClick={() => setActiveModal({ type: 'reject' })}
                                    className="w-full btn-danger flex items-center justify-center space-x-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Reject</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Application Info */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Application Info</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Source</p>
                                <p className="text-gray-900 font-medium">
                                    {application.source.replace(/_/g, ' ').toUpperCase()}
                                </p>
                            </div>
                            {application.match_score !== null && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Match Score</p>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${application.match_score}%` }}
                                            />
                                        </div>
                                        <span className="text-lg font-semibold text-blue-600">
                                            {application.match_score}%
                                        </span>
                                    </div>
                                </div>
                            )}
                            {application.screening_score !== null && (
                                <div>
                                    <p className="text-sm text-gray-600">Screening Score</p>
                                    <p className="text-gray-900 font-medium">
                                        {application.screening_score}/10
                                    </p>
                                </div>
                            )}
                            {application.interview_rating !== null && (
                                <div>
                                    <p className="text-sm text-gray-600">Interview Rating</p>
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${star <= application.interview_rating!
                                                        ? 'text-yellow-500 fill-current'
                                                        : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {application.offer_amount !== null && (
                                <div>
                                    <p className="text-sm text-gray-600">Offer Amount</p>
                                    <p className="text-gray-900 font-medium">
                                        R{application.offer_amount.toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {application.interview_scheduled_at && (
                                <div>
                                    <p className="text-sm text-gray-600">Interview Scheduled</p>
                                    <p className="text-gray-900 font-medium">
                                        {format(new Date(application.interview_scheduled_at), 'MMM d, yyyy HH:mm')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Candidate Card */}
                    <div className="card">
                        <div className="flex items-center space-x-2 text-gray-600 mb-4">
                            <User className="w-5 h-5" />
                            <h3 className="text-lg font-semibold text-gray-900">Candidate</h3>
                        </div>
                        <Link
                            to={`/candidates/${application.candidate_id}`}
                            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <p className="text-lg font-semibold text-gray-900">View Candidate Profile →</p>
                            <p className="text-sm text-gray-600 mt-1">ID: {application.candidate_id}</p>
                        </Link>
                    </div>

                    {/* Job Card */}
                    <div className="card">
                        <div className="flex items-center space-x-2 text-gray-600 mb-4">
                            <Briefcase className="w-5 h-5" />
                            <h3 className="text-lg font-semibold text-gray-900">Job</h3>
                        </div>
                        <Link
                            to={`/jobs/${application.job_id}`}
                            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <p className="text-lg font-semibold text-gray-900">View Job Details →</p>
                            <p className="text-sm text-gray-600 mt-1">ID: {application.job_id}</p>
                        </Link>
                    </div>

                    {/* Cover Letter */}
                    {application.cover_letter && (
                        <div className="card">
                            <div className="flex items-center space-x-2 text-gray-600 mb-4">
                                <MessageSquare className="w-5 h-5" />
                                <h3 className="text-lg font-semibold text-gray-900">Cover Letter</h3>
                            </div>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="card">
                        <div className="flex items-center space-x-2 text-gray-600 mb-4">
                            <Clock className="w-5 h-5" />
                            <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(application.created_at), 'MMM d, yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(application.updated_at), 'MMM d, yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments & Scorecards Tabs */}
            <div className="card">
                <div className="flex border-b border-gray-200 mb-5 gap-1">
                    {(['details', 'comments', 'scorecards'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                                activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'comments' && <MessageSquare className="w-4 h-4" />}
                            {tab === 'scorecards' && <ClipboardList className="w-4 h-4" />}
                            {tab === 'details' && <User className="w-4 h-4" />}
                            <span className="capitalize">{tab}</span>
                            {tab === 'comments' && comments.length > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{comments.length}</span>
                            )}
                            {tab === 'scorecards' && scorecards.length > 0 && (
                                <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">{scorecards.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'details' && (
                    <p className="text-sm text-gray-500">Full application details shown above.</p>
                )}

                {activeTab === 'comments' && (
                    <div>
                        <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                            {comments.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No internal comments yet. Add one below.</p>
                                </div>
                            ) : (
                                comments.map((c: any) => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                                            {(c.author_name || c.author_email || 'U').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-gray-900">{c.author_name || c.author_email}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">{c.created_at ? format(new Date(c.created_at), 'MMM d, HH:mm') : ''}</span>
                                                    {(user?.id === c.user_id) && (
                                                        <button onClick={() => handleDeleteComment(c.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={commentEndRef} />
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                                placeholder="Add internal comment..."
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={commentLoading || !newComment.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'scorecards' && (
                    <div className="space-y-4">
                        {scorecards.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No scorecards submitted yet. Complete an interview to add one.</p>
                            </div>
                        ) : (
                            scorecards.map((sc: any) => {
                                const rec = RECOMMENDATION_LABELS[sc.recommendation] ?? { label: sc.recommendation, color: 'bg-gray-100 text-gray-700' };
                                return (
                                    <div key={sc.id} className="border border-gray-200 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <span className="font-semibold text-gray-900 text-sm">{sc.scorer_name}</span>
                                                <span className="text-gray-400 text-xs ml-2">{sc.created_at ? format(new Date(sc.created_at), 'MMM d, yyyy') : ''}</span>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rec.color}`}>{rec.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mb-3">
                                            {[1,2,3,4,5].map(s => (
                                                <Star key={s} className={`w-4 h-4 ${s <= sc.overall_rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                                            ))}
                                            <span className="text-sm text-gray-600 ml-1">{sc.overall_rating}/5</span>
                                        </div>
                                        {sc.criteria_scores && (
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {Object.entries(sc.criteria_scores).map(([k, v]: [string, any]) => (
                                                    <div key={k} className="text-xs">
                                                        <span className="text-gray-500 capitalize">{k.replace('_', ' ')}: </span>
                                                        <span className="font-medium text-gray-800">{v}/5</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {sc.strengths && <p className="text-xs text-green-700 mb-1"><strong>Strengths:</strong> {sc.strengths}</p>}
                                        {sc.concerns && <p className="text-xs text-red-700"><strong>Concerns:</strong> {sc.concerns}</p>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Action Modals */}
            {activeModal?.type === 'screen' && (
                <Modal title="Screen Application" onClose={() => setActiveModal(null)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Did the candidate pass screening?
                            </label>
                            <select
                                value={screenData.passed ? 'true' : 'false'}
                                onChange={(e) => setScreenData({ ...screenData, passed: e.target.value === 'true' })}
                                className="input"
                            >
                                <option value="true">Yes - Shortlist</option>
                                <option value="false">No - Reject</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Score (0-10)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={screenData.score}
                                onChange={(e) => setScreenData({ ...screenData, score: Number(e.target.value) })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (optional)
                            </label>
                            <textarea
                                value={screenData.notes}
                                onChange={(e) => setScreenData({ ...screenData, notes: e.target.value })}
                                rows={3}
                                className="input"
                            />
                        </div>
                        <button onClick={handleScreen} className="btn-primary w-full">
                            Submit Screening
                        </button>
                    </div>
                </Modal>
            )}

            {activeModal?.type === 'interview' && (
                <Modal title="Schedule Interview" onClose={() => setActiveModal(null)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Interview Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={interviewData.interview_time}
                                onChange={(e) => setInterviewData({ ...interviewData, interview_time: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (optional)
                            </label>
                            <textarea
                                value={interviewData.notes}
                                onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                                rows={3}
                                className="input"
                                placeholder="Meeting link, location, or special instructions..."
                            />
                        </div>
                        <button onClick={handleScheduleInterview} className="btn-primary w-full">
                            Schedule Interview
                        </button>
                    </div>
                </Modal>
            )}

            {activeModal?.type === 'complete_interview' && (
                <Modal title="Complete Interview" onClose={() => setActiveModal(null)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rating (1-5)
                            </label>
                            <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setCompleteInterviewData({ ...completeInterviewData, rating })}
                                        className="p-2"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${rating <= completeInterviewData.rating
                                                    ? 'text-yellow-500 fill-current'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Feedback
                            </label>
                            <textarea
                                value={completeInterviewData.feedback}
                                onChange={(e) => setCompleteInterviewData({ ...completeInterviewData, feedback: e.target.value })}
                                rows={4}
                                className="input"
                                placeholder="Interview notes and feedback..."
                            />
                        </div>
                        <button onClick={handleCompleteInterview} className="btn-primary w-full">
                            Complete Interview
                        </button>
                    </div>
                </Modal>
            )}

            {activeModal?.type === 'offer' && (
                <Modal title="Make Offer" onClose={() => setActiveModal(null)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Offer Amount (ZAR)
                            </label>
                            <input
                                type="number"
                                value={offerData.amount}
                                onChange={(e) => setOfferData({ ...offerData, amount: Number(e.target.value) })}
                                className="input"
                                placeholder="65000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (optional)
                            </label>
                            <textarea
                                value={offerData.notes}
                                onChange={(e) => setOfferData({ ...offerData, notes: e.target.value })}
                                rows={3}
                                className="input"
                                placeholder="Additional offer details..."
                            />
                        </div>
                        <button onClick={handleMakeOffer} className="btn-primary w-full">
                            Send Offer
                        </button>
                    </div>
                </Modal>
            )}

            {activeModal?.type === 'reject' && (
                <Modal title="Reject Application" onClose={() => setActiveModal(null)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason
                            </label>
                            <select
                                value={rejectData.reason}
                                onChange={(e) => setRejectData({ ...rejectData, reason: e.target.value as any })}
                                className="input"
                            >
                                <option value="">Select reason...</option>
                                <option value="not_qualified">Not Qualified</option>
                                <option value="better_candidate">Better Candidate Selected</option>
                                <option value="position_filled">Position Filled</option>
                                <option value="budget_constraints">Budget Constraints</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Notes (optional)
                            </label>
                            <textarea
                                value={rejectData.notes}
                                onChange={(e) => setRejectData({ ...rejectData, notes: e.target.value })}
                                rows={3}
                                className="input"
                            />
                        </div>
                        <button onClick={handleReject} className="btn-danger w-full">
                            Reject Application
                        </button>
                    </div>
                </Modal>
            )}

            {activeModal?.type === 'hire' && (
                <Modal title="Confirm Hire" onClose={() => setActiveModal(null)}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <Award className="w-5 h-5 text-green-600 shrink-0" />
                            <p className="text-sm text-green-800">
                                You are about to mark this candidate as <strong>Hired</strong>. This will finalise the application and record them as a placed candidate.
                            </p>
                        </div>
                        <button
                            onClick={handleHire}
                            disabled={hireMutation.isPending}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Award className="w-4 h-4" />
                            {hireMutation.isPending ? 'Processing...' : 'Yes, Hire Candidate'}
                        </button>
                    </div>
                </Modal>
            )}

            <EmailCandidateModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                candidateId={application.candidate_id}
                candidateName={application.candidate_name || "Candidate"}
            />
        </div>
    );
}

// Modal component
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                {children}
                <button
                    onClick={onClose}
                    className="mt-4 w-full btn-secondary"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
