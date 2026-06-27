/**
 * POST /api/portal/session — the portal's first call: bootstrap + email-bind.
 *
 * Verifies the Clerk session (no paired attorney required), ensures a users
 * row exists, and — if the user isn't already bound to an attorney — tries to
 * link them by VERIFIED email to exactly one unbound attorney row. Returns the
 * portal identity when bound, or { onboarded: false, reason } so the client can
 * show a holding screen instead of a broken shell.
 *
 * Security boundary: binds ONLY on a Clerk-verified primary email with exactly
 * one unbound match, and the link write is race-safe (user_id set only while
 * NULL). All other data endpoints keep their strict requireAttorney 403.
 *
 * Ref: /plan Phase 4a; api/_attorney.ts (DO1 follow-up).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkRequest, loadPortalIdentity, type AttorneyAuthContext } from '../_attorney.js';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { decideBind } from '../../src/engine/portal/attorneyBinding.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const verified = await verifyClerkRequest(req, res);
  if (!verified) return;

  try {
    const clients = makeClientsFromEnv();
    const { userId } = await clients.db.upsertUserByClerkId({
      clerkUserId: verified.clerkUserId,
      email: verified.email,
      displayName: verified.name,
    });

    let resolved = await clients.db.resolveAttorneyByClerkUserId(verified.clerkUserId);

    if (!resolved) {
      const matches =
        verified.emailVerified && verified.email
          ? await clients.db.listUnboundAttorneysByEmail(verified.email)
          : [];
      const decision = decideBind({
        alreadyBound: false,
        emailVerified: verified.emailVerified,
        email: verified.email,
        matches,
      });

      if (decision.action === 'bind') {
        await clients.db.bindAttorneyToUser(decision.attorneyId, userId, {
          actorUserId: userId,
          actorEmail: verified.email,
        });
        resolved = await clients.db.resolveAttorneyByClerkUserId(verified.clerkUserId);
      } else {
        return res.status(200).json({ onboarded: false, reason: decision.action, email: verified.email });
      }
    }

    if (!resolved) {
      // Bind lost the race (someone else linked it first) — surface as un-onboarded.
      return res.status(200).json({ onboarded: false, reason: 'race', email: verified.email });
    }

    const ctx: AttorneyAuthContext = {
      attorneyId: resolved.attorneyId,
      userId: resolved.userId,
      clerkUserId: verified.clerkUserId,
      lawFirmId: resolved.lawFirmId,
      email: resolved.email ?? verified.email,
      firmRole: resolved.firmRole ?? 'member',
    };
    const identity = await loadPortalIdentity(clients.db, ctx);
    return res.status(200).json({ onboarded: true, ...identity });
  } catch (err) {
    console.error('POST /api/portal/session failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
