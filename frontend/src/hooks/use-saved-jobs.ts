import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

export function useSavedJobs(isCandidate: boolean) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isCandidate) return;
    apiClient.get('/candidate-portal/saved-jobs/ids')
      .then(r => setSavedIds(new Set(r.data)))
      .catch(() => {});
  }, [isCandidate]);

  const toggle = useCallback(async (jobId: string) => {
    const isSaved = savedIds.has(jobId);
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(jobId) : next.add(jobId);
      return next;
    });
    try {
      if (isSaved) {
        await apiClient.delete(`/candidate-portal/saved-jobs/${jobId}`);
        toast.success('Removed from saved jobs');
      } else {
        await apiClient.post(`/candidate-portal/saved-jobs/${jobId}`);
        toast.success('Job saved!');
      }
    } catch {
      // revert
      setSavedIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(jobId) : next.delete(jobId);
        return next;
      });
      toast.error('Failed to update saved jobs');
    }
  }, [savedIds]);

  return { savedIds, toggle, loading };
}
