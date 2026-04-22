/**
 * /api/admin/subscriptions
 *
 *   GET — list all subscriptions across every firm in the org.
 *
 * Admin-only. Read-only; mutation happens via Stripe webhooks and
 * the Stripe admin endpoints (checkout/portal).
 *
 * Ref: Step 25, Commit 6.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { makeClientsFromEnv } from '../_shared.js';

function isSubStatus(
  v: unknown,
): v is 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' {
  return (
    v === 'active' ||
    v === 'trialing' ||
    v === 'past_due' ||
    v === 'canceled' ||
    v === 'unpaid'
  );
}

function isTier(v: unknown): v is 'basic' | 'premium' {
  return v === 'basic' || v === 'premium';
}

function parseIntOr(raw: unknown, fallback: number): number {
  if (typeof raw !== 'string') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) {
      return res.status(500).json({ error: 'Default organization not found' });
    }

    const lawFirmId =
      typeof req.query.law_firm_id === 'string' ? req.query.law_firm_id : undefined;
    const statusRaw = req.query.status;
    const status = isSubStatus(statusRaw) ? statusRaw : undefined;
    const tierRaw = req.query.tier;
    const tier = isTier(tierRaw) ? tierRaw : undefined;
    const page = parseIntOr(req.query.page, 1);
    const pageSize = Math.min(parseIntOr(req.query.page_size, 50), 100);

    const result = await clients.db.listAllSubscriptionsForAdmin({
      orgId: org.id,
      lawFirmId,
      status,
      tier,
      page,
      pageSize,
    });

    res.status(200).json({
      subscriptions: result.subscriptions,
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('[admin/subscriptions GET] failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
