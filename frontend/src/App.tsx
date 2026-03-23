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

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import CandidateDashboard from './pages/dashboard/CandidateDashboard';
import CompanyDashboard from './pages/dashboard/CompanyDashboard';

// Jobs
import JobsPage from './pages/jobs/JobsPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CreateJobPage from './pages/jobs/CreateJobPage';

// Candidates
import CandidatesPage from './pages/candidates/CandidatesPage';
import CandidateDetailPage from './pages/candidates/CandidateDetailPage';
import CreateCandidatePage from './pages/candidates/CreateCandidatesPage';

// Applications
import ApplicationsPage from './pages/applications/ApplicationsPage';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage';
import KanbanBoardPage from './pages/applications/KanbanBoardPage';

// Clients
import ClientCompaniesPage from './pages/clients/ClientCompaniesPage';

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// Settings
import SettingsPage from './pages/settings/SettingsPage';

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
    if (user.role === 'candidate') return <Navigate to="/candidate/dashboard" replace />;
    if (user.role === 'client') return <Navigate to="/company/dashboard" replace />;
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

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<UnifiedLoginPage />} />
            <Route path="/register" element={<UnifiedRegisterPage />} />
          </Route>

          {/* Recruiter Dashboard (Existing) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['agency_admin', 'recruiter', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/create" element={<CreateJobPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/candidates/create" element={<CreateCandidatePage />} />
            <Route path="/candidates/:id" element={<CandidateDetailPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/jobs/:jobId/kanban" element={<KanbanBoardPage />} />
            <Route path="/clients" element={<ClientCompaniesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
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
            <Route path="/candidate/jobs" element={<JobsPage />} />
            <Route path="/candidate/applications" element={<ApplicationsPage />} />
          </Route>

          {/* Company Portal */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/client-dashboard" element={<CompanyDashboard />} />
            <Route path="/company/jobs" element={<JobsPage />} />
            <Route path="/company/candidates" element={<div>AI Matched Candidates (Coming Soon)</div>} />
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
