import apiClient from '@/lib/api-client';
import { Job, PaginatedResponse } from '@/types/api';

export interface JobFilters {
    search?: string;
    status?: string;
    employment_type?: string;
    location_city?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface CreateJobData {
    client_company_id?: string;
    title: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
    benefits?: string;
    location: string;
    city?: string;
    province?: string;
    employment_type: string;
    experience_level?: string;
    years_of_experience_min?: number;
    years_of_experience_max?: number;
    education_level?: string;
    skills?: string[];
    salary_min?: number;
    salary_max?: number;
    // Integration platforms
    post_to_pnet?: boolean;
    post_to_indeed?: boolean;
    post_to_linkedin?: boolean;
}

export const jobsService = {
    // Get all jobs
    getJobs: async (filters?: JobFilters) => {
        const response = await apiClient.get<{ jobs: Job[]; total: number; has_more: boolean }>(
            '/jobs/',
            { params: filters }
        );
        return response.data;
    },

    // Get single job
    getJob: async (id: string) => {
        const response = await apiClient.get<Job>(`/jobs/${id}`);
        return response.data;
    },

    // Create job
    createJob: async (data: CreateJobData) => {
        const response = await apiClient.post<Job>('/jobs/', data);
        return response.data;
    },

    // Update job
    updateJob: async (id: string, data: Partial<CreateJobData>) => {
        const response = await apiClient.put<Job>(`/jobs/${id}`, data);
        return response.data;
    },

    // Delete job
    deleteJob: async (id: string) => {
        await apiClient.delete(`/jobs/${id}`);
    },

    // Update job status
    updateJobStatus: async (id: string, status: string) => {
        const response = await apiClient.patch<Job>(`/jobs/${id}/status`, { status });
        return response.data;
    },

    // Get job statistics
    getJobStatistics: async () => {
        const response = await apiClient.get('/jobs/statistics');
        return response.data;
    },
};
