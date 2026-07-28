/**
 * /api/admin/email-copy
 *
 *   GET — every email the site sends, with who receives it, what makes it
 *         send, and how many of its slots have been edited.
 *
 * Read-only. Editing arrives in Phase B.
 *
 * THE TABLE MAY NOT EXIST YET. Migration 0048 is written and verified on
 * a scratch branch but has not been applied to main. A missing table is
 * therefore an expected state, not an error, and it means exactly what an
 * empty table means: nobody has edited anything. The screen shows the
 * wording from the registry, which is what those emails are currently
 * sending. Failing the whole screen over it would hide seven emails to
 * report one migration.
 *
 * Ref: /plan the email editing screen, Phase A.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { EMAIL_TEMPLATES } from '../../../src/engine/email/copySlots.js';
import type { EmailCopyRow } from '../../../src/engine/clients/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) return res.status(500).json({ error: 'Default organization not found' });

    let edits: EmailCopyRow[] = [];
    let storageReady = true;
    try {
      edits = await clients.db.listEmailCopy(org.id);
    } catch (err) {
      // See the header: no table yet is "nothing edited", not a failure.
      storageReady = false;
      console.error('[admin/email-copy GET] edits unreadable, showing originals', err);
    }

    const editedByTemplate = new Map<string, number>();
    for (const e of edits) {
      editedByTemplate.set(e.templateKey, (editedByTemplate.get(e.templateKey) ?? 0) + 1);
    }

    return res.status(200).json({
      // Reported so the screen can say "edits cannot be saved yet" rather
      // than showing a Save button that will fail.
      storage_ready: storageReady,
      templates: EMAIL_TEMPLATES.map((t) => ({
        key: t.key,
        recipient: t.recipient,
        trigger: t.trigger,
        slot_count: t.slots.length,
        edited_count: editedByTemplate.get(t.key) ?? 0,
      })),
    });
  } catch (err) {
    console.error('[admin/email-copy GET] failed', err);
    return res.status(500).json({ error: 'Failed to load email copy' });
  }
}
