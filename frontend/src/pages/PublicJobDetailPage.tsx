import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Briefcase, MapPin, Calendar, DollarSign, Building2, 
    ArrowLeft, Clock, CheckCircle, AlertCircle, Share2,
    Bookmark, ExternalLink, Users, TrendingUp
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface JobDetail {
    id: string;
    title: string;
    company_name: string;
    company_logo?: string;
    location: string;
    salary_range: string;
    job_type: string;
    category: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    qualifications: string[];
    benefits: string[];
    closing_date: string;
    posted_date: string;
    experience_level: string;
    positions_available: number;
}

export default function JobDetailPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/jobs/public/${jobId}`);
            setJob(response.data.job);
        } catch (error) {
            console.error('Failed to fetch job details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysUntilClosing = (closingDate: string) => {
        const days = Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return { text: 'Closed', color: 'text-red-600 bg-red-50' };
        if (days === 0) return { text: 'Closes today', color: 'text-orange-600 bg-orange-50' };
        if (days <= 7) return { text: `${days} days left`, color: 'text-orange-600 bg-orange-50' };
        return { text: new Date(closingDate).toLocaleDateString(), color: 'text-green-600 bg-green-50' };
    };

    const handleApply = () => {
        // Redirect to register with type=candidate parameter
        navigate(`/register?type=candidate&job=${jobId}`);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: job?.title || 'Job Opportunity',
                    text: `Check out this job: ${job?.title} at ${job?.company_name}`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h3>
                    <p className="text-gray-600 mb-6">This job posting may have been removed or closed.</p>
                    <button
                        onClick={() => navigate('/jobs')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                        Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    const closingInfo = getDaysUntilClosing(job.closing_date);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/jobs')}
                            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Jobs</span>
                        </button>
                        
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleShare}
                                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="font-medium">Share</span>
                            </button>
                            <button
                                onClick={() => setSaved(!saved)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                                    saved ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                                <span className="font-medium">{saved ? 'Saved' : 'Save'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Job Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${closingInfo.color}`}>
                                    {closingInfo.text}
                                </span>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                                    {job.category.toUpperCase()}
                                </span>
                            </div>
                            
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
                            
                            <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <Building2 className="w-5 h-5" />
                                    <span className="font-semibold">{job.company_name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <MapPin className="w-5 h-5" />
                                    <span>{job.location}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{job.job_type}</span>
                                </div>
                                {job.salary_range && (
                                    <div className="flex items-center space-x-2">
                                        <DollarSign className="w-5 h-5" />
                                        <span className="font-semibold text-gray-900">{job.salary_range}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{job.positions_available}</div>
                            <div className="text-sm text-gray-600">Positions</div>
                        </div>
                        <div className="text-center border-x border-gray-200">
                            <div className="text-2xl font-bold text-gray-900">{job.experience_level}</div>
                            <div className="text-sm text-gray-600">Experience</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {Math.ceil((new Date().getTime() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24))}d
                            </div>
                            <div className="text-sm text-gray-600">Posted</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Job Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
                            <div className="prose prose-sm max-w-none text-gray-600">
                                <p className="whitespace-pre-wrap">{job.description}</p>
                            </div>
                        </div>

                        {/* Responsibilities */}
                        {job.responsibilities && job.responsibilities.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Key Responsibilities</h2>
                                <ul className="space-y-3">
                                    {job.responsibilities.map((item, index) => (
                                        <li key={index} className="flex items-start space-x-3">
                                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                                <ul className="space-y-3">
                                    {job.requirements.map((item, index) => (
                                        <li key={index} className="flex items-start space-x-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Qualifications */}
                        {job.qualifications && job.qualifications.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Qualifications</h2>
                                <ul className="space-y-3">
                                    {job.qualifications.map((item, index) => (
                                        <li key={index} className="flex items-start space-x-3">
                                            <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Benefits */}
                        {job.benefits && job.benefits.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits & Perks</h2>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {job.benefits.map((item, index) => (
                                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700 text-sm font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Apply Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Ready to Apply?</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Closing Date</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(job.closing_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Positions</span>
                                    <span className="font-semibold text-gray-900">{job.positions_available} available</span>
                                </div>
                            </div>

                            <button
                                onClick={handleApply}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold shadow-md hover:shadow-lg transition-all mb-4"
                            >
                                Apply Now
                            </button>

                            <p className="text-xs text-gray-500 text-center mb-4">
                                You'll need to create a free account to apply
                            </p>

                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">What happens next?</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            1
                                        </div>
                                        <p className="text-sm text-gray-600">Create your free account</p>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            2
                                        </div>
                                        <p className="text-sm text-gray-600">Upload your CV and apply</p>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            3
                                        </div>
                                        <p className="text-sm text-gray-600">Track your application status</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
