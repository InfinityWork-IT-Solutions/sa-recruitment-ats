import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Briefcase, MapPin, DollarSign, Clock, Search, Filter,
    TrendingUp, Star, Calendar, FileText, LogOut, User, Settings
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function CandidateDashboard() {
    const { user, logout } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Mock data - replace with actual API calls
    const stats = {
        applications: 12,
        shortlisted: 3,
        interviews: 1,
        offers: 0,
    };

    const recommendedJobs = [
        {
            id: '1',
            title: 'Senior React Developer',
            company: 'Tech Company',
            location: 'Cape Town, Western Cape',
            employment_type: 'Full-time',
            salary_range: 'R600k - R800k',
            posted: '2 days ago',
            match_score: 95,
        },
        {
            id: '2',
            title: 'Full Stack Developer',
            company: 'Startup XYZ',
            location: 'Remote',
            employment_type: 'Full-time',
            salary_range: 'R500k - R700k',
            posted: '1 week ago',
            match_score: 92,
        },
        {
            id: '3',
            title: 'Frontend Engineer',
            company: 'Digital Agency',
            location: 'Johannesburg, Gauteng',
            employment_type: 'Contract',
            salary_range: 'R450k - R650k',
            posted: '3 days ago',
            match_score: 88,
        },
    ];

    const recentApplications = [
        {
            id: '1',
            job_title: 'Senior Developer',
            company: 'ABC Tech',
            applied_date: '2024-03-20',
            status: 'shortlisted',
            status_label: 'Shortlisted',
            status_color: 'bg-blue-100 text-blue-800',
        },
        {
            id: '2',
            job_title: 'Backend Engineer',
            company: 'Tech Corp',
            applied_date: '2024-03-18',
            status: 'interview_scheduled',
            status_label: 'Interview Scheduled',
            status_color: 'bg-purple-100 text-purple-800',
        },
        {
            id: '3',
            job_title: 'DevOps Engineer',
            company: 'Cloud Solutions',
            applied_date: '2024-03-15',
            status: 'under_review',
            status_label: 'Under Review',
            status_color: 'bg-yellow-100 text-yellow-800',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">RecruitPro SA</span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link
                                to="/candidate-profile"
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                                <User className="w-5 h-5" />
                                <span className="hidden md:inline">{user?.first_name} {user?.last_name}</span>
                            </Link>

                            <Link
                                to="/candidate-settings"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <Settings className="w-5 h-5" />
                            </Link>

                            <button
                                onClick={logout}
                                className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.first_name}! 👋
                    </h1>
                    <p className="text-gray-600">
                        Here's what's happening with your job search today
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.applications}</p>
                        <p className="text-sm text-gray-600">Applications Submitted</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Star className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.shortlisted}</p>
                        <p className="text-sm text-gray-600">Shortlisted</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.interviews}</p>
                        <p className="text-sm text-gray-600">Interviews Scheduled</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.offers}</p>
                        <p className="text-sm text-gray-600">Offers Pending</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Recommended Jobs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Search & Filter */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Find Your Next Role</h2>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search jobs by title, skills, or keywords..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <Filter className="w-5 h-5" />
                                    <span>Filters</span>
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {['all', 'full-time', 'contract', 'remote'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setSelectedFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFilter === filter
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recommended Jobs */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">🎯 Recommended for You</h2>

                            {recommendedJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                                            <p className="text-gray-600">{job.company}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                                            <span className="text-sm font-semibold">{job.match_score}% Match</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm">{job.location}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <Briefcase className="w-4 h-4" />
                                            <span className="text-sm">{job.employment_type}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-sm">{job.salary_range}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">Posted {job.posted}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                                            Apply Now
                                        </button>
                                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <Link
                                to="/browse-jobs"
                                className="block text-center py-4 text-green-600 hover:text-green-700 font-semibold"
                            >
                                View All Jobs →
                            </Link>
                        </div>
                    </div>

                    {/* Sidebar - Recent Applications */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Applications</h2>

                            <div className="space-y-4">
                                {recentApplications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                                    >
                                        <h4 className="font-semibold text-gray-900 mb-1">{app.job_title}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{app.company}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">{app.applied_date}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${app.status_color}`}>
                                                {app.status_label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link
                                to="/my-applications"
                                className="block text-center mt-4 py-2 text-green-600 hover:text-green-700 font-medium text-sm"
                            >
                                View All Applications →
                            </Link>
                        </div>

                        {/* Profile Completion */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                            <h3 className="font-bold text-gray-900 mb-2">Complete Your Profile</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Profiles with CVs get 3x more responses!
                            </p>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Profile Strength</span>
                                    <span className="font-semibold text-gray-900">65%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>

                            <Link
                                to="/candidate-profile"
                                className="block text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                            >
                                Upload CV & Complete Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
