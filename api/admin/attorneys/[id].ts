/**
 * /api/admin/attorneys/[id]
 *
 *   GET    — fetch a single attorney
 *   PATCH  — partial update
 *   DELETE — two modes:
 *     ?hard=true  → permanent delete. Gated server-side: only succeeds
 *                   if the attorney is already status='archived'. Writes
 *                   an audit_log row with the before-state. Atomic.
 *     (default)   → soft-delete (archive). Existing behavior, unchanged.
 *                   Sets status='archived'. Reversible via PATCH.
 *
 * Both admin-only. The two-stage flow (archive → review → hard-delete)
 * is policy, enforced at the DB level — not just UI. See /plan ADALL
 * Admin: Archive → Delete.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_admin.js';
import { applyCors } from '../../_cors.js';
import { makeClientsFromEnv } from '../../_shared.js';
import type { AttorneyStatus } from '../../../src/engine/clients/types.js';
import { computeReadiness, shouldEnforceApprovalGate } from '../../../src/engine/portal/accountReadiness.js';
import { resolveAttorneyFirmLink } from '../../../src/engine/attorneyFirmLink.js';
import { canStepDown } from '../../../src/engine/portal/firmOwnership.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return; // preflight handled

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (req.method === 'GET') return handleGet(id, res);
  if (req.method === 'PATCH') return handlePatch(id, req, res, auth);
  if (req.method === 'DELETE') {
    // Branch on ?hard=true. The default DELETE behavior (no query
    // param) stays exactly as it was — back-compat for the existing
    // UIs and the ADALL bridge proxy.
    const hard = req.query.hard;
    const isHard =
      hard === 'true' || (Array.isArray(hard) && hard[0] === 'true');
    if (isHard) {
      return handleHardDelete(id, auth, res);
    }
    return handleArchive(id, res);
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(id: string, res: VercelResponse) {
  try {
    const clients = makeClientsFromEnv();
    const row = await clients.db.getAttorneyById(id);
    if (!row) return res.status(404).json({ error: 'Attorney not found' });
    const firm = row.lawFirmId ? await clients.db.readLawFirmById(row.lawFirmId) : null;
    return res.status(200).json({ attorney: row, readiness: computeReadiness(row, firm) });
  } catch (err) {
    console.error('GET /api/admin/attorneys/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handlePatch(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  auth: { email: string | null; userId: string | null },
) {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body) return res.status(400).json({ error: 'Body required' });

    const patch: Record<string, unknown> = {};
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if ('firm_name' in body) patch.firmName = stringOrNull(body.firm_name);
    if ('location_city' in body) patch.locationCity = stringOrNull(body.location_city);
    if ('location_state' in body) {
      patch.locationState = stringOrNull(body.location_state)?.toUpperCase() ?? null;
    }
    if (Array.isArray(body.practice_areas)) {
      patch.practiceAreas = body.practice_areas.filter(
        (p): p is string => typeof p === 'string',
      );
    }
    if (Array.isArray(body.additional_states)) {
      patch.additionalStates = body.additional_states
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.toUpperCase());
    }
    if (Array.isArray(body.specialty_tags)) {
      patch.specialtyTags = body.specialty_tags.filter(
        (t): t is string => typeof t === 'string',
      );
    }
    if ('email' in body) patch.email = stringOrNull(body.email);
    if ('phone' in body) patch.phone = stringOrNull(body.phone);
    if ('website_url' in body) patch.websiteUrl = stringOrNull(body.website_url);
    if ('bio' in body) patch.bio = stringOrNull(body.bio);
    if ('photo_url' in body) patch.photoUrl = stringOrNull(body.photo_url);
    if ('bar_number' in body) patch.barNumber = stringOrNull(body.bar_number);
    if (typeof body.status === 'string' && isAttorneyStatus(body.status)) {
      patch.status = body.status;
    }

    const clients = makeClientsFromEnv();

    // Firm linkage (sync-on-write). Authoritative when law_firm_id is present:
    // resolve + org-check the firm, derive firm_name from it, or unlink to
    // solo when null. Runs after the free-text firm_name handling above so it
    // wins; consumers that send only firm_name (no law_firm_id) keep the old
    // free-text behavior for back-compat.
    if ('law_firm_id' in body) {
      let firmRow: { id: string; name: string } | null = null;
      if (typeof body.law_firm_id === 'string' && body.law_firm_id.trim()) {
        const org = await clients.db.getOrgByCode('adall');
        const firm = await clients.db.readLawFirmById(body.law_firm_id.trim());
        if (!firm || !org || firm.orgId !== org.id) {
          return res
            .status(400)
            .json({ error: 'law_firm_id does not match a firm in this organization' });
        }
        firmRow = { id: firm.id, name: firm.name };
      }
      const link = resolveAttorneyFirmLink({
        lawFirmId: firmRow?.id ?? null,
        firm: firmRow,
        firmName: 'firm_name' in body ? stringOrNull(body.firm_name) : null,
      });
      patch.lawFirmId = link.lawFirmId;
      patch.firmName = link.firmName;
    }

    // Firm role (owner/member) with the never-zero-owner guard. Uses the
    // audited setAttorneyFirmRole path — not the general patch — and mirrors
    // the portal owner.ts guard: an owner may be demoted only while another
    // LIVE (non-archived) owner remains.
    if ('firm_role' in body) {
      const role = body.firm_role;
      if (role !== 'owner' && role !== 'member') {
        return res.status(400).json({ error: "firm_role must be 'owner' or 'member'" });
      }
      const current = await clients.db.getAttorneyById(id);
      if (!current) return res.status(404).json({ error: 'Attorney not found' });
      if (role === 'member' && current.firmRole === 'owner' && current.lawFirmId) {
        const roster = (await clients.db.listAttorneysForFirm(current.lawFirmId)).filter(
          (a) => a.status !== 'archived',
        );
        if (!canStepDown(roster, id)) {
          return res.status(400).json({
            error:
              "This attorney is the firm's only owner — make someone else an owner first.",
          });
        }
      }
      await clients.db.setAttorneyFirmRole(id, role, {
        actorUserId: auth.userId,
        actorEmail: auth.email,
      });
    }

    // Go-live gate: an attorney can only be flipped to 'approved' once their
    // profile + firm carry the required-to-go-live fields. Readiness is
    // computed on the merged (existing + this patch) view so the admin can
    // fill the missing fields and approve in the same save.
    if (patch.status === 'approved') {
      const existing = await clients.db.getAttorneyById(id);
      if (!existing) return res.status(404).json({ error: 'Attorney not found' });
      // Only gate a genuine transition INTO approved. Re-saving a row that
      // is already approved (even an incomplete one) must be allowed, or an
      // admin editing an approved attorney gets locked out of every edit.
      if (shouldEnforceApprovalGate(existing.status, 'approved')) {
        // Use the firm this save lands on — if the linkage changed in this same
        // PATCH, readiness must reflect the new firm, not the old one.
        const effectiveFirmId =
          'lawFirmId' in patch ? (patch.lawFirmId as string | null) : existing.lawFirmId;
        const firm = effectiveFirmId ? await clients.db.readLawFirmById(effectiveFirmId) : null;
        const merged = {
          name: (patch.name as string | undefined) ?? existing.name,
          email: 'email' in patch ? (patch.email as string | null) : existing.email,
          barNumber: 'barNumber' in patch ? (patch.barNumber as string | null) : existing.barNumber,
          locationState: 'locationState' in patch ? (patch.locationState as string | null) : existing.locationState,
          additionalStates:
            'additionalStates' in patch ? (patch.additionalStates as string[]) : existing.additionalStates,
        };
        const readiness = computeReadiness(merged, firm);
        if (!readiness.ready) {
          return res.status(400).json({
            error: 'Cannot approve until the profile is complete',
            missing: readiness.missing,
          });
        }
      }
    }

    const updated =
      Object.keys(patch).length > 0
        ? await clients.db.updateAttorney(id, patch as never)
        : await clients.db.getAttorneyById(id);
    if (!updated) return res.status(404).json({ error: 'Attorney not found' });
    const firm = updated.lawFirmId ? await clients.db.readLawFirmById(updated.lawFirmId) : null;
    return res.status(200).json({ attorney: updated, readiness: computeReadiness(updated, firm) });
  } catch (err) {
    console.error('PATCH /api/admin/attorneys/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handleArchive(id: string, res: VercelResponse) {
  try {
    const clients = makeClientsFromEnv();
    const updated = await clients.db.updateAttorney(id, { status: 'archived' });
    if (!updated) return res.status(404).json({ error: 'Attorney not found' });
    return res.status(200).json({ attorney: updated });
  } catch (err) {
    console.error('DELETE /api/admin/attorneys/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

async function handleHardDelete(
  id: string,
  auth: { email: string | null; userId: string | null },
  res: VercelResponse,
) {
  try {
    const clients = makeClientsFromEnv();
    // Pre-read the row so we can distinguish "not found" (404) from
    // "gate rejected" (400). hardDeleteAttorney returns false for both
    // — the user-visible error message differs and we want to be
    // honest about which one happened.
    const existing = await clients.db.getAttorneyById(id);
    if (!existing) return res.status(404).json({ error: 'Attorney not found' });
    if (existing.status !== 'archived') {
      return res.status(400).json({
        error: 'Attorney must be archived before permanent deletion',
      });
    }

    // Audit row needs an actor email. requireAdmin populates it on
    // both auth paths (Clerk and bridge), but typed as nullable. If
    // we somehow got here without one, fall back to a sentinel rather
    // than silently writing a blank audit row.
    const actorEmail = auth.email ?? 'unknown';

    const deleted = await clients.db.hardDeleteAttorney(id, {
      actorEmail,
      actorUserId: auth.userId,
    });
    if (!deleted) {
      // Race: row was archived when we read it but something changed
      // between then and the SQL execution (rare — admin endpoint).
      // Treat as 409 so the UI can refetch and try again.
      return res
        .status(409)
        .json({ error: 'Could not delete attorney (state changed)' });
    }
    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('DELETE ?hard=true /api/admin/attorneys/[id] failed', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal error',
    });
  }
}

function isAttorneyStatus(v: unknown): v is AttorneyStatus {
  return v === 'pending' || v === 'approved' || v === 'rejected' || v === 'archived';
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}
