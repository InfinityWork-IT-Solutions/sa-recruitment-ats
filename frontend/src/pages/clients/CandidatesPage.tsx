import { useState, useEffect } from 'react';
import {
  Search, Filter, Users, MapPin, Briefcase, Award, Mail,
  Phone, Linkedin, Calendar, DollarSign, Star, ChevronDown,
  X, Download, Eye, CheckCircle, ExternalLink, Clock, Bookmark, BookmarkCheck
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  location: string;
  city: string;
  province: string;
  skills: string[];
  experience_years: number;
  current_company: string;
  salary_expectation: number;
  availability: string;
  match_score?: number;
  education: string;
  linkedin_url?: string;
  resume_url?: string;
  profile_photo?: string | null;
  applied_jobs: number;
  last_active: string;
  status: 'new' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected';
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const navigate = useNavigate();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 20]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 2000000]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

  useEffect(() => {
    fetchCandidates();
    apiClient.get('/saved-searches?search_type=candidates').then(r => setSavedSearches(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchQuery, selectedSkills, selectedProvinces, experienceRange, salaryRange, selectedStatus, minMatchScore]);

  const fetchCandidates = async () => {
    try {
      const response = await apiClient.get('/candidates?limit=100');
      const data = response.data;
      const formatted = (data.candidates || []).map((c: any) => {
        const availabilityLabel = c.is_immediately_available
          ? 'Immediate'
          : c.notice_period_days
            ? `${c.notice_period_days} day notice`
            : 'Available';
        return {
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          email: c.email,
          phone: c.phone || '',
          title: c.current_job_title || 'Candidate',
          location: [c.city, c.province].filter(Boolean).join(', ') || 'South Africa',
          city: c.city || '',
          province: c.province || '',
          skills: c.skills || [],
          experience_years: c.years_of_experience || 0,
          current_company: c.current_company || '',
          salary_expectation: c.expected_salary_min || 0,
          availability: availabilityLabel,
          match_score: c.match_score ?? null,
          education: c.education_level || '',
          linkedin_url: c.linkedin_url || '',
          resume_url: c.resume_url || '',
          applied_jobs: c.applications_count || 0,
          last_active: c.last_active || 'Recently',
          status: (['new','shortlisted','interviewed','offered','rejected'].includes(c.ui_status)
            ? c.ui_status
            : 'new') as Candidate['status'],
          profile_photo: c.profile_photo || null,
        };
      });
      setCandidates(formatted);
      setFilteredCandidates(formatted);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
      setFilteredCandidates([]);
      toast.error('Failed to load candidates. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...candidates];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.skills.some(s => s.toLowerCase().includes(query)) ||
        c.location.toLowerCase().includes(query)
      );
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(c =>
        selectedSkills.every(skill =>
          c.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    // Province filter
    if (selectedProvinces.length > 0) {
      filtered = filtered.filter(c => selectedProvinces.includes(c.province));
    }

    // Experience range
    filtered = filtered.filter(c =>
      c.experience_years >= experienceRange[0] && c.experience_years <= experienceRange[1]
    );

    // Salary range
    filtered = filtered.filter(c =>
      c.salary_expectation >= salaryRange[0] && c.salary_expectation <= salaryRange[1]
    );

    // Status filter
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(c => selectedStatus.includes(c.status));
    }

    // Match score filter
    if (minMatchScore > 0) {
      filtered = filtered.filter(c => (c.match_score || 0) >= minMatchScore);
    }

    setFilteredCandidates(filtered);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleProvince = (province: string) => {
    setSelectedProvinces(prev =>
      prev.includes(province) ? prev.filter(p => p !== province) : [...prev, province]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSkills([]);
    setSelectedProvinces([]);
    setExperienceRange([0, 20]);
    setSalaryRange([0, 2000000]);
    setSelectedStatus([]);
    setMinMatchScore(0);
  };

  const saveCurrentSearch = async () => {
    const name = prompt('Name this search:');
    if (!name?.trim()) return;
    try {
      const res = await apiClient.post('/saved-searches', {
        name,
        search_type: 'candidates',
        filters: { searchQuery, selectedSkills, selectedProvinces, experienceRange, salaryRange, selectedStatus, minMatchScore },
      });
      setSavedSearches(prev => [...prev, res.data]);
      toast.success('Search saved!');
    } catch {
      toast.error('Failed to save search');
    }
  };

  const loadSavedSearch = (s: any) => {
    const f = s.filters || {};
    if (f.searchQuery !== undefined) setSearchQuery(f.searchQuery);
    if (f.selectedSkills) setSelectedSkills(f.selectedSkills);
    if (f.selectedProvinces) setSelectedProvinces(f.selectedProvinces);
    if (f.experienceRange) setExperienceRange(f.experienceRange);
    if (f.salaryRange) setSalaryRange(f.salaryRange);
    if (f.selectedStatus) setSelectedStatus(f.selectedStatus);
    if (f.minMatchScore !== undefined) setMinMatchScore(f.minMatchScore);
    setShowSavedDropdown(false);
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      await apiClient.delete(`/saved-searches/${id}`);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Failed to delete saved search');
    }
  };

  const handleShortlist = async (candidateId: string) => {
    try {
      await apiClient.put(`/candidates/${candidateId}`, { tags: ['shortlisted'] });
      setCandidates(prev => prev.map(c =>
        c.id === candidateId ? { ...c, status: 'shortlisted' as const } : c
      ));
      toast.success('Candidate shortlisted!');
    } catch {
      toast.error('Failed to shortlist candidate.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-yellow-100 text-yellow-700',
      interviewed: 'bg-purple-100 text-purple-700',
      offered: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  // Common locations for filter
  const allSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'Java', 'Angular', 'Vue.js'];
  const commonLocations = [
    'Western Cape', 'Gauteng', 'KwaZulu-Natal', 'London', 'Berlin', 
    'Cape Town', 'Johannesburg', 'New York', 'San Francisco', 'Remote'
  ];
  const statuses = [
    { value: 'new', label: 'New' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interviewed', label: 'Interviewed' },
    { value: 'offered', label: 'Offered' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const statusActionLabel = (status: string) => {
    if (status === 'new') return 'Shortlist';
    if (status === 'shortlisted') return 'Schedule Interview';
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
              <p className="text-gray-600 mt-1">
                {filteredCandidates.length} of {candidates.length} candidates
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Saved Searches */}
              <div className="relative">
                <button
                  onClick={() => setShowSavedDropdown(v => !v)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center space-x-2 bg-white"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Saved</span>
                  {savedSearches.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {savedSearches.length}
                    </span>
                  )}
                </button>
                {showSavedDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1">
                    {savedSearches.length === 0 ? (
                      <p className="text-sm text-gray-400 px-4 py-3">No saved searches yet</p>
                    ) : (
                      savedSearches.map(s => (
                        <div key={s.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 group">
                          <button onClick={() => loadSavedSearch(s)} className="text-sm text-gray-700 font-medium flex-1 text-left">
                            {s.name}
                          </button>
                          <button onClick={() => deleteSavedSearch(s.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { saveCurrentSearch(); setShowSavedDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-1.5">
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        Save current search
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {(selectedSkills.length + selectedProvinces.length + selectedStatus.length) > 0 && (
                  <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {selectedSkills.length + selectedProvinces.length + selectedStatus.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, title, skills, or location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                  {(selectedSkills.length + selectedProvinces.length + selectedStatus.length) > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {/* Match Score */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Min. Match Score: {minMatchScore}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={minMatchScore}
                      onChange={(e) => setMinMatchScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            selectedSkills.includes(skill)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Region / Location</h3>
                    <div className="space-y-2">
                      {commonLocations.map((location) => (
                        <label key={location} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProvinces.includes(location)}
                            onChange={() => toggleProvince(location)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{location}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Experience: {experienceRange[0]}-{experienceRange[1]} years
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={experienceRange[1]}
                        onChange={(e) => setExperienceRange([experienceRange[0], Number(e.target.value)])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* Salary */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Salary: R{(salaryRange[0] / 1000).toFixed(0)}k - R{(salaryRange[1] / 1000).toFixed(0)}k
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2000000"
                      step="50000"
                      value={salaryRange[1]}
                      onChange={(e) => setSalaryRange([salaryRange[0], Number(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
                    <div className="space-y-2">
                      {statuses.map((status) => (
                        <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStatus.includes(status.value)}
                            onChange={() => toggleStatus(status.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Candidates List */}
          <div className="flex-1">
            {filteredCandidates.length === 0 ? (
              <div className="bg-white rounded-xl p-16 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search criteria
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    {/* CONTINUED IN PART 2... */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {candidate.profile_photo
                            ? <img src={candidate.profile_photo} alt={candidate.name} className="w-full h-full object-cover" />
                            : <span className="text-white font-bold text-xl">{candidate.name.split(' ').map(n => n[0]).join('')}</span>
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(candidate.status)}`}>
                              {candidate.status}
                            </span>
                            {candidate.match_score && candidate.match_score >= 85 && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                                <Star className="w-3 h-3" />
                                <span>{Number(candidate.match_score) || 0}% Match</span>
                              </span>
                            )}
                          </div>

                          <p className="text-base text-gray-700 font-medium mb-3">{candidate.title}</p>

                          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{candidate.city}, {candidate.province}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <span>{candidate.experience_years} years experience</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span>R{(candidate.salary_expectation / 1000).toFixed(0)}k</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{candidate.availability}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {candidate.skills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                +{candidate.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => setSelectedCandidate(candidate)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Quick View</span>
                        </button>
                        {candidate.status === 'new' && (
                          <button
                            onClick={() => handleShortlist(candidate.id)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-all flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Shortlist</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Quick-View Slide-Over */}
      {selectedCandidate && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedCandidate(null)}
          />
          {/* panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Candidate Profile</h2>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Avatar + name */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {selectedCandidate.profile_photo
                    ? <img src={selectedCandidate.profile_photo} alt={selectedCandidate.name} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-xl">{selectedCandidate.name.split(' ').map(n => n[0]).join('')}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-gray-600">{selectedCandidate.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedCandidate.status)}`}>
                      {selectedCandidate.status}
                    </span>
                    {selectedCandidate.match_score && selectedCandidate.match_score >= 70 && (
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {selectedCandidate.match_score}% Match
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{selectedCandidate.city}{selectedCandidate.province ? `, ${selectedCandidate.province}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{selectedCandidate.experience_years} yrs exp.</span>
                </div>
                {selectedCandidate.salary_expectation > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>R{(selectedCandidate.salary_expectation / 1000).toFixed(0)}k</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{selectedCandidate.availability}</span>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 text-sm">
                {selectedCandidate.email && (
                  <a href={`mailto:${selectedCandidate.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Mail className="w-4 h-4 shrink-0" />
                    {selectedCandidate.email}
                  </a>
                )}
                {selectedCandidate.phone && (
                  <a href={`tel:${selectedCandidate.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Phone className="w-4 h-4 shrink-0" />
                    {selectedCandidate.phone}
                  </a>
                )}
                {selectedCandidate.linkedin_url && (
                  <a href={selectedCandidate.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Linkedin className="w-4 h-4 shrink-0" />
                    LinkedIn Profile
                  </a>
                )}
              </div>

              {/* Skills */}
              {selectedCandidate.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedCandidate.education && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Education</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400 shrink-0" />
                    {selectedCandidate.education}
                  </p>
                </div>
              )}

              {/* Applied jobs */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                Applied to <strong className="text-gray-900">{selectedCandidate.applied_jobs}</strong> job{selectedCandidate.applied_jobs !== 1 ? 's' : ''} on this platform
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-gray-100 px-6 py-4 space-y-2 bg-gray-50">
              {selectedCandidate.status === 'new' && (
                <button
                  onClick={() => {
                    handleShortlist(selectedCandidate.id);
                    setSelectedCandidate(null);
                  }}
                  className="w-full px-4 py-2.5 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Shortlist Candidate
                </button>
              )}
              <button
                onClick={() => {
                  navigate(`/candidates/${selectedCandidate.id}`);
                  setSelectedCandidate(null);
                }}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

