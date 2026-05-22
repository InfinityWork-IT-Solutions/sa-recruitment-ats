import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useAuthStore } from './store/auth';
import apiClient from './lib/api-client';
import { MailCheck, X, RefreshCw } from 'lucide-react';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';

// Auth Pages
import UnifiedLoginPage from './pages/auth/UnifiedLoginPage';
import UnifiedRegisterPage from './pages/auth/UnifiedRegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import VerifyEmailRequired from './pages/auth/VerifyEmailRequired';
import PublicJobsPage from './pages/PublicJobsPage';
import PublicJobDetailPage from './pages/PublicJobDetailPage';

// Legal Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';

// Recruiter Subscription & Registration
import PricingPage from './pages/recruiter/PricingPage';
import SubscriptionSettings from './pages/recruiter/SubscriptionSettings';

// Dashboard Pages
import CandidateDashboard from './pages/dashboard/CandidateDashboard';
import CandidateProfilePage from './pages/dashboard/CandidateProfilePage';

// Jobs
import JobsPage from './pages/jobs/JobsPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CreateJobPage from './pages/jobs/CreateJobPage';

// Candidates
import CandidateDetailPage from './pages/candidates/CandidateDetailPage';
import MyAssessments from './pages/candidates/MyAssessments';
import ApplicationTrackerPage from './pages/candidates/ApplicationTrackerPage';
import SavedJobsPage from './pages/candidates/SavedJobsPage';
import OfferViewPage from './pages/candidates/OfferViewPage';

// Applications
import ApplicationsPage from './pages/applications/ApplicationsPage';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage';
import KanbanBoardPage from './pages/applications/KanbanBoardPage';

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// Settings
import SettingsPage from './pages/settings/SettingsPage';

// Client Portal Pages
import ClientDashboard from './pages/clients/Dashboard';
import ClientCandidatesPage from './pages/clients/CandidatesPage';
import ClientJobsPage from './pages/clients/JobsPage';
import ClientTeamPage from './pages/clients/TeamManagementPage';
import ClientSettingsPage from './pages/clients/SettingsPage';
import ClientIntegrationsSettingsPage from './pages/clients/IntegrationsSettingsPage';
import CompanyProfile from './pages/clients/CompanyProfile';
import AIDecisionDashboard from './pages/clients/AIDecisionDashboard';
import InterviewsPage from './pages/clients/InterviewsPage';
import OffersPage from './pages/clients/OffersPage';
import TalentPoolPage from './pages/clients/TalentPoolPage';
import JobTemplatesPage from './pages/clients/JobTemplatesPage';
import OnboardingChecklistPage from './pages/clients/OnboardingChecklistPage';
import CareerPageSettingsPage from './pages/clients/CareerPageSettingsPage';
import EmailSequencesPage from './pages/clients/EmailSequencesPage';
import CustomReportsPage from './pages/analytics/CustomReportsPage';
import PublicCareerPage from './pages/public/PublicCareerPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminCompanyDetail from './pages/admin/AdminCompanyDetail';

// Video Screening
import VideoScreeningLanding from './pages/video-screening/VideoScreeningLanding';
import VideoRecordingPage from './pages/video-screening/VideoRecordingPage';
import VideoScreeningComplete from './pages/video-screening/VideoScreeningComplete';
import RecruiterVideoReviewDashboard from './pages/video-screening/RecruiterVideoReviewDashboard';
import VideoScreeningDetailView from './pages/video-screening/VideoScreeningDetailView';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Email verification banner — shows above the page, doesn't block
function EmailVerificationBanner() {
  const { user, refreshUser } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!user || user.is_verified !== false || dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await apiClient.post('/auth/resend-verification');
      toast.success(res.data?.message || 'Verification email sent — check your inbox!');
    } catch {
      toast.error('Failed to send email. Check server logs for the verification link.');
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshUser();
      toast.success('Email verified! You now have full access.');
    } catch {
      toast.error('Not verified yet — check your inbox.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 flex items-center gap-3 shadow-lg">
      <MailCheck className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium flex-1">
        Please verify your email — check <strong>{user.email}</strong> for a verification link.
      </span>
      <button
        onClick={handleResend}
        disabled={resending}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
        {resending ? 'Sending…' : 'Resend'}
      </button>
      <button
        onClick={handleCheck}
        disabled={checking}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
        {checking ? 'Checking…' : "I've verified"}
      </button>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Synchronizing Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if they hit the wrong portal
    if (user.role === 'candidate') return <Navigate to="/candidate-dashboard" replace />;
    if (user.role === 'client') return <Navigate to="/client-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const refreshUser = useAuthStore((state) => state.refreshUser);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <EmailVerificationBanner />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/job-board" element={<PublicJobsPage />} />
          <Route path="/job-board/:jobId" element={<PublicJobDetailPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/p/:slug" element={<PublicCareerPage />} />

          {/* Email verification (public — no auth needed) */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email-required" element={<VerifyEmailRequired />} />

          {/* Video Screening Routes */}
          <Route path="/video-screening/:access_token" element={<VideoScreeningLanding />} />
          <Route path="/video-screening/:access_token/record" element={<VideoRecordingPage />} />
          <Route path="/video-screening/:access_token/complete" element={<VideoScreeningComplete />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<UnifiedLoginPage />} />
            <Route path="/login/admin" element={<UnifiedLoginPage />} />
            <Route path="/register" element={<UnifiedRegisterPage />} />
          </Route>

          {/* Candidate Portal */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate/profile" element={<CandidateProfilePage />} />
            <Route path="/candidate/jobs" element={<JobsPage />} />
            <Route path="/candidate/applications" element={<ApplicationTrackerPage />} />
            <Route path="/candidate/saved-jobs" element={<SavedJobsPage />} />
            <Route path="/candidate/offers" element={<OfferViewPage />} />
            <Route path="/candidate/assessments" element={<MyAssessments />} />
            <Route path="/candidate-dashboard" element={<Navigate to="/candidate/assessments" replace />} />
          </Route>

          {/* Company Portal */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
            <Route path="/company/dashboard" element={<ClientDashboard />} />
            <Route path="/company/profile" element={<CompanyProfile />} />
            <Route path="/company/jobs" element={<ClientJobsPage />} />
            <Route path="/company/candidates" element={<ClientCandidatesPage />} />
            <Route path="/company/applications" element={<ApplicationsPage />} />
            <Route path="/company/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/company/team" element={<ClientTeamPage />} />
            <Route path="/company/settings" element={<ClientSettingsPage />} />
            <Route path="/company/settings/integrations" element={<ClientIntegrationsSettingsPage />} />
            <Route path="/company/settings/billing" element={<SubscriptionSettings />} />
            <Route path="/company/analytics" element={<AnalyticsPage />} />
            <Route path="/company/analytics/reports" element={<CustomReportsPage />} />
            <Route path="/company/interviews" element={<InterviewsPage />} />
            <Route path="/company/offers" element={<OffersPage />} />
            <Route path="/company/talent-pool" element={<TalentPoolPage />} />
            <Route path="/company/templates" element={<JobTemplatesPage />} />
            <Route path="/company/onboarding/:appId" element={<OnboardingChecklistPage />} />
            <Route path="/company/settings/career-page" element={<CareerPageSettingsPage />} />
            <Route path="/company/settings/email-sequences" element={<EmailSequencesPage />} />
            {/* Legacy redirect */}
            <Route path="/client-dashboard" element={<Navigate to="/company/dashboard" replace />} />
          </Route>

          {/* Admin Portal (Platform Management) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/companies" element={<UserManagement />} />
            <Route path="/admin/companies/:id" element={<AdminCompanyDetail />} />
            <Route path="/admin/jobs" element={<UserManagement />} />
            <Route path="/admin/applications" element={<UserManagement />} />
            <Route path="/admin/candidates" element={<UserManagement />} />
          </Route>

          {/* Shared Routes (Accessible by all roles) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'candidate', 'client']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/billing" element={<SubscriptionSettings />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/jobs/:jobId/kanban" element={<KanbanBoardPage />} />
            <Route path="/company/video-screenings" element={<RecruiterVideoReviewDashboard />} />
            <Route path="/company/video-screening/:screening_id" element={<VideoScreeningDetailView />} />
            <Route path="/automation/decisions" element={<AIDecisionDashboard />} />
          </Route>

          {/* Catch all - dynamic redirect based on role */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
