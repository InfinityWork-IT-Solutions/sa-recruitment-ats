import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicationsService } from '@/services/applications';
import { ApplicationStatus } from '@/types/api';
import { ArrowLeft, User, Star, CheckSquare, Square, X, ChevronDown, Mail, XCircle, MoveRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

const statusLabels: Record<ApplicationStatus, string> = {
    applied: 'Applied',
    screening: 'Screening',
    shortlisted: 'Shortlisted',
    interview_scheduled: 'Interview',
    interviewed: 'Interviewed',
    offer_pending: 'Offer Pending',
    offer_made: 'Offer Made',
    offer_accepted: 'Accepted',
    hired: 'Hired',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
};

const statusColors: Record<ApplicationStatus, string> = {
    applied: 'bg-gray-100 border-gray-300',
    screening: 'bg-blue-50 border-blue-300',
    shortlisted: 'bg-purple-50 border-purple-300',
    interview_scheduled: 'bg-yellow-50 border-yellow-300',
    interviewed: 'bg-orange-50 border-orange-300',
    offer_pending: 'bg-indigo-50 border-indigo-300',
    offer_made: 'bg-pink-50 border-pink-300',
    offer_accepted: 'bg-green-50 border-green-300',
    hired: 'bg-green-100 border-green-400',
    rejected: 'bg-red-50 border-red-300',
    withdrawn: 'bg-gray-50 border-gray-300',
};

const MOVEABLE_STATUSES: ApplicationStatus[] = [
    'applied', 'screening', 'shortlisted', 'interview_scheduled',
    'interviewed', 'offer_pending', 'offer_made', 'offer_accepted', 'hired',
];

const MOCK_PIPELINE = {
    job_id: 'mock-id',
    job_title: 'Senior Software Engineer',
    total_applications: 5,
    stages: [
        { status: 'applied', count: 2, applications: [
            { id: 'app1', candidate_name: 'Sizwe Khoza', match_score: 98, created_at: new Date().toISOString() },
            { id: 'app2', candidate_name: 'Lerato Mokoena', match_score: 85, created_at: new Date().toISOString() },
        ]},
        { status: 'screening', count: 0, applications: [] },
        { status: 'shortlisted', count: 1, applications: [
            { id: 'app3', candidate_name: 'David Smith', match_score: 92, created_at: new Date().toISOString() },
        ]},
        { status: 'interview_scheduled', count: 1, applications: [
            { id: 'app4', candidate_name: 'Emma Wilson', match_score: 88, created_at: new Date().toISOString() },
        ]},
        { status: 'offer_pending', count: 1, applications: [
            { id: 'app5', candidate_name: 'Alex Johnson', match_score: 95, created_at: new Date().toISOString() },
        ]},
        { status: 'rejected', count: 0, applications: [] },
        { status: 'withdrawn', count: 0, applications: [] },
    ],
};

export default function KanbanBoardPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const isMockJob = jobId?.startsWith('123e4567');

    const { data: pipeline, isLoading } = useQuery({
        queryKey: ['pipeline', jobId],
        queryFn: () => applicationsService.getPipeline(jobId!),
        enabled: !!jobId && !isMockJob,
    });

    const displayPipeline = isMockJob ? (MOCK_PIPELINE as any) : pipeline;

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [showMoveMenu, setShowMoveMenu] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);

    const toggleSelect = (appId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(prev => {
            const next = new Set(prev);
            next.has(appId) ? next.delete(appId) : next.add(appId);
            return next;
        });
    };

    const selectAllInStage = (apps: any[], e: React.MouseEvent) => {
        e.stopPropagation();
        const ids = apps.map((a: any) => a.id);
        setSelected(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });
    };

    const clearSelection = () => setSelected(new Set());

    const handleBulkMove = async (newStatus: ApplicationStatus) => {
        setBulkLoading(true);
        setShowMoveMenu(false);
        try {
            await apiClient.post('/applications/bulk/move', {
                application_ids: Array.from(selected),
                new_status: newStatus,
            });
            toast.success(`Moved ${selected.size} candidate(s) to ${statusLabels[newStatus]}`);
            clearSelection();
            queryClient.invalidateQueries({ queryKey: ['pipeline', jobId] });
        } catch {
            toast.error('Failed to move candidates');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkReject = async () => {
        if (!confirm(`Reject ${selected.size} candidate(s)?`)) return;
        setBulkLoading(true);
        try {
            await apiClient.post('/applications/bulk/reject', {
                application_ids: Array.from(selected),
                reason: 'position_filled',
                send_email: true,
            });
            toast.success(`Rejected ${selected.size} candidate(s)`);
            clearSelection();
            queryClient.invalidateQueries({ queryKey: ['pipeline', jobId] });
        } catch {
            toast.error('Failed to reject candidates');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkEmail = async () => {
        const subject = prompt('Email subject:');
        if (!subject) return;
        const body = prompt('Email body:');
        if (!body) return;
        setBulkLoading(true);
        try {
            await apiClient.post('/applications/bulk/email', {
                application_ids: Array.from(selected),
                subject,
                body,
            });
            toast.success(`Email sent to ${selected.size} candidate(s)`);
            clearSelection();
        } catch {
            toast.error('Failed to send emails');
        } finally {
            setBulkLoading(false);
        }
    };

    if (isLoading && !isMockJob) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!displayPipeline) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Pipeline not found</h2>
                    <p className="text-gray-600">This job does not exist or has no pipeline data.</p>
                </div>
            </div>
        );
    }

    const mainStages = displayPipeline.stages.filter(
        (stage: any) => !['rejected', 'withdrawn'].includes(stage.status)
    );
    const rejectedStage = displayPipeline.stages.find((s: any) => s.status === 'rejected');
    const withdrawnStage = displayPipeline.stages.find((s: any) => s.status === 'withdrawn');

    return (
        <div className="space-y-6 pb-32">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{displayPipeline.job_title}</h1>
                        <p className="text-gray-600 mt-1">{displayPipeline.total_applications} total applications</p>
                    </div>
                </div>
                {selected.size > 0 && (
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {selected.size} selected
                    </span>
                )}
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto pb-6">
                <div className="inline-flex space-x-4 min-w-full">
                    {mainStages.map((stage: any) => (
                        <div key={stage.status} className="flex-shrink-0 w-80">
                            <div className={`rounded-lg border-2 ${statusColors[stage.status]} p-4`}>
                                {/* Stage header */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">{statusLabels[stage.status]}</h3>
                                    <div className="flex items-center gap-2">
                                        {stage.applications.length > 0 && (
                                            <button
                                                onClick={(e) => selectAllInStage(stage.applications, e)}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                All
                                            </button>
                                        )}
                                        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                                            {stage.count}
                                        </span>
                                    </div>
                                </div>

                                {/* Applications */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {stage.applications.map((app: any) => {
                                        const isSelected = selected.has(app.id);
                                        return (
                                            <div key={app.id} className="relative group">
                                                <Link
                                                    to={`/applications/${app.id}`}
                                                    className={`block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                                                        isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        {/* Checkbox */}
                                                        <button
                                                            onClick={(e) => toggleSelect(app.id, e)}
                                                            className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            {isSelected
                                                                ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                                                : <Square className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                                                            }
                                                        </button>
                                                        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-blue-100 flex items-center justify-center">
                                                            {app.candidate_photo
                                                                ? <img src={app.candidate_photo} alt={app.candidate_name || ''} className="w-full h-full object-cover" />
                                                                : <span className="text-xs font-bold text-blue-600">{app.candidate_name?.split(' ').map((n: string) => n[0]).join('') || '?'}</span>
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate text-sm">
                                                                {app.candidate_name}
                                                            </p>
                                                            {app.match_score !== null && (
                                                                <div className="flex items-center space-x-1 mt-1">
                                                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                    <span className="text-xs text-gray-600">
                                                                        {app.match_score}% match
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {format(new Date(app.created_at), 'MMM d, yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        );
                                    })}

                                    {stage.count === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            No applications in this stage
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rejected & Withdrawn (collapsed) */}
            {(rejectedStage || withdrawnStage) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rejectedStage && rejectedStage.count > 0 && (
                        <div className="card">
                            <h3 className="font-semibold text-red-600 mb-3">Rejected ({rejectedStage.count})</h3>
                            <div className="space-y-2">
                                {rejectedStage.applications.slice(0, 5).map((app: any) => (
                                    <Link key={app.id} to={`/applications/${app.id}`} className="block text-sm text-gray-600 hover:text-gray-900">
                                        {app.candidate_name}
                                    </Link>
                                ))}
                                {rejectedStage.count > 5 && (
                                    <p className="text-xs text-gray-500">+{rejectedStage.count - 5} more</p>
                                )}
                            </div>
                        </div>
                    )}
                    {withdrawnStage && withdrawnStage.count > 0 && (
                        <div className="card">
                            <h3 className="font-semibold text-gray-600 mb-3">Withdrawn ({withdrawnStage.count})</h3>
                            <div className="space-y-2">
                                {withdrawnStage.applications.slice(0, 5).map((app: any) => (
                                    <Link key={app.id} to={`/applications/${app.id}`} className="block text-sm text-gray-600 hover:text-gray-900">
                                        {app.candidate_name}
                                    </Link>
                                ))}
                                {withdrawnStage.count > 5 && (
                                    <p className="text-xs text-gray-500">+{withdrawnStage.count - 5} more</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sticky Bulk Action Bar */}
            {selected.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                    <span className="text-sm font-semibold">{selected.size} selected</span>
                    <div className="w-px h-5 bg-gray-600" />

                    {/* Move to Stage */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMoveMenu(v => !v)}
                            disabled={bulkLoading}
                            className="flex items-center gap-1.5 text-sm font-medium bg-white text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <MoveRight className="w-4 h-4" />
                            Move
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showMoveMenu && (
                            <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-48 z-10">
                                {MOVEABLE_STATUSES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleBulkMove(s)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        {statusLabels[s]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reject */}
                    <button
                        onClick={handleBulkReject}
                        disabled={bulkLoading}
                        className="flex items-center gap-1.5 text-sm font-medium bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <XCircle className="w-4 h-4" />
                        Reject
                    </button>

                    {/* Email */}
                    <button
                        onClick={handleBulkEmail}
                        disabled={bulkLoading}
                        className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Mail className="w-4 h-4" />
                        Email
                    </button>

                    <div className="w-px h-5 bg-gray-600" />

                    {/* Clear */}
                    <button onClick={clearSelection} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
