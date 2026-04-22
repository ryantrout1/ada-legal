/**
 * NeonDbClient — production DbClient backed by Drizzle over @neondatabase/serverless.
 *
 * Implements the DbClient interface (src/engine/clients/types.ts). The mapping
 * between database rows and the engine's AdaSessionState is explicit and lives
 * in this file — the engine never sees raw row shapes.
 *
 * Sessions:
 *   - readSession: SELECT by id → AdaSessionState | null
 *   - writeSession: INSERT ... ON CONFLICT (id) DO UPDATE (upsert)
 *     Drizzle's $onUpdate hook refreshes updated_at on every write.
 *
 * Attorneys:
 *   - searchAttorneys: placeholder until Phase B Step 12 loads real data.
 *     Returns empty array for now; tests against this client are integration-level
 *     and seed data explicitly when needed.
 *
 * Ref: docs/ARCHITECTURE.md §2, §6, docs/DO_NOT_TOUCH.md rule 1
 */

import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import {
  adaSessions,
  anonSessions,
  attorneys as attorneysTable,
  organizations,
  sessionPackages,
  sessionQualityChecks,
  systemSettings,
} from '../../db/schema-core.js';
import {
  lawFirms as lawFirmsTable,
  listings as listingsTable,
  listingConfigs as listingConfigsTable,
  subscriptions as subscriptionsTable,
  routingRules as routingRulesTable,
  stripeWebhookEvents as stripeWebhookEventsTable,
} from '../../db/schema-ch1.js';
import type {
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
  AdminSessionListOptions,
  AdminSessionListResult,
  AdminSessionSummary,
  AnonSessionUpsertOptions,
  AttorneyAdminRow,
  AttorneyFacets,
  AttorneyRow,
  AttorneySearchOptions,
  AttorneyStatus,
  CreateAttorneyInput,
  DbClient,
  KnowledgeChunkHit,
  KnowledgeSearchOptions,
  OrganizationRow,
  SessionPackageRow,
  SessionQualityCheckRow,
  SessionQualityCheckWrite,
  SessionReadOptions,
  SessionWriteOptions,
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
import type { AdaSessionState } from '../types.js';
import type {
  AccessibilitySnapshot,
  Classification,
  ExtractedFields,
  Message,
  ReadingLevel,
  SessionMetadata,
} from '../../types/db.js';

// ─── Row ↔ State mapping ──────────────────────────────────────────────────────

type AdaSessionRow = typeof adaSessions.$inferSelect;

function rowToState(row: AdaSessionRow): AdaSessionState {
  return {
    sessionId: row.id,
    orgId: row.orgId,
    sessionType: row.sessionType as AdaSessionState['sessionType'],
    status: row.status as AdaSessionState['status'],
    readingLevel: row.readingLevel as ReadingLevel,
    anonSessionId: row.anonSessionId,
    userId: row.userId,
    listingId: row.listingId,
    conversationHistory: (row.conversationHistory ?? []) as Message[],
    extractedFields: (row.extractedFields ?? {}) as ExtractedFields,
    classification: (row.classification ?? null) as Classification | null,
    metadata: (row.metadata ?? {}) as SessionMetadata,
    accessibilitySettings: (row.accessibilitySettings ?? {}) as AccessibilitySnapshot,
    isTest: row.isTest,
  };
}

function stateToInsert(state: AdaSessionState): typeof adaSessions.$inferInsert {
  return {
    id: state.sessionId,
    orgId: state.orgId,
    sessionType: state.sessionType,
    status: state.status,
    readingLevel: state.readingLevel,
    anonSessionId: state.anonSessionId,
    userId: state.userId,
    listingId: state.listingId,
    conversationHistory: state.conversationHistory,
    extractedFields: state.extractedFields,
    classification: state.classification,
    metadata: state.metadata,
    accessibilitySettings: state.accessibilitySettings,
    isTest: state.isTest,
  };
}

// ─── The client ───────────────────────────────────────────────────────────────

export class NeonDbClient implements DbClient {
  constructor(private readonly db: Database) {}

  async readSession({ sessionId }: SessionReadOptions): Promise<AdaSessionState | null> {
    const rows = await this.db
      .select()
      .from(adaSessions)
      .where(eq(adaSessions.id, sessionId))
      .limit(1);

    return rows[0] ? rowToState(rows[0]) : null;
  }

  async writeSession({ state }: SessionWriteOptions): Promise<void> {
    const values = stateToInsert(state);

    // Upsert: INSERT, or UPDATE if the id already exists.
    // Drizzle's $onUpdate hook on the schema refreshes updated_at automatically.
    await this.db
      .insert(adaSessions)
      .values(values)
      .onConflictDoUpdate({
        target: adaSessions.id,
        set: {
          status: values.status,
          readingLevel: values.readingLevel,
          conversationHistory: values.conversationHistory,
          extractedFields: values.extractedFields,
          classification: values.classification,
          metadata: values.metadata,
          accessibilitySettings: values.accessibilitySettings,
          listingId: values.listingId,
        },
      });
  }

  async searchAttorneys(opts: AttorneySearchOptions): Promise<AttorneyRow[]> {
    const conds = [eq(attorneysTable.status, 'approved')];
    if (opts.state) {
      conds.push(eq(attorneysTable.locationState, opts.state));
    }
    if (opts.city) {
      conds.push(eq(attorneysTable.locationCity, opts.city));
    }

    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 10) : 5;
    const rows = await this.db
      .select()
      .from(attorneysTable)
      .where(and(...conds))
      .limit(limit);

    return rows
      .filter((r) => {
        if (!opts.practiceAreas || opts.practiceAreas.length === 0) return true;
        const areas = (r.practiceAreas ?? []) as string[];
        return opts.practiceAreas.some((p) => areas.includes(p));
      })
      .map((r) => ({
        id: r.id,
        name: r.name,
        firmName: r.firmName,
        locationCity: r.locationCity,
        locationState: r.locationState,
        practiceAreas: (r.practiceAreas ?? []) as string[],
        email: r.email,
        phone: r.phone,
        websiteUrl: r.websiteUrl,
      }));
  }

  async getOrgByCode(orgCode: string): Promise<OrganizationRow | null> {
    const rows = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.orgCode, orgCode))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      orgCode: row.orgCode,
      displayName: row.displayName,
      adaIntroPrompt: row.adaIntroPrompt,
      isDefault: row.isDefault,
    };
  }

  async upsertAnonSession(opts: AnonSessionUpsertOptions): Promise<string> {
    // anon_sessions.token_hash is globally unique; anon session identity is
    // independent of org (one device = one anon session across orgs).
    // opts.orgId is accepted for interface symmetry but not used here.
    void opts.orgId;
    void opts.ipAddress;

    const existing = await this.db
      .select()
      .from(anonSessions)
      .where(eq(anonSessions.tokenHash, opts.tokenHash))
      .limit(1);
    if (existing[0]) {
      // Refresh lastSeenAt and return existing row.
      await this.db
        .update(anonSessions)
        .set({ lastSeenAt: sql`now()` })
        .where(eq(anonSessions.id, existing[0].id));
      return existing[0].id;
    }

    // Insert new. gen_random_uuid() from pgcrypto assigns id.
    const inserted = await this.db
      .insert(anonSessions)
      .values({
        tokenHash: opts.tokenHash,
        userAgent: opts.userAgent ?? null,
      })
      .returning({ id: anonSessions.id });
    return inserted[0].id;
  }

  async getAttorneyFacets(): Promise<AttorneyFacets> {
    // Small cardinality — 8 rows today, bounded at ~hundreds long-term.
    // A single SELECT is cheaper than two separate queries or a view.
    const rows = await this.db
      .select({
        locationState: attorneysTable.locationState,
        practiceAreas: attorneysTable.practiceAreas,
      })
      .from(attorneysTable)
      .where(eq(attorneysTable.status, 'approved'));

    const states = new Set<string>();
    const practiceAreas = new Set<string>();
    for (const r of rows) {
      if (r.locationState) states.add(r.locationState);
      for (const p of (r.practiceAreas ?? []) as string[]) {
        practiceAreas.add(p);
      }
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
    const offset = (page - 1) * pageSize;

    const conds = [];
    if (opts.status) conds.push(eq(adaSessions.status, opts.status));
    if (!opts.includeTest) conds.push(eq(adaSessions.isTest, false));

    const whereClause = conds.length > 0 ? and(...conds) : undefined;

    // Count first (for pagination metadata).
    const countRows = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(adaSessions)
      .where(whereClause);
    const totalCount = countRows[0]?.n ?? 0;

    // Then the page of rows.
    const rows = await this.db
      .select({
        id: adaSessions.id,
        status: adaSessions.status,
        readingLevel: adaSessions.readingLevel,
        classification: adaSessions.classification,
        conversationHistory: adaSessions.conversationHistory,
        extractedFields: adaSessions.extractedFields,
        createdAt: adaSessions.createdAt,
        updatedAt: adaSessions.updatedAt,
        isTest: adaSessions.isTest,
      })
      .from(adaSessions)
      .where(whereClause)
      .orderBy(sql`${adaSessions.updatedAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    const sessions: AdminSessionSummary[] = rows.map((r) => {
      const classification = r.classification as Classification | null;
      const history = (r.conversationHistory ?? []) as Message[];
      const extracted = (r.extractedFields ?? {}) as ExtractedFields;
      return {
        sessionId: r.id,
        status: r.status as 'active' | 'completed' | 'abandoned',
        readingLevel: r.readingLevel as 'simple' | 'standard' | 'professional',
        classificationTitle: classification?.title ?? null,
        messageCount: history.length,
        extractedFieldCount: Object.keys(extracted).length,
        createdAt: (r.createdAt as Date).toISOString(),
        updatedAt: (r.updatedAt as Date).toISOString(),
        isTest: r.isTest,
      };
    });

    return { sessions, totalCount, page, pageSize };
  }

  // ─── Admin: attorneys ───────────────────────────────────────────────────────

  async listAttorneysForAdmin(
    opts: AdminAttorneyListOptions,
  ): Promise<AdminAttorneyListResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 50;
    const offset = (page - 1) * pageSize;

    const conds = [];
    if (opts.status) conds.push(eq(attorneysTable.status, opts.status));
    if (opts.search && opts.search.trim()) {
      const term = `%${opts.search.trim()}%`;
      conds.push(
        or(ilike(attorneysTable.name, term), ilike(attorneysTable.firmName, term))!,
      );
    }
    const whereClause = conds.length > 0 ? and(...conds) : undefined;

    const countRows = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(attorneysTable)
      .where(whereClause);
    const totalCount = countRows[0]?.n ?? 0;

    const rows = await this.db
      .select()
      .from(attorneysTable)
      .where(whereClause)
      .orderBy(sql`${attorneysTable.updatedAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    return {
      attorneys: rows.map(toAttorneyAdminRow),
      totalCount,
      page,
      pageSize,
    };
  }

  async getAttorneyById(id: string): Promise<AttorneyAdminRow | null> {
    const rows = await this.db
      .select()
      .from(attorneysTable)
      .where(eq(attorneysTable.id, id))
      .limit(1);
    return rows[0] ? toAttorneyAdminRow(rows[0]) : null;
  }

  async createAttorney(input: CreateAttorneyInput): Promise<AttorneyAdminRow> {
    const inserted = await this.db
      .insert(attorneysTable)
      .values({
        orgId: input.orgId,
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
      })
      .returning();
    return toAttorneyAdminRow(inserted[0]);
  }

  async updateAttorney(
    id: string,
    input: UpdateAttorneyInput,
  ): Promise<AttorneyAdminRow | null> {
    // Build a patch object excluding undefined keys so we only touch
    // what the caller asked to change.
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.firmName !== undefined) patch.firmName = input.firmName;
    if (input.locationCity !== undefined) patch.locationCity = input.locationCity;
    if (input.locationState !== undefined) patch.locationState = input.locationState;
    if (input.practiceAreas !== undefined) patch.practiceAreas = input.practiceAreas;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.websiteUrl !== undefined) patch.websiteUrl = input.websiteUrl;
    if (input.bio !== undefined) patch.bio = input.bio;
    if (input.photoUrl !== undefined) patch.photoUrl = input.photoUrl;
    if (input.status !== undefined) patch.status = input.status;

    if (Object.keys(patch).length === 0) {
      return this.getAttorneyById(id);
    }

    const updated = await this.db
      .update(attorneysTable)
      .set(patch)
      .where(eq(attorneysTable.id, id))
      .returning();
    return updated[0] ? toAttorneyAdminRow(updated[0]) : null;
  }

  // ─── Admin: system settings ─────────────────────────────────────────────────

  async getSystemSetting<T = unknown>(key: string): Promise<T | null> {
    const rows = await this.db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return rows[0] ? (rows[0].value as T) : null;
  }

  async setSystemSetting<T = unknown>(
    key: string,
    value: T,
    updatedBy?: string | null,
  ): Promise<void> {
    await this.db
      .insert(systemSettings)
      .values({
        key,
        value: value as unknown,
        updatedBy: updatedBy ?? null,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: value as unknown,
          updatedBy: updatedBy ?? null,
        },
      });
  }

  // ─── Admin: analytics ───────────────────────────────────────────────────────

  async getAdminAnalytics(
    opts: AdminAnalyticsOptions = {},
  ): Promise<AdminAnalyticsResult> {
    const days = Math.max(1, Math.min(opts.days ?? 14, 90));
    const includeTest = opts.includeTest ?? false;

    // Base predicate for every view.
    const baseWhere = includeTest ? undefined : eq(adaSessions.isTest, false);

    // 1. Session volume by day, zero-filled.
    // Use generate_series to emit one row per day so "no sessions on day X"
    // still renders as 0 in the chart rather than a gap.
    const volumeRows = await this.db.execute<{
      date: string;
      count: number;
    }>(sql`
      WITH day_series AS (
        SELECT generate_series(
          date_trunc('day', now() - interval '1 day' * (${days} - 1)),
          date_trunc('day', now()),
          interval '1 day'
        )::date AS day
      )
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS date,
        coalesce(count(s.id), 0)::int AS count
      FROM day_series d
      LEFT JOIN ada_sessions s
        ON date_trunc('day', s.created_at) = d.day
        ${includeTest ? sql`` : sql`AND s.is_test = false`}
      GROUP BY d.day
      ORDER BY d.day ASC
    `);

    const sessionVolume = (volumeRows.rows ?? volumeRows).map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));

    // 2. Status counts (lifetime).
    const statusRows = await this.db
      .select({
        status: adaSessions.status,
        n: sql<number>`count(*)::int`,
      })
      .from(adaSessions)
      .where(baseWhere)
      .groupBy(adaSessions.status);

    const statusCounts = {
      active: 0,
      completed: 0,
      abandoned: 0,
      total: 0,
    };
    for (const r of statusRows) {
      const c = Number(r.n);
      statusCounts.total += c;
      if (r.status === 'active') statusCounts.active = c;
      else if (r.status === 'completed') statusCounts.completed = c;
      else if (r.status === 'abandoned') statusCounts.abandoned = c;
    }

    const finished = statusCounts.completed + statusCounts.abandoned;
    const completionRate = finished === 0 ? null : statusCounts.completed / finished;

    // 3. Reading-level distribution.
    const rlRows = await this.db
      .select({
        readingLevel: adaSessions.readingLevel,
        n: sql<number>`count(*)::int`,
      })
      .from(adaSessions)
      .where(baseWhere)
      .groupBy(adaSessions.readingLevel);

    const readingLevelDistribution = {
      simple: 0,
      standard: 0,
      professional: 0,
    };
    for (const r of rlRows) {
      const c = Number(r.n);
      if (r.readingLevel === 'simple') readingLevelDistribution.simple = c;
      else if (r.readingLevel === 'standard') readingLevelDistribution.standard = c;
      else if (r.readingLevel === 'professional')
        readingLevelDistribution.professional = c;
    }

    // 4. Classification breakdown (by classification.title, null bucket for
    // unclassified rows).
    const classRows = await this.db.execute<{
      title: string | null;
      count: number;
    }>(sql`
      SELECT
        classification->>'title' AS title,
        count(*)::int AS count
      FROM ada_sessions
      ${includeTest ? sql`` : sql`WHERE is_test = false`}
      GROUP BY classification->>'title'
      ORDER BY count DESC
    `);

    const classificationBreakdown = (classRows.rows ?? classRows).map((r) => ({
      title: r.title ?? 'Unclassified',
      count: Number(r.count),
    }));

    // 5. Tool-use frequency. Pulled from conversation_history JSONB.
    // We unnest the array, project every tool_call name, and group.
    // Expensive on huge tables; fine for Ch0 scale.
    const toolRows = await this.db.execute<{
      tool: string;
      count: number;
    }>(sql`
      SELECT
        (tc->>'name') AS tool,
        count(*)::int AS count
      FROM ada_sessions s,
        LATERAL jsonb_array_elements(s.conversation_history) msg,
        LATERAL jsonb_array_elements(
          coalesce(msg->'tool_calls', '[]'::jsonb)
        ) tc
      ${includeTest ? sql`` : sql`WHERE s.is_test = false`}
      GROUP BY tc->>'name'
      ORDER BY count DESC
    `);

    const toolUseFrequency = (toolRows.rows ?? toolRows)
      .filter((r) => r.tool)
      .map((r) => ({
        tool: r.tool,
        count: Number(r.count),
      }));

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
    await this.db
      .insert(sessionQualityChecks)
      .values({
        sessionId: opts.sessionId,
        passed: opts.passed,
        failures: opts.failures,
        warnings: opts.warnings,
      })
      .onConflictDoUpdate({
        target: sessionQualityChecks.sessionId,
        set: {
          passed: opts.passed,
          failures: opts.failures,
          warnings: opts.warnings,
          checkedAt: new Date(),
        },
      });
  }

  async readSessionQualityCheck(
    sessionId: string,
  ): Promise<SessionQualityCheckRow | null> {
    const rows = await this.db
      .select()
      .from(sessionQualityChecks)
      .where(eq(sessionQualityChecks.sessionId, sessionId))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      sessionId: r.sessionId,
      passed: r.passed,
      failures: (r.failures ?? []) as SessionQualityCheckRow['failures'],
      warnings: (r.warnings ?? []) as SessionQualityCheckRow['warnings'],
      checkedAt: (r.checkedAt as Date).toISOString(),
    };
  }

  async findActiveSessionForAnon(
    anonSessionId: string,
  ): Promise<AdaSessionState | null> {
    const rows = await this.db
      .select()
      .from(adaSessions)
      .where(
        and(
          eq(adaSessions.anonSessionId, anonSessionId),
          eq(adaSessions.status, 'active'),
        ),
      )
      .orderBy(sql`${adaSessions.updatedAt} DESC`)
      .limit(1);
    return rows[0] ? rowToState(rows[0]) : null;
  }

  async findAnonSessionByHash(tokenHash: string): Promise<string | null> {
    const rows = await this.db
      .select({ id: anonSessions.id })
      .from(anonSessions)
      .where(eq(anonSessions.tokenHash, tokenHash))
      .limit(1);
    return rows[0]?.id ?? null;
  }

  // ─── Knowledge base (RAG) ──────────────────────────────────────────────────

  async searchKnowledgeBase(
    opts: KnowledgeSearchOptions,
  ): Promise<KnowledgeChunkHit[]> {
    const k = Math.min(Math.max(opts.k ?? 5, 1), 10);
    const query = opts.query.trim();
    if (!query) return [];

    // ── Citation extraction ─────────────────────────────────────────────────
    // Match patterns like "36", "36.302", "36.302(c)", "36.302(c)(1)", with
    // or without a leading "§" or "Section". Case-insensitive. We look across
    // the whole query string; multiple citations in one query are supported.
    const citations = extractCitations(query);

    // ── Vector path ─────────────────────────────────────────────────────────
    let vectorHits: KnowledgeChunkHit[] = [];
    if (opts.queryEmbedding && opts.queryEmbedding.length > 0) {
      const vectorLiteral = `[${opts.queryEmbedding.join(',')}]`;
      // pgvector cosine distance: smaller = closer. similarity = 1 - distance.
      const topicClause = opts.topic ? sql`AND topic = ${opts.topic}` : sql``;
      const rows = await this.db.execute<{
        id: string;
        topic: string;
        title: string;
        content: string;
        standard_refs: string[];
        source: string | null;
        distance: number;
      }>(sql`
        SELECT id::text, topic, title, content, standard_refs, source,
               (embedding <=> ${vectorLiteral}::vector) AS distance
        FROM ada_knowledge_chunks
        WHERE embedding IS NOT NULL ${topicClause}
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${k}
      `);
      vectorHits = (rows.rows ?? rows ?? []).map((r: {
        id: string;
        topic: string;
        title: string;
        content: string;
        standard_refs: string[];
        source: string | null;
        distance: number;
      }) => ({
        id: r.id,
        topic: r.topic,
        title: r.title,
        content: r.content,
        standardRefs: Array.isArray(r.standard_refs) ? r.standard_refs : [],
        source: r.source,
        similarity: Math.max(0, 1 - Number(r.distance)),
        matchType: 'vector' as const,
      }));
    }

    // ── Citation-match path ─────────────────────────────────────────────────
    // For every extracted citation, find chunks whose standard_refs array
    // contains that exact string. This is the deterministic fallback so
    // "§36.302" always surfaces the right chunks even if similarity ranks
    // them below something semantically adjacent.
    let citationHits: KnowledgeChunkHit[] = [];
    if (citations.length > 0) {
      const citationJson = JSON.stringify(citations);
      const rows = await this.db.execute<{
        id: string;
        topic: string;
        title: string;
        content: string;
        standard_refs: string[];
        source: string | null;
      }>(sql`
        SELECT id::text, topic, title, content, standard_refs, source
        FROM ada_knowledge_chunks
        WHERE standard_refs ?| ${sql.raw(`ARRAY(SELECT jsonb_array_elements_text('${citationJson}'::jsonb))`)}
        LIMIT ${k}
      `);
      citationHits = (rows.rows ?? rows ?? []).map((r: {
        id: string;
        topic: string;
        title: string;
        content: string;
        standard_refs: string[];
        source: string | null;
      }) => ({
        id: r.id,
        topic: r.topic,
        title: r.title,
        content: r.content,
        standardRefs: Array.isArray(r.standard_refs) ? r.standard_refs : [],
        source: r.source,
        similarity: null,
        matchType: 'citation' as const,
      }));
    }

    // ── Merge + dedupe ──────────────────────────────────────────────────────
    // Citation hits first (they're deterministic and high-confidence),
    // then vector hits. Dedupe by id so a chunk matched both ways only
    // appears once. Cap at k.
    const seen = new Set<string>();
    const merged: KnowledgeChunkHit[] = [];
    for (const hit of [...citationHits, ...vectorHits]) {
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);
      merged.push(hit);
      if (merged.length >= k) break;
    }
    return merged;
  }

  // ─── session_packages (Step 18) ──────────────────────────────────────────

  async writeSessionPackage(opts: WriteSessionPackageOptions): Promise<void> {
    await this.db.insert(sessionPackages).values({
      slug: opts.slug,
      sessionId: opts.sessionId,
      payload: opts.payload as object,
      classificationTitle: opts.classificationTitle,
      generatedAt: new Date(opts.generatedAt),
      expiresAt: opts.expiresAt ? new Date(opts.expiresAt) : null,
    });
  }

  async readSessionPackageBySlug(slug: string): Promise<SessionPackageRow | null> {
    const rows = await this.db
      .select()
      .from(sessionPackages)
      .where(eq(sessionPackages.slug, slug))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    // Expired rows return null — the /s/{slug} page treats this as
    // "not found" rather than serving stale content.
    if (r.expiresAt && r.expiresAt.getTime() < Date.now()) return null;
    return {
      slug: r.slug,
      sessionId: r.sessionId,
      payload: r.payload,
      classificationTitle: r.classificationTitle,
      generatedAt: r.generatedAt.toISOString(),
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    };
  }

  async readLatestSessionPackageForSession(
    sessionId: string,
  ): Promise<SessionPackageRow | null> {
    const rows = await this.db
      .select()
      .from(sessionPackages)
      .where(eq(sessionPackages.sessionId, sessionId))
      .orderBy(sql`${sessionPackages.generatedAt} DESC`)
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
      slug: r.slug,
      sessionId: r.sessionId,
      payload: r.payload,
      classificationTitle: r.classificationTitle,
      generatedAt: r.generatedAt.toISOString(),
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    };
  }

  // ─── Ch1 — law firms, listings, subscriptions (Step 19) ──────────────────

  async writeLawFirm(row: LawFirmRow): Promise<void> {
    await this.db
      .insert(lawFirmsTable)
      .values({
        id: row.id,
        orgId: row.orgId,
        name: row.name,
        primaryContact: row.primaryContact,
        email: row.email,
        phone: row.phone,
        stripeCustomerId: row.stripeCustomerId,
        status: row.status,
        isPilot: row.isPilot,
      })
      .onConflictDoUpdate({
        target: lawFirmsTable.id,
        set: {
          name: row.name,
          primaryContact: row.primaryContact,
          email: row.email,
          phone: row.phone,
          stripeCustomerId: row.stripeCustomerId,
          status: row.status,
          isPilot: row.isPilot,
          updatedAt: new Date(),
        },
      });
  }

  async readLawFirmById(id: string): Promise<LawFirmRow | null> {
    const rows = await this.db
      .select()
      .from(lawFirmsTable)
      .where(eq(lawFirmsTable.id, id))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return toLawFirmRow(r);
  }

  async listFirmsForAdmin(
    opts: AdminFirmListOptions,
  ): Promise<AdminFirmListResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 50;
    const offset = (page - 1) * pageSize;

    const conds = [eq(lawFirmsTable.orgId, opts.orgId)];
    if (opts.status) conds.push(eq(lawFirmsTable.status, opts.status));
    if (opts.isPilot !== undefined) {
      conds.push(eq(lawFirmsTable.isPilot, opts.isPilot));
    }
    if (opts.search && opts.search.trim()) {
      const term = `%${opts.search.trim()}%`;
      conds.push(
        or(
          ilike(lawFirmsTable.name, term),
          ilike(lawFirmsTable.primaryContact, term),
        )!,
      );
    }
    const whereClause = and(...conds);

    const countRows = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(lawFirmsTable)
      .where(whereClause);
    const totalCount = countRows[0]?.n ?? 0;

    const rows = await this.db
      .select()
      .from(lawFirmsTable)
      .where(whereClause)
      .orderBy(sql`${lawFirmsTable.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    return {
      firms: rows.map(toLawFirmRow),
      totalCount,
      page,
      pageSize,
    };
  }

  async writeListing(row: ListingRow): Promise<void> {
    await this.db
      .insert(listingsTable)
      .values({
        id: row.id,
        lawFirmId: row.lawFirmId,
        title: row.title,
        slug: row.slug,
        category: row.category,
        shortDescription: row.shortDescription,
        fullDescription: row.fullDescription,
        eligibilitySummary: row.eligibilitySummary,
        status: row.status,
        tier: row.tier,
      })
      .onConflictDoUpdate({
        target: listingsTable.id,
        set: {
          lawFirmId: row.lawFirmId,
          title: row.title,
          slug: row.slug,
          category: row.category,
          shortDescription: row.shortDescription,
          fullDescription: row.fullDescription,
          eligibilitySummary: row.eligibilitySummary,
          status: row.status,
          tier: row.tier,
          updatedAt: new Date(),
        },
      });
  }

  async readListingBySlug(slug: string): Promise<ListingRow | null> {
    const rows = await this.db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.slug, slug))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return toListingRow(r);
  }

  async readListingById(id: string): Promise<ListingRow | null> {
    const rows = await this.db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, id))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return toListingRow(r);
  }

  async listListingsForFirm(lawFirmId: string): Promise<ListingRow[]> {
    const rows = await this.db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.lawFirmId, lawFirmId))
      .orderBy(sql`${listingsTable.createdAt} DESC`);
    return rows.map(toListingRow);
  }

  async listListingsForAdmin(
    opts: AdminListingListOptions,
  ): Promise<AdminListingListResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 50;
    const offset = (page - 1) * pageSize;

    // Org scoping is enforced via an INNER JOIN on law_firms. Listings
    // don't carry org_id directly; the firm they belong to does.
    const conds = [eq(lawFirmsTable.orgId, opts.orgId)];
    if (opts.lawFirmId) conds.push(eq(listingsTable.lawFirmId, opts.lawFirmId));
    if (opts.status) conds.push(eq(listingsTable.status, opts.status));
    if (opts.category) conds.push(eq(listingsTable.category, opts.category));
    if (opts.search && opts.search.trim()) {
      const term = `%${opts.search.trim()}%`;
      conds.push(
        or(ilike(listingsTable.title, term), ilike(listingsTable.slug, term))!,
      );
    }
    const whereClause = and(...conds);

    const countRows = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(listingsTable)
      .innerJoin(lawFirmsTable, eq(lawFirmsTable.id, listingsTable.lawFirmId))
      .where(whereClause);
    const totalCount = countRows[0]?.n ?? 0;

    const rows = await this.db
      .select({ listing: listingsTable })
      .from(listingsTable)
      .innerJoin(lawFirmsTable, eq(lawFirmsTable.id, listingsTable.lawFirmId))
      .where(whereClause)
      .orderBy(sql`${listingsTable.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    return {
      listings: rows.map((r) => toListingRow(r.listing)),
      totalCount,
      page,
      pageSize,
    };
  }

  async writeListingConfig(row: ListingConfigRow): Promise<void> {
    // listing_configs has a UNIQUE constraint on listing_id, so we
    // upsert on that column — multiple rows per listing aren't allowed.
    await this.db
      .insert(listingConfigsTable)
      .values({
        id: row.id,
        listingId: row.listingId,
        caseDescription: row.caseDescription,
        eligibilityCriteria: row.eligibilityCriteria as never,
        requiredFields: row.requiredFields as never,
        disqualifyingConditions: row.disqualifyingConditions,
        adaPromptOverride: row.adaPromptOverride,
      })
      .onConflictDoUpdate({
        target: listingConfigsTable.listingId,
        set: {
          caseDescription: row.caseDescription,
          eligibilityCriteria: row.eligibilityCriteria as never,
          requiredFields: row.requiredFields as never,
          disqualifyingConditions: row.disqualifyingConditions,
          adaPromptOverride: row.adaPromptOverride,
          updatedAt: new Date(),
        },
      });
  }

  async readListingConfigForListing(
    listingId: string,
  ): Promise<ListingConfigRow | null> {
    const rows = await this.db
      .select()
      .from(listingConfigsTable)
      .where(eq(listingConfigsTable.listingId, listingId))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      listingId: r.listingId,
      caseDescription: r.caseDescription,
      eligibilityCriteria: (r.eligibilityCriteria ?? []) as unknown[],
      requiredFields: (r.requiredFields ?? []) as unknown[],
      disqualifyingConditions: (r.disqualifyingConditions ?? []) as string[],
      adaPromptOverride: r.adaPromptOverride,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  async writeSubscription(row: SubscriptionRow): Promise<void> {
    await this.db
      .insert(subscriptionsTable)
      .values({
        id: row.id,
        lawFirmId: row.lawFirmId,
        listingId: row.listingId,
        stripeSubscriptionId: row.stripeSubscriptionId,
        tier: row.tier,
        status: row.status,
        currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptionsTable.id,
        set: {
          lawFirmId: row.lawFirmId,
          listingId: row.listingId,
          stripeSubscriptionId: row.stripeSubscriptionId,
          tier: row.tier,
          status: row.status,
          currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : null,
          cancelAtPeriodEnd: row.cancelAtPeriodEnd,
          updatedAt: new Date(),
        },
      });
  }

  async readSubscriptionById(id: string): Promise<SubscriptionRow | null> {
    const rows = await this.db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, id))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return toSubscriptionRow(r);
  }

  async readSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionRow | null> {
    const rows = await this.db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return toSubscriptionRow(r);
  }

  async listSubscriptionsForFirm(
    lawFirmId: string,
  ): Promise<SubscriptionRow[]> {
    const rows = await this.db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.lawFirmId, lawFirmId))
      .orderBy(sql`${subscriptionsTable.createdAt} DESC`);
    return rows.map(toSubscriptionRow);
  }

  async listAllSubscriptionsForAdmin(
    opts: AdminSubscriptionListOptions,
  ): Promise<AdminSubscriptionListResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 50;
    const offset = (page - 1) * pageSize;

    // Join through law_firms for org scoping; left join listings for title.
    const conds = [eq(lawFirmsTable.orgId, opts.orgId)];
    if (opts.lawFirmId)
      conds.push(eq(subscriptionsTable.lawFirmId, opts.lawFirmId));
    if (opts.status) conds.push(eq(subscriptionsTable.status, opts.status));
    if (opts.tier) conds.push(eq(subscriptionsTable.tier, opts.tier));
    const whereClause = and(...conds);

    const countRows = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(subscriptionsTable)
      .innerJoin(
        lawFirmsTable,
        eq(lawFirmsTable.id, subscriptionsTable.lawFirmId),
      )
      .where(whereClause);
    const totalCount = countRows[0]?.n ?? 0;

    const rows = await this.db
      .select({
        sub: subscriptionsTable,
        firmName: lawFirmsTable.name,
        listingTitle: listingsTable.title,
      })
      .from(subscriptionsTable)
      .innerJoin(
        lawFirmsTable,
        eq(lawFirmsTable.id, subscriptionsTable.lawFirmId),
      )
      .leftJoin(
        listingsTable,
        eq(listingsTable.id, subscriptionsTable.listingId),
      )
      .where(whereClause)
      .orderBy(sql`${subscriptionsTable.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    return {
      subscriptions: rows.map((r) => ({
        subscription: toSubscriptionRow(r.sub),
        lawFirmName: r.firmName,
        listingTitle: r.listingTitle,
      })),
      totalCount,
      page,
      pageSize,
    };
  }

  async listIntakesForAdmin(
    opts: AdminIntakeListOptions,
  ): Promise<AdminIntakeListResult> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const pageSize =
      opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 50;
    const offset = (page - 1) * pageSize;

    // Filter to class_action_intake + scope via listing->firm->org.
    // listingId is non-null for class_action_intake so the INNER JOIN
    // to listings is safe.
    const conds = [
      eq(adaSessions.sessionType, 'class_action_intake'),
      eq(adaSessions.orgId, opts.orgId),
    ];
    if (!opts.includeTest) conds.push(eq(adaSessions.isTest, false));
    if (opts.listingId) conds.push(eq(adaSessions.listingId, opts.listingId));
    if (opts.lawFirmId) conds.push(eq(listingsTable.lawFirmId, opts.lawFirmId));
    if (opts.status) conds.push(eq(adaSessions.status, opts.status));
    if (opts.outcome) {
      conds.push(sql`${adaSessions.metadata}->>'outcome' = ${opts.outcome}`);
    }
    const whereClause = and(...conds);

    const countRows = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(adaSessions)
      .innerJoin(listingsTable, eq(listingsTable.id, adaSessions.listingId))
      .innerJoin(lawFirmsTable, eq(lawFirmsTable.id, listingsTable.lawFirmId))
      .where(whereClause);
    const totalCount = countRows[0]?.n ?? 0;

    const rows = await this.db
      .select({
        sessionId: adaSessions.id,
        status: adaSessions.status,
        isTest: adaSessions.isTest,
        listingId: adaSessions.listingId,
        metadata: adaSessions.metadata,
        createdAt: adaSessions.createdAt,
        updatedAt: adaSessions.updatedAt,
        lawFirmId: lawFirmsTable.id,
        lawFirmName: lawFirmsTable.name,
        listingTitle: listingsTable.title,
      })
      .from(adaSessions)
      .innerJoin(listingsTable, eq(listingsTable.id, adaSessions.listingId))
      .innerJoin(lawFirmsTable, eq(lawFirmsTable.id, listingsTable.lawFirmId))
      .where(whereClause)
      .orderBy(sql`${adaSessions.updatedAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    const intakes: AdminIntakeListRow[] = rows.map((r) => {
      const metaOutcome = (r.metadata as Record<string, unknown> | null)
        ?.outcome;
      const outcome =
        metaOutcome === 'qualified' || metaOutcome === 'disqualified'
          ? metaOutcome
          : null;
      return {
        sessionId: r.sessionId,
        status: r.status as 'active' | 'completed' | 'abandoned',
        lawFirmId: r.lawFirmId,
        lawFirmName: r.lawFirmName,
        listingId: r.listingId!,
        listingTitle: r.listingTitle,
        outcome,
        isTest: r.isTest,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt ?? ''),
        updatedAt:
          r.updatedAt instanceof Date
            ? r.updatedAt.toISOString()
            : String(r.updatedAt ?? ''),
      };
    });

    return { intakes, totalCount, page, pageSize };
  }

  // ─── stripe_webhook_events (Step 23) ─────────────────────────────────────

  async recordWebhookEvent(
    row: StripeWebhookEventRow,
  ): Promise<{ inserted: boolean }> {
    // INSERT with onConflictDoNothing on the unique stripe_event_id.
    // If the row already exists (replay), rowCount will be 0; we
    // surface that as inserted=false so the handler can skip
    // processing.
    const result = await this.db
      .insert(stripeWebhookEventsTable)
      .values({
        stripeEventId: row.stripeEventId,
        type: row.type,
        payload: row.payload as Record<string, unknown>,
      })
      .onConflictDoNothing({ target: stripeWebhookEventsTable.stripeEventId })
      .returning({ id: stripeWebhookEventsTable.id });
    return { inserted: result.length > 0 };
  }

  async markWebhookEventProcessed(
    stripeEventId: string,
    error: string | null,
  ): Promise<void> {
    await this.db
      .update(stripeWebhookEventsTable)
      .set({
        processedAt: new Date(),
        error,
      })
      .where(eq(stripeWebhookEventsTable.stripeEventId, stripeEventId));
  }

  async listActiveListings(
    opts: ListActiveListingsOptions = {},
  ): Promise<ActiveListingRow[]> {
    // Query v_active_listings directly with raw SQL — the view
    // definition lives in migration 0005 (updated from 0004 for pilot
    // mode) and is the authoritative answer to "which listings are
    // live right now".
    const result = await this.db.execute<{
      listing_id: string;
      slug: string;
      title: string;
      category: string;
      tier: string;
      short_description: string | null;
      full_description: string | null;
      eligibility_summary: string | null;
      law_firm_id: string;
      law_firm_name: string;
      subscription_id: string | null;
      subscription_tier: string;
      current_period_end: Date | null;
      is_pilot: boolean;
    }>(sql`
      SELECT *
      FROM v_active_listings
      WHERE 1=1
        ${opts.category ? sql`AND category = ${opts.category}` : sql``}
        ${opts.lawFirmId ? sql`AND law_firm_id = ${opts.lawFirmId}` : sql``}
    `);

    // Drizzle's execute returns a driver-shaped result; normalize to
    // the common array form.
    const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? [];
    return (rows as Array<Record<string, unknown>>).map((r) => ({
      listingId: r.listing_id as string,
      slug: r.slug as string,
      title: r.title as string,
      category: r.category as string,
      tier: r.tier as string,
      shortDescription: (r.short_description ?? null) as string | null,
      fullDescription: (r.full_description ?? null) as string | null,
      eligibilitySummary: (r.eligibility_summary ?? null) as string | null,
      lawFirmId: r.law_firm_id as string,
      lawFirmName: r.law_firm_name as string,
      subscriptionId: (r.subscription_id ?? null) as string | null,
      subscriptionTier: r.subscription_tier as string,
      currentPeriodEnd:
        r.current_period_end instanceof Date
          ? r.current_period_end.toISOString()
          : (r.current_period_end as string | null),
      isPilot: Boolean(r.is_pilot),
    }));
  }

  // ─── routing_rules (Step 22) ─────────────────────────────────────────────

  async writeRoutingRule(row: RoutingRuleRow): Promise<void> {
    await this.db
      .insert(routingRulesTable)
      .values({
        id: row.id,
        targetOrgId: row.targetOrgId,
        complaintTypes: row.complaintTypes,
        jurisdictions: row.jurisdictions,
        active: row.active,
        priority: row.priority,
      })
      .onConflictDoUpdate({
        target: routingRulesTable.id,
        set: {
          targetOrgId: row.targetOrgId,
          complaintTypes: row.complaintTypes,
          jurisdictions: row.jurisdictions,
          active: row.active,
          priority: row.priority,
          updatedAt: new Date(),
        },
      });
  }

  async listActiveRoutingRules(): Promise<RoutingRuleWithTarget[]> {
    // Single JOIN query — one row per active rule with the target org's
    // code + display_name inlined. Ordering matches the in-memory impl
    // (priority ASC, then rule id) so tests and prod behave the same.
    const rows = await this.db
      .select({
        ruleId: routingRulesTable.id,
        targetOrgId: routingRulesTable.targetOrgId,
        complaintTypes: routingRulesTable.complaintTypes,
        jurisdictions: routingRulesTable.jurisdictions,
        priority: routingRulesTable.priority,
        targetOrgCode: organizations.orgCode,
        targetOrgDisplayName: organizations.displayName,
      })
      .from(routingRulesTable)
      .innerJoin(
        organizations,
        eq(routingRulesTable.targetOrgId, organizations.id),
      )
      .where(eq(routingRulesTable.active, true))
      .orderBy(sql`${routingRulesTable.priority} ASC, ${routingRulesTable.id} ASC`);

    return rows.map((r) => ({
      ruleId: r.ruleId,
      targetOrgId: r.targetOrgId,
      targetOrgCode: r.targetOrgCode,
      targetOrgDisplayName: r.targetOrgDisplayName,
      complaintTypes: (r.complaintTypes ?? []) as string[],
      jurisdictions: (r.jurisdictions ?? []) as RoutingRuleWithTarget['jurisdictions'],
      priority: r.priority,
    }));
  }
}

// ─── Ch1 row mappers ──────────────────────────────────────────────────────────

function toLawFirmRow(r: {
  id: string;
  orgId: string;
  name: string;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  status: string;
  isPilot: boolean;
  createdAt: Date;
  updatedAt: Date;
}): LawFirmRow {
  return {
    id: r.id,
    orgId: r.orgId,
    name: r.name,
    primaryContact: r.primaryContact,
    email: r.email,
    phone: r.phone,
    stripeCustomerId: r.stripeCustomerId,
    status: r.status as LawFirmRow['status'],
    isPilot: r.isPilot,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toListingRow(r: {
  id: string;
  lawFirmId: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string | null;
  fullDescription: string | null;
  eligibilitySummary: string | null;
  status: string;
  tier: string;
  createdAt: Date;
  updatedAt: Date;
}): ListingRow {
  return {
    id: r.id,
    lawFirmId: r.lawFirmId,
    title: r.title,
    slug: r.slug,
    category: r.category,
    shortDescription: r.shortDescription,
    fullDescription: r.fullDescription,
    eligibilitySummary: r.eligibilitySummary,
    status: r.status as ListingRow['status'],
    tier: r.tier as ListingRow['tier'],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toSubscriptionRow(r: {
  id: string;
  lawFirmId: string;
  listingId: string | null;
  stripeSubscriptionId: string | null;
  tier: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}): SubscriptionRow {
  return {
    id: r.id,
    lawFirmId: r.lawFirmId,
    listingId: r.listingId,
    stripeSubscriptionId: r.stripeSubscriptionId,
    tier: r.tier as SubscriptionRow['tier'],
    status: r.status as SubscriptionRow['status'],
    currentPeriodEnd: r.currentPeriodEnd ? r.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: !!r.cancelAtPeriodEnd,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ─── KB helpers ──────────────────────────────────────────────────────────────

/**
 * Extract ADA citations from free text. Matches two formats:
 *
 *   Part 36 / Part 35 style (CFR regulations):
 *     36.302, 36.302(c), 36.302(c)(1)
 *     leading "§" or "section" optional
 *
 *   2010 Standards style (dotted decimal):
 *     404.2.3, 206.2.1
 *     leading "§" or "section" optional
 *
 * Returns unique citations in the order they appear. Used for the
 * citation-exact-match path in searchKnowledgeBase, layered on top
 * of vector similarity as a deterministic fallback.
 */
function extractCitations(text: string): string[] {
  // Two alternatives:
  //   Alt 1: \d{2,3}\.\d{1,4}\.\d{1,3}  → 2010 Standards 3-part  (404.2.3)
  //   Alt 2: \d{2,3}\.\d{1,4}(?:\([a-z0-9]+\))+  → CFR with parens (36.302(c))
  //   Alt 3: \d{2,3}\.\d{1,4}(?!\.\d|\([a-z0-9])  → bare 2-part   (36.302)
  // We try them in that order and take the longest match for any
  // given position.
  const patterns = [
    /(?:§|section\s+)?(\d{2,3}\.\d{1,4}\.\d{1,3})/gi,
    /(?:§|section\s+)?(\d{2,3}\.\d{1,4}(?:\([a-z0-9]+\))+)/gi,
    /(?:§|section\s+)?(\d{2,3}\.\d{1,4})(?!\.\d|\([a-z0-9])/gi,
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      const c = m[1];
      if (!seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
  }
  return out;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAttorneyAdminRow(r: typeof attorneysTable.$inferSelect): AttorneyAdminRow {
  return {
    id: r.id,
    name: r.name,
    firmName: r.firmName,
    locationCity: r.locationCity,
    locationState: r.locationState,
    practiceAreas: (r.practiceAreas ?? []) as string[],
    email: r.email,
    phone: r.phone,
    websiteUrl: r.websiteUrl,
    bio: r.bio,
    photoUrl: r.photoUrl,
    status: r.status as AttorneyStatus,
    createdAt: (r.createdAt as Date).toISOString(),
    updatedAt: (r.updatedAt as Date).toISOString(),
  };
}
