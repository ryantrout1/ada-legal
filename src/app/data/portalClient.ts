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

export interface PortalCaseRow {
  case_id: string;
  ada_session_id: string | null;
  case_number: string;
  status: string;
  lane: string;
  case_name: string | null;
  classification_title: string | null;
  jurisdiction_state: string | null;
  claimant_name: string | null;
  claimant_email: string | null;
  claimant_phone: string | null;
  routed_at: string | null;
  first_contact_due: string | null;
  created_at: string;
}

export interface PortalQueueResponse {
  counts: { new: number; working: number; resolved: number };
  groups: {
    new: PortalCaseRow[];
    working: PortalCaseRow[];
    resolved: PortalCaseRow[];
  };
}

export interface PortalTranscriptMessage {
  role: string;
  content: string | ContentBlock[];
  timestamp?: string;
}

export interface PortalCaseActivityEntry {
  event_type: string;
  summary: string | null;
  actor_type: string;
  created_at: string;
}

export interface PortalCaseDetailResponse {
  case_id: string;
  ada_session_id: string | null;
  case_number: string;
  status: string;
  lane: string;
  classification_title: string | null;
  jurisdiction_state: string | null;
  consent_to_share: boolean;
  routed_at: string | null;
  first_contact_due: string | null;
  created_at: string;
  case_name: string | null;
  claimant_name: string | null;
  claimant_email: string | null;
  claimant_phone: string | null;
  qualifying_answers: Array<{ question: string; answer: string }>;
  transcript: PortalTranscriptMessage[];
  activity: PortalCaseActivityEntry[];
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

export async function fetchPortalQueue(): Promise<PortalQueueResponse> {
  const resp = await fetch(`/api/portal/queue`, { credentials: 'include' });
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
