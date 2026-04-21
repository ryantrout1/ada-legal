/**
 * POST /api/ada/session
 *
 * Creates a new Ada session. Resolves the caller's org, mints an anon
 * cookie if they don't have one, inserts `anon_sessions` if needed,
 * calls `createSession()` + `writeSession()`, returns
 * `{ session_id, greeting, reading_level }`.
 *
 * Request body (JSON, optional):
 *   {
 *     "reading_level": "simple" | "standard" | "professional"  // default: "standard"
 *   }
 *
 * Response:
 *   200 OK
 *   Content-Type: application/json
 *   Set-Cookie: ada_anon=<token>; HttpOnly; Secure; SameSite=Lax; Path=/
 *   {
 *     "session_id": "<uuid>",
 *     "greeting": "Hi, I'm Ada…",
 *     "reading_level": "standard"
 *   }
 *
 * Errors:
 *   405 — method not POST
 *   404 — org could not be resolved from host+path
 *   500 — DB or env failure
 *
 * Auth model (Ch0):
 *   - Public visitors are anonymous. A signed anon cookie uniquely
 *     identifies their browser. If no cookie is present, we mint one.
 *   - Authenticated admin users (Clerk) do NOT use this route for the
 *     public chat; admin paths go through /admin/*.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSession } from '@/engine/session/sessionRepo';
import {
  ANON_COOKIE_TTL_SECONDS,
  buildAnonCookieHeader,
  hashAnonToken,
  mintAnonToken,
} from '@/lib/anonCookie';
import type { ReadingLevel } from '@/types/db';
import {
  makeClientsFromEnv,
  readJsonBody,
  resolveRequestContext,
} from '../_shared';

interface Body {
  reading_level?: ReadingLevel;
}

const ALLOWED_LEVELS: ReadingLevel[] = ['simple', 'standard', 'professional'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = resolveRequestContext(req);
    if (ctx.notFound) {
      return res.status(404).json({ error: 'Organization not found for this host' });
    }
    const orgCode = ctx.orgCode ?? 'adall';

    const body = readJsonBody<Body>(req);
    const readingLevel: ReadingLevel =
      body.reading_level && ALLOWED_LEVELS.includes(body.reading_level)
        ? body.reading_level
        : 'standard';

    const clients = makeClientsFromEnv();

    // Resolve the organization row.
    const org = await clients.db.getOrgByCode(orgCode);
    if (!org) {
      return res.status(404).json({ error: `Organization '${orgCode}' not found` });
    }

    // Establish anon session. If the caller sent a cookie, reuse its hash;
    // otherwise mint a fresh token and set a new cookie.
    let rawToken = ctx.anonToken;
    let setCookie: string | null = null;
    if (!rawToken) {
      rawToken = mintAnonToken();
      setCookie = buildAnonCookieHeader({
        token: rawToken,
        secure: isSecureRequest(req),
        maxAgeSeconds: ANON_COOKIE_TTL_SECONDS,
      });
    }
    const tokenHash = await hashAnonToken(rawToken);
    const anonSessionId = await clients.db.upsertAnonSession({
      orgId: org.id,
      tokenHash,
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });

    // Create and persist the session.
    const session = createSession(clients, {
      orgId: org.id,
      sessionType: 'public_ada',
      anonSessionId,
      userId: null,
      readingLevel,
    });
    await clients.db.writeSession({ state: session });

    // Greeting text — deliberately brief so the client can render it
    // immediately before the first turn completes. Matches the reading
    // level; a simple greeting in the chosen voice.
    const greeting = buildGreeting(org.displayName, readingLevel);

    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }
    return res.status(200).json({
      session_id: session.sessionId,
      greeting,
      reading_level: session.readingLevel,
    });
  } catch (err) {
    console.error('POST /api/ada/session failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}

function buildGreeting(orgDisplayName: string, level: ReadingLevel): string {
  const base = `Hi, I'm Ada. I help with questions about the Americans with Disabilities Act.`;
  switch (level) {
    case 'simple':
      return `Hi! I'm Ada. I can help if someone wasn't fair because of a disability. What happened?`;
    case 'professional':
      return `${base} Tell me about the incident and I'll help route it — Title I, II, or III — and determine next steps.`;
    case 'standard':
    default:
      return `${base} Tell me what happened and I'll help figure out what to do next. (Powered by ${orgDisplayName}.)`;
  }
}

function isSecureRequest(req: VercelRequest): boolean {
  // Vercel edge sets x-forwarded-proto=https in production.
  const proto = (req.headers['x-forwarded-proto'] as string) ?? '';
  if (proto.startsWith('https')) return true;
  const host = (req.headers['host'] as string) ?? '';
  return !host.startsWith('localhost');
}
