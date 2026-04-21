/**
 * Admin API auth helper.
 *
 * Validates that the incoming request carries a valid Clerk session
 * token. Every /api/admin/* route calls requireAdmin(req, res) at the
 * top and short-circuits if the return value is null (the helper has
 * already written a 401).
 *
 * We use @clerk/backend directly rather than a middleware layer because
 * Vercel's classic Node function signature (req, res) doesn't compose
 * well with middleware patterns. Each admin route is a thin function
 * that does auth-check → query → respond.
 *
 * Ch0 authorization model:
 *   - Any signed-in Clerk user is an admin.
 *   - In Ch1 we can tighten this to membership in the admin role via
 *     org_memberships, but Ch0 has one org and a trusted handful of users.
 *   - The code is structured so Ch1 can introduce that check without
 *     touching every route.
 *
 * Ref: docs/ARCHITECTURE.md §5 — auth model
 */

import { createClerkClient } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface AdminAuthContext {
  /** Clerk user id (user_xxx). */
  userId: string;
  /** Email address of the signed-in admin, if present. */
  email: string | null;
}

/**
 * Verify the request is from a signed-in Clerk user. If so, returns
 * the auth context. If not, writes a 401 response and returns null.
 *
 * Callers MUST check the return value:
 *   const auth = await requireAdmin(req, res);
 *   if (!auth) return; // 401 already sent
 */
export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AdminAuthContext | null> {
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

    // Pull email for audit logging — nice to have, not required.
    let email: string | null = null;
    try {
      const user = await clerk.users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress ?? null;
    } catch {
      // Ignore — email is decorative.
    }

    return { userId, email };
  } catch (err) {
    console.error('requireAdmin failed', err);
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
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
