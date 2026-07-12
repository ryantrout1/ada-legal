/**
 * GET/POST /api/cron/sweep-spot-photos
 *
 * Deletes Ada Spot uploaded photos past their retention window (delete_after,
 * default 90 days) from Blob storage, then soft-deletes the row (deleted_at) so
 * only image-free metadata remains. The generated report is text and is never
 * touched — it stays available after the photos are gone.
 *
 * Per-photo: attempt del(blobUrl); mark deleted only on success, so a transient
 * failure retries on the next daily run rather than leaking a "deleted" flag.
 * (Vercel del is idempotent for already-gone blobs.) Batch-limited; runs daily.
 *
 * Auth: fails closed on CRON_SECRET. Firewall: uses @vercel/blob directly (no
 * shared-client change); writes only spot_photo rows.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del } from '@vercel/blob';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';

export const config = { maxDuration: 60 };

const SWEEP_BATCH = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const store = makeSpotStore();
    const due = await store.photosToSweep(new Date(), SWEEP_BATCH);

    let deleted = 0;
    let failed = 0;
    for (const photo of due) {
      try {
        await del(photo.blobUrl);
        await store.markPhotoDeleted(photo.id);
        deleted++;
      } catch (err) {
        // Leave deleted_at null so the next run retries this one.
        console.error('sweep-spot-photos: del failed for', photo.id, err);
        failed++;
      }
    }

    return res.status(200).json({ scanned: due.length, deleted, failed });
  } catch (err) {
    console.error('GET /api/cron/sweep-spot-photos failed', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
