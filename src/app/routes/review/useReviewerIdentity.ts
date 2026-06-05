/**
 * useReviewerIdentity — the "self-identify, not login" mechanism for the
 * public /review page. The reviewer taps their name once; we remember it
 * on the device in localStorage so they never have to again. No password,
 * no email, no auth. A "switch" action clears it.
 *
 * The stored value is validated against the known reviewer list on read,
 * so a stale or hand-edited value can't leak through as attribution.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  isPhotoReviewer,
  type PhotoReviewer,
} from '../../../types/reviewers.js';

const STORAGE_KEY = 'ada.photoReviewer';

export function useReviewerIdentity() {
  const [reviewer, setReviewerState] = useState<PhotoReviewer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isPhotoReviewer(stored)) setReviewerState(stored);
    } catch {
      /* localStorage unavailable (private mode) — fall back to in-memory */
    }
    setReady(true);
  }, []);

  const setReviewer = useCallback((name: PhotoReviewer) => {
    setReviewerState(name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* ignore persistence failure; identity still holds for this session */
    }
  }, []);

  const clearReviewer = useCallback(() => {
    setReviewerState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { reviewer, ready, setReviewer, clearReviewer };
}
