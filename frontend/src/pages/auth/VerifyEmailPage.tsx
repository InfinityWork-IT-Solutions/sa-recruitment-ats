import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import apiClient from '@/lib/api-client';

type State = 'loading' | 'success' | 'error' | 'missing';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [state, setState] = useState<State>(token ? 'loading' : 'missing');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) return;
        apiClient
            .post(`/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then((res) => {
                setMessage(res.data.message || 'Email verified successfully.');
                setState('success');
            })
            .catch((err) => {
                setMessage(
                    err.response?.data?.detail ||
                    'This link is invalid or has expired. Please request a new verification email.'
                );
                setState('error');
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-6">
                {state === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                        <h2 className="text-2xl font-bold text-gray-900">Verifying your email…</h2>
                        <p className="text-gray-500">Please wait a moment.</p>
                    </>
                )}

                {state === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                        <p className="text-gray-600">{message}</p>
                        <Link
                            to="/login"
                            className="inline-block w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Sign In Now
                        </Link>
                    </>
                )}

                {state === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500">
                            Log in to your account and click "Resend verification email" from the dashboard.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Back to Login
                        </Link>
                    </>
                )}

                {state === 'missing' && (
                    <>
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                            <Mail className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">No Token Found</h2>
                        <p className="text-gray-600">
                            This link is incomplete. Please use the full link from the verification email.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Back to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
