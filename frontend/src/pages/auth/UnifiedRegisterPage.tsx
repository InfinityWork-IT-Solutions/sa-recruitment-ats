import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, Users, Building2, User, Check } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

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
        message: 'Consent is required (POPIA compliance)',
      }),
    }).refine((data) => data.password === data.confirm_password, {
      message: "Passwords don't match",
      path: ['confirm_password'],
    });
  }

  return z.object({
    ...baseSchema,
    company_name: userType === 'company' ? z.string().min(1, 'Company name is required') : z.string().optional(),
    agency_name: userType === 'recruiter' ? z.string().min(1, 'Agency name is required') : z.string().optional(),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    country: z.string().min(1, 'Country is required'),
    subscription_plan: z.enum(['starter', 'professional', 'enterprise']),
    accept_terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept terms',
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

  useEffect(() => {
    if (urlType && ['candidate', 'company', 'recruiter'].includes(urlType)) {
      setUserType(urlType);
      setValue('user_type', urlType);
      reset({ user_type: urlType, subscription_plan: urlPlan || 'professional' });
    }
  }, [urlType, urlPlan, reset, setValue]);

  const selectedUserType = watch('user_type');
  const selectedPlan = watch('subscription_plan');

  const onSubmit = async (data: any) => {
    try {
      await registerUser({ ...data, role: data.user_type });
      if (data.user_type === 'candidate') navigate('/candidate-dashboard');
      else if (data.user_type === 'company') navigate('/client-dashboard');
      else navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error);
    }
  };

  const userTypes = [
    { value: 'candidate', label: 'Job Seeker', icon: User, color: 'emerald' },
    { value: 'company', label: 'Company', icon: Building2, color: 'blue' },
    { value: 'recruiter', label: 'Recruiter', icon: Users, color: 'purple' },
  ];

  const currentUserType = userTypes.find((t) => t.value === selectedUserType);
  const colors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600'
  }[currentUserType?.color as 'emerald' | 'blue' | 'purple'] || 'bg-blue-600';

  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-0">
      <Link to="/login" className="fixed top-8 left-8 flex items-center space-x-2 text-white/60 hover:text-white transition-colors z-50 group">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="hidden sm:inline font-bold tracking-widest text-xs uppercase">Back to Login</span>
      </Link>

      <div className="text-center mb-10">
        <div className={`inline-flex items-center justify-center w-20 h-20 ${colors} rounded-3xl mb-6 shadow-2xl`}>
          {currentUserType && <currentUserType.icon className="w-10 h-10 text-white" />}
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Create Account</h1>
        <p className="text-slate-400 font-medium tracking-wide">Join the future of recruitment</p>
      </div>

      <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/20 mb-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* User Type Selector */}
          {!urlType && (
            <div className="grid grid-cols-3 gap-4">
              {userTypes.map((type) => {
                const isSelected = selectedUserType === type.value;
                return (
                  <label
                    key={type.value}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border flex flex-col items-center gap-2 ${
                      isSelected ? 'bg-white/20 border-white/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input type="radio" value={type.value} {...register('user_type')} onChange={(e) => setUserType(e.target.value as any)} className="sr-only" />
                    <type.icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-white/40'}`}>
                      {type.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Pricing Selector for Business */}
          {(selectedUserType === 'company' || selectedUserType === 'recruiter') && (
            <div className="space-y-4">
              <label className="text-xs font-black text-white/60 uppercase tracking-[0.2em] ml-1">Select Plan</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'starter', name: 'Starter', price: 'R2,030' },
                  { id: 'professional', name: 'Pro', price: 'R4,199', popular: true },
                  { id: 'enterprise', name: 'Enterprise', price: 'Custom' },
                ].map((plan) => (
                  <label
                    key={plan.id}
                    className={`relative cursor-pointer rounded-2xl border p-5 transition-all ${
                      selectedPlan === plan.id ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-900/40' : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <input type="radio" value={plan.id} {...register('subscription_plan')} className="sr-only" />
                    {plan.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-[8px] font-black px-3 py-1 rounded-full uppercase">Popular</span>}
                    <div className="text-center">
                      <p className={`font-black text-xs uppercase tracking-widest ${selectedPlan === plan.id ? 'text-white' : 'text-white/40'}`}>{plan.name}</p>
                      <p className="text-xl font-black mt-1 text-white">{plan.price}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Conditional Business Name */}
            {selectedUserType !== 'candidate' && (
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">
                  {selectedUserType === 'company' ? 'Company Name' : 'Agency Name'}
                </label>
                <input
                  {...register(selectedUserType === 'company' ? 'company_name' : 'agency_name')}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all backdrop-blur-md"
                  placeholder={selectedUserType === 'company' ? 'Acme Corp' : 'Elite Talent Agency'}
                />
              </div>
            )}

            {/* Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">First Name</label>
                <input {...register('first_name')} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="John" />
              </div>
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Last Name</label>
                <input {...register('last_name')} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="Doe" />
              </div>
            </div>

            {/* Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Email</label>
                <input {...register('email')} type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Phone</label>
                <input {...register('phone')} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="+27 82 123 4567" />
              </div>
            </div>

            {/* Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">City</label>
                <input {...register('city')} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="Cape Town" />
              </div>
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Province</label>
                <input {...register('province')} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="Western Cape" />
              </div>
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Country</label>
                <input {...register('country')} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="South Africa" />
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all pr-16" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">Confirm</label>
                <div className="relative">
                  <input {...register('confirm_password')} type={showConfirmPassword ? 'text' : 'password'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all pr-16" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>
            </div>

            {/* Consent */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <label className="flex items-start space-x-4 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-1">
                  <input {...register(selectedUserType === 'candidate' ? 'consent_to_contact' : 'accept_terms')} type="checkbox" className="w-6 h-6 rounded-lg bg-white/5 border-white/20 checked:bg-blue-600 transition-all appearance-none cursor-pointer" />
                  <Check className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm text-white/60 group-hover:text-white transition-colors leading-relaxed">
                  {selectedUserType === 'candidate' 
                    ? 'I consent to be contacted by verified recruiters and employers regarding career opportunities (POPIA compliant).'
                    : 'I accept the Terms of Service and Privacy Policy for business accounts.'
                  }
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-900/50 ${
                isSubmitting ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'
              } text-white`}
            >
              {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </div>
        </form>

        <div className="mt-10 text-center relative z-10">
          <p className="text-white/40 font-medium">
            Already have an account?{' '}
            <Link to={`/login?type=${selectedUserType}`} className="text-white hover:text-blue-400 font-black underline underline-offset-4 decoration-2 decoration-blue-500/30">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
