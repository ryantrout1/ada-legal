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

import type { Message, PhotoFinding } from '../../types/db.js';
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
  systemPrompt: string;
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
  limit?: number;
}

export interface AttorneyRow {
  id: string;
  name: string;
  firmName: string | null;
  locationCity: string | null;
  locationState: string | null;
  practiceAreas: string[];
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
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

/** All fields required to create a new attorney row. */
export interface CreateAttorneyInput {
  orgId: string;
  name: string;
  firmName?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  practiceAreas: string[];
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
  email?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  status?: AttorneyStatus;
}

export interface OrganizationRow {
  id: string;
  orgCode: string;
  displayName: string;
  adaIntroPrompt: string | null;
  isDefault: boolean;
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
  /** Admin list of attorneys across all statuses. */
  listAttorneysForAdmin(opts: AdminAttorneyListOptions): Promise<AdminAttorneyListResult>;
  /** Read a single attorney by id for admin view. */
  getAttorneyById(id: string): Promise<AttorneyAdminRow | null>;
  /** Insert a new attorney row. Returns the created row. */
  createAttorney(input: CreateAttorneyInput): Promise<AttorneyAdminRow>;
  /** Partial update of an attorney. Returns the updated row or null. */
  updateAttorney(id: string, input: UpdateAttorneyInput): Promise<AttorneyAdminRow | null>;
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

  /** Insert or update a listing (keyed by id; slug is separately unique). */
  writeListing(row: ListingRow): Promise<void>;
  /** Read a listing by its public slug. Null for unknown. */
  readListingBySlug(slug: string): Promise<ListingRow | null>;
  /** Read a listing by id. Null for unknown. */
  readListingById(id: string): Promise<ListingRow | null>;

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
   * Read from v_active_listings. Returns rows where listing.status =
   * 'published' AND firm.status = 'active' AND subscription is active
   * AND not past current_period_end. See migration 0004.
   *
   * Multiple subscriptions for the same listing produce multiple rows;
   * callers are expected to DISTINCT ON listing_id if they want a
   * single row per listing.
   */
  listActiveListings(opts?: ListActiveListingsOptions): Promise<ActiveListingRow[]>;
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
  fullDescription: string | null;
  eligibilitySummary: string | null;
  status: 'draft' | 'published' | 'archived';
  tier: 'basic' | 'premium';
  createdAt?: string;
  updatedAt?: string;
}

export interface ListingConfigRow {
  id: string;
  listingId: string;
  caseDescription: string;
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
  fullDescription: string | null;
  eligibilitySummary: string | null;
  lawFirmId: string;
  lawFirmName: string;
  subscriptionId: string;
  subscriptionTier: string;
  currentPeriodEnd: string | null;
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
}

export interface AdminSessionListOptions {
  /** Filter by status; omit to return all (excludes is_test=true rows by default). */
  status?: 'active' | 'completed' | 'abandoned';
  /** Include is_test=true rows. Default false — QA sessions are noise for admin. */
  includeTest?: boolean;
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
  blobKey: string;
  contextHint?: string;
}

export interface PhotoAnalysisResult {
  findings: PhotoFinding[];
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
}
