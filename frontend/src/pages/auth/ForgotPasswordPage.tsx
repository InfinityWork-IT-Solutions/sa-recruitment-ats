import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true);
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
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-7 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">Forgot Password?</h1>
            <p className="text-blue-100 text-sm mt-1">
              {submitted ? "Check your inbox" : "Enter your email and we'll send a reset link"}
            </p>
          </div>

          <div className="px-8 py-7">
            {submitted ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Reset link sent</h2>
                <p className="text-sm text-gray-500 mb-6">
                  If <strong>{email}</strong> is registered, you'll receive a password reset link within a few minutes. Check your spam folder if you don't see it.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
