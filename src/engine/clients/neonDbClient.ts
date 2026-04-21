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

import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '@/db/client';
import {
  adaSessions,
  anonSessions,
  attorneys as attorneysTable,
  organizations,
} from '@/db/schema-core';
import type {
  AnonSessionUpsertOptions,
  AttorneyRow,
  AttorneySearchOptions,
  DbClient,
  OrganizationRow,
  SessionReadOptions,
  SessionWriteOptions,
} from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';
import type {
  AccessibilitySnapshot,
  Classification,
  ExtractedFields,
  Message,
  ReadingLevel,
  SessionMetadata,
} from '@/types/db';

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
}
