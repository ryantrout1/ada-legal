/**
 * usePhotoReview — data hooks for the PUBLIC /review page.
 *
 *   usePhotoReviewQueue  — the review queue (is_test analyses).
 *   usePhotoReviewDetail — one analysis + all reviews, plus submit().
 *
 * These call the PUBLIC /api/photo-review endpoints — no credentials, no
 * Clerk. Attribution rides in the request body as `reviewer` (the
 * self-identified name), validated server-side against the known list.
 *
 * The TS shapes are shared with the admin tool (same DB projection), so
 * we re-use the interfaces exported from useAdminPhotoReview.
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  PhotoReviewListItem,
  PhotoReviewDetail,
  ReviewSubmitInput,
  ReviewState,
} from '../../hooks/useAdminPhotoReview.js';
import type { PhotoReviewer } from '../../../types/reviewers.js';

const PAGE_SIZE = 25;

export function usePhotoReviewQueue() {
  const [items, setItems] = useState<PhotoReviewListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reviewState, setReviewState] = useState<ReviewState | ''>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (reviewState) params.set('review_state', reviewState);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      const resp = await fetch(`/api/photo-review?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        items: PhotoReviewListItem[];
        totalCount: number;
      };
      setItems(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [reviewState, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    items,
    totalCount,
    reviewState,
    setReviewState,
    page,
    setPage,
    totalPages,
    loading,
    error,
    reload: load,
  };
}

export function usePhotoReviewDetail(
  id: string | undefined,
  reviewer: PhotoReviewer | null,
) {
  const [detail, setDetail] = useState<PhotoReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/photo-review/${id}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setDetail((await resp.json()) as PhotoReviewDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (input: ReviewSubmitInput): Promise<boolean> => {
      if (!id || !reviewer) return false;
      setSaving(true);
      setError(null);
      try {
        const resp = await fetch(`/api/photo-review/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewer, ...input }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        await load();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save review');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id, reviewer, load],
  );

  return { detail, loading, error, saving, submit, reload: load };
}
