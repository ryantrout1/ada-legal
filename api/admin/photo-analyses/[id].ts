/**
 * /api/admin/photo-analyses/[id]
 *
 *   GET    — full analysis (findings, scene, summary, risk, positives)
 *            plus any existing expert review, for the review detail page.
 *   DELETE — remove the analysis. The photo_reviews row cascades via the
 *            ON DELETE CASCADE FK, so no separate delete is needed.
 *
 * The analyzer captures the standard reading level only (the latency
 * fix). The admin review surface wants the professional variant, so the
 * first time an analysis is opened we generate professional on demand
 * from the standard text and cache it back onto the row — subsequent
 * loads are a plain read. The rewrite is best-effort: if it fails, the
 * standard text is returned and the page falls back to it.
 *
 * Admin-only.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { PhotoAnalysisOutput, PhotoFinding } from '../../../src/types/db.js';
import type { PhotoReviewDetail } from '../../../src/engine/clients/types.js';

// The on-demand professional rewrite is a blocking model call (~5–15s).
// Give it the same headroom as the capture path so a cold first-open
// doesn't get killed mid-rewrite. Cached loads return immediately.
export const config = { maxDuration: 60 };

const FILL_LEVEL = 'professional' as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'Missing analysis id' });

  if (req.method === 'DELETE') {
    try {
      const clients = makeClientsFromEnv();
      const deleted = await clients.db.deletePhotoAnalysis(id);
      if (!deleted) return res.status(404).json({ error: 'Analysis not found' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('DELETE /api/admin/photo-analyses/[id] failed', err);
      return res.status(500).json({ error: 'Failed to delete analysis' });
    }
  }

  try {
    const clients = makeClientsFromEnv();
    const detail = await clients.db.getPhotoAnalysisForReview(id);
    if (!detail) return res.status(404).json({ error: 'Analysis not found' });

    if (needsLevel(detail, FILL_LEVEL)) {
      try {
        const filled = await clients.photo.rewriteToLevel(
          detailToOutput(detail),
          FILL_LEVEL,
        );
        await clients.db.updatePhotoAnalysisReadingLevels({
          photoAnalysisId: id,
          scene: filled.scene,
          summary: filled.summary,
          positiveFindings: filled.positive_findings,
          findings: filled.findings,
        });
        detail.scene = filled.scene;
        detail.summary = filled.summary;
        detail.positiveFindings = filled.positive_findings;
        detail.findings = filled.findings;
      } catch (err) {
        // Non-fatal: return the standard text, the page falls back to it.
        console.error(
          `photo-analyses/${id}: ${FILL_LEVEL} rewrite failed (returning standard)`,
          err,
        );
      }
    }

    return res.status(200).json(detail);
  } catch (err) {
    console.error('GET /api/admin/photo-analyses/[id] failed', err);
    return res.status(500).json({ error: 'Failed to load analysis' });
  }
}

/**
 * True when the analysis has standard content but the requested level
 * hasn't been generated/cached yet — i.e. there's something to rewrite
 * and at least one field is still missing the level.
 */
function needsLevel(
  detail: PhotoReviewDetail,
  level: 'simple' | 'professional',
): boolean {
  const titleKey = `title_${level}` as 'title_simple' | 'title_professional';
  const findingKey = `finding_${level}` as
    | 'finding_simple'
    | 'finding_professional';

  const sceneMissing = !!detail.scene?.standard && !detail.scene[level];
  const summaryMissing = !!detail.summary?.standard && !detail.summary[level];
  const findingsMissing = detail.findings.some(
    (f: PhotoFinding) =>
      (!!f.title_standard && !f[titleKey]) ||
      (!!f.finding_standard && !f[findingKey]),
  );
  return sceneMissing || summaryMissing || findingsMissing;
}

/** Reassemble a PhotoAnalysisOutput from the review-detail projection. */
function detailToOutput(detail: PhotoReviewDetail): PhotoAnalysisOutput {
  return {
    scene: detail.scene ?? { standard: '' },
    summary: detail.summary ?? { standard: '' },
    overall_risk: detail.overallRisk ?? 'none',
    positive_findings: detail.positiveFindings ?? { standard: [] },
    findings: detail.findings,
  };
}
