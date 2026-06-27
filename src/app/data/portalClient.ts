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
  sol_date: string | null;
  defendant: PortalDefendant | null;
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

/** Signed-in attorney's display identity for the shell (brand + footer). */
export interface PortalIdentity {
  attorney: { id: string; name: string; email: string | null };
  firm: { id: string; name: string };
  firmRole: string;
}

export async function fetchPortalIdentity(): Promise<PortalIdentity> {
  const resp = await fetch(`/api/portal/me`, { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalIdentity;
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

export async function addPortalCaseNote(id: string, body: string): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!resp.ok) await failFor(resp);
}

/** Set or clear (null) the attorney-set statute-of-limitations date. */
export async function setCaseSolDate(id: string, solDate: string | null): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/sol`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sol_date: solDate }),
  });
  if (!resp.ok) await failFor(resp);
}

export interface PortalDefendant {
  name: string;
  kind?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface PortalPerson {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  notes: string | null;
}

export async function fetchCasePeople(id: string): Promise<PortalPerson[]> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/people`, {
    credentials: 'include',
  });
  if (!resp.ok) await failFor(resp);
  return ((await resp.json()) as { people: PortalPerson[] }).people;
}

export async function addCasePerson(
  id: string,
  person: { name: string; role: string; email?: string | null; phone?: string | null; notes?: string | null },
): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/people`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  });
  if (!resp.ok) await failFor(resp);
}

export async function removeCasePerson(id: string, personId: string): Promise<void> {
  const resp = await fetch(
    `/api/portal/cases/${encodeURIComponent(id)}/people?person_id=${encodeURIComponent(personId)}`,
    { method: 'DELETE', credentials: 'include' },
  );
  if (!resp.ok) await failFor(resp);
}

export interface PortalDocument {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
  storageKind: string;
}

export async function fetchCaseDocuments(id: string): Promise<PortalDocument[]> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/documents`, {
    credentials: 'include',
  });
  if (!resp.ok) await failFor(resp);
  return ((await resp.json()) as { documents: PortalDocument[] }).documents;
}

export async function addCaseDocument(
  id: string,
  doc: {
    filename: string;
    url: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    storage_kind?: 'reference' | 'blob';
  },
): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  if (!resp.ok) await failFor(resp);
}

/**
 * Upload a file to the private docs Blob store via @vercel/blob/client, then
 * record it in case_documents. The browser uploads bytes directly to the store
 * (bypassing the Function body limit); the token endpoint gates it firm-scoped.
 */
export async function uploadCaseDocument(id: string, file: File): Promise<void> {
  const { upload } = await import('@vercel/blob/client');
  const result = await upload(`cases/${id}/${file.name}`, file, {
    access: 'private',
    handleUploadUrl: `/api/portal/cases/${encodeURIComponent(id)}/documents/upload`,
    contentType: file.type || undefined,
  });
  await addCaseDocument(id, {
    filename: file.name,
    url: result.url,
    mime_type: file.type || null,
    size_bytes: file.size,
    storage_kind: 'blob',
  });
}

/** URL of the firm-scoped streaming download Function for a stored ('blob') document. */
export function caseDocumentDownloadUrl(id: string, documentId: string): string {
  return `/api/portal/cases/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}/download`;
}

export async function removeCaseDocument(id: string, documentId: string): Promise<void> {
  const resp = await fetch(
    `/api/portal/cases/${encodeURIComponent(id)}/documents?document_id=${encodeURIComponent(documentId)}`,
    { method: 'DELETE', credentials: 'include' },
  );
  if (!resp.ok) await failFor(resp);
}

/** Set or clear (null) the attorney-entered defendant record. */
export async function setCaseDefendant(id: string, defendant: PortalDefendant | null): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/defendant`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ defendant }),
  });
  if (!resp.ok) await failFor(resp);
}

export type PortalCaseAction = 'accept' | 'decline' | 'send_demand' | 'begin_negotiation' | 'resolve';

export async function transitionPortalCase(
  id: string,
  action: PortalCaseAction,
  opts?: { reason?: string; resolutionType?: string; resolutionNotes?: string },
): Promise<{ status: string }> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/transition`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      reason: opts?.reason,
      resolution_type: opts?.resolutionType,
      resolution_notes: opts?.resolutionNotes,
    }),
  });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as { status: string };
}

export async function markPortalCaseHandled(id: string): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/handle`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!resp.ok && resp.status !== 204) return failFor(resp);
}

// ─── Phase 4b: tasks ────────────────────────────────────────────────────────

export interface PortalTask {
  id: string;
  case_id: string;
  title: string;
  due_date: string | null;
  priority: string;
  completed_at: string | null;
  created_at: string;
}

export interface PortalFirmTask {
  id: string;
  case_id: string;
  case_number: string;
  claimant_name: string | null;
  title: string;
  due_date: string | null;
  priority: string;
  created_at: string;
}

export async function fetchCaseTasks(caseId: string): Promise<PortalTask[]> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(caseId)}/tasks`, {
    credentials: 'include',
  });
  if (!resp.ok) return failFor(resp);
  return ((await resp.json()) as { tasks: PortalTask[] }).tasks;
}

export async function addCaseTask(
  caseId: string,
  input: { title: string; dueDate?: string | null; priority?: string },
): Promise<PortalTask> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(caseId)}/tasks`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      due_date: input.dueDate || undefined,
      priority: input.priority,
    }),
  });
  if (!resp.ok) return failFor(resp);
  return ((await resp.json()) as { task: PortalTask }).task;
}

export async function completeCaseTask(caseId: string, taskId: string): Promise<void> {
  const resp = await fetch(
    `/api/portal/cases/${encodeURIComponent(caseId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'PATCH', credentials: 'include' },
  );
  if (!resp.ok) await failFor(resp);
}

export async function fetchFirmTasks(): Promise<PortalFirmTask[]> {
  const resp = await fetch('/api/portal/tasks', { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return ((await resp.json()) as { tasks: PortalFirmTask[] }).tasks;
}

// ─── Phase 4c: pipeline analytics ───────────────────────────────────────────

export interface PipelineStatsResponse {
  stage_counts: { new: number; accepted: number; working: number; resolved: number };
  time_in_stage: { stage: string; median_hours: number; n: number }[];
  accepted_this_week: number;
}

export async function fetchPipelineStats(): Promise<PipelineStatsResponse> {
  const resp = await fetch('/api/portal/pipeline', { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PipelineStatsResponse;
}

// --- Account (portal self-serve profile + firm) ----------------------------

export interface PortalAccountAttorney {
  id: string;
  name: string;
  location_city: string | null;
  location_state: string | null;
  practice_areas: string[];
  additional_states: string[];
  specialty_tags: string[];
  email: string | null;
  phone: string | null;
  website_url: string | null;
  bio: string | null;
  photo_url: string | null;
  bar_number: string | null;
  firm_role: string;
  status: string;
  accepting_referrals: boolean;
  routing_paused: boolean;
  max_active_cases: number | null;
}

export interface PortalAccountFirm {
  id: string;
  name: string;
  primary_contact: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

export interface AccountReadinessItem {
  key: string;
  label: string;
}

export interface AccountReadiness {
  ready: boolean;
  missing: AccountReadinessItem[];
}

export interface PortalAccount {
  attorney: PortalAccountAttorney;
  firm: PortalAccountFirm | null;
  readiness: AccountReadiness;
}

/** PATCH body: only the section being saved is sent. */
export interface AccountPatch {
  attorney?: Partial<Record<string, unknown>>;
  firm?: Partial<Record<string, unknown>>;
}

export async function fetchAccount(): Promise<PortalAccount> {
  const resp = await fetch('/api/portal/account', { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalAccount;
}

export async function saveAccount(patch: AccountPatch): Promise<PortalAccount> {
  const resp = await fetch('/api/portal/account', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalAccount;
}

// --- Firm roster (owner-only) ----------------------------------------------

export interface PortalFirmLawyerSummary {
  id: string;
  name: string;
  email: string | null;
  status: string;
  firm_role: string;
  is_self: boolean;
  bound: boolean;
  ready: boolean;
  missing_count: number;
}

export interface PortalLawyerDetail {
  attorney: PortalAccountAttorney;
  firm: PortalAccountFirm | null;
  readiness: AccountReadiness;
  bound: boolean;
}

export async function fetchFirmLawyers(): Promise<PortalFirmLawyerSummary[]> {
  const resp = await fetch('/api/portal/account/lawyers', { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { lawyers: PortalFirmLawyerSummary[] };
  return data.lawyers;
}

/** Returns null on 404 (lawyer not in your firm); throws otherwise. */
export async function fetchFirmLawyer(id: string): Promise<PortalLawyerDetail | null> {
  const resp = await fetch(`/api/portal/account/lawyers/${encodeURIComponent(id)}`, {
    credentials: 'include',
  });
  if (resp.status === 404) return null;
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalLawyerDetail;
}

export async function addFirmLawyer(name: string, email: string): Promise<PortalFirmLawyerSummary> {
  const resp = await fetch('/api/portal/account/lawyers', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { lawyer: PortalFirmLawyerSummary };
  return data.lawyer;
}

async function ownerAction(payload: Record<string, unknown>): Promise<void> {
  const resp = await fetch('/api/portal/account/owner', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) return failFor(resp);
}

export const promoteOwner = (attorneyId: string) => ownerAction({ action: 'promote', attorney_id: attorneyId });
export const transferOwnership = (toAttorneyId: string) => ownerAction({ action: 'transfer', to_attorney_id: toAttorneyId });
export const stepDownOwner = () => ownerAction({ action: 'step_down' });
