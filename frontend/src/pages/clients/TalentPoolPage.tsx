import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, MapPin, Briefcase, Star, Filter, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

export default function TalentPoolPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPool();
  }, [statusFilter]);

  const fetchPool = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.append('status', statusFilter);
      const res = await apiClient.get(`/candidates?${params}`);
      const data = res.data;
      setCandidates(Array.isArray(data) ? data : data.candidates || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = candidates.filter(c =>
    !search ||
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.current_job_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    passive: 'bg-yellow-100 text-yellow-700',
    placed: 'bg-blue-100 text-blue-700',
    not_interested: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Talent Pool</h1>
            <p className="text-gray-500 text-sm mt-1">Your database of active and passive candidates</p>
          </div>
          <button
            onClick={() => navigate('/company/candidates')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, title, or skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="passive">Passive</option>
            <option value="placed">Placed</option>
            <option value="not_interested">Not Interested</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} candidates</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No candidates found</h3>
            <p className="text-gray-500 text-sm mt-1">Add candidates to your talent pool to track them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c: any) => (
              <div
                key={c.id}
                onClick={() => navigate(`/candidates/${c.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {(c.first_name?.[0] || '') + (c.last_name?.[0] || '')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{c.first_name} {c.last_name}</h3>
                      <p className="text-xs text-gray-500">{c.current_job_title || 'No title'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  {c.city && <><MapPin className="w-3 h-3" />{c.city}</>}
                  {c.years_of_experience && <><Briefcase className="w-3 h-3 ml-2" />{c.years_of_experience}y exp</>}
                </div>

                {c.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(c.skills as string[]).slice(0, 4).map((skill: string) => (
                      <span key={skill} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{skill}</span>
                    ))}
                    {c.skills.length > 4 && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">+{c.skills.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
