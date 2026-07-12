/**
 * Integration test — Ada Spot report store methods against the live DB.
 *
 * uploaded session → insertReport → getReportBySession → markInReview
 * (idempotent), verifying the pickup + persistence + status flip. Self-cleaning.
 * Skips without DATABASE_URL. Ref: /plan Phase 3a.
 */

import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { makeDb } from '@/db/client';
import { spotSessions, spotPhotos, spotReports } from '@/db/schema-spot';
import { makeSpotStore } from '@/lib/spot/spotStore';
import { generatePackageSlug } from '@/engine/package/slug';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('spotStore report methods — live DB', () => {
  it('uploaded → insertReport → getReportBySession → markInReview', async () => {
    const db = makeDb(DATABASE_URL!);
    const store = makeSpotStore(db);
    const id = await store.createSession({ amountCents: 7900 });
    try {
      await store.markPaid({ spotSessionId: id, amountCents: 7900 });
      await store.insertPhoto({ sessionId: id, blobKey: 'k', blobUrl: 'https://blob/x.jpg' });
      await store.markUploaded({ spotSessionId: id, photoCount: 1 });

      const photos = await store.listSessionPhotos(id);
      expect(photos.map((p) => p.blobUrl)).toContain('https://blob/x.jpg');

      expect(await store.getReportBySession(id)).toBeNull();
      const slug = generatePackageSlug();
      await store.insertReport({ sessionId: id, slug, content: { kind: 'clear' }, modelVersion: 'opus-test' });
      expect((await store.getReportBySession(id))?.slug).toBe(slug);

      // admin read methods (Phase 3b)
      const bySlug = await store.getReportBySlug(slug);
      expect(bySlug?.sessionId).toBe(id);
      expect((bySlug?.content as { kind?: string })?.kind).toBe('clear');
      expect((await store.listReports(100)).some((r) => r.slug === slug)).toBe(true);

      expect(await store.markInReview(id)).toBe(true);
      expect(await store.markInReview(id)).toBe(false); // idempotent
      expect((await store.getSession(id))?.status).toBe('in_review');

      // 4a: delivery + HITL
      expect(await store.getReleasedReportBySlug(slug)).toBeNull(); // not released yet
      const rel = await store.releaseReport({ slug, reviewedBy: 'Ryan' });
      expect(rel?.sessionId).toBe(id);
      expect(await store.getReleasedReportBySlug(slug)).not.toBeNull(); // now visible
      expect(await store.releaseReport({ slug, reviewedBy: 'Ryan' })).toBeNull(); // idempotent
      expect(await store.rejectReport({ slug, reviewedBy: 'Ryan' })).toBe(false); // already released

      expect(await store.markDelivered(id)).toBe(true);
      expect((await store.getSession(id))?.status).toBe('delivered');

      await store.markReportSent(slug);
      expect((await store.listReports(100)).find((r) => r.slug === slug)?.sentAt).not.toBeNull();
    } finally {
      await db.delete(spotReports).where(eq(spotReports.sessionId, id));
      await db.delete(spotPhotos).where(eq(spotPhotos.sessionId, id));
      await db.delete(spotSessions).where(eq(spotSessions.id, id));
    }
  });

  it('photosToSweep finds past-retention photos; markPhotoDeleted removes them from the sweep', async () => {
    const db = makeDb(DATABASE_URL!);
    const store = makeSpotStore(db);
    const id = await store.createSession({ amountCents: 7900 });
    try {
      await store.insertPhoto({ sessionId: id, blobKey: 'k', blobUrl: 'https://blob/sweep.jpg' });
      // Force this photo past its retention window.
      await db
        .update(spotPhotos)
        .set({ deleteAfter: new Date('2000-01-01T00:00:00Z') })
        .where(eq(spotPhotos.sessionId, id));

      const due = await store.photosToSweep(new Date(), 100);
      const mine = due.find((p) => p.blobUrl === 'https://blob/sweep.jpg');
      expect(mine).toBeTruthy();

      await store.markPhotoDeleted(mine!.id);
      const after = await store.photosToSweep(new Date(), 100);
      expect(after.some((p) => p.id === mine!.id)).toBe(false); // no longer swept
    } finally {
      await db.delete(spotPhotos).where(eq(spotPhotos.sessionId, id));
      await db.delete(spotSessions).where(eq(spotSessions.id, id));
    }
  });
});
