import apiClient from '@/lib/api-client';
import { Application, ApplicationPipeline } from '@/types/api';

export interface ApplicationFilters {
    job_id?: string;
    candidate_id?: string;
    status?: string;
    assigned_to?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface CreateApplicationData {
    job_id: string;
    candidate_id: string;
    cover_letter?: string;
    source?: string;
}

export const applicationsService = {
    // Get all applications
    getApplications: async (filters?: ApplicationFilters) => {
        const response = await apiClient.get<{ applications: Application[]; total: number }>(
            '/applications/',
            { params: filters }
        );
        return response.data;
    },

    // Get single application
    getApplication: async (id: string) => {
        const response = await apiClient.get<Application>(`/applications/${id}`);
        return response.data;
    },

    // Create application
    createApplication: async (data: CreateApplicationData) => {
        const response = await apiClient.post<Application>('/applications/', data);
        return response.data;
    },

    // Update application
    updateApplication: async (id: string, data: Partial<Application>) => {
        const response = await apiClient.put<Application>(`/applications/${id}`, data);
        return response.data;
    },

    // Delete application
    deleteApplication: async (id: string) => {
        await apiClient.delete(`/applications/${id}`);
    },

    // Get pipeline for job (Kanban board)
    getPipeline: async (jobId: string) => {
        const response = await apiClient.get<ApplicationPipeline>(`/applications/pipeline/${jobId}`);
        return response.data;
    },

    // Screen application
    screenApplication: async (id: string, data: { passed: boolean; score: number; notes?: string }) => {
        const response = await apiClient.post<Application>(`/applications/${id}/screen`, data);
        return response.data;
    },

    // Schedule interview
    scheduleInterview: async (id: string, data: { interview_time: string; notes?: string }) => {
        const response = await apiClient.post<Application>(`/applications/${id}/interview/schedule`, data);
        return response.data;
    },

    // Complete interview
    completeInterview: async (id: string, data: { rating: number; feedback: string }) => {
        const response = await apiClient.post<Application>(`/applications/${id}/interview/complete`, data);
        return response.data;
    },

    // Make offer
    makeOffer: async (id: string, data: { amount: number; notes?: string }) => {
        const response = await apiClient.post<Application>(`/applications/${id}/offer`, data);
        return response.data;
    },

    // Hire candidate
    hire: async (id: string) => {
        const response = await apiClient.post<Application>(`/applications/${id}/hire`);
        return response.data;
    },

    // Reject application
    reject: async (id: string, data: { reason: string; notes?: string }) => {
        const response = await apiClient.post<Application>(`/applications/${id}/reject`, data);
        return response.data;
    },

    // Get statistics
    getStatistics: async () => {
        const response = await apiClient.get('/applications/statistics');
        return response.data;
    },
};
