/**
 * POST /api/public/civil-rights/submit
 *
 * Saves one finished state civil rights wizard (answers + consent proof).
 * Anonymous, no AI, no email sent. The person's PDF is built in their
 * browser and does not depend on this call succeeding.
 *
 * All the rules live in src/lib/civilRights/submitCore.ts (tested without
 * a database); this file only adapts Vercel and wires the real stores.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../_cors.js';
import { handleSubmit } from '../../../src/lib/civilRights/submitCore.js';
import { makeCivilRightsStore } from '../../../src/lib/civilRights/store.js';
import { makeApiRateLimitStore } from '../../../src/lib/rateLimit/apiRateLimitStore.js';
import { clientIp } from '../../../src/lib/rateLimit/clientIp.js';
import { deriveRateLimitKey } from '../../../src/lib/spot/spotRateLimitKey.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let result;
  try {
    result = await handleSubmit(req.body, {
      store: makeCivilRightsStore(),
      rateLimitStore: makeApiRateLimitStore(),
      rateKey: deriveRateLimitKey(clientIp(req), (req.headers['user-agent'] as string) ?? ''),
    });
  } catch (err) {
    console.error('[civil-rights/submit] unexpected failure:', err);
    return res.status(500).json({ error: 'We could not save your answers. You can still download your form.' });
  }

  if (result.retryAfterSeconds) res.setHeader('Retry-After', String(result.retryAfterSeconds));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.status).json(result.body);
}
