/**
 * useAdminPhotoReview — data hooks for the expert-labeling tool.
 *
 *   useAdminPhotoReviewList   — the review queue (is_test analyses).
 *   useAdminPhotoReviewDetail — one analysis + its review, plus submit().
 *   useAdminPhotoReviewEval   — accuracy rollup by engine version.
 *
 * All call admin endpoints with credentials:'include' (Clerk cookie).
 * 401 flips `unauthenticated` so the page can prompt sign-in.
 */

import { useCallback, useEffect, useState } from 'react';

export type ReviewState = 'unreviewed' | 'reviewed' | 'addressed';
export type OverallRisk = 'high' | 'medium' | 'low' | 'none';
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'advisory';
export type FindingVerdict = 'correct' | 'over_flagged' | 'partial' | 'wrong_cite';
export type ReviewOverallVerdict = 'accurate' | 'missed' | 'over_flagged' | 'wrong' | 'mixed';

export interface PhotoReviewListItem {
  photoAnalysisId: string;
  sessionId: string;
  photoUrl: string;
  overallRisk: OverallRisk | null;
  findingCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  advisoryCount: number;
  modelVersion: string;
  analyzedAt: string;
  reviewState: ReviewState;
  reviewerCount: number;
  overallVerdict: ReviewOverallVerdict | null;
}

export interface ReadingLevelText {
  standard: string;
  simple?: string;
  professional?: string;
}

export interface PhotoFinding {
  title_standard: string;
  title_simple?: string;
  title_professional?: string;
  finding_standard: string;
  finding_simple?: string;
  finding_professional?: string;
  severity: FindingSeverity;
  standard: string;
  confidence: number;
  confirmable: boolean;
  guide_url?: string;
}

export interface FindingLabel {
  finding_index: number;
  verdict: FindingVerdict;
  reason: string;
}

export interface MissedFinding {
  description: string;
  standard?: string;
  severity?: FindingSeverity;
}

export interface PhotoReviewRecord {
  reviewer: string;
  reviewerEmail: string | null;
  status: 'reviewed' | 'addressed';
  overallVerdict: ReviewOverallVerdict | null;
  findingLabels: FindingLabel[];
  missedFindings: MissedFinding[];
  reviewerNotes: string | null;
  modelVersion: string | null;
  reviewedAt: string;
}

export interface PhotoReviewDetail {
  photoAnalysisId: string;
  sessionId: string;
  photoUrl: string;
  scene: ReadingLevelText | null;
  summary: ReadingLevelText | null;
  overallRisk: OverallRisk | null;
  positiveFindings: { standard: string[]; simple?: string[]; professional?: string[] } | null;
  findings: PhotoFinding[];
  modelVersion: string;
  analyzedAt: string;
  testerComment: string | null;
  reviews: PhotoReviewRecord[];
  viewerReviewer?: string;
}

export interface EvalRow {
  modelVersion: string;
  analysesReviewed: number;
  findingsLabeled: number;
  correct: number;
  overFlagged: number;
  partial: number;
  wrongCite: number;
  missedTotal: number;
}

export interface ReviewListFilters {
  reviewState: ReviewState | '';
  risk: OverallRisk | '';
  modelVersion: string;
  page: number;
}

const PAGE_SIZE = 25;

const DEFAULT_FILTERS: ReviewListFilters = {
  reviewState: 'unreviewed',
  risk: '',
  modelVersion: '',
  page: 1,
};

export function useAdminPhotoReviewList() {
  const [items, setItems] = useState<PhotoReviewListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ReviewListFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.reviewState) params.set('review_state', filters.reviewState);
      if (filters.risk) params.set('risk', filters.risk);
      if (filters.modelVersion) params.set('model_version', filters.modelVersion);
      params.set('page', String(filters.page));
      params.set('page_size', String(PAGE_SIZE));

      const resp = await fetch(`/api/admin/photo-analyses?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { items: PhotoReviewListItem[]; totalCount: number };
      setItems(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    items,
    totalCount,
    filters,
    setFilters,
    loading,
    error,
    unauthenticated,
    totalPages,
    pageSize: PAGE_SIZE,
    reload: load,
  };
}

export interface ReviewSubmitInput {
  status: 'reviewed' | 'addressed';
  overallVerdict: ReviewOverallVerdict | null;
  findingLabels: FindingLabel[];
  missedFindings: MissedFinding[];
  reviewerNotes: string | null;
  modelVersion: string | null;
}

export function useAdminPhotoReviewDetail(id: string | undefined) {
  const [detail, setDetail] = useState<PhotoReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/photo-analyses/${id}`, { credentials: 'include' });
      if (resp.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setDetail((await resp.json()) as PhotoReviewDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (input: ReviewSubmitInput): Promise<boolean> => {
      if (!id) return false;
      setSaving(true);
      setError(null);
      try {
        const resp = await fetch('/api/admin/photo-reviews', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoAnalysisId: id, ...input }),
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
    [id, load],
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!id) return false;
    setDeleting(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/photo-analyses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete analysis');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [id]);

  return {
    detail,
    loading,
    error,
    unauthenticated,
    saving,
    deleting,
    submit,
    remove,
    reload: load,
  };
}

export function useAdminPhotoReviewEval() {
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await fetch('/api/admin/photo-reviews/eval', { credentials: 'include' });
        if (!resp.ok) return;
        const data = (await resp.json()) as { rows: EvalRow[] };
        if (active) setRows(data.rows);
      } catch {
        /* eval strip is best-effort */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { rows, loading };
}
