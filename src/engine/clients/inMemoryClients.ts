/**
 * In-memory AdaClients for tests.
 *
 * Each client stores state in plain maps/arrays. Tests can:
 *   - inspect state directly (e.g. `clients.email.sent` after a test)
 *   - program scripted AI responses (`clients.ai.enqueueResponse(...)`)
 *   - control time and randomness (`clients.clock.advance()`, `clients.random.seed(...)`)
 *
 * This is deliberately not built on top of shared helpers. Reading one of
 * these classes should be enough to understand what a test fixture does.
 *
 * Ref: docs/ARCHITECTURE.md §13
 */

import type { AdaSessionState } from '../types';
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

// ─── AI ───────────────────────────────────────────────────────────────────────

export class InMemoryAiClient implements AiClient {
  /** Queue of canned responses. Each entry is consumed in order. */
  public readonly responseQueue: AiStreamChunk[][] = [];
  /** Every request ever made, for assertions. */
  public readonly requests: AiStreamRequest[] = [];

  enqueueResponse(chunks: AiStreamChunk[]): void {
    this.responseQueue.push(chunks);
  }

  /** Convenience: enqueue a plain text response with no tool calls. */
  enqueueText(text: string): void {
    this.enqueueResponse([
      { type: 'text_delta', content: text },
      { type: 'message_stop' },
    ]);
  }

  async *stream(req: AiStreamRequest): AsyncIterable<AiStreamChunk> {
    this.requests.push(req);
    const chunks = this.responseQueue.shift();
    if (!chunks) {
      throw new Error(
        'InMemoryAiClient: stream() called but no response queued. ' +
          'Did the test forget clients.ai.enqueueResponse(...) or enqueueText(...)?',
      );
    }
    for (const chunk of chunks) {
      yield chunk;
    }
  }
}

// ─── DB ───────────────────────────────────────────────────────────────────────

export class InMemoryDbClient implements DbClient {
  public readonly sessions = new Map<string, AdaSessionState>();
  public readonly attorneys: AttorneyRow[] = [];

  async readSession({ sessionId }: SessionReadOptions): Promise<AdaSessionState | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async writeSession({ state }: SessionWriteOptions): Promise<void> {
    // Deep clone so later mutations by the caller don't silently change stored state.
    this.sessions.set(state.sessionId, structuredClone(state));
  }

  async searchAttorneys(opts: AttorneySearchOptions): Promise<AttorneyRow[]> {
    const results = this.attorneys.filter((a) => {
      if (opts.state && a.locationState !== opts.state) return false;
      if (opts.city && a.locationCity !== opts.city) return false;
      if (opts.practiceAreas && opts.practiceAreas.length > 0) {
        if (!opts.practiceAreas.some((p) => a.practiceAreas.includes(p))) return false;
      }
      return true;
    });
    return opts.limit ? results.slice(0, opts.limit) : results;
  }
}

// ─── Blob ─────────────────────────────────────────────────────────────────────

export class InMemoryBlobClient implements BlobClient {
  public readonly blobs = new Map<string, { contentType: string; body: Uint8Array | string }>();

  async upload(opts: BlobUploadOptions): Promise<BlobUploadResult> {
    this.blobs.set(opts.key, { contentType: opts.contentType, body: opts.body });
    return {
      url: `memory://${opts.key}`,
      key: opts.key,
    };
  }

  async getSignedUrl(key: string): Promise<string> {
    if (!this.blobs.has(key)) {
      throw new Error(`InMemoryBlobClient: no blob at key ${key}`);
    }
    return `memory://${key}?signed=1`;
  }
}

// ─── Photo ────────────────────────────────────────────────────────────────────

export class InMemoryPhotoAnalysisClient implements PhotoAnalysisClient {
  public readonly responseQueue: PhotoAnalysisResult[] = [];
  public readonly requests: PhotoAnalysisRequest[] = [];

  enqueueResult(result: PhotoAnalysisResult): void {
    this.responseQueue.push(result);
  }

  async analyze(req: PhotoAnalysisRequest): Promise<PhotoAnalysisResult> {
    this.requests.push(req);
    const result = this.responseQueue.shift();
    if (!result) {
      throw new Error(
        'InMemoryPhotoAnalysisClient: analyze() called but no result queued.',
      );
    }
    return result;
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

export class InMemoryEmailClient implements EmailClient {
  public readonly sent: Array<EmailSendOptions & { id: string }> = [];
  private nextId = 1;

  async send(opts: EmailSendOptions): Promise<{ id: string }> {
    const id = `mem-email-${this.nextId++}`;
    this.sent.push({ ...opts, id });
    return { id };
  }
}

// ─── Clock ────────────────────────────────────────────────────────────────────

export class InMemoryClock implements ClockClient {
  private current: Date;

  constructor(initial: Date = new Date('2026-04-20T12:00:00Z')) {
    this.current = new Date(initial);
  }

  now(): Date {
    return new Date(this.current);
  }

  set(instant: Date): void {
    this.current = new Date(instant);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

// ─── Random ───────────────────────────────────────────────────────────────────

export class InMemoryRandom implements RandomClient {
  private counter = 0;

  constructor(private readonly prefix = 'test') {}

  uuid(): string {
    // Valid UUID v4 shape, but deterministic by counter. Enough for tests.
    const n = (this.counter++).toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${n}`;
  }

  token(_bytes = 32): string {
    return `${this.prefix}-token-${this.counter++}`;
  }
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export class InMemoryAuditClient implements AuditClient {
  public readonly entries: AuditEntry[] = [];

  async log(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

// ─── Combined fixture ────────────────────────────────────────────────────────

export interface InMemoryAdaClients extends AdaClients {
  ai: InMemoryAiClient;
  db: InMemoryDbClient;
  blob: InMemoryBlobClient;
  photo: InMemoryPhotoAnalysisClient;
  email: InMemoryEmailClient;
  clock: InMemoryClock;
  random: InMemoryRandom;
  audit: InMemoryAuditClient;
}

/** Convenience factory for tests. Each call returns a fresh set of fakes. */
export function makeInMemoryClients(): InMemoryAdaClients {
  return {
    ai: new InMemoryAiClient(),
    db: new InMemoryDbClient(),
    blob: new InMemoryBlobClient(),
    photo: new InMemoryPhotoAnalysisClient(),
    email: new InMemoryEmailClient(),
    clock: new InMemoryClock(),
    random: new InMemoryRandom(),
    audit: new InMemoryAuditClient(),
  };
}
