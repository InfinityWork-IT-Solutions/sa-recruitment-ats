import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Briefcase, MapPin, Users, TrendingUp, Eye,
  Edit, Copy, Trash2, Pause, Play, DollarSign,
  Calendar, CheckCircle, X, LayoutTemplate, Bookmark, BookmarkCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PostJobModal from '@/components/modals/PostJobModalWithIntegrations';
import { useJobDraftRestore } from '@/hooks/useJobDraftRestore';
import apiClient from '@/lib/api-client';
import EditJobModal from '@/components/modals/EditJobModal';
import toast from 'react-hot-toast';

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
  useJobDraftRestore(() => setShowPostModal(true));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Saved searches
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);
  const savedDropdownRef = useRef<HTMLDivElement>(null);

  const [integrations, setIntegrations] = useState({
    pnet: { connected: false, enabled: false },
    indeed: { connected: false, enabled: false },
    linkedin: { connected: false, enabled: false }
  });

  useEffect(() => {
    apiClient.get('/saved-searches?search_type=jobs')
      .then(r => setSavedSearches(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (savedDropdownRef.current && !savedDropdownRef.current.contains(e.target as Node))
        setShowSavedDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const saveCurrentSearch = async () => {
    const name = window.prompt('Name this saved search:');
    if (!name?.trim()) return;
    try {
      const res = await apiClient.post('/saved-searches', {
        name: name.trim(),
        search_type: 'jobs',
        filters: { searchQuery, statusFilter, typeFilter },
      });
      setSavedSearches(prev => [...prev, res.data]);
      toast.success('Search saved!');
    } catch {
      toast.error('Failed to save search');
    }
  };

  const loadSavedSearch = (s: any) => {
    const f = s.filters || {};
    setSearchQuery(f.searchQuery || '');
    setStatusFilter(f.statusFilter || 'all');
    setTypeFilter(f.typeFilter || 'all');
    setShowSavedDropdown(false);
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      await apiClient.delete(`/saved-searches/${id}`);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
      toast.success('Search deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

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
      const data = response.data;
      const jobList = Array.isArray(data) ? data : (data.jobs || data.results || []);
      setJobs(jobList);
      setFilteredJobs(jobList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
      setJobs([]);
      setFilteredJobs([]);
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
      const splitLines = (s: string) => (s || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
      const apiData = {
        ...data,
        closing_date: data.closing_date ? new Date(data.closing_date + 'T12:00:00').toISOString() : undefined,
        experience_level: data.experience_min >= 6 ? 'senior_level' : data.experience_min >= 3 ? 'mid_level' : 'entry_level',
        years_of_experience_min: data.experience_min,
        years_of_experience_max: data.experience_max,
        is_remote: data.work_mode === 'remote',
        remote_type: data.work_mode,
        skills: data.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? [],
        requirements: splitLines(data.requirements),
        benefits: splitLines(data.benefits),
        employment_type: data.job_type?.replace('-', '_') ?? 'full_time',
        salary_min: data.salary_min != null && data.salary_min !== '' ? Number(data.salary_min) : null,
        salary_max: data.salary_max != null && data.salary_max !== '' ? Number(data.salary_max) : null,
        show_salary: data.salary_min != null || data.salary_max != null,
      };

      const response = await apiClient.post('/jobs', apiData);
      const newJob = response.data;
      setJobs([newJob, ...jobs]);
      setShowPostModal(false);
      toast.success('Job posted successfully!');
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    }
  };

  const handleEditJob = async (data: any) => {
    try {
      const response = await apiClient.put(`/jobs/${selectedJob?.id}`, data);
      const updatedJob = response.data;
      setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
      setShowEditModal(false);
      toast.success('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job. Please try again.');
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
      toast.success('Job duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating job:', error);
      toast.error('Failed to duplicate job. Please try again.');
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      await apiClient.delete(`/jobs/${jobToDelete}`);
      setJobs(jobs.filter(j => j.id !== jobToDelete));
      setShowDeleteConfirm(false);
      setJobToDelete(null);
      toast.success('Job deleted successfully!');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job. Please try again.');
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      if (newStatus === 'active') {
        // publish (draft→active) or re-activate (paused→active)
        await apiClient.post(`/jobs/${jobId}/publish`);
      } else if (newStatus === 'closed') {
        await apiClient.post(`/jobs/${jobId}/close`, { status: 'closed', reason: 'Closed by recruiter' });
      } else if (newStatus === 'paused') {
        await apiClient.patch(`/jobs/${jobId}`, { status: 'paused' });
      }
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus as any } : j));
      const label = newStatus === 'active' ? 'published' : newStatus;
      toast.success(`Job ${label} successfully`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to update status. Please try again.';
      toast.error(msg);
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
    applicants: jobs.reduce((sum, j) => sum + (Number(j.applicants_count) || 0), 0),
    topMatches: jobs.reduce((sum, j) => sum + (Number(j.matches_count) || 0), 0),
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

            {/* Saved searches */}
            <div className="relative" ref={savedDropdownRef}>
              <button
                onClick={() => setShowSavedDropdown(v => !v)}
                className={`h-full px-4 py-3 border rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${savedSearches.length > 0 ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
              >
                {savedSearches.length > 0 ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {savedSearches.length > 0 ? `${savedSearches.length} Saved` : 'Save Search'}
              </button>
              {showSavedDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-30 py-1">
                  {savedSearches.length > 0 && (
                    <>
                      <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Saved Searches</p>
                      {savedSearches.map(s => (
                        <div key={s.id} className="flex items-center gap-1 px-3 py-2 hover:bg-gray-50">
                          <button onClick={() => loadSavedSearch(s)} className="flex-1 text-left text-sm text-gray-700 truncate">{s.name}</button>
                          <button onClick={() => deleteSavedSearch(s.id)} className="text-gray-300 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 mt-1" />
                    </>
                  )}
                  <button onClick={() => { saveCurrentSearch(); setShowSavedDropdown(false); }} className="w-full text-left px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />Save current search
                  </button>
                </div>
              )}
            </div>
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
                          <strong className="text-gray-900">{Number(job.applicants_count) || 0}</strong> applicants
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          <strong className="text-green-600">{Number(job.matches_count) || 0}</strong> top matches
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <strong className="text-gray-900">{Number(job.views_count) || 0}</strong> views
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
                          onClick={() => { setSelectedJob(job); setShowViewModal(true); }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>

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

      {/* Job View Modal */}
      {showViewModal && selectedJob && (
        <JobViewModal job={selectedJob} onClose={() => { setShowViewModal(false); setSelectedJob(null); }}
          onEdit={() => { setShowViewModal(false); setShowEditModal(true); }}
          onPublish={() => {
            // Read live status from the jobs array to avoid stale-closure bugs
            const liveStatus = jobs.find(j => j.id === selectedJob.id)?.status ?? selectedJob.status;
            const newStatus = liveStatus === 'draft' || liveStatus === 'paused' ? 'active' : 'paused';
            setShowViewModal(false);
            handleStatusChange(selectedJob.id, newStatus);
          }}
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

// ── Job View Modal ────────────────────────────────────────────────────────────

function JobViewModal({ job, onClose, onEdit, onPublish }: {
  job: any;
  onClose: () => void;
  onEdit: () => void;
  onPublish: () => void;
}) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    draft: 'bg-gray-100 text-gray-700',
    closed: 'bg-red-100 text-red-700',
  };

  const requirements = Array.isArray(job.requirements) ? job.requirements : [];
  const benefits     = Array.isArray(job.benefits)     ? job.benefits     : [];
  const skills       = Array.isArray(job.skills)       ? job.skills       : [];
  const closingDate  = job.closing_date ? new Date(job.closing_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const publishLabel = job.status === 'draft' ? 'Publish Now' : job.status === 'paused' ? 'Reactivate' : 'Pause';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</h4>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 flex items-start justify-between shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold">{job.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[job.status] || 'bg-gray-100 text-gray-700'}`}>
                {job.status}
              </span>
              {job.category && job.category !== 'other' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-900 text-blue-200 uppercase">
                  {job.category}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-300 mt-2">
              {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{(job.employment_type || job.job_type || 'Full-time').replace('_', ' ')}</span>
              {(job.salary_min || job.salary_max) && (
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />
                  R{((job.salary_min || 0) / 1000).toFixed(0)}k – R{((job.salary_max || 0) / 1000).toFixed(0)}k/mo
                </span>
              )}
              {closingDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Closes {closingDate}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Applicants', value: job.applicants_count || 0, color: 'text-blue-600' },
              { label: 'Top Matches', value: job.matches_count || 0, color: 'text-green-600' },
              { label: 'Views', value: job.views_count || 0, color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {job.description && (
            <Section title="Job Description">
              <p className="whitespace-pre-line">{job.description}</p>
            </Section>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <Section title="Requirements">
              <ul className="space-y-1.5">
                {requirements.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <Section title="Required Skills">
              <div className="flex flex-wrap gap-2 mt-1">
                {skills.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">{s}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <Section title="Benefits">
              <ul className="space-y-1.5">
                {benefits.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Experience */}
          {(job.years_of_experience_min != null || job.years_of_experience_max != null) && (
            <Section title="Experience Required">
              {job.years_of_experience_min ?? 0} – {job.years_of_experience_max ?? '∞'} years
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-all">
            Close
          </button>
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="px-5 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-all flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Job
            </button>
            {job.status !== 'closed' && (
              <button
                onClick={onPublish}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  job.status === 'paused' || job.status === 'draft'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                {job.status === 'draft' || job.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {publishLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
