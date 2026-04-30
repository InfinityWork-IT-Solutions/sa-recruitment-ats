import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, Users, Building2, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

// Dynamic schema based on user type
const createRegisterSchema = (userType: string) => {
  const baseSchema = {
    user_type: z.enum(['candidate', 'company', 'recruiter']),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  };

  if (userType === 'candidate') {
    return z.object({
      ...baseSchema,
      city: z.string().min(1, 'City is required'),
      province: z.string().min(1, 'State/Province is required'),
      country: z.string().min(1, 'Country is required'),
      current_job_title: z.string().optional(),
      years_of_experience: z.string().optional(),
      consent_to_contact: z.boolean().refine((val) => val === true, {
        message: 'You must consent to be contacted (POPIA compliance)',
      }),
    }).refine((data) => data.password === data.confirm_password, {
      message: "Passwords don't match",
      path: ['confirm_password'],
    });
  }

  if (userType === 'company') {
    return z.object({
      ...baseSchema,
      company_name: z.string().min(1, 'Company name is required'),
      company_industry: z.string().optional(),
      company_website: z.string().url('Invalid website URL').optional().or(z.literal('')),
      city: z.string().min(1, 'City is required'),
      province: z.string().min(1, 'State/Province is required'),
      country: z.string().min(1, 'Country is required'),
      subscription_plan: z.enum(['starter', 'professional', 'enterprise']),
      accept_terms: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
    }).refine((data) => data.password === data.confirm_password, {
      message: "Passwords don't match",
      path: ['confirm_password'],
    });
  }

  // Recruiter
  return z.object({
    ...baseSchema,
    agency_name: z.string().min(1, 'Agency name is required'),
    agency_website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'State/Province is required'),
    country: z.string().min(1, 'Country is required'),
    subscription_plan: z.enum(['starter', 'professional', 'enterprise']),
    accept_terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  }).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });
};

export default function UnifiedRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type') as 'candidate' | 'company' | 'recruiter' | null;
  const urlPlan = searchParams.get('plan');
  
  const [userType, setUserType] = useState<'candidate' | 'company' | 'recruiter'>(urlType || 'candidate');
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<any>({
    resolver: zodResolver(createRegisterSchema(userType)),
    defaultValues: {
      user_type: userType,
      subscription_plan: urlPlan || 'professional',
    },
  });

  // Effect to handle URL parameter changes
  useEffect(() => {
    if (urlType && ['candidate', 'company', 'recruiter'].includes(urlType)) {
      setUserType(urlType);
      setValue('user_type', urlType);
      reset({ 
        user_type: urlType,
        subscription_plan: urlPlan || 'professional' 
      });
    }
  }, [urlType, urlPlan, reset, setValue]);

  const selectedUserType = watch('user_type') as 'candidate' | 'company' | 'recruiter';
  const selectedPlan = watch('subscription_plan');

  // Update form when user type changes
  const handleUserTypeChange = (newType: 'candidate' | 'company' | 'recruiter') => {
    setUserType(newType);
    reset({ user_type: newType });
  };

  const onSubmit = async (data: any) => {
    try {
      await registerUser({
        ...data,
        role: data.user_type,
      });
      
      // Redirect based on user type
      if (data.user_type === 'candidate') {
        navigate('/candidate-dashboard');
      } else if (data.user_type === 'company') {
        navigate('/client-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
    }
  };

  const userTypes = [
    {
      value: 'candidate',
      label: 'Job Seeker',
      icon: User,
      color: 'green',
    },
    {
      value: 'company',
      label: 'Company',
      icon: Building2,
      color: 'blue',
    },
    {
      value: 'recruiter',
      label: 'Recruiter',
      icon: Users,
      color: 'purple',
    },
  ];

  const colorClasses = {
    green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', ring: 'focus:ring-green-500', text: 'text-green-600', bgLight: 'bg-green-100', border: 'border-green-600' },
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-100', border: 'border-blue-600' },
    purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', ring: 'focus:ring-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-100', border: 'border-purple-600' },
  };

  const currentUserType = userTypes.find((t) => t.value === selectedUserType);
  const colors = colorClasses[currentUserType?.color as keyof typeof colorClasses] || colorClasses.green;

  // Removed saProvinces array since we now use a global text input

  return (
    <div className="max-w-3xl w-full mx-auto">
      <Link to="/login" className="fixed top-4 left-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors z-50">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Login</span>
      </Link>

      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${colors.bg} rounded-2xl mb-4 shadow-lg`}>
          {currentUserType && <currentUserType.icon className="w-8 h-8 text-white" />}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
        <p className="text-gray-600">Join RecruitPro SA today</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-100 mx-4 sm:mx-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User Type Selector - Only show if not specified in URL */}
          {urlType ? (
            <input type="hidden" {...register('user_type')} />
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">I am a...</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {userTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedUserType === type.value;
                  const typeColors = colorClasses[type.color as keyof typeof colorClasses];
                  
                  return (
                    <label
                      key={type.value}
                      className={`relative cursor-pointer rounded-xl p-4 transition-all duration-200 ${
                        isSelected ? `${typeColors.bgLight} ring-2 ${typeColors.border} shadow-sm` : 'bg-gray-50 border border-gray-200 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        {...register('user_type')}
                        onChange={(e) => handleUserTypeChange(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center space-y-2">
                        <Icon className={`w-8 h-8 ${isSelected ? typeColors.text : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                          {type.label}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 my-8"></div>
            </div>
          )}

            {/* Company & Recruiter: Plan Selection */}
            {(selectedUserType === 'company' || selectedUserType === 'recruiter') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Choose Your Plan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'starter', name: 'Starter', price: 'R2,030/mo', seats: '2 seats' },
                    { id: 'professional', name: 'Professional', price: 'R4,199/mo', seats: '5 seats', popular: true },
                    { id: 'enterprise', name: 'Enterprise', price: 'Custom', seats: '10+ seats' },
                  ].map((plan) => (
                    <label
                      key={plan.id}
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedPlan === plan.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input type="radio" value={plan.id} {...register('subscription_plan')} className="sr-only" />
                      {plan.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      <div className="text-center">
                        <p className="font-bold text-gray-900">{plan.name}</p>
                        <p className="text-xl font-bold text-blue-600 mt-1">{plan.price}</p>
                        <p className="text-sm text-gray-600 mt-1">{plan.seats}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Company/Agency Name */}
            {selectedUserType === 'company' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input {...register('company_name')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="ABC Tech Solutions" />
                {errors.company_name && <p className="mt-1 text-sm text-red-600">{(errors.company_name as any).message}</p>}
              </div>
            )}

            {selectedUserType === 'recruiter' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name *</label>
                <input {...register('agency_name')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="Your Recruitment Agency" />
                {errors.agency_name && <p className="mt-1 text-sm text-red-600">{(errors.agency_name as any).message}</p>}
              </div>
            )}

            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input {...register('first_name')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="John" />
                {errors.first_name && <p className="mt-1 text-sm text-red-600">{(errors.first_name as any).message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input {...register('last_name')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="Doe" />
                {errors.last_name && <p className="mt-1 text-sm text-red-600">{(errors.last_name as any).message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input {...register('email')} type="email" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="you@example.com" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{(errors.email as any).message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input {...register('phone')} type="tel" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="+27 82 123 4567" />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{(errors.phone as any).message}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input {...register('city')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="e.g. Cape Town" />
                {errors.city && <p className="mt-1 text-sm text-red-600">{(errors.city as any).message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State / Province *</label>
                <input {...register('province')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="e.g. Western Cape" />
                {errors.province && <p className="mt-1 text-sm text-red-600">{(errors.province as any).message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                <input {...register('country')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="e.g. South Africa" />
                {errors.country && <p className="mt-1 text-sm text-red-600">{(errors.country as any).message}</p>}
              </div>
            </div>

            {/* Candidate-specific fields */}
            {selectedUserType === 'candidate' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Job Title</label>
                  <input {...register('current_job_title')} type="text" className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`} placeholder="Software Developer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <select {...register('years_of_experience')} className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`}>
                    <option value="">Select</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring} pr-12`} placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{(errors.password as any).message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <div className="relative">
                  <input {...register('confirm_password')} type={showConfirmPassword ? 'text' : 'password'} className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring} pr-12`} placeholder="Re-enter password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{(errors.confirm_password as any).message}</p>}
              </div>
            </div>

            {/* Consent/Terms */}
            <div className="bg-gray-50 rounded-lg p-4">
              {selectedUserType === 'candidate' ? (
                <label className="flex items-start space-x-3">
                  <input {...register('consent_to_contact')} type="checkbox" className={`mt-1 w-4 h-4 ${colors.text} rounded`} />
                  <span className="text-sm text-gray-700">I consent to be contacted by recruiters and employers (POPIA compliance) *</span>
                </label>
              ) : (
                <label className="flex items-start space-x-3">
                  <input {...register('accept_terms')} type="checkbox" className={`mt-1 w-4 h-4 ${colors.text} rounded`} />
                  <span className="text-sm text-gray-700">I accept the Terms & Conditions and Privacy Policy *</span>
                </label>
              )}
              {(errors.consent_to_contact || errors.accept_terms) && (
                <p className="mt-1 text-sm text-red-600">{(errors.consent_to_contact || errors.accept_terms)?.message as string}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className={`w-full ${colors.bg} ${colors.hover} text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50`}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to={`/login?type=${selectedUserType}`} 
              className={`${colors.text} hover:underline font-semibold`}
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    );
}
