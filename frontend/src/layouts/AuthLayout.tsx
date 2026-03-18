import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-blue-600 mb-2">RecruitPro SA</h1>
                    <p className="text-gray-600">AI-Powered Recruitment ATS</p>
                </div>

                {/* Auth Form Container */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <Outlet />
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-600">
                    <p>© 2026 InfinityWork IT Solutions (Pty) Ltd</p>
                    <p className="mt-1">Cape Town, South Africa</p>
                </div>
            </div>
        </div>
    );
}
