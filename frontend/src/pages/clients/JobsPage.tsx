import { useState, useEffect } from 'react';
import {
  Search, Plus, Briefcase, MapPin, Users, TrendingUp, Eye,
  Edit, Copy, Trash2, Pause, Play, DollarSign,
  Calendar, CheckCircle, X, LayoutTemplate
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PostJobModal from '@/components/modals/PostJobModalWithIntegrations';
import apiClient from '@/lib/api-client';
import EditJobModal from '@/components/modals/EditJobModal';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
  work_mode: 'remote' | 'hybrid' | 'on-site';
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_min: number;
  salary_max: number;
  description: string;
  skills: string[];
  status: 'active' | 'paused' | 'closed' | 'draft';
  applicants_count: number;
  matches_count: number;
  views_count: number;
  posted_date: string;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [integrations, setIntegrations] = useState({
    pnet: { connected: false, enabled: false },
    indeed: { connected: false, enabled: false },
    linkedin: { connected: false, enabled: false }
  });

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await apiClient.get('/integrations');
        const data = response.data || [];
        const statusMap = {
          pnet: { connected: false, enabled: false },
          indeed: { connected: false, enabled: false },
          linkedin: { connected: false, enabled: false }
        };
        
        data.forEach((item: any) => {
          if (item.platform in statusMap) {
            statusMap[item.platform as keyof typeof statusMap] = {
              connected: item.connected,
              enabled: item.connected
            };
          }
        });
        
        setIntegrations(statusMap);
      } catch (error) {
        console.error('Error fetching integrations:', error);
      }
    };
    
    fetchIntegrations();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchQuery, statusFilter, typeFilter]);

  const fetchJobs = async () => {
    try {
      const response = await apiClient.get('/jobs');
      // Backend returns a list directly or in a results/jobs field
      const data = response.data;
      const jobList = Array.isArray(data) ? data : (data.jobs || data.results || []);
      setJobs(jobList.length > 0 ? jobList : mockJobs);
      setFilteredJobs(jobList.length > 0 ? jobList : mockJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs(mockJobs);
      setFilteredJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(j =>
        (j.title || '').toLowerCase().includes(query) ||
        (j.location || '').toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(j => j.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(j => j.job_type === typeFilter);
    }

    setFilteredJobs(filtered);
  };

  const handlePostJob = async (data: any) => {
    try {
      // Map frontend modal data to API schema
      const apiData = {
        ...data,
        experience_level: data.experience_min >= 6 ? 'senior_level' : data.experience_min >= 3 ? 'mid_level' : 'entry_level',
        years_of_experience_min: data.experience_min,
        years_of_experience_max: data.experience_max,
        is_remote: data.work_mode === 'remote',
        remote_type: data.work_mode,
        skills: data.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
        employment_type: data.job_type.replace('-', '_'),
        show_salary: true
      };

      const response = await apiClient.post('/jobs', apiData);
      const newJob = response.data;
      setJobs([newJob, ...jobs]);
      setShowPostModal(false);
      alert('Job posted successfully across selected platforms!');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    }
  };

  const handleEditJob = async (data: any) => {
    try {
      const response = await apiClient.put(`/jobs/${selectedJob?.id}`, data);
      const updatedJob = response.data;
      setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
      setShowEditModal(false);
      alert('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    }
  };

  const handleDuplicateJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      const duplicateData = {
        ...job,
        title: `${job.title} (Copy)`,
        status: 'draft',
      };
      delete (duplicateData as any).id;

      const response = await apiClient.post('/jobs', duplicateData);
      const newJob = response.data;
      setJobs([newJob, ...jobs]);
      alert('Job duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating job:', error);
      alert('Failed to duplicate job. Please try again.');
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      await apiClient.delete(`/jobs/${jobToDelete}`);
      setJobs(jobs.filter(j => j.id !== jobToDelete));
      setShowDeleteConfirm(false);
      setJobToDelete(null);
      alert('Job deleted successfully!');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/jobs/${jobId}/status`, { status: newStatus });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus as any } : j));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      closed: 'bg-red-100 text-red-700',
      draft: 'bg-gray-100 text-gray-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusAction = (status: string) => {
    if (status === 'active') return { label: 'Pause', newStatus: 'paused', icon: Pause };
    if (status === 'paused') return { label: 'Activate', newStatus: 'active', icon: Play };
    if (status === 'draft') return { label: 'Publish', newStatus: 'active', icon: CheckCircle };
    return { label: 'Close', newStatus: 'closed', icon: X };
  };

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    applicants: jobs.reduce((sum, j) => sum + j.applicants_count, 0),
    topMatches: jobs.reduce((sum, j) => sum + j.matches_count, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
              <p className="text-gray-600 mt-1">Manage your job postings</p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Post New Job</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs by title or location..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Jobs</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <Play className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Active Jobs</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Total Applicants</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.applicants}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Top Matches</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.topMatches}</div>
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {jobs.length === 0 ? 'No jobs posted yet' : 'No jobs found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {jobs.length === 0
                ? 'Get started by posting your first job.'
                : 'Try adjusting your filters or search criteria.'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => setShowPostModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Post New Job</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const statusAction = getStatusAction(job.status);
              const StatusActionIcon = statusAction.icon;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{job.location || 'Remote'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="capitalize">{(job.job_type || 'full-time').replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span>R{((job.salary_min || 0) / 1000).toFixed(0)}k - R{((job.salary_max || 0) / 1000).toFixed(0)}k</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Posted {job.posted_date || 'Recently'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <strong className="text-gray-900">{job.applicants_count}</strong> applicants
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          <strong className="text-green-600">{job.matches_count}</strong> top matches
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <strong className="text-gray-900">{job.views_count}</strong> views
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/jobs/${job.id}/kanban`}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-all flex items-center space-x-2"
                        >
                          <LayoutTemplate className="w-4 h-4" />
                          <span>Pipeline</span>
                        </Link>

                        <button
                          onClick={() => handleStatusChange(job.id, statusAction.newStatus)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${statusAction.newStatus === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : statusAction.newStatus === 'paused'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          <StatusActionIcon className="w-4 h-4" />
                          <span>{statusAction.label}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setShowEditModal(true);
                          }}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDuplicateJob(job.id)}
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all flex items-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate</span>
                        </button>

                        <button
                          onClick={() => {
                            setJobToDelete(job.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <PostJobModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSubmit={handlePostJob}
        integrations={integrations}
      />

      {selectedJob && (
        <EditJobModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedJob(null);
          }}
          onSubmit={handleEditJob}
          job={selectedJob}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Job?</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job? This action cannot be undone and all applications will be lost.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setJobToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company_name: 'TechCorp',
    location: 'Cape Town, Western Cape',
    work_mode: 'hybrid',
    job_type: 'full-time',
    salary_min: 400000,
    salary_max: 650000,
    description: 'We are looking for...',
    skills: ['React', 'TypeScript', 'Node.js'],
    status: 'active',
    applicants_count: 23,
    matches_count: 5,
    views_count: 156,
    posted_date: '3 days ago',
    created_at: '2026-03-29',
  },
  {
    id: '2',
    title: 'DevOps Engineer',
    company_name: 'TechCorp',
    location: 'Johannesburg, Gauteng',
    work_mode: 'remote',
    job_type: 'full-time',
    salary_min: 500000,
    salary_max: 750000,
    description: 'We are looking for...',
    skills: ['AWS', 'Docker', 'Kubernetes'],
    status: 'active',
    applicants_count: 15,
    matches_count: 3,
    views_count: 98,
    posted_date: '1 week ago',
    created_at: '2026-03-25',
  },
  {
    id: '3',
    title: 'Product Manager',
    company_name: 'TechCorp',
    location: 'Remote',
    work_mode: 'remote',
    job_type: 'full-time',
    salary_min: 550000,
    salary_max: 800000,
    description: 'We are looking for...',
    skills: ['Product Management', 'Agile', 'User Research'],
    status: 'paused',
    applicants_count: 10,
    matches_count: 4,
    views_count: 67,
    posted_date: '2 weeks ago',
    created_at: '2026-03-18',
  },
];
