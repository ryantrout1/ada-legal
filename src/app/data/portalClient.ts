/**
 * portalClient — fetch wrappers for the attorney portal API.
 *
 * Same-origin fetch with `credentials: 'include'` so the Clerk session cookie
 * rides along; the server (requireAttorney) is the real auth boundary and
 * resolves the firm scope — the client never supplies a firm id.
 *
 * Auth/onboarding states surface as a typed PortalApiError the routes branch on
 * (401 → sign-in, 403 → not-onboarded). Case detail returns null on 404.
 *
 * Ref: .design/attorney-portal.md (src/app/data/portalClient.ts).
 */

import type { ContentBlock } from '../../types/db.js';

export interface PortalQueueCase {
  session_id: string;
  case_name: string;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  matched_at: string | null;
  handled_by_other_firm: boolean;
  handled_by_this_firm: boolean;
}

export interface PortalQueueResponse {
  summary: { open_count: number; handled_count: number };
  cases: PortalQueueCase[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface PortalTranscriptMessage {
  role: string;
  content: string | ContentBlock[];
  timestamp?: string;
}

export interface PortalCaseDetailResponse {
  session_id: string;
  litigation_listing_id: string;
  case_name: string;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  qualifying_answers: Array<{ question: string; answer: string }>;
  transcript: PortalTranscriptMessage[];
  matched_at: string | null;
  handled_by_this_firm: boolean;
}

export interface PortalQueueParams {
  page?: number;
  pageSize?: number;
  handled?: 'true' | 'false' | 'all';
}

/** Thrown for non-OK responses the routes branch on (401, 403, 5xx). */
export class PortalApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PortalApiError';
  }
}

async function failFor(resp: Response): Promise<never> {
  let message = `HTTP ${resp.status}`;
  try {
    const body = (await resp.json()) as { error?: string };
    if (body?.error) message = body.error;
  } catch {
    // non-JSON body; keep the status message
  }
  throw new PortalApiError(resp.status, message);
}

export async function fetchPortalQueue(
  params: PortalQueueParams = {},
): Promise<PortalQueueResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('page_size', String(params.pageSize));
  if (params.handled) qs.set('handled', params.handled);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const resp = await fetch(`/api/portal/queue${suffix}`, { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalQueueResponse;
}

/** Returns null on 404 (out-of-firm or unknown case); throws PortalApiError otherwise. */
export async function fetchPortalCase(
  id: string,
): Promise<PortalCaseDetailResponse | null> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}`, {
    credentials: 'include',
  });
  if (resp.status === 404) return null;
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalCaseDetailResponse;
}

export async function markPortalCaseHandled(id: string): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/handle`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!resp.ok && resp.status !== 204) return failFor(resp);
}
