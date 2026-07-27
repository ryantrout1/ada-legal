/**
 * DELETE /api/admin/litigation/:id/contacts/:contactId
 *
 * Scoped to the litigation as well as the contact. Keying on the contact id
 * alone would let a mismatched pair delete a row belonging to a different
 * case, and the id would be perfectly real — the same shape as the
 * firm-assignment bug, where a delete ran without the constraint that made
 * it safe.
 *
 * A miss is a 404, not a cheerful 204. An admin who clicked Remove and saw
 * nothing happen should be told the row was not there, rather than left to
 * assume it worked.
 *
 * Ref: /plan admin-editing, Phase 3, AC5.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../../../_admin.js';
import { applyCors } from '../../../../_cors.js';
import { makeClientsFromEnv } from '../../../../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : null;
  const contactId =
    typeof req.query.contactId === 'string' ? req.query.contactId : null;
  if (!id || !contactId) {
    return res.status(400).json({ error: 'Litigation id and contact id required' });
  }

  try {
    const clients = makeClientsFromEnv();
    const removed = await clients.db.deleteLitigationContact(id, contactId);
    if (!removed) {
      return res.status(404).json({ error: 'Contact not found on this case' });
    }
    return res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/admin/litigation/[id]/contacts/[contactId] failed', err);
    return res.status(500).json({ error: 'Could not remove the contact' });
  }
}
