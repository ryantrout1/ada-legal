/**
 * /api/admin/intakes
 *
 *   GET — list class_action_intake sessions with firm + listing
 *   names attached. Filterable by firm, listing, status, outcome,
 *   include_test.
 *
 * Admin-only. Read-only — intake sessions are written by Ada's
 * turn handler and finalized by finalize_intake.
 *
 * Ref: Step 25, Commit 6.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_admin.js';
import { makeClientsFromEnv } from '../_shared.js';

function isSessionStatus(
  v: unknown,
): v is 'active' | 'completed' | 'abandoned' {
  return v === 'active' || v === 'completed' || v === 'abandoned';
}

function isOutcome(v: unknown): v is 'qualified' | 'disqualified' {
  return v === 'qualified' || v === 'disqualified';
}

function parseBool(raw: unknown): boolean | undefined {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
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
    const listingId =
      typeof req.query.listing_id === 'string' ? req.query.listing_id : undefined;
    const statusRaw = req.query.status;
    const status = isSessionStatus(statusRaw) ? statusRaw : undefined;
    const outcomeRaw = req.query.outcome;
    const outcome = isOutcome(outcomeRaw) ? outcomeRaw : undefined;
    const includeTest = parseBool(req.query.include_test) ?? false;
    const page = parseIntOr(req.query.page, 1);
    const pageSize = Math.min(parseIntOr(req.query.page_size, 50), 100);

    const result = await clients.db.listIntakesForAdmin({
      orgId: org.id,
      lawFirmId,
      listingId,
      status,
      outcome,
      includeTest,
      page,
      pageSize,
    });

    res.status(200).json({
      intakes: result.intakes,
      total_count: result.totalCount,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (err) {
    console.error('[admin/intakes GET] failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
