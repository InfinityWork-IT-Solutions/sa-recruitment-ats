import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Briefcase, ExternalLink, Building } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function PublicCareerPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await apiClient.get(`/p/${slug}`);
        setPage(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !page) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500">This career page doesn't exist or hasn't been published yet.</p>
      </div>
    </div>
  );

  const brandColor = page.primary_color || '#2563eb';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          {page.company_logo ? (
            <img src={page.company_logo} alt={page.company_name} className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ background: brandColor }}>
              {page.company_name?.[0]}
            </div>
          )}
          <span className="font-bold text-gray-900 text-lg">{page.company_name}</span>
          {page.company_website && (
            <a href={page.company_website} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />Website
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="py-16 px-6 text-center" style={{ background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}30 100%)`, borderBottom: `4px solid ${brandColor}` }}>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.headline || `Join ${page.company_name}`}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{page.tagline || "We're looking for talented people to join our team."}</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Culture */}
        {page.culture_description && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Culture</h2>
            <p className="text-gray-600 leading-relaxed">{page.culture_description}</p>
          </section>
        )}

        {/* Perks */}
        {page.show_perks && page.perks?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Work With Us</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.perks.map((perk: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">{perk.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{perk.title}</h3>
                  <p className="text-sm text-gray-500">{perk.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Open Positions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Open Positions
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {page.active_jobs?.length || 0} roles
            </span>
          </h2>
          {!page.active_jobs?.length ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No open positions right now. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {page.active_jobs.map((job: any) => (
                <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between group">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.employment_type?.replace('_', ' ')}</span>
                      {job.is_remote && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Remote</span>}
                      {job.show_salary && job.salary_min && (
                        <span className="text-gray-600 font-medium">R{job.salary_min?.toLocaleString()} – R{job.salary_max?.toLocaleString()}/mo</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/job-board/${job.id}`}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ background: brandColor }}
                  >
                    Apply
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="border-t bg-white py-6 text-center text-sm text-gray-400">
        Powered by <span className="font-semibold text-gray-600">RecruitPro SA</span>
      </footer>
    </div>
  );
}
