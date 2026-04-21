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
import { makeDb } from '../../db/client.js';
import { NeonDbClient } from './neonDbClient.js';
import { AnthropicAiClient } from './anthropicAiClient.js';
import { AnthropicPhotoAnalysisClient } from './anthropicPhotoAnalysisClient.js';
import { makeOpenAIEmbeddingClient } from '../knowledge/embeddings.js';
import type {
  AdaClients,
  AuditClient,
  AuditEntry,
  BlobClient,
  BlobUploadOptions,
  BlobUploadResult,
  ClockClient,
  EmailClient,
  EmailSendOptions,
  RandomClient,
} from './types.js';

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

// ─── DB ───────────────────────────────────────────────────────────────────────
// Real NeonDbClient lives in ./neonDbClient.ts and is imported into the factory
// below. No stub here anymore — session persistence is implemented (Step 6).

// ─── Audit (ready now; writes to audit_log via Drizzle in Step 6) ─────────────

class NeonAuditClient implements AuditClient {
  async log(_entry: AuditEntry): Promise<void> {
    throw new Error(
      'NeonAuditClient.log: not yet implemented (Phase A Step 6).',
    );
  }
}

// ─── Anthropic ────────────────────────────────────────────────────────────────
// Real AnthropicAiClient lives in ./anthropicAiClient.ts and is wired below.

// ─── Photo ────────────────────────────────────────────────────────────────────
// Real AnthropicPhotoAnalysisClient lives in ./anthropicPhotoAnalysisClient.ts
// and is wired below.

// ─── Vercel Blob ──────────────────────────────────────────────────────────────
//
// Real implementation backed by @vercel/blob. Requires
// BLOB_READ_WRITE_TOKEN in the environment. When the token is absent,
// we fall back to a stub that throws with a specific error so the
// failure surface is obvious (no silent data loss).

class VercelBlobClientImpl implements BlobClient {
  constructor(private readonly token: string) {}

  async upload(opts: BlobUploadOptions): Promise<BlobUploadResult> {
    // Dynamic import because @vercel/blob pulls in Node-only modules
    // that don't tree-shake cleanly in the engine's bundled tests.
    const { put } = await import('@vercel/blob');
    // @vercel/blob's put() accepts Buffer | Blob | stream but NOT a
    // bare Uint8Array in its type surface. Wrap bytes in Buffer.from
    // (zero-copy view) so the contract is satisfied both at runtime
    // and in TypeScript.
    const putBody =
      typeof opts.body === 'string' ? opts.body : Buffer.from(opts.body);
    const result = await put(opts.key, putBody, {
      access: 'public',
      contentType: opts.contentType,
      token: this.token,
      // addRandomSuffix=false keeps keys predictable for the short-lived
      // blob_key contract the frontend uses. We prefix keys with a
      // per-session UUID upstream so collisions are not a concern.
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return { url: result.url, key: opts.key };
  }

  async getSignedUrl(_key: string): Promise<string> {
    // Uploaded blobs have access:'public' and so are directly reachable
    // via the url returned from upload(). Signed URLs aren't needed for
    // the photo-analysis flow at this phase. When private blobs become
    // necessary (eg attorney-facing artifacts), implement with
    // @vercel/blob's head() + signature logic.
    throw new Error(
      'VercelBlobClient.getSignedUrl: not yet required. ' +
        'Public blobs are directly reachable via the URL returned from upload().',
    );
  }
}

class StubVercelBlobClient implements BlobClient {
  async upload(_opts: BlobUploadOptions): Promise<BlobUploadResult> {
    throw new Error(
      'VercelBlobClient.upload: BLOB_READ_WRITE_TOKEN not configured. ' +
        'Set it in Vercel dashboard → Storage → Blob.',
    );
  }
  async getSignedUrl(_key: string): Promise<string> {
    throw new Error(
      'VercelBlobClient.getSignedUrl: BLOB_READ_WRITE_TOKEN not configured.',
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
  /**
   * OpenAI API key. Optional: when absent, knowledge-base retrieval
   * still runs (citation match only) but vector search is skipped.
   * Enables RAG when set.
   */
  openaiApiKey?: string;
}

export function makeAdaClients(config: AdaClientsConfig = {}): AdaClients {
  if (!config.databaseUrl) {
    throw new Error(
      'makeAdaClients: DATABASE_URL is required. ' +
        'Pass it via config.databaseUrl from your API route, ' +
        'e.g. makeAdaClients({ databaseUrl: process.env.DATABASE_URL }).',
    );
  }
  if (!config.anthropicApiKey) {
    throw new Error(
      'makeAdaClients: ANTHROPIC_API_KEY is required. ' +
        'Pass it via config.anthropicApiKey from your API route.',
    );
  }

  const db = makeDb(config.databaseUrl);

  // Embeddings client is optional — if OPENAI_API_KEY isn't configured,
  // RAG falls back to citation-match-only retrieval. No error here.
  const embeddings = config.openaiApiKey
    ? makeOpenAIEmbeddingClient(config.openaiApiKey)
    : undefined;

  return {
    ai: new AnthropicAiClient(config.anthropicApiKey),
    db: new NeonDbClient(db),
    blob: config.blobReadWriteToken
      ? new VercelBlobClientImpl(config.blobReadWriteToken)
      : new StubVercelBlobClient(),
    photo: new AnthropicPhotoAnalysisClient(config.anthropicApiKey),
    email: new StubResendEmailClient(),
    clock: new SystemClock(),
    random: new CryptoRandom(),
    audit: new NeonAuditClient(),
    embeddings,
  };
}
