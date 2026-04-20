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

import { eq } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { adaSessions } from '@/db/schema-core';
import type {
  DbClient,
  SessionReadOptions,
  SessionWriteOptions,
  AttorneySearchOptions,
  AttorneyRow,
} from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';
import type {
  Message,
  ExtractedFields,
  Classification,
  SessionMetadata,
  AccessibilitySnapshot,
  ReadingLevel,
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

  async searchAttorneys(_opts: AttorneySearchOptions): Promise<AttorneyRow[]> {
    // Placeholder until Phase B Step 12 loads real attorney data.
    return [];
  }
}
