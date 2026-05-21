import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicationsService } from '@/services/applications';
import { ApplicationStatus } from '@/types/api';
import { ArrowLeft, User, Star } from 'lucide-react';
import { format } from 'date-fns';

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

const MOCK_PIPELINE = {
    job_id: 'mock-id',
    job_title: 'Senior Software Engineer',
    total_applications: 5,
    stages: [
        {
            status: 'applied',
            count: 2,
            applications: [
                { id: 'app1', candidate_name: 'Sizwe Khoza', match_score: 98, created_at: new Date().toISOString() },
                { id: 'app2', candidate_name: 'Lerato Mokoena', match_score: 85, created_at: new Date().toISOString() }
            ]
        },
        {
            status: 'screening',
            count: 0,
            applications: []
        },
        {
            status: 'shortlisted',
            count: 1,
            applications: [
                { id: 'app3', candidate_name: 'David Smith', match_score: 92, created_at: new Date().toISOString() }
            ]
        },
        {
            status: 'interview_scheduled',
            count: 1,
            applications: [
                { id: 'app4', candidate_name: 'Emma Wilson', match_score: 88, created_at: new Date().toISOString() }
            ]
        },
        {
            status: 'offer_pending',
            count: 1,
            applications: [
                { id: 'app5', candidate_name: 'Alex Johnson', match_score: 95, created_at: new Date().toISOString() }
            ]
        },
        {
            status: 'rejected',
            count: 0,
            applications: []
        },
        {
            status: 'withdrawn',
            count: 0,
            applications: []
        }
    ]
};

export default function KanbanBoardPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();

    const isMockJob = jobId?.startsWith('123e4567');

    const { data: pipeline, isLoading } = useQuery({
        queryKey: ['pipeline', jobId],
        queryFn: () => applicationsService.getPipeline(jobId!),
        enabled: !!jobId && !isMockJob,
    });

    const displayPipeline = isMockJob ? (MOCK_PIPELINE as any) : pipeline;

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

    // Main pipeline stages (exclude rejected/withdrawn)
    const mainStages = displayPipeline.stages.filter(
        (stage: any) => !['rejected', 'withdrawn'].includes(stage.status)
    );

    const rejectedStage = displayPipeline.stages.find((s: any) => s.status === 'rejected');
    const withdrawnStage = displayPipeline.stages.find((s: any) => s.status === 'withdrawn');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{displayPipeline.job_title}</h1>
                        <p className="text-gray-600 mt-1">
                            {displayPipeline.total_applications} total applications
                        </p>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto pb-6">
                <div className="inline-flex space-x-4 min-w-full">
                    {mainStages.map((stage: any) => (
                        <div key={stage.status} className="flex-shrink-0 w-80">
                            <div className={`rounded-lg border-2 ${statusColors[stage.status]} p-4`}>
                                {/* Stage header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">
                                        {statusLabels[stage.status]}
                                    </h3>
                                    <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                                        {stage.count}
                                    </span>
                                </div>

                                {/* Applications */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {stage.applications.map((app: any) => (
                                        <Link
                                            key={app.id}
                                            to={`/applications/${app.id}`}
                                            className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {app.candidate_name}
                                                    </p>
                                                    {app.match_score !== null && (
                                                        <div className="flex items-center space-x-1 mt-1">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                            <span className="text-sm text-gray-600">
                                                                {app.match_score}% match
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {format(new Date(app.created_at), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}

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
                            <h3 className="font-semibold text-red-600 mb-3">
                                Rejected ({rejectedStage.count})
                            </h3>
                             <div className="space-y-2">
                                 {rejectedStage.applications.slice(0, 5).map((app: any) => (
                                    <Link
                                        key={app.id}
                                        to={`/applications/${app.id}`}
                                        className="block text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        {app.candidate_name}
                                    </Link>
                                ))}
                                {rejectedStage.count > 5 && (
                                    <p className="text-xs text-gray-500">
                                        +{rejectedStage.count - 5} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {withdrawnStage && withdrawnStage.count > 0 && (
                        <div className="card">
                            <h3 className="font-semibold text-gray-600 mb-3">
                                Withdrawn ({withdrawnStage.count})
                            </h3>
                             <div className="space-y-2">
                                 {withdrawnStage.applications.slice(0, 5).map((app: any) => (
                                    <Link
                                        key={app.id}
                                        to={`/applications/${app.id}`}
                                        className="block text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        {app.candidate_name}
                                    </Link>
                                ))}
                                {withdrawnStage.count > 5 && (
                                    <p className="text-xs text-gray-500">
                                        +{withdrawnStage.count - 5} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
