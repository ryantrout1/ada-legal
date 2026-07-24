/**
 * GET /api/admin/me — "am I an admin?"
 *
 * Exists so the client-side gate can ask the server the same question
 * the API asks, instead of duplicating the allowlist in the bundle.
 * Shipping ADMIN_EMAILS to the browser as a VITE_ var would publish the
 * list and, worse, create a second copy that can drift from the real one.
 *
 * Returns 200 with the caller's identity when allowlisted; requireAdmin
 * has already written 401/403 otherwise. New endpoint, so no additive
 * constraint applies.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { applyCors } from '../_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return; // 401/403 already sent

  // Never cached: an allowlist change must take effect immediately.
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ admin: true, email: auth.email, via: auth.via });
}
