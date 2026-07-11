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

import type { ContentBlock, PhotoAnalysisOutput } from '../../types/db.js';

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
  assigned_lawyer_id: string | null;
  assigned_lawyer_name: string | null;
  routed_at: string | null;
  first_contact_due: string | null;
  created_at: string;
}

export interface PortalQueueResponse {
  counts: { new: number; working: number; resolved: number };
  /** The signed-in attorney's id — drives the "Mine" matters filter. */
  viewer_attorney_id: string | null;
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
  assigned_lawyer_id: string | null;
  assigned_lawyer_name: string | null;
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

/**
 * Result of the portal bootstrap (POST /api/portal/session): either the user is
 * onboarded (identity returned) or not (reason for the holding screen).
 */
export type PortalSession =
  | ({ onboarded: true } & PortalIdentity)
  | { onboarded: false; reason: string; email: string | null };

/** Bootstrap + email-bind on portal entry. 401/5xx throw PortalApiError. */
export async function bootstrapSession(): Promise<PortalSession> {
  const resp = await fetch(`/api/portal/session`, { method: 'POST', credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalSession;
}

export type PortalView = 'loading' | 'holding' | 'shell';

/** Pure: which top-level view the portal shell should render. */
export function portalSessionView(input: { session: PortalSession | null; error: boolean }): PortalView {
  if (input.error) return 'holding';
  if (!input.session) return 'loading';
  return input.session.onboarded ? 'shell' : 'holding';
}

/** Body for creating a self-originated matter (POST /api/portal/cases). */
export interface NewMatterInput {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  classificationTitle?: string;
  jurisdictionState?: string;
  defendantName?: string;
  note?: string;
}

/** Create a self-originated matter; resolves to the new case id + number. */
export async function createMatter(
  input: NewMatterInput,
): Promise<{ case_id: string; case_number: string }> {
  const resp = await fetch('/api/portal/cases', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as { case_id: string; case_number: string };
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

/**
 * One photo on a matter (build-list #3) and its structured analysis, or null
 * when the photo hasn't been analyzed yet. `analysis` is the full output —
 * professional reading level, with each finding's cited section, confidence,
 * and `confirmable` hedge.
 */
export interface PortalEvidencePhoto {
  url: string;
  uploaded_at: string;
  source: 'claimant' | 'attorney';
  analyzed_at: string | null;
  analysis: PhotoAnalysisOutput | null;
}

/**
 * Upload an attorney-supplied photo to a matter and analyze it in one step.
 * Works on any matter the firm owns, including direct matters with no claimant
 * session. `imageBase64` is the raw base64 (no data: prefix); the caller should
 * downscale first. A slow call (upload + ~10-18s vision + a professional
 * rewrite) — show a clear in-progress state.
 */
export async function addCasePhoto(
  id: string,
  imageBase64: string,
  contentType: string,
): Promise<PortalEvidencePhoto> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/photos`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64, content_type: contentType }),
  });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { analysis: PhotoAnalysisOutput; photo_url: string };
  return {
    url: data.photo_url,
    uploaded_at: new Date().toISOString(),
    source: 'attorney',
    analyzed_at: new Date().toISOString(),
    analysis: data.analysis,
  };
}

/** The matter's photos + any stored analyses. Firm-scoped + consent-gated server-side. */
export async function fetchCaseEvidence(id: string): Promise<PortalEvidencePhoto[]> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/evidence`, {
    credentials: 'include',
  });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { photos: PortalEvidencePhoto[] };
  return data.photos;
}

/**
 * Run the structured accessibility analyzer on one of the matter's photos and
 * return the full analysis. A slow call (~10-18s vision + a professional
 * rewrite) — callers should show a clear in-progress state.
 */
export async function analyzeCasePhoto(
  id: string,
  photoUrl: string,
): Promise<PhotoAnalysisOutput> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/evidence`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo_url: photoUrl }),
  });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { analysis: PhotoAnalysisOutput };
  return data.analysis;
}

export interface PortalFirmAttorney {
  id: string;
  name: string;
}

/** The firm roster (id + name), member-accessible — powers the reassign picker. */
export async function fetchFirmAttorneys(): Promise<PortalFirmAttorney[]> {
  const resp = await fetch(`/api/portal/firm/attorneys`, { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { attorneys: PortalFirmAttorney[] };
  return data.attorneys;
}

/** Reassign a matter's owner to another firm attorney. */
export async function reassignCaseOwner(id: string, attorneyId: string): Promise<void> {
  const resp = await fetch(`/api/portal/cases/${encodeURIComponent(id)}/owner`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attorney_id: attorneyId }),
  });
  if (!resp.ok) await failFor(resp);
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

// ─── Build-list #2: Needs attention ──────────────────────────────────────────

export type AgendaBucket = 'overdue' | 'today' | 'this_week' | 'later';

export interface PortalAgendaDate {
  kind: 'sol' | 'task';
  case_id: string;
  case_number: string;
  client_name: string | null;
  title: string;
  due_date: string | null;
  bucket: AgendaBucket;
  priority: string | null;
  task_id: string | null;
}

export interface PortalAgendaFollowUp {
  case_id: string;
  case_number: string;
  client_name: string | null;
  status: string;
  reason: 'no_activity' | 'first_contact_overdue';
  days_since_activity: number | null;
  last_activity_at: string | null;
}

export interface PortalAgenda {
  key_dates: PortalAgendaDate[];
  follow_up: PortalAgendaFollowUp[];
}

export async function fetchAgenda(): Promise<PortalAgenda> {
  const resp = await fetch('/api/portal/agenda', { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalAgenda;
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
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  location_city: string | null;
  location_state: string | null;
  practice_areas: string[];
  additional_states: string[];
  serves_nationwide: boolean;
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

export interface FirmRoster {
  lawyers: PortalFirmLawyerSummary[];
  firm: PortalAccountFirm | null;
}

export async function fetchFirmLawyers(): Promise<FirmRoster> {
  const resp = await fetch('/api/portal/account/lawyers', { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as FirmRoster;
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

/** Offboard a lawyer from the firm (owner-only). Returns how many cases were reclaimed. */
export async function removeFirmLawyer(attorneyId: string): Promise<{ reclaimed: number }> {
  const resp = await fetch(`/api/portal/account/lawyers/${encodeURIComponent(attorneyId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { reclaimed?: number };
  return { reclaimed: data.reclaimed ?? 0 };
}

// ─── Firm self-select: litigations we accept ──────────────────────────────────

/**
 * A litigation in the self-select catalog, flagged with whether the signed-in
 * attorney's firm has opted in. `accepted` is the only firm-specific field;
 * everything else is the shared listing.
 */
export interface PortalLitigation {
  id: string;
  kind: string;
  case_name: string;
  slug: string;
  legal_theory: string | null;
  short_description: string | null;
  eligibility: string | null;
  defendants: string[];
  affected_states: string[];
  court: string | null;
  filing_date: string | null;
  accepted: boolean;
}

/** The active catalog with this firm's current selections flagged. */
export async function fetchPortalLitigations(): Promise<PortalLitigation[]> {
  const resp = await fetch(`/api/portal/litigations`, { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  const data = (await resp.json()) as { litigations: PortalLitigation[] };
  return data.litigations;
}

/** Opt the firm into a litigation (idempotent). */
export async function acceptLitigation(id: string): Promise<void> {
  const resp = await fetch(`/api/portal/litigations/${encodeURIComponent(id)}`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!resp.ok) await failFor(resp);
}

/** Opt the firm out of a litigation (idempotent). */
export async function unacceptLitigation(id: string): Promise<void> {
  const resp = await fetch(`/api/portal/litigations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!resp.ok) await failFor(resp);
}

/**
 * A de-identified pool case (routing rebuild R4). No claimant PII — contact is
 * revealed only after this firm claims the case, via the normal queue.
 */
export interface PoolCase {
  id: string;
  case_number: string;
  classification_title: string | null;
  classification_standard: string | null;
  jurisdiction_state: string | null;
  business_name: string | null;
  created_at: string;
}

export interface PoolBrowse {
  /** False when this firm isn't eligible to claim (subscribe to unlock). */
  eligible: boolean;
  cases: PoolCase[];
}

/** The self-select pool: consented, unclaimed cases this firm covers. */
export async function fetchPool(): Promise<PoolBrowse> {
  const resp = await fetch(`/api/portal/pool`, { credentials: 'include' });
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PoolBrowse;
}

/** Atomically claim a pool case for this firm. Throws PortalApiError (409) if it was taken. */
export async function claimPoolCase(id: string): Promise<void> {
  const resp = await fetch(`/api/portal/pool/${encodeURIComponent(id)}/claim`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!resp.ok) await failFor(resp);
}

/** Full litigation detail for the decide-to-accept page. */
export interface PortalLitigationDetail {
  id: string;
  kind: string;
  case_name: string;
  slug: string;
  legal_theory: string | null;
  full_description: string | null;
  eligibility: string | null;
  documentation_required: string | null;
  no_documentation_path: string | null;
  evidence_guidance: string | null;
  what_this_is_not: string | null;
  defendants: string[];
  affected_states: string[];
  court: string | null;
  docket_number: string | null;
  filing_date: string | null;
  key_dates: Record<string, string>;
  accepted: boolean;
}

/** Returns null on 404 (unknown / non-routable litigation). */
export async function fetchPortalLitigation(id: string): Promise<PortalLitigationDetail | null> {
  const resp = await fetch(`/api/portal/litigations/${encodeURIComponent(id)}`, {
    credentials: 'include',
  });
  if (resp.status === 404) return null;
  if (!resp.ok) return failFor(resp);
  return (await resp.json()) as PortalLitigationDetail;
}
