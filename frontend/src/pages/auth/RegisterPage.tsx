import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    agency_name: z.string().min(1, 'Agency name is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const userType = searchParams.get('type');

    const register = useAuthStore((state) => state.register);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register: registerField,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        try {
            // Restructure data to match backend RegisterRequest
            const registerData = {
                agency: {
                    name: data.agency_name,
                    email: data.email, // Using user email as agency email for now
                },
                user: {
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                },
            };
            await register(registerData as any);
            navigate('/dashboard');
        } catch (error) {
            // Error handled by interceptor
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>

            {userType && (
                <div className="mb-4 text-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        Registering as {userType === 'recruiter' ? 'Recruiter' : 'Company'}
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                            First name
                        </label>
                        <input
                            {...registerField('first_name')}
                            type="text"
                            id="first_name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John"
                        />
                        {errors.first_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Last name
                        </label>
                        <input
                            {...registerField('last_name')}
                            type="text"
                            id="last_name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Doe"
                        />
                        {errors.last_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                    </label>
                    <input
                        {...registerField('email')}
                        type="email"
                        id="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="you@company.com"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                </div>

                {/* Agency name */}
                <div>
                    <label htmlFor="agency_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Agency name
                    </label>
                    <input
                        {...registerField('agency_name')}
                        type="text"
                        id="agency_name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your Recruitment Agency"
                    />
                    {errors.agency_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.agency_name.message}</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        {...registerField('password')}
                        type="password"
                        id="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                    />
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Create account'
                    )}
                </button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
