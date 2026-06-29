/**
 * /api/portal/cases/[id]/evidence
 *
 *   GET  — the matter's photos + their structured analyses (professional level,
 *          filled on analyze). Firm-scoped + consent-gated.
 *   POST { photo_url } — run the structured accessibility analyzer on one of the
 *          matter's photos, store it linked to the matter, return the full
 *          analysis. A blocking vision call (~10-18s) + a professional rewrite.
 *
 * Build-list #3 Phase 1: claimant photos only. 404 when the case isn't this
 * firm's (or isn't consented) or the photo isn't on the matter.
 *
 * SCREENING, NOT CERTIFICATION — the analysis surfaces possible barriers for an
 * attorney to verify on site; it never certifies a location as compliant.
 *
 * Ref: /plan "Evidence + full photo analysis for attorneys" Phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import { analyzeCaseEvidencePhoto } from '../../../../src/engine/cases/caseEvidence.js';

// The analyzer makes a blocking ~10-18s vision call, then a ~5-15s professional
// rewrite. 60s gives both headroom (mirrors /api/ada/analyze-photo).
export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const clients = makeClientsFromEnv();

    if (req.method === 'GET') {
      const evidence = await clients.db.getCaseEvidenceForFirm(id, auth.lawFirmId);
      if (!evidence) return res.status(404).json({ error: 'Case not found' });
      return res.status(200).json({
        photos: evidence.photos.map((p) => ({
          url: p.url,
          uploaded_at: p.uploadedAt,
          analyzed_at: p.analyzedAt,
          analysis: p.analysis,
        })),
      });
    }

    if (req.method === 'POST') {
      const raw = (req.body ?? {}) as { photo_url?: unknown };
      if (typeof raw.photo_url !== 'string' || raw.photo_url.length === 0) {
        return res.status(400).json({ error: 'photo_url is required' });
      }
      const result = await analyzeCaseEvidencePhoto(clients, {
        caseId: id,
        lawFirmId: auth.lawFirmId,
        photoUrl: raw.photo_url,
      });
      if (!result.ok) return res.status(result.status).json({ error: result.error });
      return res.status(200).json({ analysis: result.analysis });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('/api/portal/cases/[id]/evidence failed', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
