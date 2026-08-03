/**
 * Ada Spot — annotation preview data access (internal, Phase 1).
 *
 * Reads the already-stored per-photo analyses for a session so the internal
 * preview can re-place their findings without re-running the analyzer. Its own
 * thin store rather than a method on spotStore, which deliberately never
 * touches photo_analyses. Read-only. Ref: /plan Spot photo annotation Ph.1.
 */

import { asc, eq } from 'drizzle-orm';
import { makeDb, type Database } from '../../db/client.js';
import { photoAnalyses } from '../../db/schema-core.js';
import type { AnnotationSource } from './buildPhotoAnnotations.js';

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

export interface AnnotationPreviewStore {
  /** Photo URL + findings for every stored analysis of a session, oldest first. */
  listSessionAnnotationSources(sessionId: string): Promise<AnnotationSource[]>;
}

export function makeAnnotationPreviewStore(
  db: Database = makeDb(requireDatabaseUrl()),
): AnnotationPreviewStore {
  return {
    async listSessionAnnotationSources(sessionId) {
      const rows = await db
        .select({ photoUrl: photoAnalyses.photoUrl, findings: photoAnalyses.findings })
        .from(photoAnalyses)
        .where(eq(photoAnalyses.sessionId, sessionId))
        .orderBy(asc(photoAnalyses.analyzedAt));
      return rows.map((r) => ({ photoUrl: r.photoUrl, findings: r.findings ?? [] }));
    },
  };
}
