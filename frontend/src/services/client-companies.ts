import apiClient from '@/lib/api-client';
import { ClientCompany } from '@/types/api';

export interface ClientCompanyFilters {
    search?: string;
    skip?: number;
    limit?: number;
}

export interface CreateClientCompanyData {
    name: string;
    industry?: string;
    website?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
}

export const clientCompaniesService = {
    // Get all client companies
    getClientCompanies: async (filters?: ClientCompanyFilters) => {
        const response = await apiClient.get<{ companies: ClientCompany[]; total: number }>(
            '/client-companies/',
            { params: filters }
        );
        return response.data;
    },

    // Get single client company
    getClientCompany: async (id: string) => {
        const response = await apiClient.get<ClientCompany>(`/client-companies/${id}`);
        return response.data;
    },

    // Create client company
    createClientCompany: async (data: CreateClientCompanyData) => {
        const response = await apiClient.post<ClientCompany>('/client-companies/', data);
        return response.data;
    },

    // Update client company
    updateClientCompany: async (id: string, data: Partial<CreateClientCompanyData>) => {
        const response = await apiClient.put<ClientCompany>(`/client-companies/${id}`, data);
        return response.data;
    },

    // Delete client company
    deleteClientCompany: async (id: string) => {
        await apiClient.delete(`/client-companies/${id}`);
    },
};
