import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    clientCompaniesService,
    ClientCompanyFilters,
    CreateClientCompanyData,
} from '@/services/client-companies';
import { toast } from 'react-hot-toast';

// Query keys
export const clientCompanyKeys = {
    all: ['client-companies'] as const,
    lists: () => [...clientCompanyKeys.all, 'list'] as const,
    list: (filters?: ClientCompanyFilters) => [...clientCompanyKeys.lists(), filters] as const,
    details: () => [...clientCompanyKeys.all, 'detail'] as const,
    detail: (id: string) => [...clientCompanyKeys.details(), id] as const,
};

// Get client companies list
export const useClientCompanies = (filters?: ClientCompanyFilters) => {
    return useQuery({
        queryKey: clientCompanyKeys.list(filters),
        queryFn: () => clientCompaniesService.getClientCompanies(filters),
    });
};

// Get single client company
export const useClientCompany = (id: string) => {
    return useQuery({
        queryKey: clientCompanyKeys.detail(id),
        queryFn: () => clientCompaniesService.getClientCompany(id),
        enabled: !!id,
    });
};

// Create client company
export const useCreateClientCompany = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateClientCompanyData) =>
            clientCompaniesService.createClientCompany(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientCompanyKeys.lists() });
            toast.success('Client company created successfully!');
        },
        onError: () => {
            toast.error('Failed to create client company');
        },
    });
};

// Update client company
export const useUpdateClientCompany = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateClientCompanyData> }) =>
            clientCompaniesService.updateClientCompany(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientCompanyKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: clientCompanyKeys.lists() });
            toast.success('Client company updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update client company');
        },
    });
};

// Delete client company
export const useDeleteClientCompany = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => clientCompaniesService.deleteClientCompany(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientCompanyKeys.lists() });
            toast.success('Client company deleted successfully!');
        },
        onError: () => {
            toast.error('Failed to delete client company');
        },
    });
};
