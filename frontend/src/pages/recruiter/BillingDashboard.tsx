/**
 * ============================================================================
 * BILLING DASHBOARD - SUBSCRIPTION MANAGEMENT
 * ============================================================================
 * 
 * PURPOSE:
 * Recruiter billing dashboard to manage subscription, view invoices, track usage.
 * 
 * ROUTE: /recruiter/billing
 * 
 * FEATURES:
 * - Current plan display
 * - Usage tracking (searches used this month)
 * - Seat management
 * - Invoice history
 * - Cancel subscription
 * - Upgrade/downgrade options
 * 
 * API ENDPOINTS:
 * GET /api/subscriptions/current - Current subscription
 * GET /api/subscriptions/invoices - Invoice history
 * POST /api/subscriptions/cancel - Cancel subscription
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Users, 
  Search, 
  FileText,
  AlertCircle,
  Check,
  Download,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import apiClient from '@/lib/api-client';

interface Subscription {
  id: string;
  plan: {
    display_name: string;
    price_monthly: number;
    seats_included: number;
    features: {
      max_searches: number | null;
    };
  };
  status: string;
  billing_cycle: string;
  amount: number;
  seats_allocated: number;
  seats_used: number;
  current_period_end: string;
  trial_end_date: string | null;
  is_trialing: boolean;
  days_until_renewal: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  pdf_url: string | null;
}

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { user } = useAuthStore();
  const agencyId = user?.agency_id;

  useEffect(() => {
    if (agencyId) {
      fetchSubscription();
      fetchInvoices();
    }
  }, [agencyId]);

  const fetchSubscription = async () => {
    try {
      const response = await apiClient.get(`/subscriptions/current?agency_id=${agencyId}`);
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await apiClient.get(`/subscriptions/invoices?agency_id=${agencyId}`);
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await apiClient.post(`/subscriptions/cancel?agency_id=${agencyId}`);
      setShowCancelModal(false);
      fetchSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!subscription) {
    return <div className="p-8">No active subscription found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing details</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{subscription.plan.display_name} Plan</h2>
              <p className="text-gray-600">
                {subscription.is_trialing ? (
                  <span className="text-green-600 font-semibold">
                    Free trial • {subscription.days_until_renewal} days remaining
                  </span>
                ) : (
                  <span>Renews in {subscription.days_until_renewal} days</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                R{subscription.amount.toLocaleString()}<span className="text-lg text-gray-500">/{subscription.billing_cycle === 'annual' ? 'year' : 'month'}</span>
              </div>
              {subscription.is_trialing && (
                <div className="text-sm text-gray-500 mt-1">
                  Payment starts after trial
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{subscription.seats_used}/{subscription.seats_allocated}</span>
              </div>
              <div className="text-sm text-gray-600">Seats Used</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Search className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {subscription.plan.features.max_searches ? '45/50' : 'Unlimited'}
                </span>
              </div>
              <div className="text-sm text-gray-600">Searches This Month</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">{subscription.days_until_renewal}</span>
              </div>
              <div className="text-sm text-gray-600">Days Until Renewal</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              Upgrade Plan
            </button>
            <button 
              onClick={() => setShowCancelModal(true)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Billing History</h3>

          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-semibold text-gray-900">Invoice #{invoice.invoice_number}</div>
                      <div className="text-sm text-gray-500">{new Date(invoice.issue_date).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">R{invoice.total.toLocaleString()}</div>
                      <div className={`text-sm ${invoice.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                        {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                    </div>

                    {invoice.pdf_url && (
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Subscription?</h3>
              <p className="text-gray-600 mb-6">
                Your subscription will remain active until {new Date(subscription.current_period_end).toLocaleDateString()}.
                After that, you'll lose access to all features.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
