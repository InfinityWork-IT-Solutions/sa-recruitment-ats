import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface JobDraft {
  formData: Record<string, any>;
  step: number;
  savedAt: number;
}

// Scope the key to the logged-in user so drafts never leak between accounts
// on a shared browser session.
function getDraftKey(): string {
  const userId = useAuthStore.getState().user?.id ?? 'anon';
  return `_recruitpro_job_draft_${userId}`;
}

export function saveJobDraft(formData: Record<string, any>, step: number) {
  const draft: JobDraft = { formData, step, savedAt: Date.now() };
  sessionStorage.setItem(getDraftKey(), JSON.stringify(draft));
}

export function loadJobDraft(): JobDraft | null {
  try {
    const key = getDraftKey();
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const draft: JobDraft = JSON.parse(raw);
    if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearJobDraft() {
  sessionStorage.removeItem(getDraftKey());
}

/** Drop into any page that hosts the PostJobModal. Automatically opens the modal
 *  when the user returns from the integrations page via ?openDraft=1 — but only
 *  if a draft actually exists in sessionStorage for this user. */
export function useJobDraftRestore(openModal: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('openDraft') === '1') {
      // Only open if there's actually a saved draft; otherwise ignore the param
      if (loadJobDraft() !== null) {
        openModal();
      }
      setSearchParams(
        prev => { const n = new URLSearchParams(prev); n.delete('openDraft'); return n; },
        { replace: true }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
