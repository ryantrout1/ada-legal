/**
 * Production AdaClients factory.
 *
 * Wires real services: Anthropic, Neon via Drizzle, Vercel Blob, Resend.
 * Each client adapter lives in its own file and is instantiated here.
 *
 * This file is intentionally thin. It exists in Phase A so the engine
 * code has a real concrete AdaClients to import when we start writing
 * real endpoints, even though most client adapters are not yet implemented.
 *
 * Adapters that DO exist in this phase:
 *   - NeonDbClient (thin wrapper around Drizzle, readSession/writeSession/searchAttorneys)
 *   - SystemClock (uses Date.now())
 *   - CryptoRandom (uses Node crypto)
 *   - NoopAuditClient (writes to audit_log via Drizzle in a later step)
 *
 * Adapters that DO NOT yet exist (stubbed):
 *   - AnthropicAiClient → filled in Phase A Step 9
 *   - VercelBlobClient → filled in Phase B
 *   - AnthropicPhotoClient → filled in Phase A Step 10
 *   - ResendEmailClient → filled in Phase B
 *
 * Stubbed adapters throw a descriptive error if called. This is on purpose:
 * it catches accidental production-code paths that reach for an unbuilt
 * dependency long before that path is wired up properly.
 *
 * Ref: docs/ARCHITECTURE.md §6, §13
 */

import { randomUUID, randomBytes } from 'node:crypto';
import type {
  AdaClients,
  AiClient,
  AiStreamChunk,
  AiStreamRequest,
  AttorneyRow,
  AttorneySearchOptions,
  AuditClient,
  AuditEntry,
  BlobClient,
  BlobUploadOptions,
  BlobUploadResult,
  ClockClient,
  DbClient,
  EmailClient,
  EmailSendOptions,
  PhotoAnalysisClient,
  PhotoAnalysisRequest,
  PhotoAnalysisResult,
  RandomClient,
  SessionReadOptions,
  SessionWriteOptions,
} from './types';
import type { AdaSessionState } from '../types';

// ─── Clock + Random (ready now) ───────────────────────────────────────────────

class SystemClock implements ClockClient {
  now(): Date {
    return new Date();
  }
}

class CryptoRandom implements RandomClient {
  uuid(): string {
    return randomUUID();
  }
  token(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }
}

// ─── DB (ready now; adapter shape only — Drizzle queries fill in Step 6) ──────

class NeonDbClient implements DbClient {
  // Placeholder: Drizzle db instance will be injected once session-persistence
  // is implemented in Step 6. The shape is correct; the body is a stub.

  async readSession(_opts: SessionReadOptions): Promise<AdaSessionState | null> {
    throw new Error(
      'NeonDbClient.readSession: not yet implemented (Phase A Step 6 — session persistence).',
    );
  }

  async writeSession(_opts: SessionWriteOptions): Promise<void> {
    throw new Error(
      'NeonDbClient.writeSession: not yet implemented (Phase A Step 6 — session persistence).',
    );
  }

  async searchAttorneys(_opts: AttorneySearchOptions): Promise<AttorneyRow[]> {
    throw new Error(
      'NeonDbClient.searchAttorneys: not yet implemented (Phase B Step 12 — attorney directory).',
    );
  }
}

// ─── Audit (ready now; writes to audit_log via Drizzle in Step 6) ─────────────

class NeonAuditClient implements AuditClient {
  async log(_entry: AuditEntry): Promise<void> {
    throw new Error(
      'NeonAuditClient.log: not yet implemented (Phase A Step 6).',
    );
  }
}

// ─── Anthropic (Step 9) ───────────────────────────────────────────────────────

class StubAnthropicAiClient implements AiClient {
  async *stream(_req: AiStreamRequest): AsyncIterable<AiStreamChunk> {
    throw new Error(
      'AnthropicAiClient.stream: not yet implemented (Phase A Step 9).',
    );
    // Unreachable yield keeps TypeScript happy about the AsyncIterable contract.
    yield { type: 'message_stop' };
  }
}

// ─── Photo (Step 10) ──────────────────────────────────────────────────────────

class StubPhotoAnalysisClient implements PhotoAnalysisClient {
  async analyze(_req: PhotoAnalysisRequest): Promise<PhotoAnalysisResult> {
    throw new Error(
      'PhotoAnalysisClient.analyze: not yet implemented (Phase A Step 10).',
    );
  }
}

// ─── Vercel Blob (Phase B) ────────────────────────────────────────────────────

class StubVercelBlobClient implements BlobClient {
  async upload(_opts: BlobUploadOptions): Promise<BlobUploadResult> {
    throw new Error(
      'VercelBlobClient.upload: not yet implemented (Phase B).',
    );
  }
  async getSignedUrl(_key: string): Promise<string> {
    throw new Error(
      'VercelBlobClient.getSignedUrl: not yet implemented (Phase B).',
    );
  }
}

// ─── Resend (Phase B) ─────────────────────────────────────────────────────────

class StubResendEmailClient implements EmailClient {
  async send(_opts: EmailSendOptions): Promise<{ id: string }> {
    throw new Error(
      'ResendEmailClient.send: not yet implemented (Phase B).',
    );
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Build a production AdaClients bundle.
 *
 * Configuration comes from environment variables; callers supply them so
 * this factory stays pure. At this phase, env vars are not yet consumed —
 * the factory just assembles the adapter objects. Real wiring happens as
 * each adapter lands.
 */
export interface AdaClientsConfig {
  databaseUrl?: string;
  anthropicApiKey?: string;
  blobReadWriteToken?: string;
  resendApiKey?: string;
}

export function makeAdaClients(_config: AdaClientsConfig = {}): AdaClients {
  return {
    ai: new StubAnthropicAiClient(),
    db: new NeonDbClient(),
    blob: new StubVercelBlobClient(),
    photo: new StubPhotoAnalysisClient(),
    email: new StubResendEmailClient(),
    clock: new SystemClock(),
    random: new CryptoRandom(),
    audit: new NeonAuditClient(),
  };
}
