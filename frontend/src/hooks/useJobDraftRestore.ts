import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const DRAFT_KEY = '_recruitpro_job_draft';
const DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface JobDraft {
  formData: Record<string, any>;
  step: number;
  savedAt: number;
}

export function saveJobDraft(formData: Record<string, any>, step: number) {
  const draft: JobDraft = { formData, step, savedAt: Date.now() };
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadJobDraft(): JobDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: JobDraft = JSON.parse(raw);
    if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearJobDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

/** Drop into any page that hosts the PostJobModal. Automatically opens the modal
 *  when the user returns from the integrations page via ?openDraft=1. */
export function useJobDraftRestore(openModal: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('openDraft') === '1') {
      openModal();
      setSearchParams(
        prev => { const n = new URLSearchParams(prev); n.delete('openDraft'); return n; },
        { replace: true }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
