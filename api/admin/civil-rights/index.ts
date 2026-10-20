/**
 * GET /api/admin/civil-rights            submissions list (newest first)
 * GET /api/admin/civil-rights?format=csv the full CSV export (audited)
 *
 * State civil rights complaint page data. Clerk + ADMIN_EMAILS (or the
 * bridge secret) via requireAdmin, like every /api/admin/* route.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { makeCivilRightsAdminStore } from '../../../src/lib/civilRights/store.js';
import { exportWithAudit, listView } from '../../../src/lib/civilRights/adminCore.js';

/** Plenty for v1 (data for 3 to 4 months); the page says when it is capped. */
const MAX_ROWS = 5000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  res.setHeader('Cache-Control', 'no-store');
  try {
    const rows = await makeCivilRightsAdminStore().list(MAX_ROWS);

    if (req.query.format === 'csv') {
      const clients = makeClientsFromEnv();
      const csv = await exportWithAudit(rows, (count) =>
        clients.audit.log({
          orgId: null,
          actorType: auth.via === 'clerk' ? 'user' : 'system',
          actorId: auth.userId ?? auth.email,
          action: 'civil_rights.export',
          resourceType: 'civil_rights_submissions',
          resourceId: null,
          metadata: { count, via: auth.via, email: auth.email },
        }),
      );
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="civil-rights-submissions.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({ rows: rows.map(listView), total: rows.length, capped: rows.length === MAX_ROWS });
  } catch (err) {
    console.error('GET /api/admin/civil-rights failed', err);
    return res.status(500).json({ error: 'Could not load civil rights submissions' });
  }
}
