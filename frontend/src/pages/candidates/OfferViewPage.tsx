import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import {
  PartyPopper, Banknote, Calendar, MapPin, Briefcase,
  CheckCircle, XCircle, Clock, ChevronRight, CircleDashed,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OfferViewPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/candidate-portal/my-applications')
      .then(r => {
        const offers = r.data.filter((a: any) =>
          ['offer_pending', 'offer_made', 'offer_accepted', 'hired'].includes(a.status)
        );
        setApps(offers);
      })
      .catch(() => toast.error('Failed to load offers'))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    offer_pending: { label: 'Offer Pending',   color: 'bg-orange-100 text-orange-700' },
    offer_made:    { label: 'Offer Received',  color: 'bg-green-100 text-green-700' },
    offer_accepted:{ label: 'Accepted',        color: 'bg-emerald-100 text-emerald-800' },
    hired:         { label: 'Hired 🎉',        color: 'bg-green-200 text-green-900' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PartyPopper className="w-6 h-6 text-green-600" /> My Offers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${apps.length} offer${apps.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <CircleDashed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No offers yet</h3>
            <p className="text-sm text-gray-400 mt-1 mb-5">Keep applying — your offer is coming!</p>
            <Link to="/candidate/jobs" className="btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => {
              const st = STATUS_MAP[app.status] ?? { label: app.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={app.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{app.job_title ?? 'Position'}</h2>
                      {app.job_location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {app.job_location}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {app.offer_amount && (
                      <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2.5">
                        <Banknote className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Offered Salary</p>
                          <p className="text-sm font-bold text-green-800">
                            {app.offer_currency ?? 'ZAR'} {Number(app.offer_amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Updated</p>
                        <p className="text-sm font-medium text-gray-700">
                          {format(new Date(app.updated_at), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {app.status === 'offer_made' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                      You have a pending offer. Contact your recruiter to accept or discuss the terms.
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/jobs/${app.job_id}`}
                      className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      View Job
                    </Link>
                    <Link
                      to="/candidate/applications"
                      className="flex-1 text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      Track Application <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
