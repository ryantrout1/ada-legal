/**
 * GET    /api/admin/civil-rights/:id  one submission, with consent proof
 * DELETE /api/admin/civil-rights/:id  permanently delete it (e.g. a request
 *                                     to delete, or an admin-preview test)
 *
 * Both behind requireAdmin. Deletes are audited.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { makeCivilRightsAdminStore } from '../../../src/lib/civilRights/store.js';
import { isUuid } from '../../../src/lib/uuid.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = req.query.id;
  if (!isUuid(id)) return res.status(400).json({ error: 'A valid id is required', field: 'id' });

  res.setHeader('Cache-Control', 'no-store');
  try {
    const store = makeCivilRightsAdminStore();

    if (req.method === 'DELETE') {
      const removed = await store.remove(id);
      if (!removed) return res.status(404).json({ error: 'No such submission' });
      try {
        await makeClientsFromEnv().audit.log({
          orgId: null,
          actorType: auth.via === 'clerk' ? 'user' : 'system',
          actorId: auth.userId ?? auth.email,
          action: 'civil_rights.delete',
          resourceType: 'civil_rights_submission',
          resourceId: id,
          metadata: { via: auth.via, email: auth.email },
        });
      } catch (auditErr) {
        console.error('civil rights delete audit failed', auditErr);
      }
      return res.status(200).json({ deleted: true });
    }

    const row = await store.get(id);
    if (!row) return res.status(404).json({ error: 'No such submission' });
    return res.status(200).json({ submission: row });
  } catch (err) {
    console.error(`${req.method} /api/admin/civil-rights/${id} failed`, err);
    return res.status(500).json({ error: 'Could not load that submission' });
  }
}
