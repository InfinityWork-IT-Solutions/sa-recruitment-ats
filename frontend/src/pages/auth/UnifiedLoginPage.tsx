import { useState } from 'react';
import { Link } from 'react-router-dom';
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

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user_type: 'candidate',
    },
  });

  const selectedUserType = watch('user_type');

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.user_type);
      // Auth store will redirect based on actual user role from backend
    } catch (error: any) {
      console.error('Login failed:', error);
      setError('root', { 
        type: 'manual', 
        message: error.response?.data?.detail || error.message || 'Login failed. Please check your credentials and user type.' 
      });
    }
  };

  // User type options with icons and colors
  const userTypes = [
    {
      value: 'candidate',
      label: 'Job Seeker',
      icon: User,
      color: 'green',
      description: 'Find your next opportunity',
    },
    {
      value: 'company',
      label: 'Company',
      icon: Building2,
      color: 'blue',
      description: 'Hire top talent',
    },
    {
      value: 'recruiter',
      label: 'Recruiter',
      icon: Users,
      color: 'purple',
      description: 'Manage your agency',
    },
  ];

  const currentUserType = userTypes.find((t) => t.value === selectedUserType);
  const colorClasses = {
    green: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      ring: 'focus:ring-green-500',
      text: 'text-green-600',
      bgLight: 'bg-green-100',
      border: 'border-green-600',
    },
    blue: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      ring: 'focus:ring-blue-500',
      text: 'text-blue-600',
      bgLight: 'bg-blue-100',
      border: 'border-blue-600',
    },
    purple: {
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      ring: 'focus:ring-purple-500',
      text: 'text-purple-600',
      bgLight: 'bg-purple-100',
      border: 'border-purple-600',
    },
  };

  const colors = colorClasses[currentUserType?.color as keyof typeof colorClasses] || colorClasses.green;

  return (
    <div className="max-w-xl w-full mx-auto">
      {/* Back to Home moved to top fixed if needed, or just kept here */}
      <Link
        to="/"
        className="fixed top-4 left-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors z-50"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${colors.bg} rounded-2xl mb-4 shadow-lg`}>
          {currentUserType && <currentUserType.icon className="w-8 h-8 text-white" />}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to RecruitPro SA
        </h1>
        <p className="text-gray-600">
          Sign in to your account
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-100 mx-4 sm:mx-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {errors.root && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200 font-medium">
              {errors.root.message}
            </div>
          )}

          {/* User Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              I am a...
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {userTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedUserType === type.value;
                const typeColors = colorClasses[type.color as keyof typeof colorClasses];
                
                return (
                  <label
                    key={type.value}
                    className={`relative cursor-pointer rounded-xl p-4 transition-all duration-200 ${
                      isSelected
                        ? `${typeColors.bgLight} ring-2 ${typeColors.border} shadow-md`
                        : 'bg-gray-50 border border-gray-200 hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register('user_type')}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className={`w-8 h-8 ${isSelected ? typeColors.text : 'text-gray-400'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider text-center ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                        {type.label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.user_type && (
              <p className="mt-1 text-sm text-red-600">{errors.user_type.message}</p>
            )}
          </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring} focus:border-transparent transition-all`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring} focus:border-transparent transition-all pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className={`w-4 h-4 ${colors.text} border-gray-300 rounded focus:ring-2 ${colors.ring}`}
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className={`text-sm ${colors.text} hover:underline font-medium`}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full ${colors.bg} ${colors.hover} text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className={`${colors.text} hover:underline font-semibold`}>
              Sign up here
            </Link>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {currentUserType?.description}
          </p>
        </div>
      </div>
    );
}
