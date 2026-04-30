/**
 * ============================================================================
 * PRICING PAGE - SUBSCRIPTION PLANS
 * ============================================================================
 * 
 * PURPOSE:
 * Display 3 subscription tiers for recruiters to choose from.
 * Beautiful, conversion-optimized pricing cards.
 * 
 * ROUTE: /pricing
 * 
 * HOW IT WORKS:
 * 1. Fetch plans from API
 * 2. Display 3 cards (Starter, Professional, Enterprise)
 * 3. Highlight "Most Popular" (Professional)
 * 4. Monthly/Annual toggle
 * 5. "Get Started" button → Registration with plan pre-selected
 * 
 * API ENDPOINT:
 * GET /api/subscriptions/plans
 * 
 * FEATURES:
 * - Beautiful gradients
 * - Feature comparison
 * - Annual discount badge
 * - Responsive (mobile-first)
 * - Smooth animations
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Star, Building, Sparkles } from 'lucide-react';
import apiClient from '@/lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  seats_included: number;
  features: {
    video_screening: boolean;
    ai_matching: boolean;
    advanced_analytics: boolean;
    api_access: boolean;
    white_label: boolean;
    priority_support: boolean;
    max_searches: number | null;
  };
  is_most_popular: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PricingPage() {
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  /**
   * FETCH PLANS
   */
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/subscriptions/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * HANDLE PLAN SELECTION
   */
  const handleSelectPlan = (plan: Plan) => {
    // Navigate to registration with plan pre-selected
    navigate('/register/recruiter', {
      state: {
        selectedPlan: plan.id,
        billingCycle: billingCycle
      }
    });
  };

  /**
   * CALCULATE ANNUAL SAVINGS
   */
  const getAnnualSavings = (plan: Plan): number => {
    const monthlyTotal = plan.price_monthly * 12;
    const savings = monthlyTotal - plan.price_annual;
    return Math.round((savings / monthlyTotal) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start your 14-day free trial. No credit card required.
          </p>

          {/* BILLING TOGGLE */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-8 py-3 rounded-full font-semibold transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              annualSavings={getAnnualSavings(plan)}
              onSelect={() => handleSelectPlan(plan)}
              delay={index * 100}
            />
          ))}
        </div>

        {/* TRUST BADGES */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Trusted by recruitment agencies across South Africa
          </p>
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">14-Day Free Trial</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">Cancel Anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">South African Owned</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


// ============================================================================
// PRICING CARD COMPONENT
// ============================================================================

interface PricingCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  annualSavings: number;
  onSelect: () => void;
  delay: number;
}

function PricingCard({ plan, billingCycle, annualSavings, onSelect, delay }: PricingCardProps) {
  
  const price = billingCycle === 'annual' ? plan.price_annual / 12 : plan.price_monthly;
  const isPopular = plan.is_most_popular;
  const isEnterprise = plan.name === 'enterprise';

  /**
   * GET PLAN ICON
   */
  const getPlanIcon = () => {
    if (plan.name === 'starter') return <Zap className="w-8 h-8" />;
    if (plan.name === 'professional') return <Star className="w-8 h-8" />;
    if (plan.name === 'enterprise') return <Building className="w-8 h-8" />;
    return <Sparkles className="w-8 h-8" />;
  };

  /**
   * GET GRADIENT COLORS
   */
  const getGradient = () => {
    if (plan.name === 'starter') return 'from-green-500 to-emerald-600';
    if (plan.name === 'professional') return 'from-blue-600 to-purple-600';
    if (plan.name === 'enterprise') return 'from-purple-600 to-pink-600';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-2xl ${
        isPopular ? 'ring-4 ring-blue-500 scale-105' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* MOST POPULAR BADGE */}
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-bl-2xl font-bold text-sm">
          ⭐ MOST POPULAR
        </div>
      )}

      {/* CARD CONTENT */}
      <div className="p-8">
        
        {/* PLAN ICON */}
        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${getGradient()} rounded-2xl text-white mb-4`}>
          {getPlanIcon()}
        </div>

        {/* PLAN NAME */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {plan.display_name}
        </h3>
        <p className="text-gray-600 mb-6 min-h-[3rem]">
          {plan.description}
        </p>

        {/* PRICE */}
        <div className="mb-6">
          {isEnterprise ? (
            <div>
              <div className="text-4xl font-bold text-gray-900">Custom</div>
              <div className="text-sm text-gray-500">Contact for pricing</div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">
                  R{price.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                </span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
              {billingCycle === 'annual' && (
                <div className="text-sm text-green-600 font-semibold mt-1">
                  Save {annualSavings}% with annual billing
                </div>
              )}
              <div className="text-sm text-gray-500 mt-1">
                Billed {billingCycle === 'annual' ? 'annually' : 'monthly'}
              </div>
            </div>
          )}
        </div>

        {/* GET STARTED BUTTON */}
        <button
          onClick={onSelect}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${
            isPopular
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {isEnterprise ? 'Contact Sales' : 'Start Free Trial'}
        </button>

        {/* FEATURES LIST */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700">
              <strong>{plan.seats_included}</strong> {plan.seats_included === 1 ? 'recruiter seat' : 'recruiter seats'}
            </span>
          </div>

          <div className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700">
              <strong>{plan.features.max_searches ? `${plan.features.max_searches}` : 'Unlimited'}</strong> candidate searches/month
            </span>
          </div>

          {plan.features.ai_matching && (
            <div className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">AI candidate matching</span>
            </div>
          )}

          {plan.features.video_screening && (
            <div className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Video screening access</span>
            </div>
          )}

          {plan.features.advanced_analytics && (
            <div className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Advanced analytics</span>
            </div>
          )}

          {plan.features.priority_support && (
            <div className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Priority support</span>
            </div>
          )}

          {plan.features.api_access && (
            <div className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">API access</span>
            </div>
          )}

          {plan.features.white_label && (
            <div className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">White-label option</span>
            </div>
          )}
        </div>
      </div>

      {/* GRADIENT BORDER (for popular plan) */}
      {isPopular && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10 pointer-events-none"></div>
      )}
    </div>
  );
}
