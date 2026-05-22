import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, CheckCircle, XCircle, Clock, Briefcase, User,
  Plus, X, TrendingUp, AlertCircle, ClipboardCheck
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

interface OfferApplication {
  id: string;
  candidate_name: string;
  candidate_id: string;
  job_title: string;
  job_id: string;
  status: 'offer_pending' | 'offer_made' | 'offer_accepted' | 'hired' | 'rejected';
  offer_amount?: number;
  notes?: string;
  created_at: string;
  match_score?: number;
}

const OFFER_STATUSES = ['offer_pending', 'offer_made', 'offer_accepted', 'hired'];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  offer_pending: { label: 'Offer Pending', color: 'bg-indigo-100 text-indigo-700', icon: <Clock className="w-4 h-4" /> },
  offer_made:    { label: 'Offer Made',    color: 'bg-pink-100 text-pink-700',   icon: <DollarSign className="w-4 h-4" /> },
  offer_accepted:{ label: 'Accepted',      color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  hired:         { label: 'Hired',         color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-4 h-4" /> },
  rejected:      { label: 'Declined',      color: 'bg-red-100 text-red-700',     icon: <XCircle className="w-4 h-4" /> },
};

export default function OffersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [makeOfferModal, setMakeOfferModal] = useState<OfferApplication | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await apiClient.get('/applications?status=offer_pending,offer_made,offer_accepted,hired&limit=100');
      return (res.data.applications || res.data || []) as OfferApplication[];
    },
  });

  const makeOfferMutation = useMutation({
    mutationFn: ({ id, amount, notes }: { id: string; amount: number; notes: string }) =>
      apiClient.post(`/applications/${id}/make-offer`, { amount, notes }),
    onSuccess: () => {
      toast.success('Offer sent!');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setMakeOfferModal(null);
      setOfferAmount('');
      setOfferNotes('');
    },
    onError: () => toast.error('Failed to send offer'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/applications/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      const label = statusConfig[vars.status]?.label || vars.status;
      toast.success(`Application marked as ${label}`);
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const allOffers: OfferApplication[] = data || [];
  const offers = filterStatus === 'all' ? allOffers : allOffers.filter(o => o.status === filterStatus);

  const summary = {
    pending: allOffers.filter(o => o.status === 'offer_pending').length,
    made: allOffers.filter(o => o.status === 'offer_made').length,
    accepted: allOffers.filter(o => ['offer_accepted', 'hired'].includes(o.status)).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
              <p className="text-gray-600 mt-1">Track and manage all candidate offers</p>
            </div>
            <button
              onClick={() => navigate('/company/applications')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Make Offer from Applications
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{summary.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Offer Made</p>
            <p className="text-3xl font-bold text-pink-600 mt-1">{summary.made}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500">Accepted / Hired</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{summary.accepted}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All' }, ...OFFER_STATUSES.map(s => ({ value: s, label: statusConfig[s].label }))].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filterStatus === tab.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {allOffers.filter(o => o.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No offers yet</h3>
            <p className="text-gray-600 mb-6">
              Move candidates to "Offer Pending" from the Applications page to track them here.
            </p>
            <button
              onClick={() => navigate('/company/applications')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              View Applications
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map(offer => {
              const cfg = statusConfig[offer.status] || statusConfig.offer_pending;
              return (
                <div key={offer.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {offer.candidate_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900">{offer.candidate_name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {offer.job_title}
                        </p>
                        {offer.offer_amount && offer.offer_amount > 0 && (
                          <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mt-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            R{offer.offer_amount.toLocaleString()} offered
                          </p>
                        )}
                        {offer.notes && (
                          <p className="text-xs text-gray-500 mt-1">{offer.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions based on current status */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {offer.status === 'offer_pending' && (
                        <button
                          onClick={() => { setMakeOfferModal(offer); setOfferAmount(''); setOfferNotes(''); }}
                          className="px-3 py-1.5 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 font-semibold flex items-center gap-1.5"
                        >
                          <DollarSign className="w-4 h-4" />
                          Make Offer
                        </button>
                      )}
                      {offer.status === 'offer_made' && (
                        <>
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: offer.id, status: 'offer_accepted' })}
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-semibold flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Accepted
                          </button>
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: offer.id, status: 'rejected' })}
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 font-semibold flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <XCircle className="w-4 h-4" />
                            Declined
                          </button>
                        </>
                      )}
                      {offer.status === 'offer_accepted' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: offer.id, status: 'hired' })}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 font-semibold flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Hired
                        </button>
                      )}
                      {offer.status === 'hired' && (
                        <button
                          onClick={() => navigate(`/company/onboarding/${offer.id}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-1.5"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          Start Onboarding
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/applications/${offer.id}`)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 font-medium"
                      >
                        View Application
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Make Offer Modal */}
      {makeOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
              <button onClick={() => setMakeOfferModal(null)} className="p-1.5 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Sending offer to <strong>{makeOfferModal.candidate_name}</strong> for <strong>{makeOfferModal.job_title}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Amount (ZAR / year)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">R</span>
                  <input
                    type="number"
                    min="0"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder="e.g. 600000"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Message (optional)</label>
                <textarea
                  value={offerNotes}
                  onChange={e => setOfferNotes(e.target.value)}
                  rows={3}
                  placeholder="Any conditions, start date, benefits..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMakeOfferModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={!offerAmount || makeOfferMutation.isPending}
                onClick={() => makeOfferMutation.mutate({ id: makeOfferModal.id, amount: Number(offerAmount), notes: offerNotes })}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-60"
              >
                {makeOfferMutation.isPending ? 'Sending...' : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
