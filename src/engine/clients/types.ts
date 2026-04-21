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
