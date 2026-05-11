import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, Users, Building2, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  user_type: z.enum(['candidate', 'company', 'recruiter']),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function UnifiedLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type') as 'candidate' | 'company' | 'recruiter' | null;

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user_type: (urlType as any) || 'candidate',
    },
  });

  // Effect to handle URL parameter changes
  useEffect(() => {
    if (urlType && ['candidate', 'company', 'recruiter'].includes(urlType)) {
      setValue('user_type', urlType as any);
    }
  }, [urlType, setValue]);

  const selectedUserType = watch('user_type');

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.user_type);
    } catch (error: any) {
      console.error('Login failed:', error);
      setError('root', { 
        type: 'manual', 
        message: error.response?.data?.detail || error.message || 'Login failed. Please check your credentials.' 
      });
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
    <div className="max-w-xl w-full mx-auto px-4 sm:px-0">
      <Link
        to="/"
        className="fixed top-8 left-8 flex items-center space-x-2 text-white/60 hover:text-white transition-colors z-50 group"
      >
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="hidden sm:inline font-bold tracking-widest text-xs uppercase">Back to Home</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-10">
        <div className={`inline-flex items-center justify-center w-20 h-20 ${colors} rounded-3xl mb-6 shadow-2xl shadow-blue-500/20`}>
          {currentUserType && <currentUserType.icon className="w-10 h-10 text-white" />}
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-slate-400 font-medium">
          Secure access to your recruitment portal
        </p>
      </div>

      {/* Glass Login Card */}
      <div className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/20 relative overflow-hidden">
        {/* Decorative subtle light */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative z-10">
          
          {errors.root && (
            <div className="bg-red-500/20 text-red-200 p-4 rounded-2xl text-sm border border-red-500/30 font-medium backdrop-blur-md">
              {errors.root.message}
            </div>
          )}

          {/* User Type Selector */}
          {!urlType && (
            <div className="grid grid-cols-3 gap-4">
              {userTypes.map((type) => {
                const isSelected = selectedUserType === type.value;
                return (
                  <label
                    key={type.value}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'bg-white/20 border-white/50 shadow-lg'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input type="radio" value={type.value} {...register('user_type')} className="sr-only" />
                    <type.icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-white/40'}`}>
                      {type.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-md placeholder:text-white/20"
                placeholder="name@example.com"
              />
              {errors.email && <p className="mt-2 text-xs text-red-400 font-bold ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-md placeholder:text-white/20 pr-16"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-xs text-red-400 font-bold ml-1">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input type="checkbox" className="w-5 h-5 bg-white/5 border-white/20 rounded-lg focus:ring-blue-500/50 text-blue-600" />
              <span className="text-sm text-white/60 group-hover:text-white transition-colors">Keep me signed in</span>
            </label>
            <Link to="/forgot-password" size="sm" className="text-sm text-blue-400 hover:text-blue-300 font-bold">
              Forgot?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-900/50 ${
              isSubmitting ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'
            } text-white`}
          >
            {isSubmitting ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-10 text-center relative z-10">
          <p className="text-white/40 font-medium">
            Don't have an account?{' '}
            <Link to={`/register?type=${selectedUserType}`} className="text-white hover:text-blue-400 font-black underline underline-offset-4 decoration-2 decoration-blue-500/30">
              Join the beta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
