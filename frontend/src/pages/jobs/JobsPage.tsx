import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useJobs, useCreateJob } from '@/hooks/use-jobs';
import { useAuthStore } from '@/store/auth';
import {
  Plus, Search, Briefcase, MapPin,
  Banknote, CalendarDays, Wifi, Users, Eye,
  X, Bookmark, BookmarkCheck, Filter, ChevronDown,
} from 'lucide-react';
import { JobStatus, EmploymentType } from '@/types/api';
import apiClient from '@/lib/api-client';
import PostJobModal from '@/components/modals/PostJobModalWithIntegrations';
import { useJobDraftRestore } from '@/hooks/useJobDraftRestore';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { useSavedJobs } from '@/hooks/use-saved-jobs';

const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
  freelance: 'Freelance',
};

const typeColors: Record<string, string> = {
  full_time: 'bg-blue-50 text-blue-700 border-blue-100',
  part_time: 'bg-purple-50 text-purple-700 border-purple-100',
  contract: 'bg-orange-50 text-orange-700 border-orange-100',
  temporary: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  internship: 'bg-green-50 text-green-700 border-green-100',
  freelance: 'bg-pink-50 text-pink-700 border-pink-100',
};

const statusColors: Record<JobStatus, string> = {
  draft: 'badge-gray',
  active: 'badge-green',
  paused: 'badge-yellow',
  closed: 'badge-gray',
  filled: 'badge-blue',
  expired: 'badge-red',
};

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('');

  // Candidate sidebar filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedArrangements, setSelectedArrangements] = useState<string[]>([]);
  const [datePosted, setDatePosted] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    jobType: true, workArrangement: true, salary: false, datePosted: false, location: false,
  });
  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const { user } = useAuthStore();
  const isCandidate = user?.role === 'candidate';

  const { data, isLoading } = useJobs({
    search,
    status: isCandidate ? 'active' : (statusFilter || ''),
    employment_type: isCandidate ? '' : employmentTypeFilter,
    limit: isCandidate ? 100 : 20,
  });

  const { savedIds, toggle: toggleSave } = useSavedJobs(isCandidate);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isCandidate || !data?.jobs?.length) return;
    const fetchScores = async () => {
      const results: Record<string, number> = {};
      await Promise.allSettled(
        data.jobs.slice(0, 10).map(async (job) => {
          try {
            const res = await apiClient.get(`/candidate-portal/match-score/${job.id}`);
            if (res.data?.score != null) results[job.id] = res.data.score;
          } catch { /* non-blocking */ }
        })
      );
      setMatchScores(results);
    };
    fetchScores();
  }, [isCandidate, data?.jobs]);

  const [showPostJobModal, setShowPostJobModal] = useState(false);
  useJobDraftRestore(() => setShowPostJobModal(true));
  const [integrations, setIntegrations] = useState({
    pnet: { connected: false, enabled: false },
    indeed: { connected: false, enabled: false },
    linkedin: { connected: false, enabled: false }
  });

  useEffect(() => {
    if (user?.role !== 'client') return;
    apiClient.get('/integrations').then((res) => {
      const statusMap = {
        pnet: { connected: false, enabled: false },
        indeed: { connected: false, enabled: false },
        linkedin: { connected: false, enabled: false }
      };
      (res.data || []).forEach((item: any) => {
        if (item.platform in statusMap) {
          statusMap[item.platform as keyof typeof statusMap] = { connected: item.connected, enabled: item.connected };
        }
      });
      setIntegrations(statusMap);
    }).catch(() => {});
  }, [user?.role]);

  const createJob = useCreateJob();

  const handleClientPostJob = async (modalData: any) => {
    try {
      const splitLines = (s: string) => (s || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
      await (createJob.mutateAsync as Function)({
        title: modalData.title,
        description: modalData.description,
        employment_type: modalData.job_type === 'full-time' ? 'full_time' : modalData.job_type === 'part-time' ? 'part_time' : modalData.job_type,
        location: modalData.location,
        city: modalData.location?.split(',')[0]?.trim() || modalData.location,
        province: modalData.location?.split(',')[1]?.trim() || 'Unspecified',
        requirements: splitLines(modalData.requirements),
        benefits: splitLines(modalData.benefits),
        salary_min: modalData.salary_min || null,
        salary_max: modalData.salary_max || null,
        show_salary: !!(modalData.salary_min || modalData.salary_max),
        is_remote: modalData.work_mode === 'remote',
        remote_type: modalData.work_mode,
        years_of_experience_min: modalData.experience_min,
        years_of_experience_max: modalData.experience_max,
        skills: modalData.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? [],
        post_to_pnet: modalData.post_to_pnet,
        post_to_indeed: modalData.post_to_indeed,
        post_to_linkedin: modalData.post_to_linkedin,
      });
      setShowPostJobModal(false);
    } catch {}
  };

  // Client-side filtering for candidate view
  const filteredJobs = useMemo(() => {
    if (!isCandidate || !data?.jobs) return data?.jobs ?? [];
    return data.jobs.filter(job => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(job.employment_type)) return false;
      if (selectedArrangements.length > 0) {
        const arr = (job as any).remote_type || (job.is_remote ? 'remote' : 'on_site');
        if (!selectedArrangements.includes(arr)) return false;
      }
      if (salaryMin && job.salary_max != null && job.salary_max < parseInt(salaryMin)) return false;
      if (salaryMax && job.salary_min != null && job.salary_min > parseInt(salaryMax)) return false;
      if (datePosted) {
        const diff = Date.now() - new Date(job.created_at).getTime();
        if (datePosted === 'day' && diff > 86400000) return false;
        if (datePosted === 'week' && diff > 604800000) return false;
        if (datePosted === 'month' && diff > 2592000000) return false;
      }
      if (locationFilter) {
        const loc = `${job.city ?? ''} ${job.province ?? ''} ${job.location ?? ''}`.toLowerCase();
        if (!loc.includes(locationFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [isCandidate, data?.jobs, selectedTypes, selectedArrangements, datePosted, locationFilter, salaryMin, salaryMax]);

  const toggleType = (type: string) =>
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const toggleArrangement = (arr: string) =>
    setSelectedArrangements(prev => prev.includes(arr) ? prev.filter(a => a !== arr) : [...prev, arr]);

  const clearCandidateFilters = () => {
    setSelectedTypes([]); setSelectedArrangements([]);
    setDatePosted(''); setLocationFilter('');
    setSalaryMin(''); setSalaryMax('');
  };

  const activeFiltersCount = isCandidate
    ? [...selectedTypes, ...selectedArrangements, datePosted, locationFilter, salaryMin, salaryMax].filter(Boolean).length
    : [statusFilter, employmentTypeFilter].filter(Boolean).length;

  /* ─── CANDIDATE VIEW ─────────────────────────────────────── */
  if (isCandidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero search bar */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-1">Find Your Next Opportunity</h1>
            <p className="text-blue-200 mb-6 text-sm">Browse {data?.total ?? '...'} jobs across South Africa</p>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Job title, skills, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-0 shadow-sm text-sm focus:ring-2 focus:ring-blue-300 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Content: sidebar + job list */}
        <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6 items-start">

          {/* Filter Sidebar */}
          <aside className="w-60 flex-shrink-0 sticky top-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" /> Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <button onClick={clearCandidateFilters} className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear ({activeFiltersCount})
                  </button>
                )}
              </div>

              {/* Job Type */}
              <div>
                <button
                  onClick={() => toggleSection('jobType')}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                    Job Type {selectedTypes.length > 0 && <span className="ml-1 text-blue-500">({selectedTypes.length})</span>}
                  </h4>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${openSections.jobType ? 'rotate-180' : ''}`} />
                </button>
                {openSections.jobType && (
                  <div className="mt-2 mb-3 space-y-2">
                    {(Object.entries(employmentTypeLabels) as [EmploymentType, string][]).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(value)}
                          onChange={() => toggleType(value)}
                          className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                        {selectedTypes.includes(value) && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Work Arrangement */}
              <div>
                <button
                  onClick={() => toggleSection('workArrangement')}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                    Work Arrangement {selectedArrangements.length > 0 && <span className="ml-1 text-blue-500">({selectedArrangements.length})</span>}
                  </h4>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${openSections.workArrangement ? 'rotate-180' : ''}`} />
                </button>
                {openSections.workArrangement && (
                  <div className="mt-2 mb-3 space-y-2">
                    {[
                      { value: 'remote', label: 'Remote', icon: '🌐' },
                      { value: 'hybrid', label: 'Hybrid', icon: '🏠' },
                      { value: 'on_site', label: 'On-site', icon: '🏢' },
                    ].map(({ value, label, icon }) => (
                      <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedArrangements.includes(value)}
                          onChange={() => toggleArrangement(value)}
                          className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{icon} {label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Salary Range */}
              <div>
                <button
                  onClick={() => toggleSection('salary')}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                    Salary Range (ZAR) {(salaryMin || salaryMax) && <span className="ml-1 text-blue-500">●</span>}
                  </h4>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${openSections.salary ? 'rotate-180' : ''}`} />
                </button>
                {openSections.salary && (
                  <div className="mt-2 mb-3 flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Date Posted */}
              <div>
                <button
                  onClick={() => toggleSection('datePosted')}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                    Date Posted {datePosted && <span className="ml-1 text-blue-500">●</span>}
                  </h4>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${openSections.datePosted ? 'rotate-180' : ''}`} />
                </button>
                {openSections.datePosted && (
                  <div className="mt-2 mb-3 space-y-2">
                    {[
                      { value: '', label: 'Any time' },
                      { value: 'day', label: 'Past 24 hours' },
                      { value: 'week', label: 'Past week' },
                      { value: 'month', label: 'Past month' },
                    ].map(({ value, label }) => (
                      <label key={value || 'any'} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio"
                          name="datePosted"
                          value={value}
                          checked={datePosted === value}
                          onChange={() => setDatePosted(value)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Location */}
              <div>
                <button
                  onClick={() => toggleSection('location')}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                    Location {locationFilter && <span className="ml-1 text-blue-500">●</span>}
                  </h4>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${openSections.location ? 'rotate-180' : ''}`} />
                </button>
                {openSections.location && (
                  <div className="mt-2 relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="City or province"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Job List */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : !filteredJobs.length ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No jobs match your search</p>
                <p className="text-sm text-gray-400 mt-1">Try different keywords or clear your filters</p>
                {activeFiltersCount > 0 && (
                  <button onClick={clearCandidateFilters} className="mt-3 text-xs text-blue-600 font-semibold hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Showing <span className="font-semibold text-gray-700">{filteredJobs.length}</span> of{' '}
                  <span className="font-semibold text-gray-700">{data?.total}</span> jobs
                </p>
                <div className="space-y-3">
                  {filteredJobs.map((job) => {
                    const isClosingSoon = job.closing_date && !isPast(new Date(job.closing_date)) &&
                      new Date(job.closing_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                    const isClosed = job.closing_date && isPast(new Date(job.closing_date));

                    return (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="group block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {job.title.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-[15px] leading-snug">
                                {job.title}
                              </h3>
                              {isClosingSoon && !isClosed && (
                                <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                                  Closing soon
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location || `${job.city || ''}${job.province ? ', ' + job.province : ''}`}
                              </span>
                              {job.is_remote && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Wifi className="w-3 h-3" />
                                  Remote
                                </span>
                              )}
                              {(job.salary_min || job.salary_max) && (
                                <span className="flex items-center gap-1">
                                  <Banknote className="w-3 h-3" />
                                  {job.salary_currency || 'ZAR'} {job.salary_min?.toLocaleString() || '0'}
                                  {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : '+'}
                                </span>
                              )}
                              {job.closing_date && (
                                <span className={`flex items-center gap-1 ${isClosed ? 'text-red-500' : isClosingSoon ? 'text-orange-500' : ''}`}>
                                  <CalendarDays className="w-3 h-3" />
                                  {isClosed ? 'Closed' : `Closes ${format(new Date(job.closing_date), 'dd MMM yyyy')}`}
                                </span>
                              )}
                            </div>

                            {job.description && (
                              <p className="text-xs text-gray-500 leading-relaxed mb-2.5 line-clamp-2">
                                {job.description.slice(0, 200)}{job.description.length > 200 ? '…' : ''}
                              </p>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${typeColors[job.employment_type] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                {employmentTypeLabels[job.employment_type]}
                              </span>
                              {job.skills?.filter((s: string) => s.trim()).slice(0, 5).map((skill: string) => (
                                <span key={skill} className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                  {skill}
                                </span>
                              ))}
                              {(job.skills?.length ?? 0) > 5 && (
                                <span className="text-[10px] text-gray-400 font-medium">+{(job.skills?.length ?? 0) - 5} more</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => { e.preventDefault(); toggleSave(job.id); }}
                              className={`p-1.5 rounded-lg transition-colors ${savedIds.has(job.id) ? 'text-purple-600 bg-purple-50' : 'text-gray-300 hover:text-purple-500 hover:bg-purple-50'}`}
                              title={savedIds.has(job.id) ? 'Remove from saved' : 'Save job'}
                            >
                              {savedIds.has(job.id)
                                ? <BookmarkCheck className="w-4 h-4" />
                                : <Bookmark className="w-4 h-4" />
                              }
                            </button>
                            {matchScores[job.id] != null && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${matchScores[job.id] >= 75 ? 'bg-green-100 text-green-700' : matchScores[job.id] >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                                {matchScores[job.id]}% match
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── RECRUITER / ADMIN VIEW ─────────────────────────────── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">Manage your job postings</p>
        </div>
        {user?.role === 'client' ? (
          <button onClick={() => setShowPostJobModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Post New Job (AI Agent)</span>
          </button>
        ) : (
          <Link to="/jobs/create" className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </Link>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
          <select value={employmentTypeFilter} onChange={(e) => setEmploymentTypeFilter(e.target.value)} className="input">
            <option value="">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : !data?.jobs?.length ? (
        <div className="card text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-6">Get started by posting your first job.</p>
          {user?.role === 'client' ? (
            <button onClick={() => setShowPostJobModal(true)} className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" /><span>Post New Job</span>
            </button>
          ) : (
            <Link to="/jobs/create" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" /><span>Post New Job</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data.jobs.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="card hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <span className={`badge ${statusColors[job.status.toLowerCase() as JobStatus] || 'badge-gray'}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{employmentTypeLabels[job.employment_type]}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                    {(job.salary_min || job.salary_max) && (
                      <span className="flex items-center gap-1">
                        <Banknote className="w-4 h-4" />
                        {job.salary_currency || 'ZAR'} {job.salary_min?.toLocaleString() || '0'}
                        {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                      </span>
                    )}
                    {job.closing_date && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <CalendarDays className="w-4 h-4" />
                        Closes {format(new Date(job.closing_date), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.filter(s => s.trim()).slice(0, 5).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100">{skill}</span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-bold uppercase border border-gray-100">+{job.skills.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2 ml-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1"><Users className="w-4 h-4" /><span>{Number(job.applications_count) || 0}</span></span>
                    <span className="flex items-center space-x-1"><Eye className="w-4 h-4" /><span>{Number(job.views_count) || 0}</span></span>
                  </div>
                  <span className="text-xs text-gray-500">Ref: {job.reference}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {data.jobs?.length || 0} of {Number(data.total) || 0} jobs
        </div>
      )}

      <PostJobModal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
        onSubmit={handleClientPostJob}
        integrations={integrations}
      />
    </div>
  );
}
