import apiClient from '@/lib/api-client';
import { DashboardMetrics } from '@/types/api';

export const analyticsService = {
    // Get dashboard metrics
    getDashboard: async (periodDays: number = 30) => {
        const response = await apiClient.get<DashboardMetrics>(
            '/analytics/dashboard',
            { params: { period_days: periodDays } }
        );
        return response.data;
    },

    // Get applications over time (for charts)
    getApplicationsOverTime: async (periodDays: number = 30) => {
        const response = await apiClient.get('/analytics/applications-over-time', {
            params: { period_days: periodDays },
        });
        return response.data;
    },

    // Get applications by status (for pie chart)
    getApplicationsByStatus: async () => {
        const response = await apiClient.get('/analytics/applications-by-status');
        return response.data;
    },

    // Get top performing jobs
    getTopJobs: async (limit: number = 10) => {
        const response = await apiClient.get('/analytics/top-jobs', {
            params: { limit },
        });
        return response.data;
    },

    // Get recruiter performance
    getRecruiterPerformance: async () => {
        const response = await apiClient.get('/analytics/recruiter-performance');
        return response.data;
    },

    // Get source effectiveness
    getSourceEffectiveness: async () => {
        const response = await apiClient.get('/analytics/source-effectiveness');
        return response.data;
    },

    // Export applications to CSV
    exportApplicationsCSV: async (status?: string) => {
        const response = await apiClient.get('/analytics/export/applications/csv', {
            params: { status },
            responseType: 'blob',
        });
        return response.data;
    },

    // Export candidates to Excel
    exportCandidatesExcel: async () => {
        const response = await apiClient.get('/analytics/export/candidates/excel', {
            responseType: 'blob',
        });
        return response.data;
    },
};
