/**
 * Neon store for civil rights submissions.
 *
 * One batch (one transaction over HTTP): the submission row and its consent
 * rows land together or not at all. Both inserts skip on conflict, so the
 * same browser-made id sent twice is one submission with one set of consents.
 */

import { makeDb, type Database } from '../../db/client.js';
import { civilRightsConsents, civilRightsSubmissions } from '../../db/schema-core.js';
import type { CivilRightsStore } from './submitCore.js';

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
