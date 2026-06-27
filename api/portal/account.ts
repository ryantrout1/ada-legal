/**
 * GET  /api/portal/account — the signed-in attorney's profile + their firm.
 * PATCH /api/portal/account — self-serve edit of profile + firm display fields.
 *
 * Attorney-only (requireAttorney). The attorney + firm are resolved from the
 * Clerk session server-side — the client never supplies an id, so the write
 * is structurally firm-scoped (no cross-firm reach). Field editability is
 * enforced by filterAccountPatch: sensitive fields (status/verification/
 * billing/ids) are rejected, not silently dropped.
 *
 * Ref: /plan Phase 1 (Account page — self-serve profile/firm editing).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../_attorney.js';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { filterAccountPatch } from '../../src/engine/portal/accountBoundary.js';
import { computeReadiness } from '../../src/engine/portal/accountReadiness.js';
import { toAccountAttorney, toAccountFirm } from '../../src/engine/portal/accountView.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  const clients = makeClientsFromEnv();

  if (req.method === 'GET') {
    try {
      const [attorney, firm] = await Promise.all([
        clients.db.getAttorneyById(auth.attorneyId),
        clients.db.readLawFirmById(auth.lawFirmId),
      ]);
      if (!attorney) return res.status(404).json({ error: 'Attorney not found' });
      return res.status(200).json({
        attorney: toAccountAttorney(attorney),
        firm: firm ? toAccountFirm(firm) : null,
        readiness: computeReadiness(attorney, firm),
      });
    } catch (err) {
      console.error('GET /api/portal/account failed', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const result = filterAccountPatch(req.body);
      if (!result.ok) {
        return res.status(400).json({
          error: 'Some fields cannot be edited here',
          forbidden: result.forbidden,
        });
      }

      // Firm display fields are owner-only. A member editing their own
      // profile is fine; editing the firm requires firm_role='owner'.
      if (Object.keys(result.firmPatch).length > 0 && auth.firmRole !== 'owner') {
        return res.status(403).json({ error: 'Only a firm owner can edit firm details' });
      }

      let attorney = await clients.db.getAttorneyById(auth.attorneyId);
      if (!attorney) return res.status(404).json({ error: 'Attorney not found' });
      if (Object.keys(result.attorneyPatch).length > 0) {
        attorney = (await clients.db.updateAttorney(auth.attorneyId, result.attorneyPatch)) ?? attorney;
      }

      // Firm: read-merge-write so locked fields (status/is_pilot/stripe) are
      // preserved from the stored row — only the allowed display fields move.
      let firm = await clients.db.readLawFirmById(auth.lawFirmId);
      if (firm && Object.keys(result.firmPatch).length > 0) {
        firm = { ...firm, ...result.firmPatch };
        await clients.db.writeLawFirm(firm);
      }

      return res.status(200).json({
        attorney: toAccountAttorney(attorney),
        firm: firm ? toAccountFirm(firm) : null,
        readiness: computeReadiness(attorney, firm),
      });
    } catch (err) {
      console.error('PATCH /api/portal/account failed', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
