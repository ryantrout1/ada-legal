/**
 * Neon store for civil rights submissions.
 *
 * One batch (one transaction over HTTP): the submission row and its consent
 * rows land together or not at all. Both inserts skip on conflict, so the
 * same browser-made id sent twice is one submission with one set of consents.
 */

import { desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { makeDb, type Database } from '../../db/client.js';
import { civilRightsConsents, civilRightsSubmissions } from '../../db/schema-core.js';
import type { CivilRightsStore } from './submitCore.js';
import { RETENTION_MONTHS, type AdminSubmission } from './adminCore.js';
import type { ConsentKind } from './copy.js';

function requireDatabaseUrlOrThrow(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

export function makeCivilRightsStore(
  db: Database = makeDb(requireDatabaseUrlOrThrow()),
): CivilRightsStore {
  return {
    async saveSubmission(row, consents) {
      const [inserted] = await db.batch([
        db
          .insert(civilRightsSubmissions)
          .values(row)
          .onConflictDoNothing({ target: civilRightsSubmissions.id })
          .returning({ id: civilRightsSubmissions.id }),
        db
          .insert(civilRightsConsents)
          .values(consents)
          .onConflictDoNothing({
            target: [civilRightsConsents.submissionId, civilRightsConsents.kind],
          }),
      ]);
      return inserted.length > 0 ? 'created' : 'duplicate';
    },
  };
}

// ─── Admin reads, deletes and retention ───────────────────────────────────

export interface CivilRightsAdminStore {
  list(limit: number): Promise<AdminSubmission[]>;
  get(id: string): Promise<AdminSubmission | null>;
  /** Permanently deletes one submission and its consents. */
  remove(id: string): Promise<boolean>;
  /** Deletes everything older than the retention period. Returns the count. */
  pruneExpired(): Promise<number>;
}

type SubmissionRow = typeof civilRightsSubmissions.$inferSelect;
type ConsentRow = typeof civilRightsConsents.$inferSelect;

function toAdmin(row: SubmissionRow, consents: ConsentRow[]): AdminSubmission {
  // `answers` stays out: every answer is already a column.
  const { answers: _answers, createdAt, ...rest } = row;
  return {
    ...rest,
    createdAt: createdAt.toISOString(),
    consents: consents
      .filter((c) => c.submissionId === row.id)
      .map((c) => ({
        kind: c.kind as ConsentKind,
        granted: c.granted,
        wording: c.wording,
        wordingVersion: c.wordingVersion,
        recordedAt: c.recordedAt.toISOString(),
      })),
  };
}

export function makeCivilRightsAdminStore(
  db: Database = makeDb(requireDatabaseUrlOrThrow()),
): CivilRightsAdminStore {
  return {
    async list(limit) {
      const rows = await db
        .select()
        .from(civilRightsSubmissions)
        .orderBy(desc(civilRightsSubmissions.createdAt))
        .limit(limit);
      if (!rows.length) return [];
      const consents = await db
        .select()
        .from(civilRightsConsents)
        .where(inArray(civilRightsConsents.submissionId, rows.map((r) => r.id)));
      return rows.map((r) => toAdmin(r, consents));
    },

    async get(id) {
      const [row] = await db.select().from(civilRightsSubmissions).where(eq(civilRightsSubmissions.id, id));
      if (!row) return null;
      const consents = await db
        .select()
        .from(civilRightsConsents)
        .where(eq(civilRightsConsents.submissionId, id));
      return toAdmin(row, consents);
    },

    async remove(id) {
      const deleted = await db
        .delete(civilRightsSubmissions)
        .where(eq(civilRightsSubmissions.id, id))
        .returning({ id: civilRightsSubmissions.id });
      return deleted.length > 0;
    },

    async pruneExpired() {
      // The cutoff is computed by Postgres, so no app clock is involved.
      const deleted = await db
        .delete(civilRightsSubmissions)
        .where(lt(civilRightsSubmissions.createdAt, sql`now() - make_interval(months => ${RETENTION_MONTHS})`))
        .returning({ id: civilRightsSubmissions.id });
      return deleted.length;
    },
  };
}
