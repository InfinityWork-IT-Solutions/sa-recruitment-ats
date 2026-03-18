import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesService, CandidateFilters, CreateCandidateData } from '@/services/candidates';
import { toast } from 'react-hot-toast';

// Query keys
export const candidateKeys = {
    all: ['candidates'] as const,
    lists: () => [...candidateKeys.all, 'list'] as const,
    list: (filters?: CandidateFilters) => [...candidateKeys.lists(), filters] as const,
    details: () => [...candidateKeys.all, 'detail'] as const,
    detail: (id: string) => [...candidateKeys.details(), id] as const,
    statistics: () => [...candidateKeys.all, 'statistics'] as const,
};

// Get candidates list
export const useCandidates = (filters?: CandidateFilters) => {
    return useQuery({
        queryKey: candidateKeys.list(filters),
        queryFn: () => candidatesService.getCandidates(filters),
    });
};

// Get single candidate
export const useCandidate = (id: string) => {
    return useQuery({
        queryKey: candidateKeys.detail(id),
        queryFn: () => candidatesService.getCandidate(id),
        enabled: !!id,
    });
};

// Get candidate statistics
export const useCandidateStatistics = () => {
    return useQuery({
        queryKey: candidateKeys.statistics(),
        queryFn: () => candidatesService.getStatistics(),
    });
};

// Create candidate
export const useCreateCandidate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCandidateData) => candidatesService.createCandidate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: candidateKeys.statistics() });
            toast.success('Candidate created successfully!');
        },
        onError: () => {
            toast.error('Failed to create candidate');
        },
    });
};

// Update candidate
export const useUpdateCandidate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCandidateData> }) =>
            candidatesService.updateCandidate(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
            toast.success('Candidate updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update candidate');
        },
    });
};

// Delete candidate
export const useDeleteCandidate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => candidatesService.deleteCandidate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: candidateKeys.statistics() });
            toast.success('Candidate deleted successfully!');
        },
        onError: () => {
            toast.error('Failed to delete candidate');
        },
    });
};

// Upload resume
export const useUploadResume = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) =>
            candidatesService.uploadResume(id, file),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: candidateKeys.detail(variables.id) });
            toast.success('Resume uploaded successfully!');
        },
        onError: () => {
            toast.error('Failed to upload resume');
        },
    });
};

// Calculate job match
export const useCalculateMatch = () => {
    return useMutation({
        mutationFn: ({ candidateId, jobId }: { candidateId: string; jobId: string }) =>
            candidatesService.calculateMatch(candidateId, jobId),
        onSuccess: (data) => {
            toast.success(`Match score: ${data.match_score}%`);
        },
        onError: () => {
            toast.error('Failed to calculate match');
        },
    });
};
