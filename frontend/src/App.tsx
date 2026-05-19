import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';

// Auth Pages
import UnifiedLoginPage from './pages/auth/UnifiedLoginPage';
import UnifiedRegisterPage from './pages/auth/UnifiedRegisterPage';
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

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

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
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/job-board" element={<PublicJobsPage />} />
          <Route path="/job-board/:jobId" element={<PublicJobDetailPage />} />
          <Route path="/pricing" element={<PricingPage />} />

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
            <Route path="/candidate/applications" element={<ApplicationsPage />} />
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
            <Route path="/admin/users" element={<UserManagement />} />
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
