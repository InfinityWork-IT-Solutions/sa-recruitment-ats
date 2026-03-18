import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService, ApplicationFilters, CreateApplicationData } from '@/services/applications';
import { toast } from 'react-hot-toast';

// Query keys
export const applicationKeys = {
    all: ['applications'] as const,
    lists: () => [...applicationKeys.all, 'list'] as const,
    list: (filters?: ApplicationFilters) => [...applicationKeys.lists(), filters] as const,
    details: () => [...applicationKeys.all, 'detail'] as const,
    detail: (id: string) => [...applicationKeys.details(), id] as const,
    pipeline: (jobId: string) => [...applicationKeys.all, 'pipeline', jobId] as const,
    statistics: () => [...applicationKeys.all, 'statistics'] as const,
};

// Get applications list
export const useApplications = (filters?: ApplicationFilters) => {
    return useQuery({
        queryKey: applicationKeys.list(filters),
        queryFn: () => applicationsService.getApplications(filters),
    });
};

// Get single application
export const useApplication = (id: string) => {
    return useQuery({
        queryKey: applicationKeys.detail(id),
        queryFn: () => applicationsService.getApplication(id),
        enabled: !!id,
    });
};

// Get pipeline for job
export const usePipeline = (jobId: string) => {
    return useQuery({
        queryKey: applicationKeys.pipeline(jobId),
        queryFn: () => applicationsService.getPipeline(jobId),
        enabled: !!jobId,
    });
};

// Get application statistics
export const useApplicationStatistics = () => {
    return useQuery({
        queryKey: applicationKeys.statistics(),
        queryFn: () => applicationsService.getStatistics(),
    });
};

// Create application
export const useCreateApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateApplicationData) => applicationsService.createApplication(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: applicationKeys.statistics() });
            toast.success('Application created successfully!');
        },
        onError: () => {
            toast.error('Failed to create application');
        },
    });
};

// Update application
export const useUpdateApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            applicationsService.updateApplication(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            toast.success('Application updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update application');
        },
    });
};

// Delete application
export const useDeleteApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => applicationsService.deleteApplication(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: applicationKeys.statistics() });
            toast.success('Application deleted successfully!');
        },
        onError: () => {
            toast.error('Failed to delete application');
        },
    });
};

// Screen application
export const useScreenApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { passed: boolean; score: number; notes?: string } }) =>
            applicationsService.screenApplication(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            toast.success('Application screened successfully!');
        },
        onError: () => {
            toast.error('Failed to screen application');
        },
    });
};

// Schedule interview
export const useScheduleInterview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { interview_time: string; notes?: string } }) =>
            applicationsService.scheduleInterview(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            toast.success('Interview scheduled successfully!');
        },
        onError: () => {
            toast.error('Failed to schedule interview');
        },
    });
};

// Complete interview
export const useCompleteInterview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { rating: number; feedback: string } }) =>
            applicationsService.completeInterview(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            toast.success('Interview completed successfully!');
        },
        onError: () => {
            toast.error('Failed to complete interview');
        },
    });
};

// Make offer
export const useMakeOffer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { amount: number; notes?: string } }) =>
            applicationsService.makeOffer(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            toast.success('Offer made successfully!');
        },
        onError: () => {
            toast.error('Failed to make offer');
        },
    });
};

// Hire candidate
export const useHireCandidate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => applicationsService.hire(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            toast.success('Candidate hired successfully!');
        },
        onError: () => {
            toast.error('Failed to hire candidate');
        },
    });
};

// Reject application
export const useRejectApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { reason: string; notes?: string } }) =>
            applicationsService.reject(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
            toast.success('Application rejected');
        },
        onError: () => {
            toast.error('Failed to reject application');
        },
    });
};
