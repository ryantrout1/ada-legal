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

import type { AdaSessionState } from '../types.js';
import type {
  AdaClients,
  AdminAnalyticsOptions,
  AdminAnalyticsResult,
  AdminAttorneyListOptions,
  AdminAttorneyListResult,
  AdminSessionListOptions,
  AdminSessionListResult,
  AdminSessionSummary,
  AiClient,
  AiStreamChunk,
  AiStreamRequest,
  AnonSessionUpsertOptions,
  AttorneyAdminRow,
  AttorneyFacets,
  AttorneyRow,
  AttorneySearchOptions,
  AuditClient,
  AuditEntry,
  BlobClient,
  BlobUploadOptions,
  BlobUploadResult,
  ClockClient,
  CreateAttorneyInput,
  DbClient,
  EmailClient,
  EmailSendOptions,
  OrganizationRow,
  PhotoAnalysisClient,
  PhotoAnalysisRequest,
  PhotoAnalysisResult,
  RandomClient,
  SessionQualityCheckRow,
  SessionQualityCheckWrite,
  SessionReadOptions,
  SessionWriteOptions,
  UpdateAttorneyInput,
} from './types.js';

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
  public readonly adminAttorneys: AttorneyAdminRow[] = [];
  public readonly orgs: OrganizationRow[] = [];
  public readonly systemSettings = new Map<string, unknown>();
  public readonly qualityChecks = new Map<string, SessionQualityCheckRow>();
  public readonly anonSessions: Array<{
    id: string;
    orgId: string;
    tokenHash: string;
  }> = [];

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

  async getOrgByCode(orgCode: string): Promise<OrganizationRow | null> {
    return this.orgs.find((o) => o.orgCode === orgCode) ?? null;
  }

  async upsertAnonSession(opts: AnonSessionUpsertOptions): Promise<string> {
    const existing = this.anonSessions.find(
      (a) => a.orgId === opts.orgId && a.tokenHash === opts.tokenHash,
    );
    if (existing) return existing.id;
    const id =
      '00000000-0000-4000-8000-' + (this.anonSessions.length + 1).toString(16).padStart(12, '0');
    this.anonSessions.push({ id, orgId: opts.orgId, tokenHash: opts.tokenHash });
    return id;
  }

  async getAttorneyFacets(): Promise<AttorneyFacets> {
    const states = new Set<string>();
    const practiceAreas = new Set<string>();
    for (const a of this.attorneys) {
      if (a.locationState) states.add(a.locationState);
      for (const p of a.practiceAreas) practiceAreas.add(p);
    }
    return {
      states: [...states].sort(),
      practiceAreas: [...practiceAreas].sort(),
    };
  }

  async listSessionsForAdmin(
    opts: AdminSessionListOptions,
  ): Promise<AdminSessionListResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 25;

    const all = [...this.sessions.values()].filter((s) => {
      if (opts.status && s.status !== opts.status) return false;
      if (!opts.includeTest && s.isTest) return false;
      return true;
    });

    const summaries: AdminSessionSummary[] = all.map((s) => ({
      sessionId: s.sessionId,
      status: s.status,
      readingLevel: s.readingLevel,
      classificationTitle: s.classification?.title ?? null,
      messageCount: s.conversationHistory.length,
      extractedFieldCount: Object.keys(s.extractedFields).length,
      // Synthetic timestamps for in-memory — tests that care set them directly.
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      isTest: s.isTest,
    }));

    const start = (page - 1) * pageSize;
    return {
      sessions: summaries.slice(start, start + pageSize),
      totalCount: summaries.length,
      page,
      pageSize,
    };
  }

  // ─── Admin: attorneys ───────────────────────────────────────────────────────

  async listAttorneysForAdmin(
    opts: AdminAttorneyListOptions,
  ): Promise<AdminAttorneyListResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 50;

    const term = opts.search?.trim().toLowerCase();
    const all = this.adminAttorneys.filter((a) => {
      if (opts.status && a.status !== opts.status) return false;
      if (term) {
        const hay = `${a.name} ${a.firmName ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    const sorted = [...all].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );

    const start = (page - 1) * pageSize;
    return {
      attorneys: sorted.slice(start, start + pageSize),
      totalCount: all.length,
      page,
      pageSize,
    };
  }

  async getAttorneyById(id: string): Promise<AttorneyAdminRow | null> {
    return this.adminAttorneys.find((a) => a.id === id) ?? null;
  }

  async createAttorney(input: CreateAttorneyInput): Promise<AttorneyAdminRow> {
    const now = new Date().toISOString();
    const id =
      '10000000-0000-4000-8000-' + (this.adminAttorneys.length + 1).toString(16).padStart(12, '0');
    const row: AttorneyAdminRow = {
      id,
      name: input.name,
      firmName: input.firmName ?? null,
      locationCity: input.locationCity ?? null,
      locationState: input.locationState ?? null,
      practiceAreas: input.practiceAreas,
      email: input.email ?? null,
      phone: input.phone ?? null,
      websiteUrl: input.websiteUrl ?? null,
      bio: input.bio ?? null,
      photoUrl: input.photoUrl ?? null,
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.adminAttorneys.push(row);
    // If approved, also expose via searchAttorneys.
    if (row.status === 'approved') {
      this.attorneys.push(toPublicAttorney(row));
    }
    return row;
  }

  async updateAttorney(
    id: string,
    input: UpdateAttorneyInput,
  ): Promise<AttorneyAdminRow | null> {
    const idx = this.adminAttorneys.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const prev = this.adminAttorneys[idx];
    const next: AttorneyAdminRow = {
      ...prev,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.firmName !== undefined ? { firmName: input.firmName } : {}),
      ...(input.locationCity !== undefined ? { locationCity: input.locationCity } : {}),
      ...(input.locationState !== undefined ? { locationState: input.locationState } : {}),
      ...(input.practiceAreas !== undefined ? { practiceAreas: input.practiceAreas } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.websiteUrl !== undefined ? { websiteUrl: input.websiteUrl } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.adminAttorneys[idx] = next;

    // Keep the public mirror in sync.
    const publicIdx = this.attorneys.findIndex((a) => a.id === id);
    if (next.status === 'approved') {
      if (publicIdx === -1) this.attorneys.push(toPublicAttorney(next));
      else this.attorneys[publicIdx] = toPublicAttorney(next);
    } else if (publicIdx !== -1) {
      this.attorneys.splice(publicIdx, 1);
    }

    return next;
  }

  // ─── Admin: system settings ─────────────────────────────────────────────────

  async getSystemSetting<T = unknown>(key: string): Promise<T | null> {
    return (this.systemSettings.get(key) as T) ?? null;
  }

  async setSystemSetting<T = unknown>(
    key: string,
    value: T,
    _updatedBy?: string | null,
  ): Promise<void> {
    this.systemSettings.set(key, value);
  }

  async getAdminAnalytics(
    opts: AdminAnalyticsOptions = {},
  ): Promise<AdminAnalyticsResult> {
    const days = Math.max(1, Math.min(opts.days ?? 14, 90));
    const includeTest = opts.includeTest ?? false;

    const relevant = [...this.sessions.values()].filter(
      (s) => includeTest || !s.isTest,
    );

    // 1. Session volume — in-memory sessions don't carry a stable createdAt
    // (synthetic timestamps in listSessionsForAdmin), so fall back to a
    // zero-filled series for the last N days. Tests that care about the
    // shape will still see a correctly-sized array.
    const sessionVolume: Array<{ date: string; count: number }> = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      sessionVolume.push({ date: iso, count: 0 });
    }
    // Everything's lumped onto "today" since we don't track per-session dates.
    if (relevant.length > 0 && sessionVolume.length > 0) {
      sessionVolume[sessionVolume.length - 1].count = relevant.length;
    }

    // 2. Status counts.
    const statusCounts = { active: 0, completed: 0, abandoned: 0, total: relevant.length };
    for (const s of relevant) {
      if (s.status === 'active') statusCounts.active++;
      else if (s.status === 'completed') statusCounts.completed++;
      else if (s.status === 'abandoned') statusCounts.abandoned++;
    }

    const finished = statusCounts.completed + statusCounts.abandoned;
    const completionRate = finished === 0 ? null : statusCounts.completed / finished;

    // 3. Reading-level distribution.
    const readingLevelDistribution = { simple: 0, standard: 0, professional: 0 };
    for (const s of relevant) {
      readingLevelDistribution[s.readingLevel]++;
    }

    // 4. Classification breakdown.
    const classMap = new Map<string, number>();
    for (const s of relevant) {
      const title = s.classification?.title ?? 'Unclassified';
      classMap.set(title, (classMap.get(title) ?? 0) + 1);
    }
    const classificationBreakdown = [...classMap.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Tool-use frequency.
    const toolMap = new Map<string, number>();
    for (const s of relevant) {
      for (const msg of s.conversationHistory) {
        for (const tc of msg.tool_calls ?? []) {
          toolMap.set(tc.name, (toolMap.get(tc.name) ?? 0) + 1);
        }
      }
    }
    const toolUseFrequency = [...toolMap.entries()]
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count);

    return {
      sessionVolume,
      statusCounts,
      completionRate,
      readingLevelDistribution,
      classificationBreakdown,
      toolUseFrequency,
    };
  }

  // ─── Admin: quality checks ──────────────────────────────────────────────────

  async writeSessionQualityCheck(opts: SessionQualityCheckWrite): Promise<void> {
    // Upsert by sessionId.
    this.qualityChecks.set(opts.sessionId, {
      id:
        '20000000-0000-4000-8000-' +
        (this.qualityChecks.size + 1).toString(16).padStart(12, '0'),
      sessionId: opts.sessionId,
      passed: opts.passed,
      failures: opts.failures,
      warnings: opts.warnings,
      checkedAt: new Date().toISOString(),
    });
  }

  async readSessionQualityCheck(
    sessionId: string,
  ): Promise<SessionQualityCheckRow | null> {
    return this.qualityChecks.get(sessionId) ?? null;
  }

  async findActiveSessionForAnon(
    anonSessionId: string,
  ): Promise<AdaSessionState | null> {
    // In-memory has no timestamps on the session state itself, so we
    // just return the first active one found. Tests that care about
    // ordering can seed deterministically.
    for (const s of this.sessions.values()) {
      if (s.anonSessionId === anonSessionId && s.status === 'active') {
        return structuredClone(s);
      }
    }
    return null;
  }

  async findAnonSessionByHash(tokenHash: string): Promise<string | null> {
    const hit = this.anonSessions.find((a) => a.tokenHash === tokenHash);
    return hit?.id ?? null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPublicAttorney(a: AttorneyAdminRow): AttorneyRow {
  return {
    id: a.id,
    name: a.name,
    firmName: a.firmName,
    locationCity: a.locationCity,
    locationState: a.locationState,
    practiceAreas: a.practiceAreas,
    email: a.email,
    phone: a.phone,
    websiteUrl: a.websiteUrl,
  };
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
