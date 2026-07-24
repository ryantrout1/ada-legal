/**
 * Admin API auth helper — dual-mode (Phase 0 transitional).
 *
 * Accepts EITHER:
 *   (a) A valid Clerk session token (existing path; keeps the old
 *       ada.adalegallink.com/admin alive during transition)
 *   (b) A valid Authorization: Bearer ${ADALL_BRIDGE_SECRET} header,
 *       with the admin's email passed via X-Admin-Email (for audit)
 *
 * Path (b) is used by the Base44 adallProxy server function. The proxy
 * verifies the caller is a Base44 admin via Base44 native auth, then
 * forwards to Vercel with the bridge secret. The secret is set in both
 * Vercel and Base44 env, never exposed client-side.
 *
 * Every /api/admin/* route calls requireAdmin(req, res) at the top and
 * short-circuits if the return value is null (the helper has already
 * written a 401).
 *
 * After Phase 6 cutover (Vercel admin dies, all admin moves to Base44),
 * the Clerk path can be removed and this file simplifies to bridge-only.
 *
 * AUTHORIZATION MODEL (M6):
 *   - Path (a), Clerk: the caller's verified email must appear in the
 *     ADMIN_EMAILS allowlist. Being signed in is NOT sufficient.
 *   - Path (b), bridge: any caller holding the bridge secret is an
 *     admin. Unchanged.
 *
 * WHY THE ALLOWLIST EXISTS. Until M6 this helper admitted any
 * authenticated Clerk user, and Clerk is the ATTORNEY PORTAL's auth
 * provider — not a separate admin directory. Every pilot attorney with
 * a portal login could therefore call all 25 /api/admin/* endpoints and
 * read every session, intake and firm across every firm boundary. On a
 * legal platform that is a cross-firm confidentiality exposure, not a
 * permissions nit.
 *
 * WHY ENV, NOT DATABASE. A database-driven allowlist means a database
 * outage locks you out of the admin tools you would use to diagnose it.
 * ADMIN_EMAILS is read from process.env on every call, so the list can
 * be changed in Vercel without a deploy.
 *
 * FAILS CLOSED. An unset or empty ADMIN_EMAILS denies every Clerk
 * caller. That is deliberate: the alternative — treating "no list
 * configured" as "everyone is an admin" — is exactly the bug this
 * replaces. The bridge path is unaffected, so Gina's Base44 admin keeps
 * working as a fallback if the variable is ever missing.
 *
 * Ref: /plan M6 Phase 1, docs/ARCHITECTURE.md §5
 */

import { createClerkClient } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Parse ADMIN_EMAILS into a lowercased set.
 *
 * Read per-call rather than cached at module load so the list can be
 * changed in Vercel and take effect on the next invocation without a
 * redeploy. The parse is trivial next to a Clerk round-trip.
 */
export function parseAdminAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Is this email allowed to use the admin surface? */
export function isAllowlistedAdmin(
  email: string | null | undefined,
  raw: string | undefined = process.env.ADMIN_EMAILS,
): boolean {
  const allow = parseAdminAllowlist(raw);
  if (allow.size === 0) return false; // fail closed
  if (!email) return false;
  return allow.has(email.trim().toLowerCase());
}

export interface AdminAuthContext {
  /** Clerk user id (user_xxx) when via Clerk; null when via bridge. */
  userId: string | null;
  /** Email address of the signed-in admin, if present. */
  email: string | null;
  /** Which auth path was used — for audit logging. */
  via: 'clerk' | 'bridge';
}

/**
 * Verify the request is an authorized admin. Tries the bridge secret
 * first (cheaper — no Clerk roundtrip), falls back to Clerk session.
 *
 * Returns context on success. On failure, writes 401 and returns null.
 *
 * Callers MUST check the return value:
 *   const auth = await requireAdmin(req, res);
 *   if (!auth) return; // 401 already sent
 */
export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AdminAuthContext | null> {
  // --- Path (b): bridge secret ---
  const bridgeSecret = process.env.ADALL_BRIDGE_SECRET;
  const authHeader = req.headers.authorization;
  if (
    bridgeSecret &&
    typeof authHeader === 'string' &&
    authHeader.startsWith('Bearer ') &&
    constantTimeEquals(authHeader.slice(7), bridgeSecret)
  ) {
    const emailHeader = req.headers['x-admin-email'];
    const email = typeof emailHeader === 'string' ? emailHeader : null;
    return { userId: null, email, via: 'bridge' };
  }

  // --- Path (a): Clerk session ---
  const secret = process.env.CLERK_SECRET_KEY;
  const publishable = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!secret || !publishable) {
    res.status(500).json({ error: 'Clerk is not configured on the server' });
    return null;
  }

  try {
    const clerk = createClerkClient({
      secretKey: secret,
      publishableKey: publishable,
    });

    // authenticateRequest reads the session token from the cookie or
    // Authorization header and verifies signature + expiry.
    const request = vercelRequestToWebRequest(req);
    const state = await clerk.authenticateRequest(request, {
      secretKey: secret,
      publishableKey: publishable,
    });

    if (!state.isAuthenticated) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    const auth = state.toAuth();
    const userId = auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    // The email is now the authorization signal, not audit decoration:
    // if it cannot be read, the caller cannot be authorized.
    let email: string | null = null;
    try {
      const user = await clerk.users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress ?? null;
    } catch (err) {
      console.error('requireAdmin: could not read Clerk user email', err);
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    if (!isAllowlistedAdmin(email)) {
      // 403, not 401: the caller IS authenticated, they are simply not
      // an admin. A 401 would bounce a signed-in attorney to a sign-in
      // page they are already past, which reads as a broken app.
      console.warn(
        `requireAdmin: denied non-allowlisted Clerk user ${userId} (${email ?? 'no email'})`,
      );
      res.status(403).json({ error: 'Forbidden' });
      return null;
    }

    return { userId, email, via: 'clerk' };
  } catch (err) {
    console.error('requireAdmin failed', err);
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

/**
 * Constant-time string compare to prevent timing attacks on the
 * bridge secret. Both strings get walked fully regardless of mismatch.
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Convert a classic Node-style VercelRequest into a Web API Request
 * so @clerk/backend's authenticateRequest (which expects the web
 * standard) can read headers and cookies.
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

  // GET/HEAD don't carry a body; anything else we pass through.
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
