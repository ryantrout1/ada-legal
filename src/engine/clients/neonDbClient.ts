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
  systemSettings,
} from '../../db/schema-core.js';
import type {
  AdminAnalyticsOptions,
  AdminAnalyticsResult,
  AdminAttorneyListOptions,
  AdminAttorneyListResult,
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
  OrganizationRow,
  SessionReadOptions,
  SessionWriteOptions,
  UpdateAttorneyInput,
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
