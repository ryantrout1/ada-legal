/**
 * POST /api/portal/cases/[id]/photos
 *
 * Attach an attorney-supplied photo to a matter (build-list #3 Phase 2) and
 * analyze it. The browser downscales the image and sends it base64; we upload
 * it to the public photos store (the analyzer reads photos by URL), then run
 * the structured analyzer and store the result linked to the matter with
 * source 'attorney' and a null origin session.
 *
 * Works on ANY matter the firm owns, including self-originated (direct) matters
 * with no claimant session. Firm-scoped + consent-gated. 404 when the case
 * isn't this firm's.
 *
 * SCREENING, NOT CERTIFICATION — see the Evidence panel framing.
 *
 * Ref: /plan "Evidence + full photo analysis for attorneys" Phase 2.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import { analyzeAttorneyPhoto } from '../../../../src/engine/cases/caseEvidence.js';

// Upload (small base64 body) + a blocking ~10-18s vision call + a ~5-15s
// professional rewrite. 60s gives headroom (mirrors /api/ada/analyze-photo).
export const config = { maxDuration: 60 };

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Cap the base64 payload. The browser downscales first, so this is generous
// headroom, not the expected size — and stays under the Function body limit.
const MAX_BASE64_LEN = 6 * 1024 * 1024;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const raw = (req.body ?? {}) as { image_base64?: unknown; content_type?: unknown };
  const contentType = typeof raw.content_type === 'string' ? raw.content_type : '';
  if (!EXT[contentType]) {
    return res.status(400).json({ error: 'content_type must be a JPEG, PNG, WebP, or GIF image' });
  }
  if (typeof raw.image_base64 !== 'string' || raw.image_base64.length === 0) {
    return res.status(400).json({ error: 'image_base64 is required' });
  }
  if (raw.image_base64.length > MAX_BASE64_LEN) {
    return res.status(413).json({ error: 'Image is too large — try a smaller photo' });
  }

  try {
    const clients = makeClientsFromEnv();
    if (!clients.blob) {
      return res.status(503).json({ error: 'Photo storage is not configured' });
    }

    // Firm-scope + consent gate BEFORE uploading, so we never write a blob for
    // a matter this firm can't see.
    const evidence = await clients.db.getCaseEvidenceForFirm(id, auth.lawFirmId);
    if (!evidence) return res.status(404).json({ error: 'Case not found' });

    const key = `case-photos/${id}/${randomUUID()}.${EXT[contentType]}`;
    const { url } = await clients.blob.upload({
      key,
      contentType,
      body: Buffer.from(raw.image_base64, 'base64'),
    });

    const result = await analyzeAttorneyPhoto(clients, {
      caseId: id,
      lawFirmId: auth.lawFirmId,
      photoUrl: url,
    });
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    return res.status(200).json({ analysis: result.analysis, photo_url: url });
  } catch (err) {
    console.error('/api/portal/cases/[id]/photos failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
