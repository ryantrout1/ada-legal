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
}
