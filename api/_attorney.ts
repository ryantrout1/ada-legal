/**
 * Attorney portal API auth helper.
 *
 * Clerk-direct only — no bridge-secret path. The attorney portal lives on
 * Vercel at /portal and authenticates via Clerk natively (mirrors the admin
 * Clerk path in api/_admin.ts, scoped to the portal).
 *
 * requireAttorney(req, res):
 *   1. Verify the Clerk session (signature + expiry).
 *   2. Resolve the Clerk user id → users.clerk_user_id → attorneys.user_id →
 *      law_firms (via resolveAttorneyByClerkUserId).
 *   3. On a verified session with no paired attorney → 403 "not onboarded".
 *      On no/invalid session → 401.
 *
 * Every /api/portal/* route calls requireAttorney(req, res) at the top and
 * short-circuits if the return value is null (the helper has already written
 * the response).
 *
 * Pairing (DO1): v1 pairs attorneys to Clerk users by setting attorneys.user_id
 * (B44 admin, or the migration-0019 firm_name backfill for law_firm_id).
 * Auto-pair-by-verified-email on first sign-in is a documented follow-up — it
 * needs net-new user-provisioning DB infrastructure (a users upsert-by-clerk-id
 * + an attorney email lookup + an atomic linkage write) that doesn't exist yet,
 * and it's a security boundary, so it's deferred to its own scoped change.
 * Until then an unpaired attorney gets a clean 403 (DO1's zero-match path).
 *
 * Ref: .design/attorney-portal.md (requireAttorney contract; DO1).
 */

import { createClerkClient } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { DbClient } from '../src/engine/clients/types.js';
import { makeClientsFromEnv } from './_shared.js';

export interface AttorneyAuthContext {
  attorneyId: string;
  /** ada_legal users.id (NOT the Clerk user id). */
  userId: string;
  clerkUserId: string;
  lawFirmId: string;
  email: string | null;
  firmRole: string;
}

/**
 * Resolve a verified Clerk identity to an attorney auth context. Pure-ish core
 * (no HTTP, no env) so it's unit-testable against the in-memory client. Returns
 * null when the Clerk user has no paired+firm-bound attorney.
 */
export async function resolveAttorneyContext(
  db: DbClient,
  clerkUserId: string,
  clerkEmail: string | null,
): Promise<AttorneyAuthContext | null> {
  const resolved = await db.resolveAttorneyByClerkUserId(clerkUserId);
  if (!resolved) return null;
  return {
    attorneyId: resolved.attorneyId,
    userId: resolved.userId,
    clerkUserId,
    lawFirmId: resolved.lawFirmId,
    email: resolved.email ?? clerkEmail,
    firmRole: resolved.firmRole ?? 'member',
  };
}

/** Display identity for the portal shell (sidebar brand + footer). */
export interface PortalIdentity {
  attorney: { id: string; name: string; email: string | null };
  firm: { id: string; name: string };
}

/**
 * Load the signed-in attorney's display name + firm name for the portal shell.
 * Pure-ish (no HTTP, no env) so it's unit-testable against the in-memory client.
 * Falls back gracefully when a name is missing — the shell must always render.
 */
export async function loadPortalIdentity(
  db: DbClient,
  ctx: AttorneyAuthContext,
): Promise<PortalIdentity> {
  const [firm, attorney] = await Promise.all([
    db.readLawFirmById(ctx.lawFirmId),
    db.getAttorneyById(ctx.attorneyId),
  ]);
  return {
    attorney: {
      id: ctx.attorneyId,
      name: attorney?.name ?? ctx.email ?? 'Attorney',
      email: ctx.email,
    },
    firm: {
      id: ctx.lawFirmId,
      name: firm?.name ?? 'Your firm',
    },
  };
}

/**
 * Verify the request is an authorized, paired attorney. On failure writes the
 * response (401 unauth, 403 not-onboarded, 500 misconfig) and returns null.
 *
 * Callers MUST check the return value:
 *   const auth = await requireAttorney(req, res);
 *   if (!auth) return; // response already sent
 */
export async function requireAttorney(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AttorneyAuthContext | null> {
  const secret = process.env.CLERK_SECRET_KEY;
  const publishable = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!secret || !publishable) {
    res.status(500).json({ error: 'Clerk is not configured on the server' });
    return null;
  }

  let clerkUserId: string;
  let clerkEmail: string | null = null;
  try {
    const clerk = createClerkClient({ secretKey: secret, publishableKey: publishable });
    const state = await clerk.authenticateRequest(vercelRequestToWebRequest(req), {
      secretKey: secret,
      publishableKey: publishable,
    });
    if (!state.isAuthenticated) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }
    const auth = state.toAuth();
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }
    clerkUserId = auth.userId;
    try {
      const user = await clerk.users.getUser(clerkUserId);
      clerkEmail = user.primaryEmailAddress?.emailAddress ?? null;
    } catch {
      // email is decorative for the context; ignore lookup failure
    }
  } catch (err) {
    console.error('requireAttorney: Clerk verification failed', err);
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  let ctx: AttorneyAuthContext | null;
  try {
    const clients = makeClientsFromEnv();
    ctx = await resolveAttorneyContext(clients.db, clerkUserId, clerkEmail);
  } catch (err) {
    console.error('requireAttorney: attorney resolution failed', err);
    res.status(500).json({ error: 'Internal error' });
    return null;
  }

  if (!ctx) {
    // Verified Clerk user, but no paired attorney (DO1 zero-match path).
    res.status(403).json({ error: 'Not onboarded as an attorney' });
    return null;
  }
  return ctx;
}

/**
 * Convert a Node-style VercelRequest into a Web API Request so
 * @clerk/backend's authenticateRequest can read headers + cookies.
 * (Mirrors the private helper in api/_admin.ts; kept local to avoid
 * modifying _admin.ts.)
 */
function vercelRequestToWebRequest(req: VercelRequest): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = (req.headers['host'] as string) ?? 'localhost';
  const url = `${proto}://${host}${req.url ?? '/'}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  const method = req.method ?? 'GET';
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : typeof req.body === 'string'
      ? req.body
      : req.body
      ? JSON.stringify(req.body)
      : undefined;

  return new Request(url, { method, headers, body });
}
