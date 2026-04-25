import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Users, Briefcase, Target, Eye, EyeOff, ArrowLeft } from 'lucide-react';

type UserType = 'candidate' | 'company' | 'recruiter' | null;

export default function Register() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Read user type from URL parameter
    const urlUserType = searchParams.get('type') as UserType;
    const jobId = searchParams.get('job'); // Optional: if applying to specific job
    const plan = searchParams.get('plan'); // Optional: subscription plan selection
    
    const [selectedType, setSelectedType] = useState<UserType>(urlUserType || null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState({
        // Common fields
        email: '',
        password: '',
        confirmPassword: '',
        
        // Candidate fields
        firstName: '',
        lastName: '',
        phone: '',
        
        // Company fields
        companyName: '',
        companySize: '',
        industry: '',
        
        // Recruiter fields
        recruiterName: '',
        agency: ''
    });

    // If URL has type parameter, auto-select that type
    useEffect(() => {
        if (urlUserType && ['candidate', 'company', 'recruiter'].includes(urlUserType)) {
            setSelectedType(urlUserType);
        }
    }, [urlUserType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (formData.password.length < 8) {
            alert('Password must be at least 8 characters!');
            return;
        }

        setLoading(true);
        
        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userType: selectedType,
                    jobId: jobId || null, // Include job ID if applying
                    plan: plan || 'lite' // Include subscription plan
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                alert('Registration successful! Please check your email to verify your account.');
                navigate('/login');
            } else {
                alert(data.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderTypeSelector = () => {
        // If URL parameter specified a type, don't show selector
        if (urlUserType) {
            return null;
        }

        return (
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Account Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        type="button"
                        onClick={() => setSelectedType('candidate')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                            selectedType === 'candidate'
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                        <Target className={`w-8 h-8 mx-auto mb-3 ${
                            selectedType === 'candidate' ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <h3 className="font-bold text-gray-900 mb-1">Job Seeker</h3>
                        <p className="text-sm text-gray-600">Find and apply to jobs</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedType('company')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                            selectedType === 'company'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        <Briefcase className={`w-8 h-8 mx-auto mb-3 ${
                            selectedType === 'company' ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <h3 className="font-bold text-gray-900 mb-1">Company</h3>
                        <p className="text-sm text-gray-600">Post jobs and hire talent</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedType('recruiter')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                            selectedType === 'recruiter'
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                        }`}
                    >
                        <Users className={`w-8 h-8 mx-auto mb-3 ${
                            selectedType === 'recruiter' ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <h3 className="font-bold text-gray-900 mb-1">Recruiter</h3>
                        <p className="text-sm text-gray-600">Manage recruitment pipeline</p>
                    </button>
                </div>
            </div>
        );
    };

    const renderFormFields = () => {
        if (!selectedType) return null;

        return (
            <div className="space-y-4">
                {/* Candidate Fields */}
                {selectedType === 'candidate' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="+27 12 345 6789"
                            />
                        </div>
                    </>
                )}

                {/* Company Fields */}
                {selectedType === 'company' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Acme Corporation"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Size *
                                </label>
                                <select
                                    required
                                    value={formData.companySize}
                                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select size</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="501+">501+ employees</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Industry *
                                </label>
                                <select
                                    required
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select industry</option>
                                    <option value="technology">Technology</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="finance">Finance</option>
                                    <option value="retail">Retail</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {/* Recruiter Fields */}
                {selectedType === 'recruiter' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.recruiterName}
                                onChange={(e) => setFormData({ ...formData, recruiterName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Jane Smith"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Agency/Company Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.agency}
                                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Elite Recruitment Agency"
                            />
                        </div>
                    </>
                )}

                {/* Common Fields */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-lg font-bold text-white transition-colors ${
                        selectedType === 'candidate' ? 'bg-green-600 hover:bg-green-700' :
                        selectedType === 'company' ? 'bg-blue-600 hover:bg-blue-700' :
                        'bg-purple-600 hover:bg-purple-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Back Button */}
                <button
                    onClick={() => navigate(urlUserType ? '/jobs' : '/')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
                    <p className="text-gray-600">
                        {urlUserType === 'candidate' && 'Join thousands of job seekers finding their dream jobs'}
                        {urlUserType === 'company' && 'Start hiring top talent today'}
                        {urlUserType === 'recruiter' && 'Manage your recruitment pipeline efficiently'}
                        {!urlUserType && 'Get started with RecruitPro SA'}
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <form onSubmit={handleSubmit}>
                        {renderTypeSelector()}
                        {renderFormFields()}
                    </form>

                    {/* Sign In Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
