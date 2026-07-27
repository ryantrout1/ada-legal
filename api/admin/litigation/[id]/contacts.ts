/**
 * GET  /api/admin/litigation/:id/contacts   — list, in display order
 * POST /api/admin/litigation/:id/contacts   — add one
 *
 * Separate from the litigation PATCH on purpose. That endpoint saves a flat
 * form of scalars in one request; contacts are a variable-length list of
 * ten-field rows. Folding them together would mean holding unsaved child
 * rows in memory against a parent save, where a partial failure leaves the
 * two out of step. Adding a contact is its own request that either works or
 * does not, and never depends on the rest of the form being valid.
 *
 * Validation returns the field by name. Every other admin field on the
 * litigation endpoint silently drops a value that fails its guard — which
 * is precisely how a blank Kind dropdown survived a save without complaint.
 * A scope note is the sentence that stops someone in Arizona ringing a
 * Seattle curb-ramp line, so leaving it out has to say so.
 *
 * Ref: /plan admin-editing, Phase 3.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../../_admin.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';
import type {
  CreateLitigationContactInput,
  LitigationContactKind,
} from '../../../../src/engine/clients/types.js';

const CONTACT_KINDS: readonly LitigationContactKind[] = [
  'class_counsel',
  'settlement_administrator',
  'government_agency',
  'state_pa',
  'referral_firm',
  'defendant_process',
];

type Validated =
  | { ok: true; value: Omit<CreateLitigationContactInput, 'orgId' | 'litigationListingId'> }
  | { ok: false; error: string };

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Exported so the messages can be tested. They are the feature — an admin
 * who leaves a field out should read a sentence, not a constraint error.
 */
export function validateContactInput(body: Record<string, unknown>): Validated {
  const orgName = str(body.org_name);
  if (!orgName) {
    return { ok: false, error: 'Give the organisation a name.' };
  }

  const kind = body.contact_kind;
  if (typeof kind !== 'string' || !CONTACT_KINDS.includes(kind as LitigationContactKind)) {
    return { ok: false, error: `Choose a contact kind. One of: ${CONTACT_KINDS.join(', ')}.` };
  }

  const scopeNote = str(body.scope_note);
  if (!scopeNote) {
    return {
      ok: false,
      error:
        'Say who this contact can help — which place, or which group of people. ' +
        'It shows next to the phone number, and it is what stops someone ringing a line that cannot help them.',
    };
  }

  const order = Number(body.display_order);

  return {
    ok: true,
    value: {
      contactKind: kind as LitigationContactKind,
      orgName,
      scopeNote,
      personName: str(body.person_name),
      phone: str(body.phone),
      tty: str(body.tty),
      email: str(body.email),
      url: str(body.url),
      address: str(body.address),
      intakeOpen: body.intake_open === true,
      displayOrder: Number.isFinite(order) ? order : 0,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = typeof req.query.id === 'string' ? req.query.id : null;
  if (!id) return res.status(400).json({ error: 'Litigation id required' });

  const clients = makeClientsFromEnv();

  if (req.method === 'GET') {
    try {
      const contacts = await clients.db.listContactsForLitigation(id);
      return res.status(200).json({ contacts });
    } catch (err) {
      console.error('GET /api/admin/litigation/[id]/contacts failed', err);
      return res.status(500).json({ error: 'Could not load contacts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;

      // The litigation has to exist, and its org owns the contact — the
      // caller does not get to name one.
      const litigation = await clients.db.getLitigationById(id);
      if (!litigation) return res.status(404).json({ error: 'Litigation not found' });

      // The contact belongs to the same org as everything else here. The
      // caller does not get to name one, and requireAdmin does not carry it.
      const org = await clients.db.getOrgByCode('adall');
      if (!org) return res.status(500).json({ error: 'Default organization not found' });

      const validated = validateContactInput(body);
      if (!validated.ok) return res.status(400).json({ error: validated.error });

      const contact = await clients.db.createLitigationContact({
        orgId: org.id,
        litigationListingId: id,
        ...validated.value,
      });
      return res.status(201).json({ contact });
    } catch (err) {
      console.error('POST /api/admin/litigation/[id]/contacts failed', err);
      return res.status(500).json({ error: 'Could not add the contact' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
