import { useState } from 'react';
import { MailCheck, RefreshCw, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

export default function VerifyEmailRequired() {
    const { user, logout, refreshUser } = useAuthStore();
    const [resending, setResending] = useState(false);
    const [checking, setChecking] = useState(false);

    const handleResend = async () => {
        setResending(true);
        try {
            await apiClient.post('/auth/resend-verification');
            toast.success('Verification email sent — check your inbox!');
        } catch {
            toast.error('Failed to send email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const handleCheckVerified = async () => {
        setChecking(true);
        try {
            await refreshUser();
            // refreshUser updates the store — if now verified, ProtectedRoute
            // will automatically let them through on next render
        } catch {
            toast.error('Could not refresh your session. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                    <MailCheck className="w-12 h-12 text-blue-600" />
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Verify your email first</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        We sent a verification link to{' '}
                        <span className="font-semibold text-gray-800">{user?.email}</span>.
                        Click the link in that email to activate your account.
                    </p>
                </div>

                {/* Steps hint */}
                <div className="bg-blue-50 rounded-2xl p-4 text-left space-y-2">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">What to do</p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Open the email from <strong>RecruitPro SA</strong></li>
                        <li>Click the <strong>"Verify My Account"</strong> button</li>
                        <li>Come back here and click <strong>"I've verified"</strong></li>
                    </ol>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleCheckVerified}
                        disabled={checking}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking…' : "I've verified — continue"}
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="w-full border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                        {resending ? 'Sending…' : 'Resend verification email'}
                    </button>

                    <button
                        onClick={logout}
                        className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                    </button>
                </div>

                <p className="text-xs text-gray-400">
                    Didn't get an email? Check your spam folder or use the resend button above.
                </p>
            </div>
        </div>
    );
}
