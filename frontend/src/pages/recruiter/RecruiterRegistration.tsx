/**
 * ============================================================================
 * RECRUITER REGISTRATION - WITH PLAN SELECTION
 * ============================================================================
 * 
 * PURPOSE:
 * Updated registration flow that includes subscription plan selection
 * and PayFast payment integration.
 * 
 * ROUTE: /register/recruiter
 * 
 * FLOW:
 * 1. Fill agency details (name, email, phone, location)
 * 2. Create account credentials (password)
 * 3. Select subscription plan (or comes from pricing page)
 * 4. Submit → Creates account + subscription
 * 5. Redirect to PayFast for payment setup
 * 6. After 14-day trial → Payment auto-processes
 * 
 * API ENDPOINTS:
 * POST /api/auth/register/recruiter - Create account
 * POST /api/subscriptions/create - Create subscription + get PayFast form
 * 
 * FEATURES:
 * - Plan selection (if not pre-selected from pricing page)
 * - Monthly/Annual toggle
 * - Trial period info
 * - Auto-redirect to PayFast
 * 
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Check, AlertCircle, Loader, Users } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface Plan {
  id: string;
  display_name: string;
  price_monthly: number;
  price_annual: number;
}

export default function RecruiterRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentFormRef = useRef<HTMLFormElement>(null);
  
  // Pre-selected plan from pricing page
  const preSelectedPlan = location.state?.selectedPlan;
  const preSelectedCycle = location.state?.billingCycle || 'monthly';
  
  // Form state
  const [step, setStep] = useState(1); // 1 = Details, 2 = Plan, 3 = Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Registration data
  const [formData, setFormData] = useState({
    agency_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    province: '',
    country: 'South Africa',
    password: '',
    confirm_password: '',
    accept_terms: false
  });
  
  // Subscription data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(preSelectedPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(preSelectedCycle);
  
  // PayFast payment data (for auto-submit)
  const [paymentData, setPaymentData] = useState<any>(null);

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
      
      // If no pre-selected plan, default to Professional
      if (!selectedPlanId && response.data.length > 0) {
        const professional = response.data.find((p: Plan) => p.display_name === 'Professional');
        setSelectedPlanId(professional?.id || response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  /**
   * AUTO-SUBMIT PAYMENT FORM
   * When PayFast data is received, auto-submit form to redirect to PayFast
   */
  useEffect(() => {
    if (paymentData && paymentFormRef.current) {
      // Brief delay to show success message, then auto-submit
      setTimeout(() => {
        paymentFormRef.current?.submit();
      }, 1500);
    }
  }, [paymentData]);

  /**
   * HANDLE INPUT CHANGE
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * VALIDATE STEP 1
   */
  const validateStep1 = (): boolean => {
    if (!formData.agency_name || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone) {
      setError('Please enter your phone number');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.accept_terms) {
      setError('Please accept the Terms & Conditions');
      return false;
    }
    return true;
  };

  /**
   * HANDLE NEXT STEP
   */
  const handleNext = () => {
    setError(null);
    
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!selectedPlanId) {
        setError('Please select a plan');
        return;
      }
      handleSubmit();
    }
  };

  /**
   * HANDLE SUBMIT
   * Creates account + subscription + gets PayFast payment form
   */
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create recruiter account
      const registerResponse = await apiClient.post('/auth/register/recruiter', {
        agency_name: formData.agency_name,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        password: formData.password
      });

      const agencyId = registerResponse.data.agency_id;

      // Step 2: Create subscription + get PayFast payment form
      const subscriptionResponse = await apiClient.post('/subscriptions/create', {
        agency_id: agencyId,
        plan_id: selectedPlanId,
        billing_cycle: billingCycle
      });

      // Step 3: Set payment data (will trigger auto-submit)
      setPaymentData(subscriptionResponse.data);
      setStep(3);

    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Something went wrong';
      setError(message);
      setLoading(false);
    }
  };

  /**
   * GET SELECTED PLAN
   */
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const price = selectedPlan ? (billingCycle === 'annual' ? selectedPlan.price_annual / 12 : selectedPlan.price_monthly) : 0;

  // ========================================
  // STEP 1: ACCOUNT DETAILS
  // ========================================

  if (step === 1) {
    return (
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-0">
        {/* Header */}
        <div className="text-center mb-10 mt-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-3xl mb-6 shadow-2xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Create Agency Account</h1>
          <p className="text-slate-400 font-medium tracking-wide">Start your 14-day free trial</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/20 mb-12">
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              
              {/* Agency Name */}
              <div className="mb-8">
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">
                  Agency Name *
                </label>
                <input
                  type="text"
                  name="agency_name"
                  value={formData.agency_name}
                  onChange={handleChange}
                  placeholder="Elite Talent Agency"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all backdrop-blur-md"
                  required
                />
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+27 12 345 6789"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Cape Town"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Province *</label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder="Western Cape"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/40 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Confirm *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="mb-10 bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="flex items-start space-x-4 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-1">
                    <input
                      type="checkbox"
                      name="accept_terms"
                      checked={formData.accept_terms}
                      onChange={handleChange}
                      className="w-6 h-6 rounded-lg bg-white/5 border-white/20 checked:bg-blue-600 transition-all appearance-none cursor-pointer"
                      required
                    />
                    <Check className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white transition-colors leading-relaxed">
                    I accept the <a href="/terms" className="text-blue-400 hover:underline">Terms & Conditions</a> and <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a> *
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 font-black text-lg uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-900/50"
              >
                Continue to Plan Selection →
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-10 text-center">
              <p className="text-white/40 font-medium">
                Already have an account?{' '}
                <Link to="/login?type=recruiter" className="text-white hover:text-blue-400 font-black underline underline-offset-4 decoration-2 decoration-blue-500/30">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
    );
  }

  // ========================================
  // STEP 2: PLAN SELECTION
  // ========================================

  if (step === 2) {
    return (
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-0">
          <div className="text-center mb-10 mt-12">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Choose Your Plan</h1>
            <p className="text-slate-400 font-medium tracking-wide">14-day free trial starts today</p>
          </div>

          <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/20 mb-12">
            
            {/* Plan Cards (simplified for registration) */}
            <div className="space-y-4 mb-8">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                    selectedPlanId === plan.id
                      ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-900/40'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        selectedPlanId === plan.id
                          ? 'border-white bg-white'
                          : 'border-white/20'
                      }`}>
                        {selectedPlanId === plan.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white uppercase tracking-tight">{plan.display_name}</h3>
                        <p className={`text-sm ${selectedPlanId === plan.id ? 'text-blue-100' : 'text-slate-400'} font-medium`}>
                          R{(billingCycle === 'annual' ? plan.price_annual / 12 : plan.price_monthly).toLocaleString()}/month
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-10">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 text-white/60 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] hover:bg-blue-500 disabled:opacity-50 shadow-xl shadow-blue-900/50"
              >
                {loading ? 'Processing...' : 'Complete Registration →'}
              </button>
            </div>
          </div>
        </div>
    );
  }

  // ========================================
  // STEP 3: REDIRECTING TO PAYFAST
  // ========================================

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl p-12 max-w-md w-full text-center border border-white/20">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Account Created!
          </h2>
          <p className="text-slate-400 font-medium tracking-wide">
            Redirecting to secure payment setup...
          </p>
        </div>

        <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto" />

        {/* Hidden form that auto-submits to PayFast */}
        {paymentData && (
          <form
            ref={paymentFormRef}
            action={paymentData.payfast_payment_url}
            method="POST"
            style={{ display: 'none' }}
          >
            {Object.entries(paymentData.payfast_payment_data).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value as string} />
            ))}
          </form>
        )}
      </div>
    </div>
  );
}
