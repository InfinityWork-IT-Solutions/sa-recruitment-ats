import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService, JobFilters, CreateJobData } from '@/services/jobs';
import { toast } from 'react-hot-toast';

// Query keys
export const jobKeys = {
    all: ['jobs'] as const,
    lists: () => [...jobKeys.all, 'list'] as const,
    list: (filters?: JobFilters) => [...jobKeys.lists(), filters] as const,
    details: () => [...jobKeys.all, 'detail'] as const,
    detail: (id: string) => [...jobKeys.details(), id] as const,
    statistics: () => [...jobKeys.all, 'statistics'] as const,
};

// Get jobs list
export const useJobs = (filters?: JobFilters) => {
    return useQuery({
        queryKey: jobKeys.list(filters),
        queryFn: () => jobsService.getJobs(filters),
    });
};

// Get single job
export const useJob = (id: string) => {
    return useQuery({
        queryKey: jobKeys.detail(id),
        queryFn: () => jobsService.getJob(id),
        enabled: !!id,
    });
};

// Get job statistics
export const useJobStatistics = () => {
    return useQuery({
        queryKey: jobKeys.statistics(),
        queryFn: () => jobsService.getJobStatistics(),
    });
};

// Create job
export const useCreateJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateJobData) => jobsService.createJob(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobKeys.statistics() });
            toast.success('Job created successfully!');
        },
        onError: () => {
            toast.error('Failed to create job');
        },
    });
};

// Update job
export const useUpdateJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobData> }) =>
            jobsService.updateJob(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
            toast.success('Job updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update job');
        },
    });
};

// Delete job
export const useDeleteJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => jobsService.deleteJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobKeys.statistics() });
            toast.success('Job deleted successfully!');
        },
        onError: () => {
            toast.error('Failed to delete job');
        },
    });
};

// Update job status
export const useUpdateJobStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            jobsService.updateJobStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
            toast.success('Job status updated!');
        },
        onError: () => {
            toast.error('Failed to update job status');
        },
    });
};
