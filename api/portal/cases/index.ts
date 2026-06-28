/**
 * POST /api/portal/cases
 *   { clientName, clientEmail?, clientPhone?, classificationTitle?,
 *     jurisdictionState?, defendantName?, note? }
 *
 * Create a self-originated matter — an attorney brings their own client into
 * the portal (no Ada intake, no routing). Attorney-only, firm-scoped: the new
 * matter is owned by the caller and lands in their firm's working queue.
 * 201 with { caseId, caseNumber }. 400 when the client name is missing.
 *
 * Ref: /plan "Add a matter" Phase 1.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../_attorney.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import { parseNewMatterInput } from '../../../src/engine/cases/newMatterInput.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseNewMatterInput(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const clients = makeClientsFromEnv();

    // Resolve the org from the signed-in attorney's firm (cases.org_id).
    const firm = await clients.db.readLawFirmById(auth.lawFirmId);
    if (!firm) {
      return res.status(500).json({ error: 'Firm not found for the signed-in attorney' });
    }

    const matter = parsed.value;
    const caseRow = await clients.db.createDirectCase({
      orgId: firm.orgId,
      firmId: auth.lawFirmId,
      assignedLawyerId: auth.attorneyId,
      createdBy: auth.userId,
      classificationTitle: matter.classificationTitle,
      jurisdictionState: matter.jurisdictionState,
      defendant: matter.defendant,
      client: matter.client,
      openingNote: matter.openingNote,
    });

    return res.status(201).json({ caseId: caseRow.id, caseNumber: caseRow.caseNumber });
  } catch (err) {
    console.error('POST /api/portal/cases failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
