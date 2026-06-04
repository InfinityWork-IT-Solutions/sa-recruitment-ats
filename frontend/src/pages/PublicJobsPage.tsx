import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase, MapPin, Calendar, Clock, Search,
    Filter, ChevronRight, Building2, DollarSign,
    TrendingUp, Heart, ExternalLink, ArrowLeft
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface Job {
    id: string;
    title: string;
    company_name: string;
    location: string;
    salary_range: string;
    job_type: string; // Full-time, Part-time, Contract
    category: string; // IT, Health, Marketing, Finance, HR, etc.
    description: string;
    closing_date: string;
    posted_date: string;
    requirements: string[];
}

const CATEGORIES = [
    { id: 'all', name: 'All Jobs', icon: '🌐' },
    { id: 'it', name: 'IT & Technology', icon: '💻' },
    { id: 'health', name: 'Healthcare', icon: '🏥' },
    { id: 'marketing', name: 'Marketing & Sales', icon: '📈' },
    { id: 'finance', name: 'Finance & Accounting', icon: '💰' },
    { id: 'hr', name: 'Human Resources', icon: '👥' },
    { id: 'engineering', name: 'Engineering', icon: '⚙️' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'hospitality', name: 'Hospitality', icon: '🏨' },
    { id: 'retail', name: 'Retail', icon: '🛍️' },
    { id: 'legal', name: 'Legal', icon: '⚖️' },
    { id: 'other', name: 'Other', icon: '📋' }
];

export default function PublicJobsPage() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [savedJobs, setSavedJobs] = useState<string[]>([]);

    useEffect(() => {
        fetchJobs();
    }, [selectedCategory]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/jobs/public', {
                params: selectedCategory !== 'all' ? { category: selectedCategory } : {}
            });
            setJobs(response.data.jobs || []);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getDaysUntilClosing = (closingDate: string) => {
        const days = Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return 'Closed';
        if (days === 0) return 'Closes today';
        if (days === 1) return '1 day left';
        if (days <= 7) return `${days} days left`;
        return new Date(closingDate).toLocaleDateString();
    };

    const toggleSaveJob = (jobId: string) => {
        setSavedJobs(prev =>
            prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Home</span>
                        </button>
                        
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/login?type=candidate')}
                                className="text-gray-600 hover:text-blue-600 font-medium"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/register?type=candidate')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium"
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Browse Available Jobs
                    </h1>
                    <p className="text-lg text-gray-600">
                        Explore {jobs.length}+ opportunities across all industries
                    </p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by job title, company, or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Filter by Category</h2>
                    </div>
                    <div className="flex overflow-x-auto pb-4 space-x-3 scrollbar-hide">
                        {CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                                    selectedCategory === category.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <span className="text-xl">{category.icon}</span>
                                <span>{category.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Jobs Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl">
                        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredJobs.map(job => (
                            <div
                                key={job.id}
                                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 p-6 cursor-pointer group"
                                onClick={() => navigate(`/job-board/${job.id}`)}
                            >
                                {/* Job Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-2xl">
                                                {CATEGORIES.find(c => c.id === job.category)?.icon || '📋'}
                                            </span>
                                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                {job.category.toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {job.title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSaveJob(job.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Heart
                                            className={`w-5 h-5 ${savedJobs.includes(job.id) ? 'fill-red-500 text-red-500' : ''}`}
                                        />
                                    </button>
                                </div>

                                {/* Company */}
                                <div className="flex items-center space-x-2 text-gray-600 mb-3">
                                    <Building2 className="w-4 h-4" />
                                    <span className="font-medium">{job.company_name}</span>
                                </div>

                                {/* Location */}
                                <div className="flex items-center space-x-2 text-gray-600 mb-3">
                                    <MapPin className="w-4 h-4" />
                                    <span>{job.location}</span>
                                </div>

                                {/* Salary */}
                                {job.salary_range && (
                                    <div className="flex items-center space-x-2 text-gray-600 mb-4">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="font-semibold text-gray-900">{job.salary_range}</span>
                                    </div>
                                )}

                                {/* Description Preview */}
                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                    {job.description}
                                </p>

                                {/* Job Type Badge */}
                                <div className="flex items-center space-x-2 mb-4">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                        {job.job_type}
                                    </span>
                                </div>

                                {/* Closing Date */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center space-x-2 text-gray-500 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>{getDaysUntilClosing(job.closing_date)}</span>
                                    </div>
                                    <button className="flex items-center space-x-1 text-blue-600 font-semibold text-sm group-hover:space-x-2 transition-all">
                                        <span>View Details</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky Apply CTA (shown when scrolling) */}
            {filteredJobs.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-30">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Found your perfect job?</p>
                            <p className="font-semibold text-gray-900">Create an account to apply</p>
                        </div>
                        <button
                            onClick={() => navigate('/register?type=candidate')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
                        >
                            Register & Apply Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
