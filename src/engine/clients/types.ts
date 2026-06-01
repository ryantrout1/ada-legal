/**
 * AdaClients — the engine seam.
 *
 * Everything outside the engine that the engine needs, injected as a single
 * object. Production wires this to real services (AnthropicAiClient, NeonDb,
 * Vercel Blob, Resend). Tests wire it to InMemoryAdaClients.
 *
 * See docs/DO_NOT_TOUCH.md rule 1: engine code must NEVER import module-scoped
 * client instances. It must only receive clients via this interface.
 *
 * Design principle: every method here is either non-deterministic, performs
 * I/O, or has side effects. Deterministic pure functions (prompt assembly,
 * state-machine transitions) live in the engine directly and are not on
 * this interface.
 *
 * Ref: docs/ARCHITECTURE.md §6
 */

import type {
  Message,
  PhotoAnalysisOutput,
  PhotoFinding,
  PhotoFindingLabel,
  MissedFinding,
  PhotoOverallRisk,
  ReviewOverallVerdict,
  ReviewStatus,
  ReadingLevelText,
  ReadingLevelStringList,
} from '../../types/db.js';
import type { AdaSessionState } from '../types.js';

// ─── AI client ────────────────────────────────────────────────────────────────

export interface AiStreamChunk {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_delta' | 'tool_use_stop' | 'message_stop';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolId?: string;
}

export interface AiStreamRequest {
  /**
   * The system prompt. When `systemPromptCachePrefix` is also set, this
   * is treated as the volatile suffix appended after the cached prefix.
   * When the prefix is not set, this is the entire system prompt.
   */
  systemPrompt: string;
  /**
   * Optional stable prefix that should be cached by the model provider
   * (Anthropic prompt caching: `cache_control: {type: "ephemeral"}`).
   * When provided, it is sent as a separate system block before the
   * volatile `systemPrompt` content. The two are concatenated logically
   * — anything that depends on per-turn state should stay in
   * `systemPrompt` (the suffix) so the prefix is reusable across turns.
   *
   * Cost / latency win: the cached prefix is billed at ~10% of input
   * rate after the first hit, and the model skips re-prefilling it,
   * which drops time-to-first-token meaningfully on every turn after
   * the first in a conversation.
   */
  systemPromptCachePrefix?: string;
  messages: Message[];
  tools: AiToolDefinition[];
  maxTokens?: number;
  model?: string;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AiClient {
  /**
   * Stream a turn. Yields chunks as the model produces them. The caller is
   * responsible for accumulating deltas into coherent Message objects.
   */
  stream(req: AiStreamRequest): AsyncIterable<AiStreamChunk>;
}

// ─── DB client ────────────────────────────────────────────────────────────────

export interface SessionReadOptions {
  sessionId: string;
}

export interface SessionWriteOptions {
  state: AdaSessionState;
}

export interface AttorneySearchOptions {
  orgId: string;
  state?: string;
  city?: string;
  practiceAreas?: string[];
  /** Canonical taxonomy match: title_i | title_ii | title_iii | class_action | mass_action. Overlap match. */
  specialtyTags?: string[];
  limit?: number;
}

export interface AttorneyRow {
  id: string;
  name: string;
  firmName: string | null;
  locationCity: string | null;
  locationState: string | null;
  practiceAreas: string[];
  /** Secondary practice states (location_state is primary). */
  additionalStates: string[];
  /** Canonical taxonomy tags. See AttorneySearchOptions.specialtyTags. */
  specialtyTags: string[];
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  /**
   * Attorney portal (migration 0019): the ada_legal `users.id` this attorney
   * is paired to (NOT the Clerk user id). Null until paired. Optional so
   * existing AttorneyRow constructors are unaffected.
   */
  userId?: string | null;
  /**
   * Attorney portal (migration 0019): the `law_firms.id` this attorney
   * belongs to. Load-bearing routing data — the portal queue is firm-scoped.
   * Null until set (B44 admin or the firm_name backfill).
   */
  lawFirmId?: string | null;
}

/** Attorney statuses the admin can filter on or set. */
export type AttorneyStatus = 'pending' | 'approved' | 'rejected' | 'archived';

/** Full attorney record including all admin-only fields. */
export interface AttorneyAdminRow extends AttorneyRow {
  bio: string | null;
  photoUrl: string | null;
  status: AttorneyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAttorneyListOptions {
  /** Filter by status. Omit for all. */
  status?: AttorneyStatus;
  /** Substring search on name or firm_name. */
  search?: string;
  /** 1-based page. Default 1. */
  page?: number;
  /** Rows per page, 1..100. Default 50. */
  pageSize?: number;
}

export interface AdminAttorneyListResult {
  attorneys: AttorneyAdminRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Options for listFirmsForAdmin. All filters optional; the empty
 * options object returns every firm in the org paginated.
 * Step 25.
 */
export interface AdminFirmListOptions {
  /** Scoping org. Required — admin can only list firms in their org. */
  orgId: string;
  /** Filter by firm status (active | suspended | churned). Omit for all. */
  status?: 'active' | 'suspended' | 'churned';
  /** Filter by pilot flag. Omit for all. */
  isPilot?: boolean;
  /** Substring search on firm name or primary contact. Case-insensitive. */
  search?: string;
  /** 1-based page. Default 1. */
  page?: number;
  /** Rows per page, 1..100. Default 50. */
  pageSize?: number;
}

export interface AdminFirmListResult {
  firms: LawFirmRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Options for listListingsForAdmin. orgId is required for scoping.
 * Every other filter is optional and AND'd. Step 25.
 */
export interface AdminListingListOptions {
  orgId: string;
  /** Filter by firm. Omit to include listings across all firms. */
  lawFirmId?: string;
  /** Filter by listing status. */
  status?: 'draft' | 'published' | 'archived';
  /** Filter by category (e.g. 'ada_title_iii'). */
  category?: string;
  /** Case-insensitive substring match on title or slug. */
  search?: string;
  /** 1-based page. Default 1. */
  page?: number;
  /** Rows per page, 1..100. Default 50. */
  pageSize?: number;
}

export interface AdminListingListResult {
  listings: ListingRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Options for listAllSubscriptionsForAdmin. orgId required for scoping
 * via the firm join (subscriptions have law_firm_id but not org_id).
 * Step 25 Commit 6.
 */
export interface AdminSubscriptionListOptions {
  orgId: string;
  lawFirmId?: string;
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  tier?: 'basic' | 'premium';
  page?: number;
  pageSize?: number;
}

export interface AdminSubscriptionListRow {
  subscription: SubscriptionRow;
  /** Firm name resolved at query time for display in the table. */
  lawFirmName: string;
  /** Listing title if subscription is listing-scoped. */
  listingTitle: string | null;
}

export interface AdminSubscriptionListResult {
  subscriptions: AdminSubscriptionListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Options for listIntakesForAdmin. orgId required. Filters are AND'd.
 * Step 25 Commit 6.
 */
export interface AdminIntakeListOptions {
  orgId: string;
  /** Filter by firm (finds sessions where listing.lawFirmId matches). */
  lawFirmId?: string;
  /** Filter by listing directly. */
  listingId?: string;
  /** Filter by session status. */
  status?: 'active' | 'completed' | 'abandoned';
  /** Filter by outcome in metadata ('qualified' | 'disqualified'). */
  outcome?: 'qualified' | 'disqualified';
  /** Include is_test sessions (preview sandbox sessions). Default false. */
  includeTest?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminIntakeListRow {
  sessionId: string;
  status: 'active' | 'completed' | 'abandoned';
  lawFirmId: string;
  lawFirmName: string;
  listingId: string;
  listingTitle: string;
  /** From metadata.outcome; null until finalized. */
  outcome: 'qualified' | 'disqualified' | null;
  /** From metadata.handoff.is_test. */
  isTest: boolean;
  /**
   * Phase 4: quick-look projections from metadata.handoff.
   *
   *   - true  → finalize_intake ran and the side effect succeeded
   *   - false → finalize_intake ran and the side effect errored (id is null
   *             and a matching *_error field is populated)
   *   - null  → metadata.handoff is absent (pre-finalize, or the 4 backfilled
   *             rows that were stamped class_action_intake without re-running
   *             finalize_intake)
   *
   * The detail page reads the full metadata.handoff for the actionable
   * fields (the actual error string, the email ids, the disqualifying
   * reason). These three are list-page convenience pills only.
   */
  firmEmailSent: boolean | null;
  userEmailSent: boolean | null;
  transcriptUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIntakeListResult {
  intakes: AdminIntakeListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Single-row read for the admin intake detail page (Phase 4).
 *
 * Returns the full session state PLUS the joined firm and listing rows in
 * one round-trip — saves the B44 admin page from fanning out to
 * /sessions/[id] + /listings/[id] + /firms/[id] through the bridge proxy.
 *
 * Both joined objects are non-null: a class_action_intake session must be
 * bound to a listing, and that listing must reference an active firm. If
 * either is missing, the DbClient returns null and the endpoint surfaces
 * 404 — it's a data-integrity case the admin shouldn't be presented with.
 */
export interface AdminIntakeReadOptions {
  sessionId: string;
  orgId: string;
}

export interface AdminIntakeReadResult {
  session: AdaSessionState;
  firm: {
    id: string;
    name: string;
    email: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
  };
}

/** All fields required to create a new attorney row. */
export interface CreateAttorneyInput {
  orgId: string;
  name: string;
  firmName?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  practiceAreas: string[];
  additionalStates?: string[];
  specialtyTags?: string[];
  email?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  status?: AttorneyStatus;
}

/** Partial update for an existing attorney. */
export interface UpdateAttorneyInput {
  name?: string;
  firmName?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  practiceAreas?: string[];
  additionalStates?: string[];
  specialtyTags?: string[];
  email?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  status?: AttorneyStatus;
}

/**
 * Who's performing a hard-delete on an attorney. The actor email is
 * always present (admins can't reach this code path unauthenticated).
 * actor_user_id is null when the request came in via the ADALL bridge
 * (B44 admin → Vercel) — bridge auth carries an email but no internal
 * user id. The Clerk path carries both.
 */
export interface HardDeleteActor {
  actorEmail: string;
  actorUserId: string | null;
}

/**
 * Shape of one entry in the in-memory audit log buffer used by tests.
 * Matches the columns of the real audit_log table closely enough that
 * the same assertions work for both clients. NeonDbClient writes
 * directly to the table; this is here only to give tests a place to
 * inspect.
 */
export interface AuditLogEntry {
  orgId: string | null;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Litigation listings ────────────────────────────────────────────────────
//
// Phase A1 (May 2026): expanded from class+mass to cover the full
// landscape of disability-rights litigation. `kind` values:
//
//   class                — federally-certified class action
//   enforcement_action   — DOJ / state AG enforcement (replaces 'mass')
//   consent_decree       — court-ordered relief under monitoring
//   pattern_of_practice  — no current named case; intake for future filing
//   regulatory_challenge — challenge to a regulation (notice-and-comment, etc)
//
// `status` adds: investigating (DOJ stage), compliance (post-consent-decree
// monitoring), tracking (pattern_of_practice intake). 'settled' was removed
// because it conflated terminal status with active settlement-administration.

export type LitigationKind =
  | 'class'
  | 'enforcement_action'
  | 'consent_decree'
  | 'pattern_of_practice'
  | 'regulatory_challenge';

export type LitigationStatus =
  | 'draft'
  | 'active'
  | 'investigating'
  | 'compliance'
  | 'tracking'
  | 'closed'
  | 'archived';

/**
 * Phase A1: structured intake guidance for Ada. The shape is permissive
 * (Record<string, unknown>-style) so admin can iterate on the question
 * format without breaking the engine. The engine consumes whatever keys
 * are present and ignores the rest. Default is `{}`.
 */
export type AdaQualifyingQuestions = Record<string, unknown>;

/**
 * Phase A1: structured key dates (filing deadline, certification
 * hearing, settlement-fund-claim deadline, etc). Free-form keyed by
 * the admin so we don't lock in a vocabulary on day one. Default `{}`.
 */
export type LitigationKeyDates = Record<string, string>;

/** Public-facing row Ada gets when looking up active litigation. */
export interface LitigationRow {
  id: string;
  kind: LitigationKind;
  caseName: string;
  slug: string;
  /** Phase A1: short legal-theory label, surfaced on the public detail page. */
  legalTheory: string | null;
  shortDescription: string | null;
  shortDescriptionSimple: string | null;
  shortDescriptionProfessional: string | null;
  fullDescription: string | null;
  fullDescriptionSimple: string | null;
  fullDescriptionProfessional: string | null;
  eligibility: string | null;
  eligibilitySimple: string | null;
  eligibilityProfessional: string | null;
  /** Phase A1: documentation-gating fields. Each has simple+professional variants. */
  documentationRequiredSimple: string | null;
  documentationRequiredProfessional: string | null;
  noDocumentationPathSimple: string | null;
  noDocumentationPathProfessional: string | null;
  evidenceGuidanceSimple: string | null;
  evidenceGuidanceProfessional: string | null;
  whatThisIsNotSimple: string | null;
  whatThisIsNotProfessional: string | null;
  defendants: string[];
  court: string | null;
  docketNumber: string | null;
  affectedStates: string[];
  filingDate: string | null; // ISO date
  /** Phase A1: structured key dates (filing deadlines, hearings, etc). */
  keyDates: LitigationKeyDates;
  /** Phase A1: related listing ids — companion cases or consolidated actions. */
  relatedListingIds: string[];
  /** Phase A1: Ada qualifying-question structure for this listing. */
  adaQualifyingQuestions: AdaQualifyingQuestions;
  leadAttorneyId: string | null;
  /** Phase A1: optional lead firm (separate from lead attorney). */
  leadFirmId: string | null;
}

/** Admin row, exposes status + timestamps. */
export interface LitigationAdminRow extends LitigationRow {
  status: LitigationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListLitigationForAdminOptions {
  kind?: LitigationKind;
  status?: LitigationStatus;
  search?: string;
  leadAttorneyId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListLitigationForAdminResult {
  litigation: LitigationAdminRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CreateLitigationInput {
  orgId: string;
  kind: LitigationKind;
  caseName: string;
  slug: string;
  legalTheory?: string | null;
  shortDescription?: string | null;
  shortDescriptionSimple?: string | null;
  shortDescriptionProfessional?: string | null;
  fullDescription?: string | null;
  fullDescriptionSimple?: string | null;
  fullDescriptionProfessional?: string | null;
  eligibility?: string | null;
  eligibilitySimple?: string | null;
  eligibilityProfessional?: string | null;
  documentationRequiredSimple?: string | null;
  documentationRequiredProfessional?: string | null;
  noDocumentationPathSimple?: string | null;
  noDocumentationPathProfessional?: string | null;
  evidenceGuidanceSimple?: string | null;
  evidenceGuidanceProfessional?: string | null;
  whatThisIsNotSimple?: string | null;
  whatThisIsNotProfessional?: string | null;
  defendants?: string[];
  court?: string | null;
  docketNumber?: string | null;
  affectedStates?: string[];
  filingDate?: string | null;
  keyDates?: LitigationKeyDates;
  relatedListingIds?: string[];
  adaQualifyingQuestions?: AdaQualifyingQuestions;
  leadAttorneyId?: string | null;
  leadFirmId?: string | null;
  status?: LitigationStatus;
}

export interface UpdateLitigationInput {
  kind?: LitigationKind;
  caseName?: string;
  slug?: string;
  legalTheory?: string | null;
  shortDescription?: string | null;
  shortDescriptionSimple?: string | null;
  shortDescriptionProfessional?: string | null;
  fullDescription?: string | null;
  fullDescriptionSimple?: string | null;
  fullDescriptionProfessional?: string | null;
  eligibility?: string | null;
  eligibilitySimple?: string | null;
  eligibilityProfessional?: string | null;
  documentationRequiredSimple?: string | null;
  documentationRequiredProfessional?: string | null;
  noDocumentationPathSimple?: string | null;
  noDocumentationPathProfessional?: string | null;
  evidenceGuidanceSimple?: string | null;
  evidenceGuidanceProfessional?: string | null;
  whatThisIsNotSimple?: string | null;
  whatThisIsNotProfessional?: string | null;
  defendants?: string[];
  court?: string | null;
  docketNumber?: string | null;
  affectedStates?: string[];
  filingDate?: string | null;
  keyDates?: LitigationKeyDates;
  relatedListingIds?: string[];
  adaQualifyingQuestions?: AdaQualifyingQuestions;
  leadAttorneyId?: string | null;
  leadFirmId?: string | null;
  status?: LitigationStatus;
}

export interface ListActiveLitigationOptions {
  kind?: LitigationKind;
  /**
   * Phase A3a: statuses to include. Defaults to `['active']` for
   * back-compat with Ada's prompt context (only active rows feed
   * her vocabulary). The public `/class-actions` page passes
   * `['active','compliance','investigating','tracking']` to surface
   * settled-compliance, DOJ-investigation, and regulatory-challenge
   * rows alongside the active class actions. Admin-only statuses
   * (`draft`, `closed`, `archived`) are never returned by this
   * method regardless of what the caller passes.
   */
  statuses?: LitigationStatus[];
  /** If set, only litigation matching this state in affected_states (or empty affected_states = nationwide). */
  state?: string;
  /**
   * Phase 6a: case-insensitive substring search across case_name +
   * eligibility + short_description. Empty/missing → no search filter.
   * Composes with kind + state filters (AND'd).
   */
  search?: string;
  limit?: number;
}

/**
 * Phase 6a: single-row read of an active litigation by slug, with the
 * lead attorney's name joined in. Used by the public detail endpoint.
 */
export interface ReadActiveLitigationBySlugOptions {
  orgId: string;
  slug: string;
  /**
   * Phase A3a: statuses to consider. Defaults to `['active']`. The
   * public detail endpoint passes the 4 page-visible statuses
   * (`active`, `compliance`, `investigating`, `tracking`) so that
   * settled-compliance, DOJ-investigation, and regulatory-challenge
   * rows render their detail pages. Admin-only statuses (`draft`,
   * `closed`, `archived`) always 404 regardless of what's passed.
   */
  statuses?: LitigationStatus[];
}

export interface LitigationDetailRow extends LitigationRow {
  /** null when leadAttorneyId is unset OR the attorney row is missing. */
  leadAttorneyName: string | null;
  /**
   * Phase C1: inlined surface-visible related cases resolved from
   * relatedListingIds. Skips ids that resolve to missing/draft/closed/
   * archived rows. Empty array when relatedListingIds is empty OR none
   * of the referenced rows are surface-visible.
   *
   * Surface-visible = status IN ('active','compliance','investigating',
   * 'tracking'). Same filter as the public list endpoint.
   *
   * Renders the "Related cases" card on LawsuitDetail. Front-ends MUST
   * NOT use relatedListingIds (raw ids) for rendering — those don't
   * carry case_name/kind/status. Use this array.
   */
  relatedCases: RelatedLitigationCase[];
}

/**
 * Phase C1: a single resolved related case for the LawsuitDetail
 * "Related cases" card. Minimum fields needed to render a labeled,
 * clickable link without a second fetch.
 */
export interface RelatedLitigationCase {
  id: string;
  slug: string;
  caseName: string;
  kind: LitigationKind;
  status: LitigationStatus;
}

export interface OrganizationRow {
  id: string;
  orgCode: string;
  displayName: string;
  adaIntroPrompt: string | null;
  isDefault: boolean;
}

// ─── Attorney portal (migration 0019) ────────────────────────────────────────

/** A row in litigation_firm_assignments — one firm assigned to one litigation. */
export interface LitigationFirmAssignment {
  id: string;
  litigationListingId: string;
  lawFirmId: string;
  assignedByUserId: string | null;
  createdAt: string;
}

/** Options for listPortalQueueForFirm. */
export interface PortalQueueOptions {
  page?: number;
  pageSize?: number;
  /**
   * Which cases to list. Default 'false' (open view): excludes cases this
   * firm has handled, but still lists cases handled by ANOTHER firm (grayed).
   * 'true' lists only cases this firm handled. 'all' lists everything.
   */
  handled?: 'true' | 'false' | 'all';
}

/** One case in the firm's portal queue. camelCase domain shape; the Phase 3 endpoint maps to snake_case JSON. */
export interface PortalQueueRow {
  sessionId: string;
  caseName: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  /** session.updatedAt when the litigation match landed; null in-memory (no timestamp tracked). */
  matchedAt: string | null;
  /** A firm_session_handled row exists for this session by some OTHER assigned firm. */
  handledByOtherFirm: boolean;
  /** A firm_session_handled row exists for (session, this firm). */
  handledByThisFirm: boolean;
}

export interface PortalQueueResult {
  /** Counts are firm-scoped (DO3). openCount excludes other-firm-handled; handledCount = this firm. */
  summary: { openCount: number; handledCount: number };
  cases: PortalQueueRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** One qualifying-question answer surfaced in the case detail. */
export interface PortalCaseQqAnswer {
  question: string;
  answer: string;
}

/** Full case package for a single portal case. */
export interface PortalCaseDetail {
  sessionId: string;
  litigationListingId: string;
  caseName: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  qualifyingAnswers: PortalCaseQqAnswer[];
  transcript: Message[];
  matchedAt: string | null;
  handledByThisFirm: boolean;
}

/** Result of resolving a signed-in Clerk user to an attorney (used by requireAttorney in Phase 3). */
export interface PortalAttorneyResolution {
  attorneyId: string;
  userId: string;
  lawFirmId: string;
  email: string | null;
}

export interface DbClient {
  /** Read the current state of a session. Returns null if not found. */
  readSession(opts: SessionReadOptions): Promise<AdaSessionState | null>;
  /** Persist a session state. Overwrites prior row. */
  writeSession(opts: SessionWriteOptions): Promise<void>;
  /** Look up matching attorneys for the attorney-directory tool. */
  searchAttorneys(opts: AttorneySearchOptions): Promise<AttorneyRow[]>;
  /** Distinct facet values for the attorney directory filter UI. */
  getAttorneyFacets(): Promise<AttorneyFacets>;
  /** Look up an organization by its org_code. Returns null if not found. */
  getOrgByCode(orgCode: string): Promise<OrganizationRow | null>;
  /** Persist an anon_sessions row (creates if not exists). */
  upsertAnonSession(opts: AnonSessionUpsertOptions): Promise<string>;
  /** Paginated list of ada_sessions for the admin overview. */
  listSessionsForAdmin(opts: AdminSessionListOptions): Promise<AdminSessionListResult>;
  /** Paginated list of field-test (is_test) photo analyses for expert review. */
  listPhotoAnalysesForReview(opts: PhotoReviewListOptions): Promise<PhotoReviewListResult>;
  /** Full analysis plus any existing expert review, for the detail page. */
  getPhotoAnalysisForReview(photoAnalysisId: string): Promise<PhotoReviewDetail | null>;
  /** Create or update the single authoritative expert review for an analysis. */
  upsertPhotoReview(input: UpsertPhotoReviewInput): Promise<void>;
  /** Accuracy rollup grouped by engine (model) version. */
  getPhotoReviewEvalSummary(): Promise<PhotoReviewEvalRow[]>;
  /** Admin list of attorneys across all statuses. */
  listAttorneysForAdmin(opts: AdminAttorneyListOptions): Promise<AdminAttorneyListResult>;
  /** Read a single attorney by id for admin view. */
  getAttorneyById(id: string): Promise<AttorneyAdminRow | null>;
  /** Insert a new attorney row. Returns the created row. */
  createAttorney(input: CreateAttorneyInput): Promise<AttorneyAdminRow>;
  /** Partial update of an attorney. Returns the updated row or null. */
  updateAttorney(id: string, input: UpdateAttorneyInput): Promise<AttorneyAdminRow | null>;
  /**
   * Permanently delete an attorney. Gated server-side: succeeds only
   * when the target row already has status='archived'. Returns true on
   * success, false if the row is missing or not archived.
   *
   * Writes an `attorney.hard_delete` row to audit_log capturing the
   * full before-state so the delete is auditable. The audit write and
   * the row delete happen in one transaction — you don't get one
   * without the other.
   *
   * litigation_listings.lead_attorney_id is ON DELETE SET NULL at the
   * schema level, so any litigation cases led by this attorney lose
   * their `lead_attorney_id` rather than being deleted (a case can
   * outlive its lead).
   *
   * Ref: /plan ADALL Admin: Archive → Delete.
   */
  hardDeleteAttorney(
    id: string,
    actor: HardDeleteActor,
  ): Promise<boolean>;
  /**
   * Test-only: in-memory audit log buffer. NeonDbClient leaves this
   * undefined — audit rows live in the real audit_log table there.
   * Tests assert on this buffer to verify the in-memory implementation
   * writes audit entries correctly.
   */
  readonly __testAuditLog?: ReadonlyArray<AuditLogEntry>;

  // ─── Litigation listings (Phase 2) ──────────────────────────────────────

  /** Admin: list litigation rows across kinds/statuses with filter + pagination. */
  listLitigationForAdmin(opts: ListLitigationForAdminOptions): Promise<ListLitigationForAdminResult>;
  /** Admin: read a single litigation row by id. */
  getLitigationById(id: string): Promise<LitigationAdminRow | null>;
  /** Admin: insert a new litigation row. */
  createLitigation(input: CreateLitigationInput): Promise<LitigationAdminRow>;
  /** Admin: partial update. Returns the updated row or null. */
  updateLitigation(id: string, input: UpdateLitigationInput): Promise<LitigationAdminRow | null>;
  /**
   * Engine: list active litigation rows for Ada's system prompt and the
   * public read endpoint. Filters status='active'. Optional kind + state
   * narrowing. A row with empty affected_states is treated as nationwide
   * and matches every state filter.
   */
  listActiveLitigation(opts?: ListActiveLitigationOptions): Promise<LitigationRow[]>;
  /**
   * Phase 6a: read a single active litigation row by slug, scoped to
   * orgId. Returns the row joined with the lead attorney's name, or null
   * if no matching active row exists.
   */
  readActiveLitigationBySlug(
    opts: ReadActiveLitigationBySlugOptions,
  ): Promise<LitigationDetailRow | null>;

  /** Read a single system_settings value by key. */
  getSystemSetting<T = unknown>(key: string): Promise<T | null>;
  /** Write a system_settings value by key (upsert). */
  setSystemSetting<T = unknown>(key: string, value: T, updatedBy?: string | null): Promise<void>;
  /** Aggregate session stats for the admin analytics dashboard. */
  getAdminAnalytics(opts?: AdminAnalyticsOptions): Promise<AdminAnalyticsResult>;
  /** Persist a session_quality_checks row (upserts by session_id). */
  writeSessionQualityCheck(opts: SessionQualityCheckWrite): Promise<void>;
  /** Read the latest quality check row for a session. */
  readSessionQualityCheck(sessionId: string): Promise<SessionQualityCheckRow | null>;
  /**
   * Find the most-recently-updated active session for a given anon
   * identity. Used for session resume — if a user returns to the site
   * with their anon cookie intact and has an in-progress conversation,
   * we offer to continue it rather than starting fresh.
   *
   * Returns null if no active session exists for this anon.
   */
  findActiveSessionForAnon(anonSessionId: string): Promise<AdaSessionState | null>;
  /**
   * Read-only lookup: find an existing anon_sessions row by its token
   * hash without upserting. Returns null if the hash is unknown.
   * Used by the session-resume endpoint to avoid creating spurious
   * anon_sessions rows during a "do I have an existing session?" check.
   */
  findAnonSessionByHash(tokenHash: string): Promise<string | null>;
  /**
   * Hybrid search over the ADA knowledge base (ada_knowledge_chunks).
   * Combines vector cosine similarity against the query embedding with
   * an exact citation-match fallback (so "§36.302" still hits even if
   * semantic similarity ranks it lower). Returns the top-k unioned
   * results, deduplicated by chunk id, ordered best-first.
   *
   * Returns an empty array rather than throwing if the KB is empty or
   * the embedding client is unavailable — retrieval is an enhancement,
   * not a hard dependency.
   *
   * Ref: docs/ARCHITECTURE.md §10.5
   */
  searchKnowledgeBase(opts: KnowledgeSearchOptions): Promise<KnowledgeChunkHit[]>;
  /**
   * Persist a generated SessionPackage. The package is an immutable
   * artifact — if a session produces more than one (e.g. re-generated
   * after an admin correction), each gets its own row with a distinct
   * slug. Step 18 (Triage & Routing).
   */
  writeSessionPackage(opts: WriteSessionPackageOptions): Promise<void>;
  /**
   * Look up a package by its public slug. Returns null if unknown or
   * expired. No auth required — the slug IS the access control.
   */
  readSessionPackageBySlug(slug: string): Promise<SessionPackageRow | null>;
  /**
   * Admin/engine lookup: find the most recent package for a session.
   * Used by the admin session detail view and by the engine when it
   * needs to avoid regenerating a package for an already-packaged
   * session.
   */
  readLatestSessionPackageForSession(sessionId: string): Promise<SessionPackageRow | null>;

  // ─── Ch1 — law firms, listings, subscriptions (Step 19) ──────────────────
  //
  // Minimal CRUD surface needed for Steps 20-24 (match_listing tool,
  // routing engine, Stripe billing, attorney handoff). The full admin
  // surface ships with Step 25. Writes are idempotent on the natural
  // key (slug for listings, stripeSubscriptionId for subscriptions) so
  // seed + test flows don't need delete-first.

  /**
   * Insert or update a law firm. `id` is required; callers generate it
   * (via crypto.randomUUID) so they know what to reference as FK in
   * listings created in the same flow.
   */
  writeLawFirm(row: LawFirmRow): Promise<void>;
  /** Read a law firm by id. Null for unknown. */
  readLawFirmById(id: string): Promise<LawFirmRow | null>;

  /**
   * Admin-side: list law firms with optional filters + pagination.
   * Filters are AND'd. A firm matches when every provided filter
   * matches. Empty/missing filters are ignored. Step 25.
   */
  listFirmsForAdmin(opts: AdminFirmListOptions): Promise<AdminFirmListResult>;

  /** Insert or update a listing (keyed by id; slug is separately unique). */
  writeListing(row: ListingRow): Promise<void>;
  /** Read a listing by its public slug. Null for unknown. */
  readListingBySlug(slug: string): Promise<ListingRow | null>;
  /** Read a listing by id. Null for unknown. */
  readListingById(id: string): Promise<ListingRow | null>;

  /**
   * Admin-side: list every listing owned by a specific firm. Returns
   * all statuses (draft, published, archived) sorted newest first.
   * Used by the firm detail page. Step 25.
   */
  listListingsForFirm(lawFirmId: string): Promise<ListingRow[]>;

  /**
   * Admin-side: list all listings in the org across every firm, with
   * optional filters + pagination. Used by the /admin/listings list
   * page. Step 25.
   */
  listListingsForAdmin(opts: AdminListingListOptions): Promise<AdminListingListResult>;

  /** Insert or update a listing_config (one-to-one with listing). */
  writeListingConfig(row: ListingConfigRow): Promise<void>;
  /** Read the config attached to a listing, if any. */
  readListingConfigForListing(listingId: string): Promise<ListingConfigRow | null>;

  /**
   * Insert or update a subscription. stripeSubscriptionId is unique; a
   * second call with the same id updates the existing row (used when
   * Stripe webhooks replay).
   */
  writeSubscription(row: SubscriptionRow): Promise<void>;
  readSubscriptionById(id: string): Promise<SubscriptionRow | null>;

  /**
   * Look up a subscription by Stripe's id (sub_xxx). Used by the
   * webhook handler in Step 23 to find the local row that corresponds
   * to an incoming Stripe event.
   */
  readSubscriptionByStripeId(stripeSubscriptionId: string): Promise<SubscriptionRow | null>;

  /**
   * Admin-side: list every subscription (real Stripe rows only) for a
   * firm across all statuses. Ordered newest first. Step 25.
   */
  listSubscriptionsForFirm(lawFirmId: string): Promise<SubscriptionRow[]>;

  /**
   * Admin-side: list all subscriptions across every firm in the org,
   * with optional filters + pagination. Used by /admin/subscriptions.
   * Step 25 Commit 6.
   */
  listAllSubscriptionsForAdmin(
    opts: AdminSubscriptionListOptions,
  ): Promise<AdminSubscriptionListResult>;

  /**
   * Admin-side: list intake sessions (session_type='class_action_intake')
   * with firm + listing names attached. Used by /admin/intakes.
   * Step 25 Commit 6.
   */
  listIntakesForAdmin(opts: AdminIntakeListOptions): Promise<AdminIntakeListResult>;

  /**
   * Admin-side: read a single intake session by id with the joined firm
   * and listing in one round-trip. Used by /admin/intakes/[id] (Phase 4).
   * Returns null when the session does not exist, is not a
   * class_action_intake, or does not belong to the supplied org (cross-org
   * access surfaces as not-found to avoid leaking existence).
   */
  readIntakeForAdmin(
    opts: AdminIntakeReadOptions,
  ): Promise<AdminIntakeReadResult | null>;

  // ─── stripe_webhook_events (Step 23) ──────────────────────────────────────
  //
  // Idempotency store for Stripe webhook processing. Every incoming
  // event is INSERTed into this table keyed on stripe_event_id (UNIQUE).
  // A replay attempt - Stripe retries on 5xx or timeout - collides on
  // the unique constraint, at which point we know we've already seen
  // this event and can respond 200 without re-processing.

  /**
   * Attempt to record a webhook event. Returns true if the row was
   * inserted (first time seeing this event), false if the event id
   * was already present (replay). The caller uses the boolean to
   * decide whether to process the event's business logic.
   */
  recordWebhookEvent(row: StripeWebhookEventRow): Promise<{ inserted: boolean }>;

  /**
   * Mark a webhook event as processed (or record the processing
   * error). Called at the end of handling each event.
   */
  markWebhookEventProcessed(stripeEventId: string, error: string | null): Promise<void>;

  /**
   * Read from v_active_listings. Returns rows where listing.status =
   * 'published' AND firm.status = 'active' AND subscription is active
   * AND not past current_period_end. See migration 0004.
   *
   * Multiple subscriptions for the same listing produce multiple rows;
   * callers are expected to DISTINCT ON listing_id if they want a
   * single row per listing.
   */
  listActiveListings(opts?: ListActiveListingsOptions): Promise<ActiveListingRow[]>;

  // ─── routing_rules (Step 22) ─────────────────────────────────────────────
  //
  // routing_rules defines cross-channel redirects. A rule says "for this
  // complaint type in this jurisdiction, there's another org that can
  // help." Ch1 ships the rails; Ch2 adds the destination orgs. When no
  // rules exist (Ch1 state), evaluation returns empty and the routing
  // block in Ada's prompt is omitted.

  /** Insert or update a routing rule (keyed by id). */
  writeRoutingRule(row: RoutingRuleRow): Promise<void>;
  /**
   * Return every active routing rule with the target org joined in. The
   * engine's rule evaluator (evaluateRoutingRules) filters in-memory
   * against session state. Ordered by priority ASC then rule id so
   * tie-breaking is stable.
   */
  listActiveRoutingRules(): Promise<RoutingRuleWithTarget[]>;

  // ─── Attorney portal (migration 0019) ──────────────────────────────────────

  /**
   * Portal queue for a firm: sessions whose litigation row is assigned to
   * `lawFirmId` (via litigation_firm_assignments), with firm-scoped summary
   * counts and gray-out flags from firm_session_handled. See PortalQueueOptions
   * for the handled-filter semantics.
   */
  listPortalQueueForFirm(
    lawFirmId: string,
    opts?: PortalQueueOptions,
  ): Promise<PortalQueueResult>;

  /**
   * Full case package for a single session, scoped to a firm. Returns null
   * when the session doesn't exist OR the firm has no assignment for the
   * session's litigation row (the access boundary).
   */
  getPortalCaseForFirm(
    sessionId: string,
    lawFirmId: string,
  ): Promise<PortalCaseDetail | null>;

  /**
   * Mark a case handled by a firm. Idempotent — a second call for the same
   * (session, firm) is a no-op. One-bit state (DO2: permanent in v1).
   */
  markFirmSessionHandled(
    sessionId: string,
    lawFirmId: string,
    handledByUserId: string | null,
  ): Promise<void>;

  /** List the firms currently assigned to a litigation row. */
  listFirmAssignmentsForLitigation(
    litigationListingId: string,
  ): Promise<LitigationFirmAssignment[]>;

  /**
   * Replace the full set of firms assigned to a litigation row (PUT
   * semantics). Returns the resulting assignment set.
   */
  replaceFirmAssignmentsForLitigation(
    litigationListingId: string,
    lawFirmIds: string[],
    assignedByUserId?: string | null,
  ): Promise<LitigationFirmAssignment[]>;

  /**
   * Resolve a signed-in Clerk user id to a paired attorney (Clerk user →
   * users.clerk_user_id → attorneys.user_id → law_firms). Null when no
   * paired attorney exists. Consumed by requireAttorney in Phase 3.
   */
  resolveAttorneyByClerkUserId(
    clerkUserId: string,
  ): Promise<PortalAttorneyResolution | null>;
}

// ─── Ch1 row shapes ───────────────────────────────────────────────────────────

export interface LawFirmRow {
  id: string;
  orgId: string;
  name: string;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  status: 'active' | 'suspended' | 'churned';
  /**
   * When true, this firm's listings are active without a Stripe
   * subscription (pilot mode). Flip to false and start a Stripe sub
   * to transition into paid billing. Step 23.
   */
  isPilot: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListingRow {
  id: string;
  lawFirmId: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string | null;
  shortDescriptionSimple?: string | null;
  shortDescriptionProfessional?: string | null;
  fullDescription: string | null;
  fullDescriptionSimple?: string | null;
  fullDescriptionProfessional?: string | null;
  eligibilitySummary: string | null;
  eligibilitySummarySimple?: string | null;
  eligibilitySummaryProfessional?: string | null;
  status: 'draft' | 'published' | 'archived';
  tier: 'basic' | 'premium';
  createdAt?: string;
  updatedAt?: string;
}

export interface ListingConfigRow {
  id: string;
  listingId: string;
  caseDescription: string;
  caseDescriptionSimple?: string | null;
  caseDescriptionProfessional?: string | null;
  eligibilityCriteria: unknown[];
  requiredFields: unknown[];
  disqualifyingConditions: string[];
  adaPromptOverride: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionRow {
  id: string;
  lawFirmId: string;
  listingId: string | null;
  stripeSubscriptionId: string | null;
  tier: 'basic' | 'premium';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * One Stripe webhook event as persisted to stripe_webhook_events. The
 * payload is the full event.data.object JSON so we can replay or
 * audit if needed.
 */
export interface StripeWebhookEventRow {
  stripeEventId: string;
  type: string;
  payload: unknown;
}

export interface ListActiveListingsOptions {
  /** Optional category filter (exact match). */
  category?: string;
  /** Optional law firm filter. */
  lawFirmId?: string;
}

export interface ActiveListingRow {
  listingId: string;
  slug: string;
  title: string;
  category: string;
  tier: string;
  shortDescription: string | null;
  shortDescriptionSimple?: string | null;
  shortDescriptionProfessional?: string | null;
  fullDescription: string | null;
  fullDescriptionSimple?: string | null;
  fullDescriptionProfessional?: string | null;
  eligibilitySummary: string | null;
  eligibilitySummarySimple?: string | null;
  eligibilitySummaryProfessional?: string | null;
  lawFirmId: string;
  lawFirmName: string;
  /** Nullable for pilot-firm listings (no Stripe sub). */
  subscriptionId: string | null;
  /** 'pilot' for pilot firms, otherwise the subscription's tier. */
  subscriptionTier: string;
  currentPeriodEnd: string | null;
  /** Step 23: true when this listing is live via pilot mode. */
  isPilot: boolean;
}

// ─── Ch1 routing row shapes (Step 22) ─────────────────────────────────────────

export interface RoutingRuleRow {
  id: string;
  targetOrgId: string;
  /**
   * Complaint types this rule matches. Values align with
   * Classification.title ('I', 'II', 'III', 'class_action',
   * 'out_of_scope'). Empty array = matches any complaint type.
   */
  complaintTypes: string[];
  /**
   * Jurisdictions this rule matches. Empty array = matches any
   * jurisdiction. State matching is required; city is an optional
   * narrower filter (city match requires state match too).
   */
  jurisdictions: import('../../types/db.js').RoutingJurisdiction[];
  active: boolean;
  /**
   * Lower priority number = higher precedence. Ordering is priority
   * ASC then id to keep tiebreaking stable. Default 100.
   */
  priority: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A routing rule joined with its target organization's display fields.
 * Returned by listActiveRoutingRules for use in the engine's rule
 * evaluator — the evaluator needs the org_code and display_name to
 * build the RoutingMatch that goes in Ada's prompt and the hop URL.
 */
export interface RoutingRuleWithTarget {
  ruleId: string;
  targetOrgId: string;
  targetOrgCode: string;
  targetOrgDisplayName: string;
  complaintTypes: string[];
  jurisdictions: import('../../types/db.js').RoutingJurisdiction[];
  priority: number;
}

export interface WriteSessionPackageOptions {
  slug: string;
  sessionId: string;
  /** Serialized SessionPackage payload. */
  payload: unknown;
  /** Denormalized for admin filtering — the classification.title value. */
  classificationTitle: string | null;
  generatedAt: string;
  /** ISO timestamp, null for permanent retention. */
  expiresAt: string | null;
}

export interface SessionPackageRow {
  slug: string;
  sessionId: string;
  /** Deserialized SessionPackage payload. Caller narrows the type. */
  payload: unknown;
  classificationTitle: string | null;
  generatedAt: string;
  expiresAt: string | null;
}

export interface KnowledgeSearchOptions {
  /** Raw user text used for both semantic search and citation extraction. */
  query: string;
  /** Number of results to return after merging vector + citation hits. Default 5, max 10. */
  k?: number;
  /** Optional topic filter (matches the `topic` column). */
  topic?: string;
  /**
   * Precomputed embedding for `query`. If present, we skip the embedding
   * client call. Lets the engine embed once and reuse across KB searches
   * within a turn.
   */
  queryEmbedding?: number[];
}

export interface KnowledgeChunkHit {
  id: string;
  topic: string;
  title: string;
  content: string;
  standardRefs: string[];
  source: string | null;
  /** Cosine similarity (0..1, higher is better). Only set for vector hits. */
  similarity: number | null;
  /** Which retrieval path surfaced this chunk. */
  matchType: 'vector' | 'citation';
}

export interface SessionQualityCheckWrite {
  sessionId: string;
  passed: boolean;
  failures: Array<{ code: string; message: string; details?: Record<string, unknown> }>;
  warnings: Array<{ code: string; message: string; details?: Record<string, unknown> }>;
}

export interface SessionQualityCheckRow {
  id: string;
  sessionId: string;
  passed: boolean;
  failures: Array<{ code: string; message: string; details?: Record<string, unknown> }>;
  warnings: Array<{ code: string; message: string; details?: Record<string, unknown> }>;
  checkedAt: string;
}

export interface AdminAnalyticsOptions {
  /** Number of days for the session-volume time series. Default 14, max 90. */
  days?: number;
  /** Include is_test rows in every view. Default false. */
  includeTest?: boolean;
}

export interface AdminAnalyticsResult {
  /** One entry per day, oldest-first, zero-filled for days with no sessions. */
  sessionVolume: Array<{ date: string; count: number }>;
  /** Counts across the full lifetime (filtered by include_test). */
  statusCounts: {
    active: number;
    completed: number;
    abandoned: number;
    total: number;
  };
  /** Finished sessions only. completed / (completed + abandoned), 0..1. null if no finished sessions yet. */
  completionRate: number | null;
  readingLevelDistribution: {
    simple: number;
    standard: number;
    professional: number;
  };
  classificationBreakdown: Array<{ title: string; count: number }>;
  toolUseFrequency: Array<{ tool: string; count: number }>;
  /**
   * Lifetime count of class_action_intake sessions (filtered by include_test
   * the same way every other counter in this result is). Phase 5a addition —
   * powers the AdminDashboard "Intakes" tile without a separate endpoint.
   */
  intakesTotal: number;
}

export interface AdminSessionListOptions {
  /** Filter by status; omit to return all (excludes is_test=true rows by default). */
  status?: 'active' | 'completed' | 'abandoned';
  /** Include is_test=true rows. Default false — QA sessions are noise for admin. */
  includeTest?: boolean;
  /** Include never-touched (0-message) sessions. Default false — these are
   *  created on chat-page load before anyone types, and are pure noise. */
  includeEmpty?: boolean;
  /** 1-based page number. Default 1. */
  page?: number;
  /** Rows per page. 1..100. Default 25. */
  pageSize?: number;
}

export interface AdminSessionSummary {
  sessionId: string;
  status: 'active' | 'completed' | 'abandoned';
  readingLevel: 'simple' | 'standard' | 'professional';
  /** Title I / II / III slug if Ada classified the incident, else null. */
  classificationTitle: string | null;
  /** Count of messages in the conversation (user + assistant). */
  messageCount: number;
  /** How many extracted fields landed on the session. */
  extractedFieldCount: number;
  /** Created timestamp from the row (ISO). */
  createdAt: string;
  /** Last-updated timestamp (ISO). */
  updatedAt: string;
  /** True if this session was marked is_test (QA origin). */
  isTest: boolean;
}

export interface AdminSessionListResult {
  sessions: AdminSessionSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Admin: photo review (expert labeling loop) ─────────────────────────────

export type PhotoReviewState = 'unreviewed' | 'reviewed' | 'addressed';

export interface PhotoReviewListOptions {
  /** Filter by review state. 'unreviewed' = analysis has no photo_reviews row. */
  reviewState?: PhotoReviewState;
  /** Filter by the analysis overall_risk. */
  risk?: PhotoOverallRisk;
  /** Filter by engine (model) version. */
  modelVersion?: string;
  /** 1-based page number. Default 1. */
  page?: number;
  /** Rows per page, 1..100. Default 25. */
  pageSize?: number;
}

export interface PhotoReviewListItem {
  photoAnalysisId: string;
  sessionId: string;
  photoUrl: string;
  overallRisk: PhotoOverallRisk | null;
  findingCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  advisoryCount: number;
  modelVersion: string;
  analyzedAt: string;
  reviewState: PhotoReviewState;
  overallVerdict: ReviewOverallVerdict | null;
}

export interface PhotoReviewListResult {
  items: PhotoReviewListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PhotoReviewRecord {
  reviewerEmail: string;
  status: ReviewStatus;
  overallVerdict: ReviewOverallVerdict | null;
  findingLabels: PhotoFindingLabel[];
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
  overallRisk: PhotoOverallRisk | null;
  positiveFindings: ReadingLevelStringList | null;
  findings: PhotoFinding[];
  modelVersion: string;
  analyzedAt: string;
  /** Null when not yet reviewed. */
  review: PhotoReviewRecord | null;
}

export interface UpsertPhotoReviewInput {
  photoAnalysisId: string;
  reviewerEmail: string;
  status?: ReviewStatus;
  overallVerdict?: ReviewOverallVerdict | null;
  findingLabels: PhotoFindingLabel[];
  missedFindings: MissedFinding[];
  reviewerNotes?: string | null;
  modelVersion?: string | null;
}

export interface PhotoReviewEvalRow {
  modelVersion: string;
  analysesReviewed: number;
  findingsLabeled: number;
  correct: number;
  overFlagged: number;
  partial: number;
  wrongCite: number;
  missedTotal: number;
}

export interface AttorneyFacets {
  /** Two-letter state codes that at least one approved attorney covers. */
  states: string[];
  /** Distinct practice area slugs across approved attorneys. */
  practiceAreas: string[];
}

export interface AnonSessionUpsertOptions {
  orgId: string;
  tokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

// ─── Blob client ──────────────────────────────────────────────────────────────

export interface BlobUploadOptions {
  key: string;
  contentType: string;
  body: Uint8Array | string;
}

export interface BlobUploadResult {
  url: string;
  key: string;
}

export interface BlobClient {
  upload(opts: BlobUploadOptions): Promise<BlobUploadResult>;
  getSignedUrl(key: string): Promise<string>;
}

// ─── Photo analysis client ────────────────────────────────────────────────────
// Logically "AI" but a separate surface because the model, prompt, and
// output shape are distinct. Keeps the main AiClient focused on conversation.

export interface PhotoAnalysisRequest {
  /**
   * Up to 3 blob keys (data: URI or Vercel Blob URL) for photos from
   * the same site. The analyzer treats them as a batch so it can
   * reason about cross-photo compliance chains. Throws if length is
   * 0 or > 3. Step 30, Commit 8.
   */
  blobKeys: string[];
  contextHint?: string;
}

export interface PhotoAnalysisResult {
  output: PhotoAnalysisOutput;
  modelVersion: string;
}

export interface PhotoAnalysisClient {
  analyze(req: PhotoAnalysisRequest): Promise<PhotoAnalysisResult>;
}

// ─── Email client ─────────────────────────────────────────────────────────────

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailClient {
  send(opts: EmailSendOptions): Promise<{ id: string }>;
}

// ─── Time + random (for determinism in tests) ─────────────────────────────────

export interface ClockClient {
  now(): Date;
}

export interface RandomClient {
  uuid(): string;
  token(bytes?: number): string;
}

// ─── Audit logger ─────────────────────────────────────────────────────────────

export interface AuditEntry {
  orgId: string | null;
  actorType: 'user' | 'ada' | 'staff' | 'system' | 'webhook';
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown>;
}

export interface AuditClient {
  log(entry: AuditEntry): Promise<void>;
}

// ─── Embeddings (RAG retrieval support) ───────────────────────────────────────

/**
 * Minimal embedding client seam. The engine uses this to embed the
 * user query at turn start so DbClient.searchKnowledgeBase can do
 * vector similarity. Production implementation lives in
 * src/engine/knowledge/embeddings.ts (OpenAI text-embedding-3-small).
 *
 * The engine tolerates embed failures — knowledge retrieval is an
 * enhancement, not a hard requirement. If this client throws,
 * processAdaTurn falls back to citation-only KB search.
 */
export interface EmbeddingClient {
  /** Embed a single query. Returns a 1536-dim vector. */
  embedQuery(text: string): Promise<number[]>;
}

// ─── The seam ─────────────────────────────────────────────────────────────────

export interface AdaClients {
  ai: AiClient;
  db: DbClient;
  blob: BlobClient;
  photo: PhotoAnalysisClient;
  email: EmailClient;
  clock: ClockClient;
  random: RandomClient;
  audit: AuditClient;
  /**
   * Optional: embedding client for knowledge-base retrieval. Absent in
   * tests that don't care about RAG. When absent, processAdaTurn skips
   * the vector search and the knowledge-base section is omitted from
   * the prompt.
   */
  embeddings?: EmbeddingClient;
  /**
   * Step 22: HMAC secret for minting hop tokens (route tool with
   * destination=external). Sourced from process.env.ADALL_HOP_SECRET
   * in production; tests pass a fixed string. When absent, the route
   * tool refuses external routes and returns a clear error — this
   * degrades gracefully rather than crashing the turn.
   */
  hopSecret?: string;
  /**
   * Step 23: Stripe billing client. Optional — when absent, checkout
   * and portal endpoints return a clear "not configured" error, and
   * webhook verification refuses all events. Pilot firms still work
   * without it (they don't touch Stripe).
   */
  stripe?: import('./stripeClient.js').AdaStripeClient;
}
