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

import { applyCaseTransition, caseTransitionSummary } from '../cases/caseStateMachine.js';
import type { CaseStatus, CaseTransition, CaseLane } from '../cases/caseStateMachine.js';
import { computePipelineStats } from '../cases/pipelineStats.js';
import type { PipelineStats } from '../cases/pipelineStats.js';

const PIPELINE_EVENT_TYPES: ReadonlySet<string> = new Set(['ROUTED', 'ACCEPT', 'BEGIN_WORK', 'RESOLVE']);
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
  AdminSubscriptionListOptions,
  AdminSubscriptionListResult,
  AdminIntakeListOptions,
  AdminIntakeListResult,
  AdminIntakeListRow,
  AdminIntakeReadOptions,
  AdminIntakeReadResult,
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
  CreateLitigationInput,
  LitigationAdminRow,
  LitigationRow,
  LitigationStatus,
  LitigationDetailRow,
  RelatedLitigationCase,
  ListActiveLitigationOptions,
  ReadActiveLitigationBySlugOptions,
  ListLitigationForAdminOptions,
  ListLitigationForAdminResult,
  UpdateLitigationInput,
  AuditLogEntry,
  HardDeleteActor,
  PortalQueueOptions,
  PortalQueueResult,
  PortalCaseListRow,
  PortalCaseListResult,
  AdminCaseRow,
  TaskRow,
  FirmTaskRow,
  PortalCaseDetailFull,
  PortalQueueRow,
  PortalCaseDetail,
  PortalCaseQqAnswer,
  LitigationFirmAssignment,
  PortalAttorneyResolution,
  CreateCaseOptions,
  CreateCaseResult,
  RecordConsentResult,
  CaseRow,
  PhotoReviewListOptions,
  PhotoReviewListResult,
  PhotoReviewDetail,
  UpsertPhotoReviewInput,
  PhotoReviewEvalRow,
  SavePhotoAnalysisInput,
  UpdatePhotoAnalysisReadingLevelsInput,
} from './types.js';
import type { ExtractedFields, Message, PhotoAnalysisOutput } from '../../types/db.js';

/** Read an extracted-field value as a string|null (portal projection). */
function portalFieldStr(fields: ExtractedFields, key: string): string | null {
  const v = fields[key]?.value;
  return v == null ? null : typeof v === 'string' ? v : String(v);
}

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
  public readonly adminLitigation: LitigationAdminRow[] = [];
  public readonly orgs: OrganizationRow[] = [];
  public readonly systemSettings = new Map<string, unknown>();
  public readonly qualityChecks = new Map<string, SessionQualityCheckRow>();
  /**
   * In-memory audit log buffer. Real Neon client writes to the
   * audit_log table; this exposes the same data shape to tests so they
   * can assert on audit behavior without standing up a database.
   * Exposed via the optional `__testAuditLog` getter on DbClient.
   */
  public readonly auditLog: AuditLogEntry[] = [];
  get __testAuditLog(): ReadonlyArray<AuditLogEntry> {
    return this.auditLog;
  }
  public readonly anonSessions: Array<{
    id: string;
    orgId: string;
    tokenHash: string;
  }> = [];

  // ─── Attorney portal (migration 0019) ──────────────────────────────────────
  public readonly litigationFirmAssignments: LitigationFirmAssignment[] = [];
  public readonly firmSessionHandled: Array<{
    sessionId: string;
    lawFirmId: string;
    handledByUserId: string | null;
    handledAt: string;
  }> = [];

  // ─── Cases foundation (migration 0023) + routing (Phase 1a) ─────────────────
  public readonly cases: CaseRow[] = [];
  /** Phase 2a: fields the lean CaseRow drops but the portal queue needs. */
  private readonly caseExtras = new Map<
    string,
    {
      classificationTitle: string | null;
      jurisdictionState: string | null;
      routedAt: string | null;
      firstContactDue: string | null;
      solDate: string | null;
    }
  >();
  public readonly caseActivity: Array<{
    caseId: string;
    actorType: string;
    eventType: string;
    summary: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }> = [];
  private caseSeq = 0;
  /**
   * Test-only clerk-user → attorney pairing. The real Neon client resolves
   * clerk_user_id → users → attorneys; in-memory has no users table, so
   * tests/fixtures pair explicitly via linkClerkUser(). Mirrors how the AI
   * client exposes test-only enqueue helpers.
   */
  public readonly clerkUserLinks = new Map<string, string>();

  /** Test-only: pair a Clerk user id to an attorney id (for resolveAttorneyByClerkUserId). */
  linkClerkUser(clerkUserId: string, attorneyId: string): void {
    this.clerkUserLinks.set(clerkUserId, attorneyId);
  }

  async readSession({ sessionId }: SessionReadOptions): Promise<AdaSessionState | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async writeSession({ state }: SessionWriteOptions): Promise<void> {
    // Deep clone so later mutations by the caller don't silently change stored state.
    this.sessions.set(state.sessionId, structuredClone(state));
  }

  async searchAttorneys(opts: AttorneySearchOptions): Promise<AttorneyRow[]> {
    const results = this.attorneys.filter((a) => {
      if (opts.state) {
        const matchesPrimary = a.locationState === opts.state;
        const matchesAdditional = (a.additionalStates ?? []).includes(opts.state);
        if (!matchesPrimary && !matchesAdditional) return false;
      }
      if (opts.city && a.locationCity !== opts.city) return false;
      if (opts.practiceAreas && opts.practiceAreas.length > 0) {
        if (!opts.practiceAreas.some((p) => a.practiceAreas.includes(p))) return false;
      }
      if (opts.specialtyTags && opts.specialtyTags.length > 0) {
        const tags = a.specialtyTags ?? [];
        if (!opts.specialtyTags.some((t) => tags.includes(t))) return false;
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

  async savePhotoAnalysis(_input: SavePhotoAnalysisInput): Promise<string> {
    // Not modeled in-memory; photo persistence is exercised against Neon.
    return `mem-analysis-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }

  async savePhotoTesterComment(_sessionId: string, _comment: string): Promise<boolean> {
    return false;
  }

  async listPhotoAnalysesForReview(
    opts: PhotoReviewListOptions,
  ): Promise<PhotoReviewListResult> {
    // Not modeled in-memory; photo review is exercised against Neon only.
    return {
      items: [],
      totalCount: 0,
      page: opts.page && opts.page > 0 ? opts.page : 1,
      pageSize: opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 25,
    };
  }

  async getPhotoAnalysisForReview(
    _photoAnalysisId: string,
  ): Promise<PhotoReviewDetail | null> {
    return null;
  }

  async updatePhotoAnalysisReadingLevels(
    _input: UpdatePhotoAnalysisReadingLevelsInput,
  ): Promise<void> {
    // Not modeled in-memory; photo persistence is exercised against Neon.
  }

  async deletePhotoAnalysis(_photoAnalysisId: string): Promise<boolean> {
    // Not modeled in-memory; photo persistence is exercised against Neon.
    return false;
  }

  async upsertPhotoReview(_input: UpsertPhotoReviewInput): Promise<void> {
    // no-op in memory
  }

  async getPhotoReviewEvalSummary(): Promise<PhotoReviewEvalRow[]> {
    return [];
  }

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
    // Stash orgId so hardDeleteAttorney can attribute the audit row.
    // AttorneyAdminRow's public type doesn't expose orgId today, but
    // the in-memory store carries it as a non-enumerated field for
    // server-side ops. We cast through `unknown` to put it on the row
    // without leaking it into AttorneyAdminRow.
    const row: AttorneyAdminRow & { orgId?: string } = {
      id,
      name: input.name,
      firmName: input.firmName ?? null,
      locationCity: input.locationCity ?? null,
      locationState: input.locationState ?? null,
      practiceAreas: input.practiceAreas,
      additionalStates: input.additionalStates ?? [],
      specialtyTags: input.specialtyTags ?? [],
      email: input.email ?? null,
      phone: input.phone ?? null,
      websiteUrl: input.websiteUrl ?? null,
      bio: input.bio ?? null,
      photoUrl: input.photoUrl ?? null,
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
      orgId: input.orgId,
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
      ...(input.additionalStates !== undefined ? { additionalStates: input.additionalStates } : {}),
      ...(input.specialtyTags !== undefined ? { specialtyTags: input.specialtyTags } : {}),
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

  async hardDeleteAttorney(
    id: string,
    actor: HardDeleteActor,
  ): Promise<boolean> {
    // Status gate. Two-stage attorney removal: must already be
    // archived. See /plan ADALL Admin Archive→Delete.
    const idx = this.adminAttorneys.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const row = this.adminAttorneys[idx];
    if (row.status !== 'archived') return false;

    // Audit row captures the full before-state so a deleted attorney
    // is still reconstructible from the log if we ever need it.
    const orgId = (row as AttorneyAdminRow & { orgId?: string }).orgId ?? null;
    this.auditLog.push({
      orgId,
      actorType: 'staff',
      actorId: actor.actorUserId,
      action: 'attorney.hard_delete',
      resourceType: 'attorney',
      resourceId: id,
      metadata: {
        actor_email: actor.actorEmail,
        before: serializeAttorneyForAudit(row, orgId),
      },
      createdAt: new Date().toISOString(),
    });

    // Remove from admin list.
    this.adminAttorneys.splice(idx, 1);
    // Remove from the public mirror if present (shouldn't be, since
    // status was archived, but defensive).
    const publicIdx = this.attorneys.findIndex((a) => a.id === id);
    if (publicIdx !== -1) this.attorneys.splice(publicIdx, 1);

    // Mimic the ON DELETE SET NULL behavior of
    // litigation_listings.lead_attorney_id at the schema level. This
    // is a real cascade in Neon; we replicate it here so the
    // in-memory client doesn't leave stale FK references.
    for (const lit of this.adminLitigation) {
      if (lit.leadAttorneyId === id) lit.leadAttorneyId = null;
    }

    return true;
  }

  // ─── Admin: litigation (class + mass actions) ───────────────────────────────

  async listLitigationForAdmin(
    opts: ListLitigationForAdminOptions,
  ): Promise<ListLitigationForAdminResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 50;

    let filtered = this.adminLitigation.slice();
    if (opts.kind) filtered = filtered.filter((l) => l.kind === opts.kind);
    if (opts.status) filtered = filtered.filter((l) => l.status === opts.status);
    if (opts.leadAttorneyId)
      filtered = filtered.filter((l) => l.leadAttorneyId === opts.leadAttorneyId);
    if (opts.search && opts.search.trim()) {
      const term = opts.search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.caseName.toLowerCase().includes(term) ||
          (l.docketNumber ?? '').toLowerCase().includes(term),
      );
    }

    const sorted = filtered.sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    const start = (page - 1) * pageSize;
    return {
      litigation: sorted.slice(start, start + pageSize),
      totalCount: filtered.length,
      page,
      pageSize,
    };
  }

  async getLitigationById(id: string): Promise<LitigationAdminRow | null> {
    return this.adminLitigation.find((l) => l.id === id) ?? null;
  }

  async createLitigation(input: CreateLitigationInput): Promise<LitigationAdminRow> {
    const now = new Date().toISOString();
    const id =
      '20000000-0000-4000-8000-' +
      (this.adminLitigation.length + 1).toString(16).padStart(12, '0');
    const row: LitigationAdminRow = {
      id,
      kind: input.kind,
      caseName: input.caseName,
      slug: input.slug,
      legalTheory: input.legalTheory ?? null,
      shortDescription: input.shortDescription ?? null,
      shortDescriptionSimple: input.shortDescriptionSimple ?? null,
      shortDescriptionProfessional: input.shortDescriptionProfessional ?? null,
      fullDescription: input.fullDescription ?? null,
      fullDescriptionSimple: input.fullDescriptionSimple ?? null,
      fullDescriptionProfessional: input.fullDescriptionProfessional ?? null,
      eligibility: input.eligibility ?? null,
      eligibilitySimple: input.eligibilitySimple ?? null,
      eligibilityProfessional: input.eligibilityProfessional ?? null,
      documentationRequiredSimple: input.documentationRequiredSimple ?? null,
      documentationRequiredProfessional: input.documentationRequiredProfessional ?? null,
      noDocumentationPathSimple: input.noDocumentationPathSimple ?? null,
      noDocumentationPathProfessional: input.noDocumentationPathProfessional ?? null,
      evidenceGuidanceSimple: input.evidenceGuidanceSimple ?? null,
      evidenceGuidanceProfessional: input.evidenceGuidanceProfessional ?? null,
      whatThisIsNotSimple: input.whatThisIsNotSimple ?? null,
      whatThisIsNotProfessional: input.whatThisIsNotProfessional ?? null,
      defendants: input.defendants ?? [],
      court: input.court ?? null,
      docketNumber: input.docketNumber ?? null,
      affectedStates: input.affectedStates ?? [],
      filingDate: input.filingDate ?? null,
      keyDates: input.keyDates ?? {},
      relatedListingIds: input.relatedListingIds ?? [],
      adaQualifyingQuestions: input.adaQualifyingQuestions ?? {},
      leadAttorneyId: input.leadAttorneyId ?? null,
      leadFirmId: input.leadFirmId ?? null,
      status: input.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
    };
    this.adminLitigation.push(row);
    return row;
  }

  async updateLitigation(
    id: string,
    input: UpdateLitigationInput,
  ): Promise<LitigationAdminRow | null> {
    const idx = this.adminLitigation.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    const prev = this.adminLitigation[idx];
    const next: LitigationAdminRow = {
      ...prev,
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.caseName !== undefined ? { caseName: input.caseName } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.legalTheory !== undefined ? { legalTheory: input.legalTheory } : {}),
      ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
      ...(input.shortDescriptionSimple !== undefined
        ? { shortDescriptionSimple: input.shortDescriptionSimple }
        : {}),
      ...(input.shortDescriptionProfessional !== undefined
        ? { shortDescriptionProfessional: input.shortDescriptionProfessional }
        : {}),
      ...(input.fullDescription !== undefined ? { fullDescription: input.fullDescription } : {}),
      ...(input.fullDescriptionSimple !== undefined
        ? { fullDescriptionSimple: input.fullDescriptionSimple }
        : {}),
      ...(input.fullDescriptionProfessional !== undefined
        ? { fullDescriptionProfessional: input.fullDescriptionProfessional }
        : {}),
      ...(input.eligibility !== undefined ? { eligibility: input.eligibility } : {}),
      ...(input.eligibilitySimple !== undefined
        ? { eligibilitySimple: input.eligibilitySimple }
        : {}),
      ...(input.eligibilityProfessional !== undefined
        ? { eligibilityProfessional: input.eligibilityProfessional }
        : {}),
      ...(input.documentationRequiredSimple !== undefined
        ? { documentationRequiredSimple: input.documentationRequiredSimple }
        : {}),
      ...(input.documentationRequiredProfessional !== undefined
        ? { documentationRequiredProfessional: input.documentationRequiredProfessional }
        : {}),
      ...(input.noDocumentationPathSimple !== undefined
        ? { noDocumentationPathSimple: input.noDocumentationPathSimple }
        : {}),
      ...(input.noDocumentationPathProfessional !== undefined
        ? { noDocumentationPathProfessional: input.noDocumentationPathProfessional }
        : {}),
      ...(input.evidenceGuidanceSimple !== undefined
        ? { evidenceGuidanceSimple: input.evidenceGuidanceSimple }
        : {}),
      ...(input.evidenceGuidanceProfessional !== undefined
        ? { evidenceGuidanceProfessional: input.evidenceGuidanceProfessional }
        : {}),
      ...(input.whatThisIsNotSimple !== undefined
        ? { whatThisIsNotSimple: input.whatThisIsNotSimple }
        : {}),
      ...(input.whatThisIsNotProfessional !== undefined
        ? { whatThisIsNotProfessional: input.whatThisIsNotProfessional }
        : {}),
      ...(input.defendants !== undefined ? { defendants: input.defendants } : {}),
      ...(input.court !== undefined ? { court: input.court } : {}),
      ...(input.docketNumber !== undefined ? { docketNumber: input.docketNumber } : {}),
      ...(input.affectedStates !== undefined ? { affectedStates: input.affectedStates } : {}),
      ...(input.filingDate !== undefined ? { filingDate: input.filingDate } : {}),
      ...(input.keyDates !== undefined ? { keyDates: input.keyDates } : {}),
      ...(input.relatedListingIds !== undefined ? { relatedListingIds: input.relatedListingIds } : {}),
      ...(input.adaQualifyingQuestions !== undefined
        ? { adaQualifyingQuestions: input.adaQualifyingQuestions }
        : {}),
      ...(input.leadAttorneyId !== undefined ? { leadAttorneyId: input.leadAttorneyId } : {}),
      ...(input.leadFirmId !== undefined ? { leadFirmId: input.leadFirmId } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.adminLitigation[idx] = next;
    return next;
  }

  async listActiveLitigation(
    opts: ListActiveLitigationOptions = {},
  ): Promise<LitigationRow[]> {
    // Phase A3a: statuses option defaults to ['active'] for back-compat
    // with Ada's prompt context. The public page passes the 4 page-
    // visible statuses. Admin-only statuses are silently excluded by
    // intersecting with the allow-set below.
    const allowedStatuses: ReadonlySet<LitigationStatus> = new Set([
      'active',
      'compliance',
      'investigating',
      'tracking',
    ]);
    const requested: LitigationStatus[] = opts.statuses ?? ['active'];
    const statusFilter = new Set(requested.filter((s) => allowedStatuses.has(s)));

    let filtered = this.adminLitigation.filter((l) =>
      statusFilter.has(l.status),
    );
    if (opts.kind) filtered = filtered.filter((l) => l.kind === opts.kind);
    if (opts.state) {
      filtered = filtered.filter(
        (l) =>
          l.affectedStates.length === 0 ||
          l.affectedStates.includes(opts.state!),
      );
    }
    if (opts.search && opts.search.trim().length > 0) {
      const needle = opts.search.trim().toLowerCase();
      filtered = filtered.filter((l) => {
        const haystack = [
          l.caseName,
          l.eligibility ?? '',
          l.shortDescription ?? '',
        ]
          .join('\n')
          .toLowerCase();
        return haystack.includes(needle);
      });
    }
    const sorted = filtered.sort((a, b) => {
      const aDate = a.filingDate ?? '';
      const bDate = b.filingDate ?? '';
      return bDate.localeCompare(aDate);
    });
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 20;
    return sorted.slice(0, limit).map((l) => ({
      id: l.id,
      kind: l.kind,
      caseName: l.caseName,
      slug: l.slug,
      legalTheory: l.legalTheory,
      shortDescription: l.shortDescription,
      shortDescriptionSimple: l.shortDescriptionSimple,
      shortDescriptionProfessional: l.shortDescriptionProfessional,
      fullDescription: l.fullDescription,
      fullDescriptionSimple: l.fullDescriptionSimple,
      fullDescriptionProfessional: l.fullDescriptionProfessional,
      eligibility: l.eligibility,
      eligibilitySimple: l.eligibilitySimple,
      eligibilityProfessional: l.eligibilityProfessional,
      documentationRequiredSimple: l.documentationRequiredSimple,
      documentationRequiredProfessional: l.documentationRequiredProfessional,
      noDocumentationPathSimple: l.noDocumentationPathSimple,
      noDocumentationPathProfessional: l.noDocumentationPathProfessional,
      evidenceGuidanceSimple: l.evidenceGuidanceSimple,
      evidenceGuidanceProfessional: l.evidenceGuidanceProfessional,
      whatThisIsNotSimple: l.whatThisIsNotSimple,
      whatThisIsNotProfessional: l.whatThisIsNotProfessional,
      defendants: l.defendants,
      court: l.court,
      docketNumber: l.docketNumber,
      affectedStates: l.affectedStates,
      filingDate: l.filingDate,
      keyDates: l.keyDates,
      relatedListingIds: l.relatedListingIds,
      adaQualifyingQuestions: l.adaQualifyingQuestions,
      leadAttorneyId: l.leadAttorneyId,
      leadFirmId: l.leadFirmId,
    }));
  }

  async readActiveLitigationBySlug(
    opts: ReadActiveLitigationBySlugOptions,
  ): Promise<LitigationDetailRow | null> {
    // In-memory storage is single-org; orgId is accepted for parity with
    // the Neon impl. Phase A3a: status is governed by `opts.statuses`,
    // defaulting to ['active'], intersected with the 4 page-visible
    // statuses (admin-only statuses always 404 regardless of caller).
    const allowedStatuses: ReadonlySet<LitigationStatus> = new Set([
      'active',
      'compliance',
      'investigating',
      'tracking',
    ]);
    const requested: LitigationStatus[] = opts.statuses ?? ['active'];
    const statusFilter = new Set(requested.filter((s) => allowedStatuses.has(s)));
    const row = this.adminLitigation.find(
      (l) => l.slug === opts.slug && statusFilter.has(l.status),
    );
    if (!row) return null;
    let leadAttorneyName: string | null = null;
    if (row.leadAttorneyId) {
      const attorney = this.adminAttorneys.find((a) => a.id === row.leadAttorneyId);
      leadAttorneyName = attorney ? attorney.name : null;
    }

    // Phase C1: resolve relatedListingIds to surface-visible related
    // cases. Skip ids that resolve to missing/admin-only-status rows.
    // Preserve relatedListingIds-authored order.
    const relatedIds = row.relatedListingIds ?? [];
    const relatedCases: RelatedLitigationCase[] = relatedIds
      .map((id) => this.adminLitigation.find((l) => l.id === id))
      .filter(
        (l): l is typeof this.adminLitigation[number] =>
          l !== undefined && allowedStatuses.has(l.status),
      )
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        caseName: l.caseName,
        kind: l.kind,
        status: l.status,
      }));

    return {
      id: row.id,
      kind: row.kind,
      caseName: row.caseName,
      slug: row.slug,
      legalTheory: row.legalTheory,
      shortDescription: row.shortDescription,
      shortDescriptionSimple: row.shortDescriptionSimple,
      shortDescriptionProfessional: row.shortDescriptionProfessional,
      fullDescription: row.fullDescription,
      fullDescriptionSimple: row.fullDescriptionSimple,
      fullDescriptionProfessional: row.fullDescriptionProfessional,
      eligibility: row.eligibility,
      eligibilitySimple: row.eligibilitySimple,
      eligibilityProfessional: row.eligibilityProfessional,
      documentationRequiredSimple: row.documentationRequiredSimple,
      documentationRequiredProfessional: row.documentationRequiredProfessional,
      noDocumentationPathSimple: row.noDocumentationPathSimple,
      noDocumentationPathProfessional: row.noDocumentationPathProfessional,
      evidenceGuidanceSimple: row.evidenceGuidanceSimple,
      evidenceGuidanceProfessional: row.evidenceGuidanceProfessional,
      whatThisIsNotSimple: row.whatThisIsNotSimple,
      whatThisIsNotProfessional: row.whatThisIsNotProfessional,
      defendants: row.defendants,
      court: row.court,
      docketNumber: row.docketNumber,
      affectedStates: row.affectedStates,
      filingDate: row.filingDate,
      keyDates: row.keyDates,
      relatedListingIds: row.relatedListingIds,
      adaQualifyingQuestions: row.adaQualifyingQuestions,
      leadAttorneyId: row.leadAttorneyId,
      leadFirmId: row.leadFirmId,
      leadAttorneyName,
      relatedCases,
    };
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

    // 6. Intakes total (Phase 5a) — lifetime count of class_action_intake
    // sessions, scoped by the same include_test filter the rest of this
    // result uses. Powers the AdminDashboard "Intakes" tile.
    const intakesTotal = relevant.filter(
      (s) => s.sessionType === 'class_action_intake',
    ).length;

    return {
      sessionVolume,
      statusCounts,
      completionRate,
      readingLevelDistribution,
      classificationBreakdown,
      toolUseFrequency,
      intakesTotal,
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

  // ─── Attorney portal (migration 0019) ──────────────────────────────────────

  async listPortalQueueForFirm(
    lawFirmId: string,
    opts?: PortalQueueOptions,
  ): Promise<PortalQueueResult> {
    const page = Math.max(1, opts?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 50));
    const handledFilter = opts?.handled ?? 'false';

    // Litigation rows assigned to this firm.
    const assignedLitigationIds = new Set(
      this.litigationFirmAssignments
        .filter((a) => a.lawFirmId === lawFirmId)
        .map((a) => a.litigationListingId),
    );

    const matched = [...this.sessions.values()].filter(
      (s) =>
        s.litigationListingId &&
        assignedLitigationIds.has(s.litigationListingId) &&
        // Consent gate (Phase 1b, soft): hide a session with an UNCONSENTED
        // case. No case (legacy / pre-routing) → unaffected. Mirrors the neon
        // NOT EXISTS predicate.
        !this.cases.some((c) => c.adaSessionId === s.sessionId && c.consentToShare === false),
    );

    const caseName = (litigationListingId: string): string =>
      this.adminLitigation.find((l) => l.id === litigationListingId)?.caseName ?? '';

    const all: PortalQueueRow[] = matched.map((s) => {
      const handledByThisFirm = this.firmSessionHandled.some(
        (h) => h.sessionId === s.sessionId && h.lawFirmId === lawFirmId,
      );
      const handledByOtherFirm = this.firmSessionHandled.some(
        (h) => h.sessionId === s.sessionId && h.lawFirmId !== lawFirmId,
      );
      return {
        sessionId: s.sessionId,
        caseName: caseName(s.litigationListingId!),
        userName: portalFieldStr(s.extractedFields, 'claimant_name'),
        userEmail: portalFieldStr(s.extractedFields, 'claimant_email'),
        userPhone: portalFieldStr(s.extractedFields, 'claimant_phone'),
        matchedAt: null, // in-memory tracks no updated_at
        handledByThisFirm,
        handledByOtherFirm,
      };
    });

    // Firm-scoped counts (DO3): openCount excludes other-firm-handled.
    const openCount = all.filter(
      (c) => !c.handledByThisFirm && !c.handledByOtherFirm,
    ).length;
    const handledCount = all.filter((c) => c.handledByThisFirm).length;

    const filtered = all.filter((c) => {
      if (handledFilter === 'all') return true;
      if (handledFilter === 'true') return c.handledByThisFirm;
      return !c.handledByThisFirm; // 'false' (open) — keeps other-firm-handled (grayed)
    });

    const start = (page - 1) * pageSize;
    return {
      summary: { openCount, handledCount },
      cases: filtered.slice(start, start + pageSize),
      totalCount: filtered.length,
      page,
      pageSize,
    };
  }

  async getPortalCaseForFirm(
    sessionId: string,
    lawFirmId: string,
  ): Promise<PortalCaseDetail | null> {
    const s = this.sessions.get(sessionId);
    if (!s || !s.litigationListingId) return null;

    // Access boundary: the firm must be assigned to the session's litigation row.
    const assigned = this.litigationFirmAssignments.some(
      (a) => a.litigationListingId === s.litigationListingId && a.lawFirmId === lawFirmId,
    );
    if (!assigned) return null;

    const litigation = this.adminLitigation.find((l) => l.id === s.litigationListingId);

    const identity = new Set([
      'claimant_name',
      'claimant_email',
      'claimant_phone',
      'contact_preference',
    ]);
    const qualifyingAnswers: PortalCaseQqAnswer[] = [];
    for (const [key, field] of Object.entries(s.extractedFields)) {
      if (identity.has(key)) continue;
      const v = field?.value;
      if (v == null) continue;
      qualifyingAnswers.push({
        question: key,
        answer: typeof v === 'string' ? v : String(v),
      });
    }

    const handledByThisFirm = this.firmSessionHandled.some(
      (h) => h.sessionId === sessionId && h.lawFirmId === lawFirmId,
    );

    return {
      sessionId: s.sessionId,
      litigationListingId: s.litigationListingId,
      caseName: litigation?.caseName ?? '',
      userName: portalFieldStr(s.extractedFields, 'claimant_name'),
      userEmail: portalFieldStr(s.extractedFields, 'claimant_email'),
      userPhone: portalFieldStr(s.extractedFields, 'claimant_phone'),
      qualifyingAnswers,
      transcript: s.conversationHistory as Message[],
      matchedAt: null,
      handledByThisFirm,
    };
  }

  async markFirmSessionHandled(
    sessionId: string,
    lawFirmId: string,
    handledByUserId: string | null,
  ): Promise<void> {
    const exists = this.firmSessionHandled.some(
      (h) => h.sessionId === sessionId && h.lawFirmId === lawFirmId,
    );
    if (exists) return; // idempotent
    this.firmSessionHandled.push({
      sessionId,
      lawFirmId,
      handledByUserId,
      handledAt: new Date(0).toISOString(),
    });
  }

  async listFirmAssignmentsForLitigation(
    litigationListingId: string,
  ): Promise<LitigationFirmAssignment[]> {
    return this.litigationFirmAssignments
      .filter((a) => a.litigationListingId === litigationListingId)
      .map((a) => ({ ...a }));
  }

  async replaceFirmAssignmentsForLitigation(
    litigationListingId: string,
    lawFirmIds: string[],
    assignedByUserId?: string | null,
  ): Promise<LitigationFirmAssignment[]> {
    // Remove existing assignments for this litigation row.
    for (let i = this.litigationFirmAssignments.length - 1; i >= 0; i--) {
      if (this.litigationFirmAssignments[i]!.litigationListingId === litigationListingId) {
        this.litigationFirmAssignments.splice(i, 1);
      }
    }
    const unique = [...new Set(lawFirmIds)];
    const created: LitigationFirmAssignment[] = unique.map((lawFirmId, idx) => ({
      id: `lfa-${litigationListingId}-${idx}`,
      litigationListingId,
      lawFirmId,
      assignedByUserId: assignedByUserId ?? null,
      createdAt: new Date(0).toISOString(),
    }));
    this.litigationFirmAssignments.push(...created.map((c) => ({ ...c })));
    return created;
  }

  async createCase(opts: CreateCaseOptions): Promise<CreateCaseResult> {
    // Idempotent on ada_session_id (matches the cases_ada_session_unique
    // constraint). A non-null session that already has a case returns the
    // existing row with created=false and writes nothing new.
    if (opts.adaSessionId !== null) {
      const existing = this.cases.find((c) => c.adaSessionId === opts.adaSessionId);
      if (existing) {
        return { caseRow: { ...existing }, created: false };
      }
    }

    this.caseSeq += 1;
    const caseRow: CaseRow = {
      id: `mem-case-${this.caseSeq}`,
      orgId: opts.orgId,
      adaSessionId: opts.adaSessionId,
      litigationListingId: opts.litigationListingId,
      caseNumber: `CASE-${String(this.caseSeq).padStart(4, '0')}`,
      lane: opts.lane,
      status: 'new',
      firmId: opts.firmId,
      consentToShare: false,
      createdAt: new Date(0).toISOString(),
    };
    this.cases.push(caseRow);
    this.caseExtras.set(caseRow.id, {
      classificationTitle: opts.classificationTitle,
      jurisdictionState: opts.jurisdictionState,
      routedAt: opts.routedAt,
      firstContactDue: opts.firstContactDue,
      solDate: null,
    });

    this.caseActivity.push({
      caseId: caseRow.id,
      actorType: 'system',
      eventType: 'ROUTED',
      summary: opts.routingReason,
      metadata: { lane: opts.lane, firmId: opts.firmId },
      createdAt: new Date(0).toISOString(),
    });

    return { caseRow: { ...caseRow }, created: true };
  }

  async getCaseBySessionId(sessionId: string): Promise<CaseRow | null> {
    const found = this.cases.find((c) => c.adaSessionId === sessionId);
    return found ? { ...found } : null;
  }

  async recordCaseConsent(opts: {
    sessionId: string;
    scope: string;
  }): Promise<RecordConsentResult | null> {
    const c = this.cases.find((x) => x.adaSessionId === opts.sessionId);
    if (!c) return null;

    if (c.consentToShare) {
      return { caseRow: { ...c }, alreadyConsented: true };
    }

    c.consentToShare = true;
    this.caseActivity.push({
      caseId: c.id,
      actorType: 'client',
      eventType: 'CONSENT',
      summary: `claimant consented to share (${opts.scope})`,
      metadata: { scope: opts.scope },
      createdAt: new Date(0).toISOString(),
    });

    return { caseRow: { ...c }, alreadyConsented: false };
  }

  async appendCaseActivity(opts: {
    caseId: string;
    actorType: 'user' | 'system' | 'ada' | 'client';
    eventType: string;
    summary: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.caseActivity.push({
      caseId: opts.caseId,
      actorType: opts.actorType,
      eventType: opts.eventType,
      summary: opts.summary,
      metadata: opts.metadata ?? {},
      createdAt: new Date(0).toISOString(),
    });
  }

  async listCasesForFirm(lawFirmId: string): Promise<PortalCaseListResult> {
    const STATUS_GROUP: Record<string, 'new' | 'working' | 'resolved' | null> = {
      new: 'new',
      accepted: 'working',
      working: 'working',
      resolved: 'resolved',
      closed: 'resolved',
    };

    const groups = { new: [] as PortalCaseListRow[], working: [] as PortalCaseListRow[], resolved: [] as PortalCaseListRow[] };

    // Firm-scoped + HARD consent gate.
    const firmCases = this.cases.filter((c) => c.firmId === lawFirmId && c.consentToShare);
    // Stable order: newest first.
    firmCases.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    for (const c of firmCases) {
      const group = STATUS_GROUP[c.status];
      if (!group) continue; // declined / reclaimed are not in the active queue
      const session = c.adaSessionId ? this.sessions.get(c.adaSessionId) : undefined;
      const fields = session?.extractedFields ?? {};
      const extras = this.caseExtras.get(c.id);
      const litig = this.adminLitigation.find((l) => l.id === c.litigationListingId);
      groups[group].push({
        caseId: c.id,
        adaSessionId: c.adaSessionId,
        caseNumber: c.caseNumber,
        status: c.status,
        lane: c.lane,
        caseName: litig?.caseName ?? null,
        classificationTitle: extras?.classificationTitle ?? null,
        jurisdictionState: extras?.jurisdictionState ?? null,
        claimantName: portalFieldStr(fields, 'claimant_name'),
        claimantEmail: portalFieldStr(fields, 'claimant_email'),
        claimantPhone: portalFieldStr(fields, 'claimant_phone'),
        routedAt: extras?.routedAt ?? null,
        firstContactDue: extras?.firstContactDue ?? null,
        createdAt: c.createdAt,
      });
    }

    return {
      groups,
      counts: { new: groups.new.length, working: groups.working.length, resolved: groups.resolved.length },
    };
  }

  async getCaseDetailForFirm(
    caseId: string,
    lawFirmId: string,
  ): Promise<PortalCaseDetailFull | null> {
    const c = this.cases.find((x) => x.id === caseId && x.firmId === lawFirmId);
    if (!c || !c.consentToShare) return null;

    const session = c.adaSessionId ? this.sessions.get(c.adaSessionId) : undefined;
    const fields = session?.extractedFields ?? {};
    const extras = this.caseExtras.get(c.id);
    const litig = this.adminLitigation.find((l) => l.id === c.litigationListingId);

    const identity = new Set(['claimant_name', 'claimant_email', 'claimant_phone', 'contact_preference']);
    const qualifyingAnswers: { question: string; answer: string }[] = [];
    for (const [key, field] of Object.entries(fields)) {
      if (identity.has(key)) continue;
      const v = field?.value;
      if (v == null) continue;
      qualifyingAnswers.push({ question: key, answer: typeof v === 'string' ? v : String(v) });
    }

    const activity = this.caseActivity
      .filter((a) => a.caseId === caseId)
      .map((a) => ({
        eventType: a.eventType,
        summary: a.summary,
        actorType: a.actorType,
        createdAt: a.createdAt,
      }));

    return {
      caseId: c.id,
      adaSessionId: c.adaSessionId,
      caseNumber: c.caseNumber,
      status: c.status,
      lane: c.lane,
      classificationTitle: extras?.classificationTitle ?? null,
      jurisdictionState: extras?.jurisdictionState ?? null,
      consentToShare: c.consentToShare,
      routedAt: extras?.routedAt ?? null,
      firstContactDue: extras?.firstContactDue ?? null,
      createdAt: c.createdAt,
      caseName: litig?.caseName ?? null,
      solDate: extras?.solDate ?? null,
      claimantName: portalFieldStr(fields, 'claimant_name'),
      claimantEmail: portalFieldStr(fields, 'claimant_email'),
      claimantPhone: portalFieldStr(fields, 'claimant_phone'),
      qualifyingAnswers,
      transcript: (session?.conversationHistory ?? []) as Message[],
      activity,
    };
  }

  async transitionCaseForFirm(opts: {
    caseId: string;
    lawFirmId: string;
    transition: CaseTransition;
    reason?: string;
    resolutionType?: string;
    resolutionNotes?: string;
  }): Promise<{ caseRow: CaseRow } | null> {
    const c = this.cases.find((x) => x.id === opts.caseId && x.firmId === opts.lawFirmId);
    if (!c || !c.consentToShare) return null;

    // Throws IllegalCaseTransitionError on a bad transition.
    c.status = applyCaseTransition(c.status as CaseStatus, opts.transition);

    this.caseActivity.push({
      caseId: c.id,
      actorType: 'user',
      eventType: opts.transition.toUpperCase(),
      summary: caseTransitionSummary(opts),
      metadata: {
        transition: opts.transition,
        reason: opts.reason ?? null,
        resolutionType: opts.resolutionType ?? null,
      },
      createdAt: new Date(0).toISOString(),
    });

    return { caseRow: { ...c } };
  }

  async addCaseNoteForFirm(opts: {
    caseId: string;
    lawFirmId: string;
    body: string;
  }): Promise<boolean> {
    const c = this.cases.find((x) => x.id === opts.caseId && x.firmId === opts.lawFirmId);
    if (!c || !c.consentToShare) return false;
    this.caseActivity.push({
      caseId: c.id,
      actorType: 'user',
      eventType: 'NOTE',
      summary: opts.body,
      metadata: { note: true },
      createdAt: new Date(0).toISOString(),
    });
    return true;
  }

  async setCaseSolDate(opts: {
    caseId: string;
    lawFirmId: string;
    solDate: string | null;
  }): Promise<boolean> {
    const c = this.cases.find((x) => x.id === opts.caseId && x.firmId === opts.lawFirmId);
    if (!c || !c.consentToShare) return false;
    const extras = this.caseExtras.get(c.id);
    this.caseExtras.set(c.id, {
      classificationTitle: extras?.classificationTitle ?? null,
      jurisdictionState: extras?.jurisdictionState ?? null,
      routedAt: extras?.routedAt ?? null,
      firstContactDue: extras?.firstContactDue ?? null,
      solDate: opts.solDate,
    });
    this.caseActivity.push({
      caseId: c.id,
      actorType: 'user',
      eventType: 'SOL_SET',
      summary: opts.solDate
        ? `Statute of limitations set to ${opts.solDate}`
        : 'Statute of limitations cleared',
      metadata: { solDate: opts.solDate },
      createdAt: new Date(0).toISOString(),
    });
    return true;
  }

  async listCasesForAdmin(
    orgId: string,
    opts?: { lane?: CaseLane | 'unplaced' },
  ): Promise<{ cases: AdminCaseRow[] }> {
    let rows = this.cases.filter((c) => c.orgId === orgId);
    if (opts?.lane === 'unplaced') {
      rows = rows.filter((c) => (c.lane === 'sourcing' || c.lane === 'general_queue') && !c.firmId);
    } else if (opts?.lane) {
      rows = rows.filter((c) => c.lane === opts.lane);
    }
    rows = [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const cases: AdminCaseRow[] = rows.map((c) => {
      const session = c.adaSessionId ? this.sessions.get(c.adaSessionId) : undefined;
      const fields = session?.extractedFields ?? {};
      const extras = this.caseExtras.get(c.id);
      const litig = this.adminLitigation.find((l) => l.id === c.litigationListingId);
      const firm = c.firmId ? this.lawFirms.find((f) => f.id === c.firmId) : undefined;
      return {
        caseId: c.id,
        adaSessionId: c.adaSessionId,
        caseNumber: c.caseNumber,
        lane: c.lane,
        status: c.status,
        classificationTitle: extras?.classificationTitle ?? null,
        jurisdictionState: extras?.jurisdictionState ?? null,
        consentToShare: c.consentToShare,
        claimantName: portalFieldStr(fields, 'claimant_name'),
        claimantEmail: portalFieldStr(fields, 'claimant_email'),
        caseName: litig?.caseName ?? null,
        firmId: c.firmId,
        firmName: firm?.name ?? null,
        createdAt: c.createdAt,
      };
    });
    return { cases };
  }

  async placeCaseToFirm(opts: {
    caseId: string;
    orgId: string;
    firmId: string;
  }): Promise<{ caseRow: CaseRow } | null> {
    const c = this.cases.find((x) => x.id === opts.caseId && x.orgId === opts.orgId);
    if (!c) return null;
    const firm = this.lawFirms.find((f) => f.id === opts.firmId && f.orgId === opts.orgId);
    if (!firm) return null;

    c.firmId = opts.firmId;
    c.lane = 'routed_firm';
    const routedAt = new Date(0).toISOString();
    const firstContactDue = new Date(24 * 60 * 60 * 1000).toISOString();
    const extras = this.caseExtras.get(c.id);
    this.caseExtras.set(c.id, {
      classificationTitle: extras?.classificationTitle ?? null,
      jurisdictionState: extras?.jurisdictionState ?? null,
      routedAt,
      firstContactDue,
      solDate: extras?.solDate ?? null,
    });

    this.caseActivity.push({
      caseId: c.id,
      actorType: 'system',
      eventType: 'PLACED',
      summary: `Placed to ${firm.name}`,
      metadata: { firmId: opts.firmId },
      createdAt: routedAt,
    });

    return { caseRow: { ...c } };
  }

  // ─── Phase 4b: case tasks ───────────────────────────────────────────────
  private caseTasks: TaskRow[] = [];

  private accessibleCase(caseId: string, lawFirmId: string): CaseRow | null {
    const c = this.cases.find((x) => x.id === caseId && x.firmId === lawFirmId);
    return c && c.consentToShare ? c : null;
  }

  async listTasksForCase(caseId: string, lawFirmId: string): Promise<TaskRow[] | null> {
    if (!this.accessibleCase(caseId, lawFirmId)) return null;
    return this.caseTasks
      .filter((t) => t.caseId === caseId)
      .map((t) => ({ ...t }))
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }

  async addTaskForCase(opts: {
    caseId: string;
    lawFirmId: string;
    title: string;
    dueDate?: string | null;
    priority?: string;
    createdBy?: string | null;
  }): Promise<TaskRow | null> {
    if (!this.accessibleCase(opts.caseId, opts.lawFirmId)) return null;
    const row: TaskRow = {
      id: `task-${this.caseTasks.length + 1}-${Math.random().toString(36).slice(2, 8)}`,
      caseId: opts.caseId,
      title: opts.title,
      dueDate: opts.dueDate ?? null,
      priority: opts.priority ?? 'medium',
      completedAt: null,
      createdAt: new Date(this.caseTasks.length).toISOString(),
    };
    this.caseTasks.push(row);
    return { ...row };
  }

  async completeTaskForCase(opts: { taskId: string; lawFirmId: string }): Promise<boolean> {
    const task = this.caseTasks.find((t) => t.id === opts.taskId);
    if (!task) return false;
    if (!this.accessibleCase(task.caseId, opts.lawFirmId)) return false;
    task.completedAt = new Date(0).toISOString();
    return true;
  }

  async listOpenTasksForFirm(lawFirmId: string): Promise<FirmTaskRow[]> {
    const out: FirmTaskRow[] = [];
    for (const t of this.caseTasks) {
      if (t.completedAt) continue;
      const c = this.cases.find((x) => x.id === t.caseId);
      if (!c || c.firmId !== lawFirmId || !c.consentToShare) continue;
      const session = c.adaSessionId ? this.sessions.get(c.adaSessionId) : undefined;
      out.push({
        ...t,
        caseNumber: c.caseNumber,
        claimantName: session ? portalFieldStr(session.extractedFields, 'claimant_name') : null,
      });
    }
    return out.sort((a, b) => {
      if (a.dueDate === b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    });
  }

  async getFirmPipelineStats(lawFirmId: string): Promise<PipelineStats> {
    const firmCases = this.cases.filter((c) => c.firmId === lawFirmId && c.consentToShare);
    const ids = new Set(firmCases.map((c) => c.id));
    const cases = firmCases.map((c) => ({ id: c.id, createdAt: c.createdAt }));
    const events = this.caseActivity
      .filter((a) => ids.has(a.caseId) && PIPELINE_EVENT_TYPES.has(a.eventType))
      .map((a) => ({ caseId: a.caseId, eventType: a.eventType, createdAt: a.createdAt }));
    return computePipelineStats(cases, events);
  }

  async resolveAttorneyByClerkUserId(
    clerkUserId: string,
  ): Promise<PortalAttorneyResolution | null> {
    const attorneyId = this.clerkUserLinks.get(clerkUserId);
    if (!attorneyId) return null;
    const a = this.adminAttorneys.find((x) => x.id === attorneyId);
    if (!a || !a.userId || !a.lawFirmId) return null;
    return {
      attorneyId: a.id,
      userId: a.userId,
      lawFirmId: a.lawFirmId,
      email: a.email,
    };
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

  async listAllSubscriptionsForAdmin(
    opts: AdminSubscriptionListOptions,
  ): Promise<AdminSubscriptionListResult> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

    // Build firm id → (orgId, name) map, listing id → title map
    const firmsById = new Map<string, LawFirmRow>();
    for (const f of this.lawFirms) firmsById.set(f.id, f);
    const listingsById = new Map<string, ListingRow>();
    for (const l of this.listings) listingsById.set(l.id, l);

    let rows = this.subscriptionRows.filter((s) => {
      const firm = firmsById.get(s.lawFirmId);
      return firm?.orgId === opts.orgId;
    });
    if (opts.lawFirmId) rows = rows.filter((s) => s.lawFirmId === opts.lawFirmId);
    if (opts.status) rows = rows.filter((s) => s.status === opts.status);
    if (opts.tier) rows = rows.filter((s) => s.tier === opts.tier);

    rows.sort((a, b) => {
      const aAt = a.createdAt ?? '';
      const bAt = b.createdAt ?? '';
      return bAt.localeCompare(aAt);
    });

    const totalCount = rows.length;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize).map((s) => ({
      subscription: { ...s },
      lawFirmName: firmsById.get(s.lawFirmId)?.name ?? s.lawFirmId,
      listingTitle: s.listingId
        ? (listingsById.get(s.listingId)?.title ?? null)
        : null,
    }));

    return {
      subscriptions: paged,
      totalCount,
      page,
      pageSize,
    };
  }

  async listIntakesForAdmin(
    opts: AdminIntakeListOptions,
  ): Promise<AdminIntakeListResult> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

    const firmsById = new Map<string, LawFirmRow>();
    for (const f of this.lawFirms) firmsById.set(f.id, f);
    const listingsById = new Map<string, ListingRow>();
    for (const l of this.listings) listingsById.set(l.id, l);

    // Filter sessions: class_action_intake, scoped to org (via listing→firm→org)
    let sessions = Array.from(this.sessions.values()).filter((s) => {
      if (s.sessionType !== 'class_action_intake') return false;
      if (s.orgId !== opts.orgId) return false;
      if (!opts.includeTest && s.isTest) return false;
      if (!s.listingId) return false;
      return true;
    });

    if (opts.listingId) {
      sessions = sessions.filter((s) => s.listingId === opts.listingId);
    }
    if (opts.lawFirmId) {
      sessions = sessions.filter((s) => {
        const listing = s.listingId ? listingsById.get(s.listingId) : null;
        return listing?.lawFirmId === opts.lawFirmId;
      });
    }
    if (opts.status) {
      sessions = sessions.filter((s) => s.status === opts.status);
    }
    if (opts.outcome) {
      sessions = sessions.filter(
        (s) => s.metadata?.outcome === opts.outcome,
      );
    }

    // Newest first; InMemory sessions don't always carry timestamps so
    // fall back to sessionId for stable order.
    sessions.sort((a, b) => b.sessionId.localeCompare(a.sessionId));

    const totalCount = sessions.length;
    const start = (page - 1) * pageSize;
    const paged = sessions.slice(start, start + pageSize);

    const intakes: AdminIntakeListRow[] = paged.map((s) => {
      const listing = listingsById.get(s.listingId!);
      const firm = listing ? firmsById.get(listing.lawFirmId) : null;
      const metaOutcome = (s.metadata as Record<string, unknown>)?.outcome;
      const outcome =
        metaOutcome === 'qualified' || metaOutcome === 'disqualified'
          ? metaOutcome
          : null;
      // Phase 4: project handoff side-effect status. Null when finalize_intake
      // hasn't run; true/false based on whether the email id is populated.
      const handoff = s.metadata?.handoff ?? null;
      const firmEmailSent =
        handoff === null ? null : handoff.firm_email_id !== null;
      const userEmailSent =
        handoff === null ? null : handoff.user_email_id !== null;
      const transcriptUrl = handoff?.transcript_url ?? null;
      return {
        sessionId: s.sessionId,
        status: s.status,
        lawFirmId: firm?.id ?? '',
        lawFirmName: firm?.name ?? '(unknown firm)',
        listingId: s.listingId!,
        listingTitle: listing?.title ?? '(unknown listing)',
        outcome,
        isTest: s.isTest,
        firmEmailSent,
        userEmailSent,
        transcriptUrl,
        createdAt: '',
        updatedAt: '',
      };
    });

    return { intakes, totalCount, page, pageSize };
  }

  async readIntakeForAdmin(
    opts: AdminIntakeReadOptions,
  ): Promise<AdminIntakeReadResult | null> {
    const session = this.sessions.get(opts.sessionId);
    if (!session) return null;
    // Session-type gate: this endpoint is the intake detail page, non-intake
    // sessions belong on AdminSessionDetail and should not be reachable here.
    if (session.sessionType !== 'class_action_intake') return null;
    // Org scope: surface cross-org access as not-found, not 403.
    if (session.orgId !== opts.orgId) return null;
    // class_action_intake sessions are always listing-bound (finalize_intake
    // Gate 1). If listingId is somehow missing, this is data corruption — fail
    // closed by returning null.
    if (!session.listingId) return null;
    const listing = this.listings.find((l) => l.id === session.listingId);
    if (!listing) return null;
    const firm = this.lawFirms.find((f) => f.id === listing.lawFirmId);
    if (!firm) return null;
    return {
      session: structuredClone(session),
      firm: { id: firm.id, name: firm.name, email: firm.email },
      listing: { id: listing.id, title: listing.title, slug: listing.slug },
    };
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
    additionalStates: a.additionalStates ?? [],
    specialtyTags: a.specialtyTags ?? [],
    email: a.email,
    phone: a.phone,
    websiteUrl: a.websiteUrl,
  };
}

/**
 * Snake_case snapshot of an attorney row for audit_log.metadata.before.
 * Snake_case matches the DB column naming so a future restore tool can
 * map it back to columns 1:1 if we ever need to undo a hard-delete.
 * Lives next to toPublicAttorney so any new fields here are likely to
 * be noticed there too.
 */
function serializeAttorneyForAudit(
  a: AttorneyAdminRow,
  orgId: string | null,
): Record<string, unknown> {
  return {
    id: a.id,
    org_id: orgId,
    name: a.name,
    firm_name: a.firmName,
    location_city: a.locationCity,
    location_state: a.locationState,
    practice_areas: a.practiceAreas,
    additional_states: a.additionalStates ?? [],
    specialty_tags: a.specialtyTags ?? [],
    email: a.email,
    phone: a.phone,
    website_url: a.websiteUrl,
    bio: a.bio,
    photo_url: a.photoUrl,
    status: a.status,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
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
  public readonly rewriteRequests: Array<{
    output: PhotoAnalysisOutput;
    level: 'simple' | 'professional';
  }> = [];

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

  async rewriteToLevel(
    output: PhotoAnalysisOutput,
    level: 'simple' | 'professional',
  ): Promise<PhotoAnalysisOutput> {
    this.rewriteRequests.push({ output, level });
    // Deterministic stand-in: copy the standard text into the requested
    // level so the returned output is fully populated for that level.
    const titleKey = `title_${level}` as 'title_simple' | 'title_professional';
    const findingKey = `finding_${level}` as
      | 'finding_simple'
      | 'finding_professional';
    return {
      ...output,
      scene: { ...output.scene, [level]: output.scene.standard },
      summary: { ...output.summary, [level]: output.summary.standard },
      positive_findings: {
        ...output.positive_findings,
        [level]: output.positive_findings.standard,
      },
      findings: output.findings.map((f) => ({
        ...f,
        [titleKey]: f.title_standard,
        [findingKey]: f.finding_standard,
      })),
    };
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
