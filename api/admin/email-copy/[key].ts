/**
 * /api/admin/email-copy/[key]
 *
 *   GET — one email's slots: the wording that will go out, the original it
 *         came from, whether it has been edited, and which variables the
 *         slot accepts.
 *
 * Read-only. PATCH and DELETE arrive in Phase B.
 *
 * WHY BOTH `value` AND `default` ARE RETURNED. `value` is what the next
 * email will actually say; `default` is the wording in the code. Sending
 * only the first makes "reverted" indistinguishable from "never touched"
 * on the screen, and sending only the second would show something other
 * than what claimants receive. The pair is what lets the editor say which
 * of the two you are looking at.
 *
 * A missing table means nothing has been edited — see the list endpoint's
 * header for why that is a state and not an error.
 *
 * Ref: /plan the email editing screen, Phase A.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { EMAIL_TEMPLATES, type LeveledText } from '../../../src/engine/email/copySlots.js';
import type { EmailCopyRow } from '../../../src/engine/clients/types.js';
import type { ReadingLevel } from '../../../src/types/db.js';

const LEVELS: ReadingLevel[] = ['simple', 'standard', 'professional'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const key = typeof req.query.key === 'string' ? req.query.key : '';
  const template = EMAIL_TEMPLATES.find((t) => t.key === key);
  if (!template) return res.status(404).json({ error: 'No such email' });

  try {
    const clients = makeClientsFromEnv();
    const org = await clients.db.getOrgByCode('adall');
    if (!org) return res.status(500).json({ error: 'Default organization not found' });

    let rows: EmailCopyRow[] = [];
    let storageReady = true;
    try {
      rows = await clients.db.getEmailCopy(org.id, key);
    } catch (err) {
      storageReady = false;
      console.error('[admin/email-copy/[key] GET] edits unreadable, showing originals', err);
    }
    const stored = new Map(rows.map((r) => [`${r.slotKey}:${r.readingLevel}`, r]));

    return res.status(200).json({
      storage_ready: storageReady,
      key: template.key,
      recipient: template.recipient,
      trigger: template.trigger,
      slots: template.slots.map((slot) => {
        const levels = slot.varied ? LEVELS : (['standard'] as ReadingLevel[]);
        return {
          key: slot.key,
          varied: slot.varied,
          variables: slot.variables,
          variants: levels.map((level) => {
            const original =
              typeof slot.default === 'string'
                ? slot.default
                : (slot.default as LeveledText)[level];
            const row = stored.get(`${slot.key}:${level}`);
            return {
              reading_level: level,
              value: row?.value ?? original,
              default: original,
              is_edited: row !== undefined,
              updated_by: row?.updatedBy ?? null,
              updated_at: row?.updatedAt ?? null,
            };
          }),
        };
      }),
    });
  } catch (err) {
    console.error('[admin/email-copy/[key] GET] failed', err);
    return res.status(500).json({ error: 'Failed to load email' });
  }
}
