import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = (() => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-500', width: 'w-1/3' };
    if (score <= 3) return { label: 'Fair', color: 'bg-yellow-400', textColor: 'text-yellow-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600', width: 'w-full' };
  })();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundImage: "url('/auth-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-500 text-sm mb-6">This password reset link is invalid or has already been used.</p>
          <Link to="/forgot-password" className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-sm">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundImage: "url('/auth-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
          <p className="text-gray-500 text-sm mb-6">Your password has been changed successfully. You can now log in with your new password.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
      toast.success('Password updated successfully!');
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? 'Something went wrong. Please try again.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/auth-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-7 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">Set New Password</h1>
            <p className="text-blue-100 text-sm mt-1">Choose a strong password for your account</p>
          </div>

          <div className="px-8 py-7">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${passwordStrength.color} ${passwordStrength.width}`} />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${passwordStrength.textColor}`}>{passwordStrength.label} password</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 8}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Updating password…</>
                ) : (
                  'Update Password'
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
