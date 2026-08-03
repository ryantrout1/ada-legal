/**
 * POST /api/spot/admin/annotation-preview  { sessionId, model?, minConfidence? }
 *   → { annotations: PhotoAnnotation[] }
 *
 * Internal admin preview (Phase 1): re-place the findings of a session's
 * already-stored photo analyses one at a time, so Peter and Ryan can see where
 * focused placement lands vs the all-at-once boxes. requireAdmin-gated — this
 * spends on the model per finding, so it is never public. Nothing is persisted
 * and no buyer-facing surface changes. Ref: /plan Spot photo annotation Ph.1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { readJsonBody } from '../../_shared.js';
import { makeAnnotationPreviewStore } from '../../../src/lib/spot/annotationPreviewStore.js';
import { buildPhotoAnnotations } from '../../../src/lib/spot/buildPhotoAnnotations.js';
import {
  makeAnthropicPlaceFn,
  PLACEMENT_MODEL_DEFAULT,
} from '../../../src/lib/spot/placeFindingAnthropic.js';

export const config = { maxDuration: 300 };

/** Models allowed for a preview run. Kept tight — this spends. */
const ALLOWED_MODELS = new Set([PLACEMENT_MODEL_DEFAULT, 'claude-sonnet-5']);
const MIN_CONFIDENCE_DEFAULT = 0.5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readJsonBody<{ sessionId?: unknown; model?: unknown; minConfidence?: unknown }>(req);

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const model =
    typeof body.model === 'string' && ALLOWED_MODELS.has(body.model)
      ? body.model
      : PLACEMENT_MODEL_DEFAULT;

  const minConfidence =
    typeof body.minConfidence === 'number' &&
    Number.isFinite(body.minConfidence) &&
    body.minConfidence >= 0 &&
    body.minConfidence <= 1
      ? body.minConfidence
      : MIN_CONFIDENCE_DEFAULT;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });

  try {
    const store = makeAnnotationPreviewStore();
    const sources = await store.listSessionAnnotationSources(sessionId);
    if (sources.length === 0) {
      return res.status(404).json({ error: 'No stored photo analyses for this session' });
    }

    const place = makeAnthropicPlaceFn(apiKey, model);
    const annotations = await buildPhotoAnnotations(sources, place, { minConfidence });

    return res.status(200).json({ model, minConfidence, annotations });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
