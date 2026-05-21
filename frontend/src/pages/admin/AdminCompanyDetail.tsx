import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, ArrowLeft, Mail, MapPin, Globe, Briefcase, FileText } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import StatusBadge from '../../components/common/StatusBadge';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function AdminCompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await apiClient.get('/admin/companies');
        // Find the company in the list (in a real app we'd have a GET /admin/companies/:id endpoint)
        const comp = response.data.companies.find((c: any) => c.id === id);
        setCompany(comp);
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Building className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h2>
        <p className="text-gray-500 mb-6">The company you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/admin/companies')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/admin/companies')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12 text-white flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Building className="w-12 h-12 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">{company.name}</h1>
                <StatusBadge status={company.is_active ? 'active' : 'inactive'} />
              </div>
              <p className="text-blue-100 text-lg font-medium">{company.industry || 'General Industry'}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2 space-y-8">
              <section>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
                <div className="bg-gray-50/50 rounded-2xl p-6 space-y-4 border border-gray-100">
                  <div className="flex items-center gap-3 text-gray-700 font-medium">
                    <Mail className="w-5 h-5 text-gray-400" /> {company.contact_email || 'No email provided'}
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 font-medium">
                    <MapPin className="w-5 h-5 text-gray-400" /> {company.city ? `${company.city}, ${company.country || 'South Africa'}` : 'Location unknown'}
                  </div>
                  <div className="flex items-center gap-3 text-blue-600 font-medium cursor-pointer hover:underline">
                    <Globe className="w-5 h-5 text-blue-400" /> {company.website || 'No website provided'}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Company Overview</h3>
                <div className="text-gray-600 leading-relaxed">
                  {company.description || "No description provided by the company."}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 text-center">
                <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-black text-blue-900 mb-1">0</div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active Jobs</div>
              </div>
              
              <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 text-center">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-black text-purple-900 mb-1">0</div>
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Total Applications</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
