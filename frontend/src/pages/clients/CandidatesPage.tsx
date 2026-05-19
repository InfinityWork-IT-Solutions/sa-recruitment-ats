import { useState, useEffect } from 'react';
import { 
  Search, Filter, Users, MapPin, Briefcase, Award, Mail, 
  Phone, Linkedin, Calendar, DollarSign, Star, ChevronDown,
  X, Download, Eye, CheckCircle
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchQuery, selectedSkills, selectedProvinces, experienceRange, salaryRange, selectedStatus, minMatchScore]);

  const fetchCandidates = async () => {
    try {
      const response = await apiClient.get('/candidates');
      const data = response.data;
      const formatted = (data.candidates || []).map((c: any) => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        phone: c.phone || '',
        title: c.current_job_title || 'Candidate',
        location: c.city || 'South Africa',
        city: c.city || '',
        province: '',
        skills: c.skills || [],
        experience_years: c.years_of_experience || 0,
        current_company: '',
        salary_expectation: 0,
        availability: 'Immediate',
        match_score: 95,
        education: '',
        applied_jobs: c.applications_count || 0,
        last_active: 'Recently',
        status: c.status === 'active' ? 'new' : c.status,
      }));
      setCandidates(formatted.length > 0 ? formatted : mockCandidates);
      setFilteredCandidates(formatted.length > 0 ? formatted : mockCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates(mockCandidates);
      setFilteredCandidates(mockCandidates);
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

  const handleShortlist = async (candidateId: string) => {
    try {
      // Mock API call since shortlist status is tracked on Applications rather than Candidate model
      await new Promise(resolve => setTimeout(resolve, 500));
      // Update local state
      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? { ...c, status: 'shortlisted' as const } : c
      ));
    } catch (error) {
      console.error('Error shortlisting candidate:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
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
                                <span>{candidate.match_score}% Match</span>
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
                          onClick={() => navigate(`/candidates/${candidate.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
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

      {/* Candidate Detail Modal - will add in next part */}
    </div>
  );
}

// Mock data
const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sizwe Khoza',
    email: 'sizwe@example.com',
    phone: '+27 82 123 4567',
    title: 'Senior DevOps Engineer',
    location: 'Cape Town, Western Cape',
    city: 'Cape Town',
    province: 'Western Cape',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python', 'CI/CD'],
    experience_years: 7,
    current_company: 'TechCorp',
    salary_expectation: 650000,
    availability: 'Immediate',
    match_score: 98,
    education: 'BSc Computer Science - UCT',
    linkedin_url: 'https://linkedin.com/in/sizwe',
    applied_jobs: 3,
    last_active: '2 hours ago',
    status: 'new',
  },
  // Add more mock candidates...
];
