/**
 * /api/admin/spot/reads
 *
 *   GET    → free reads, newest first.
 *   DELETE → remove one (?id=…), with its photos and their blobs.
 *
 * WHY FREE READS GET THEIR OWN ENDPOINT. A free read is not a cheaper paid
 * session — it is a different record. No buyer, no payment, no report, and no
 * stored photo, because the free path is transient by design. What it keeps is
 * the analysis itself, which is the interesting part: it is what Spot actually
 * told someone who never paid, and it is the only evidence of how the free tier
 * performs. Forcing both into one list would mean a table of mostly-empty
 * columns.
 *
 * DELETE IS A HARD DELETE. The current data is all test traffic and the point
 * is to clear it. Blobs go before rows — the FK cascade drops spot_photo rows
 * but Blob storage knows nothing about Postgres, and the retention sweep only
 * walks rows, so a row deleted without its blob leaves a file nothing will ever
 * collect.
 *
 * Ref: /plan Spot admin, Phase 4.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeSpotStore } from '../../../src/lib/spot/spotStore.js';

const MAX_ROWS = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const store = makeSpotStore();

  try {
    if (req.method === 'GET') {
      const reads = await store.listFreeReads(MAX_ROWS);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ reads });
    }

    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : '';
      if (!id) return res.status(400).json({ error: 'id is required' });

      const ok = await store.deleteFreeRead(id);
      if (!ok) {
        // Either it was already gone, or a blob refused to delete and the row
        // was deliberately left behind so a retry can finish.
        return res.status(409).json({ error: 'Could not delete — try again.' });
      }
      return res.status(200).json({ deleted: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('/api/admin/spot/reads failed', err);
    return res.status(500).json({ error: 'Could not load or delete free reads.' });
  }
}
