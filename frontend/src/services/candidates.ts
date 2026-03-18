import apiClient from '@/lib/api-client';
import { Candidate } from '@/types/api';

export interface CandidateFilters {
    search?: string;
    status?: string;
    skills?: string;
    city?: string;
    province?: string;
    years_of_experience_min?: number;
    is_immediately_available?: boolean;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface CreateCandidateData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    city?: string;
    province?: string;
    current_job_title?: string;
    current_company?: string;
    years_of_experience?: number;
    skills?: string[];
    education_level?: string;
    expected_salary_min?: number;
    expected_salary_max?: number;
    linkedin_url?: string;
    source?: string;
    consent_to_contact: boolean;
}

export const candidatesService = {
    // Get all candidates
    getCandidates: async (filters?: CandidateFilters) => {
        const response = await apiClient.get<{ candidates: Candidate[]; total: number }>(
            '/candidates/',
            { params: filters }
        );
        return response.data;
    },

    // Get single candidate
    getCandidate: async (id: string) => {
        const response = await apiClient.get<Candidate>(`/candidates/${id}`);
        return response.data;
    },

    // Create candidate
    createCandidate: async (data: CreateCandidateData) => {
        const response = await apiClient.post<Candidate>('/candidates/', data);
        return response.data;
    },

    // Update candidate
    updateCandidate: async (id: string, data: Partial<CreateCandidateData>) => {
        const response = await apiClient.put<Candidate>(`/candidates/${id}`, data);
        return response.data;
    },

    // Delete candidate
    deleteCandidate: async (id: string) => {
        await apiClient.delete(`/candidates/${id}`);
    },

    // Upload resume
    uploadResume: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(`/candidates/${id}/resume`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Calculate job match
    calculateMatch: async (candidateId: string, jobId: string) => {
        const response = await apiClient.post(`/candidates/${candidateId}/calculate-match/${jobId}`);
        return response.data;
    },

    // Get statistics
    getStatistics: async () => {
        const response = await apiClient.get('/candidates/statistics');
        return response.data;
    },
};
