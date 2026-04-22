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
  AdminFirmListOptions,
  AdminFirmListResult,
  AdminListingListOptions,
  AdminListingListResult,
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
  EmbeddingClient,
  KnowledgeChunkHit,
  KnowledgeSearchOptions,
  OrganizationRow,
  PhotoAnalysisClient,
  PhotoAnalysisRequest,
  PhotoAnalysisResult,
  RandomClient,
  SessionQualityCheckRow,
  SessionQualityCheckWrite,
  SessionReadOptions,
  SessionWriteOptions,
  SessionPackageRow,
  UpdateAttorneyInput,
  WriteSessionPackageOptions,
  LawFirmRow,
  ListingRow,
  ListingConfigRow,
  SubscriptionRow,
  ListActiveListingsOptions,
  ActiveListingRow,
  RoutingRuleRow,
  RoutingRuleWithTarget,
  StripeWebhookEventRow,
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

  /**
   * Test-controllable knowledge base. Seed via `this.knowledgeChunks`
   * and the search returns matches by citation-contains only (no vector
   * math; no embedding needed). Good enough for unit tests that want to
   * assert "Ada cites §36.302 when KB hit is present."
   */
  public readonly knowledgeChunks: KnowledgeChunkHit[] = [];

  async searchKnowledgeBase(
    opts: KnowledgeSearchOptions,
  ): Promise<KnowledgeChunkHit[]> {
    const k = Math.min(Math.max(opts.k ?? 5, 1), 10);
    const query = opts.query.trim().toLowerCase();
    if (!query || this.knowledgeChunks.length === 0) return [];

    // Simple test-friendly match: chunk wins if the query mentions one
    // of its standardRefs OR any word from its title. Topic filter
    // applied if present.
    const citeRe = /(?:§|section\s+)?(\d{2,3}\.\d{1,4}(?:\([a-z0-9]+\))*)/gi;
    const citationsInQuery = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = citeRe.exec(query)) !== null) {
      citationsInQuery.add(m[1]);
    }

    const hits: KnowledgeChunkHit[] = [];
    for (const c of this.knowledgeChunks) {
      if (opts.topic && c.topic !== opts.topic) continue;
      const citeMatch = c.standardRefs.some((r) => citationsInQuery.has(r));
      const titleMatch = c.title.toLowerCase().split(/\W+/).some(
        (w) => w.length > 3 && query.includes(w),
      );
      if (citeMatch || titleMatch) {
        hits.push({ ...c, matchType: citeMatch ? 'citation' : 'vector' });
      }
      if (hits.length >= k) break;
    }
    return hits;
  }

  // ─── session_packages ────────────────────────────────────────────────────

  public readonly sessionPackages: SessionPackageRow[] = [];

  async writeSessionPackage(opts: WriteSessionPackageOptions): Promise<void> {
    // Slugs are unique; if the caller tries to reuse one, replace the row
    // in-memory rather than throwing (Postgres will throw on UNIQUE
    // violation, which callers should handle — but in tests we're usually
    // writing once per slug anyway).
    const idx = this.sessionPackages.findIndex((p) => p.slug === opts.slug);
    const row: SessionPackageRow = {
      slug: opts.slug,
      sessionId: opts.sessionId,
      payload: opts.payload,
      classificationTitle: opts.classificationTitle,
      generatedAt: opts.generatedAt,
      expiresAt: opts.expiresAt,
    };
    if (idx >= 0) {
      this.sessionPackages[idx] = row;
    } else {
      this.sessionPackages.push(row);
    }
  }

  async readSessionPackageBySlug(slug: string): Promise<SessionPackageRow | null> {
    const row = this.sessionPackages.find((p) => p.slug === slug);
    if (!row) return null;
    // Expired rows return null.
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return row;
  }

  async readLatestSessionPackageForSession(
    sessionId: string,
  ): Promise<SessionPackageRow | null> {
    const matches = this.sessionPackages.filter((p) => p.sessionId === sessionId);
    if (matches.length === 0) return null;
    // Sort by generatedAt descending; return the newest.
    matches.sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
    return matches[0]!;
  }

  // ─── Ch1 (Step 19) ───────────────────────────────────────────────────────

  public readonly lawFirms: LawFirmRow[] = [];
  public readonly listings: ListingRow[] = [];
  public readonly listingConfigs: ListingConfigRow[] = [];
  public readonly subscriptionRows: SubscriptionRow[] = [];

  async writeLawFirm(row: LawFirmRow): Promise<void> {
    const idx = this.lawFirms.findIndex((f) => f.id === row.id);
    if (idx >= 0) this.lawFirms[idx] = { ...row };
    else this.lawFirms.push({ ...row });
  }

  async readLawFirmById(id: string): Promise<LawFirmRow | null> {
    return this.lawFirms.find((f) => f.id === id) ?? null;
  }

  async listFirmsForAdmin(
    opts: AdminFirmListOptions,
  ): Promise<AdminFirmListResult> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));
    const searchLower = opts.search?.trim().toLowerCase();

    let rows = this.lawFirms.filter((f) => f.orgId === opts.orgId);
    if (opts.status !== undefined) {
      rows = rows.filter((f) => f.status === opts.status);
    }
    if (opts.isPilot !== undefined) {
      rows = rows.filter((f) => f.isPilot === opts.isPilot);
    }
    if (searchLower) {
      rows = rows.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          (f.primaryContact?.toLowerCase().includes(searchLower) ?? false),
      );
    }
    // Deterministic order: newest first when createdAt present,
    // otherwise name ASC. In-memory rows may not have timestamps.
    rows.sort((a, b) => {
      const aAt = a.createdAt ?? '';
      const bAt = b.createdAt ?? '';
      if (aAt && bAt) return bAt.localeCompare(aAt);
      return a.name.localeCompare(b.name);
    });

    const totalCount = rows.length;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize).map((f) => ({ ...f }));
    return { firms: paged, totalCount, page, pageSize };
  }

  async writeListing(row: ListingRow): Promise<void> {
    const idx = this.listings.findIndex((l) => l.id === row.id);
    if (idx >= 0) this.listings[idx] = { ...row };
    else this.listings.push({ ...row });
  }

  async readListingBySlug(slug: string): Promise<ListingRow | null> {
    return this.listings.find((l) => l.slug === slug) ?? null;
  }

  async listListingsForFirm(lawFirmId: string): Promise<ListingRow[]> {
    return this.listings
      .filter((l) => l.lawFirmId === lawFirmId)
      .map((l) => ({ ...l }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async listListingsForAdmin(
    opts: AdminListingListOptions,
  ): Promise<AdminListingListResult> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));
    const searchLower = opts.search?.trim().toLowerCase();

    // Build firm-id → orgId map once so we can filter by org.
    const firmOrgs = new Map<string, string>();
    for (const f of this.lawFirms) firmOrgs.set(f.id, f.orgId);

    let rows = this.listings.filter((l) => firmOrgs.get(l.lawFirmId) === opts.orgId);
    if (opts.lawFirmId) {
      rows = rows.filter((l) => l.lawFirmId === opts.lawFirmId);
    }
    if (opts.status) {
      rows = rows.filter((l) => l.status === opts.status);
    }
    if (opts.category) {
      rows = rows.filter((l) => l.category === opts.category);
    }
    if (searchLower) {
      rows = rows.filter(
        (l) =>
          l.title.toLowerCase().includes(searchLower) ||
          l.slug.toLowerCase().includes(searchLower),
      );
    }
    rows.sort((a, b) => a.title.localeCompare(b.title));

    const totalCount = rows.length;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize).map((l) => ({ ...l }));
    return { listings: paged, totalCount, page, pageSize };
  }

  async readListingById(id: string): Promise<ListingRow | null> {
    return this.listings.find((l) => l.id === id) ?? null;
  }

  async writeListingConfig(row: ListingConfigRow): Promise<void> {
    const idx = this.listingConfigs.findIndex((c) => c.id === row.id);
    if (idx >= 0) this.listingConfigs[idx] = { ...row };
    else this.listingConfigs.push({ ...row });
  }

  async readListingConfigForListing(
    listingId: string,
  ): Promise<ListingConfigRow | null> {
    return this.listingConfigs.find((c) => c.listingId === listingId) ?? null;
  }

  async writeSubscription(row: SubscriptionRow): Promise<void> {
    const idx = this.subscriptionRows.findIndex((s) => s.id === row.id);
    if (idx >= 0) this.subscriptionRows[idx] = { ...row };
    else this.subscriptionRows.push({ ...row });
  }

  async readSubscriptionById(id: string): Promise<SubscriptionRow | null> {
    return this.subscriptionRows.find((s) => s.id === id) ?? null;
  }

  async readSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionRow | null> {
    return (
      this.subscriptionRows.find(
        (s) => s.stripeSubscriptionId === stripeSubscriptionId,
      ) ?? null
    );
  }

  async listSubscriptionsForFirm(
    lawFirmId: string,
  ): Promise<SubscriptionRow[]> {
    return this.subscriptionRows
      .filter((s) => s.lawFirmId === lawFirmId)
      .map((s) => ({ ...s }))
      .sort((a, b) => {
        const aAt = a.createdAt ?? '';
        const bAt = b.createdAt ?? '';
        return bAt.localeCompare(aAt);
      });
  }

  // ─── stripe_webhook_events (Step 23) ─────────────────────────────────────

  public readonly webhookEvents = new Map<
    string,
    {
      row: StripeWebhookEventRow;
      processedAt: string | null;
      error: string | null;
    }
  >();

  async recordWebhookEvent(
    row: StripeWebhookEventRow,
  ): Promise<{ inserted: boolean }> {
    if (this.webhookEvents.has(row.stripeEventId)) {
      return { inserted: false };
    }
    this.webhookEvents.set(row.stripeEventId, {
      row: { ...row },
      processedAt: null,
      error: null,
    });
    return { inserted: true };
  }

  async markWebhookEventProcessed(
    stripeEventId: string,
    error: string | null,
  ): Promise<void> {
    const existing = this.webhookEvents.get(stripeEventId);
    if (!existing) return;
    existing.processedAt = new Date().toISOString();
    existing.error = error;
  }

  async listActiveListings(
    opts: ListActiveListingsOptions = {},
  ): Promise<ActiveListingRow[]> {
    // Mirrors the v_active_listings view definition. Keep this in sync
    // with migration 0005 (pilot mode).
    //
    // A listing surfaces as active if:
    //   (a) firm.isPilot=true (no subscription needed), OR
    //   (b) firm has an active/trialing subscription not past period_end
    // Firms in pilot mode emit ONE row per listing (subscriptionId=null,
    // subscriptionTier='pilot'). Paid firms emit one row per active sub.
    const now = Date.now();
    const result: ActiveListingRow[] = [];
    for (const listing of this.listings) {
      if (listing.status !== 'published') continue;
      if (opts.category && listing.category !== opts.category) continue;
      if (opts.lawFirmId && listing.lawFirmId !== opts.lawFirmId) continue;

      const firm = this.lawFirms.find((f) => f.id === listing.lawFirmId);
      if (!firm || firm.status !== 'active') continue;

      if (firm.isPilot) {
        // Pilot firms: one row per listing, no subscription
        result.push({
          listingId: listing.id,
          slug: listing.slug,
          title: listing.title,
          category: listing.category,
          tier: listing.tier,
          shortDescription: listing.shortDescription,
          fullDescription: listing.fullDescription,
          eligibilitySummary: listing.eligibilitySummary,
          lawFirmId: firm.id,
          lawFirmName: firm.name,
          subscriptionId: null,
          subscriptionTier: 'pilot',
          currentPeriodEnd: null,
          isPilot: true,
        });
        continue;
      }

      // Non-pilot firms: match any active/trialing subscription not
      // past period_end. Zero matches means the listing isn't live.
      const activeSubs = this.subscriptionRows.filter((s) => {
        if (s.listingId !== listing.id) return false;
        if (s.status !== 'active' && s.status !== 'trialing') return false;
        if (s.currentPeriodEnd && new Date(s.currentPeriodEnd).getTime() <= now) {
          return false;
        }
        return true;
      });

      for (const sub of activeSubs) {
        result.push({
          listingId: listing.id,
          slug: listing.slug,
          title: listing.title,
          category: listing.category,
          tier: listing.tier,
          shortDescription: listing.shortDescription,
          fullDescription: listing.fullDescription,
          eligibilitySummary: listing.eligibilitySummary,
          lawFirmId: firm.id,
          lawFirmName: firm.name,
          subscriptionId: sub.id,
          subscriptionTier: sub.tier,
          currentPeriodEnd: sub.currentPeriodEnd,
          isPilot: false,
        });
      }
    }
    return result;
  }

  // ─── routing_rules (Step 22) ─────────────────────────────────────────────

  public readonly routingRules: RoutingRuleRow[] = [];

  async writeRoutingRule(row: RoutingRuleRow): Promise<void> {
    const idx = this.routingRules.findIndex((r) => r.id === row.id);
    if (idx >= 0) this.routingRules[idx] = { ...row };
    else this.routingRules.push({ ...row });
  }

  async listActiveRoutingRules(): Promise<RoutingRuleWithTarget[]> {
    // Join each active rule with its target org. In-memory we scan the
    // organizations array (which the in-memory client builds up via
    // other seed calls).
    const joined: RoutingRuleWithTarget[] = [];
    for (const rule of this.routingRules) {
      if (!rule.active) continue;
      const org = this.orgs.find((o) => o.id === rule.targetOrgId);
      if (!org) continue; // dangling rule; skip
      joined.push({
        ruleId: rule.id,
        targetOrgId: rule.targetOrgId,
        targetOrgCode: org.orgCode,
        targetOrgDisplayName: org.displayName,
        complaintTypes: rule.complaintTypes,
        jurisdictions: rule.jurisdictions,
        priority: rule.priority,
      });
    }
    // Stable order: priority ASC, then ruleId lexical.
    joined.sort(
      (a, b) => a.priority - b.priority || a.ruleId.localeCompare(b.ruleId),
    );
    return joined;
  }
}

/**
 * Test-controllable embedding client. By default returns a deterministic
 * 1536-dim vector derived from a hash of the input text, so tests can
 * assert stability without calling a real API. The engine tolerates
 * embedQuery throwing, so tests that want to simulate outage can set
 * `shouldFail = true`.
 */
export class InMemoryEmbeddingClient implements EmbeddingClient {
  public shouldFail = false;
  public readonly embedCalls: string[] = [];

  async embedQuery(text: string): Promise<number[]> {
    this.embedCalls.push(text);
    if (this.shouldFail) throw new Error('embedding client simulated failure');
    // Fixed-size deterministic vector. Not a real embedding, but stable
    // per-input, non-zero, and the correct dimension.
    const seed = cheapHash(text);
    const vec = new Array(1536);
    for (let i = 0; i < 1536; i++) {
      vec[i] = Math.sin(seed + i) * 0.1;
    }
    return vec;
  }
}

function cheapHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
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
  embeddings: InMemoryEmbeddingClient;
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
    embeddings: new InMemoryEmbeddingClient(),
  };
}
