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
 *     "greeting": "I'm Ada. If a business, workplace, or public place…",
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
import { createSession } from '../../src/engine/session/sessionRepo.js';
import {
  ANON_COOKIE_TTL_SECONDS,
  buildAnonCookieHeader,
  hashAnonToken,
  mintAnonToken,
} from '../../src/lib/anonCookie.js';
import type { PageContext, ReadingLevel } from '../../src/types/db.js';
import {
  makeClientsFromEnv,
  readJsonBody,
  resolveRequestContext,
} from '../_shared.js';

interface Body {
  reading_level?: ReadingLevel;
  /**
   * Optional deep-link from /class-actions/:slug. When set and the
   * slug maps to an ACTIVE listing in this org, the new session is
   * created as a class_action_intake pre-bound to that listing.
   * Invalid or inactive slugs are ignored (session is created as
   * public_ada, no error — the directory page is cacheable and a
   * slug may go archive-state between page load and button click).
   *
   * Step 26, Commit 1.
   */
  listing_slug?: string;
  /**
   * Optional deep-link from a Standards Guide chapter or deep-dive
   * guide page. When set we record it in metadata.page_context so
   * Ada can acknowledge the topic in her greeting and reference it
   * in replies (Commit 6).
   *
   * Malformed values are ignored (session is still created, but
   * without page context) — the CTA shouldn't break the chat if a
   * client sends something unexpected.
   *
   * Step 29, Commit 5.
   */
  page_context?: {
    kind?: string;
    ref?: string;
    title?: string;
  };
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

    // If the caller passed a listing_slug, try to resolve it against
    // v_active_listings. Only active (published + active firm + pilot
    // or active sub) listings bind the session. Everything else
    // silently falls back to public_ada, same as if no slug was passed.
    let listingId: string | null = null;
    if (typeof body.listing_slug === 'string' && body.listing_slug.trim()) {
      const active = await clients.db.listActiveListings();
      const match = active.find((r) => r.slug === body.listing_slug!.trim());
      if (match) {
        listingId = match.listingId;
      }
    }

    // Validate page_context. Accept only fully-formed payloads; silently
    // drop anything malformed so the CTA doesn't fail the chat.
    const pageContext = parsePageContext(body.page_context);

    // Create and persist the session. If listingId resolved, this is
    // a class_action_intake session pre-bound to that listing —
    // equivalent to what match_listing would have done, minus the
    // LLM round-trip (the user's intent was expressed by clicking
    // into the listing's public page, so the consent gate is
    // structurally satisfied).
    const session = createSession(clients, {
      orgId: org.id,
      sessionType: listingId ? 'class_action_intake' : 'public_ada',
      anonSessionId,
      userId: null,
      readingLevel,
      listingId,
      metadata: pageContext ? { page_context: pageContext } : undefined,
    });
    await clients.db.writeSession({ state: session });

    // Greeting text — deliberately brief so the client can render it
    // immediately before the first turn completes. Matches the reading
    // level; a simple greeting in the chosen voice. When the session
    // was opened from a chapter or guide page, Ada leads with a short
    // acknowledgment of the topic.
    const greeting = buildGreeting(org.displayName, readingLevel, pageContext);

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

/**
 * The first words Ada says to every user.
 *
 * Voice rules (see docs/ADA_VOICE_GUIDE.md):
 *   - First person, specific, not performative
 *   - Names what she's for — access under the ADA, not "disability law" generically
 *   - Gives the user permission to take their time
 *   - Asks the open question without padding ("Tell me what happened.")
 *   - No "Please," no "I'm so sorry," no thanking in advance, no exclamation marks
 *   - No "Powered by" attribution in the greeting — it's ambient, not first-word
 *
 * Reading level variations preserve the same voice and the same belief —
 * only sentence length and vocabulary change.
 *
 * If pageContext is present the greeting begins with a single short
 * line acknowledging the topic the user was reading about. It does
 * NOT summarize the page or presume what the user experienced —
 * just names the topic, then opens the floor the same way every
 * other greeting does.
 */
function buildGreeting(
  _orgDisplayName: string,
  level: ReadingLevel,
  pageContext?: PageContext | null,
): string {
  const base = baseGreeting(level);
  if (!pageContext) return base;

  const lead = topicLead(pageContext, level);
  return `${lead} ${base}`;
}

function baseGreeting(level: ReadingLevel): string {
  // Voice principle (post-2026-04 copy pass): the SUBJECT is the
  // barrier, not the disability. Earlier wording leaned 'because of a
  // disability' / 'access you're owed' which centered the user's
  // condition. The barrier framing centers the thing that shouldn't
  // have been there. Same warmth; different stance.
  //
  // Simple keeps plain causal language ('something got in your way')
  // so users in distress reach for the words naturally. Standard and
  // Professional name 'barrier' explicitly because the bandwidth is
  // there and the framing lands harder.
  //
  // Standard also names DIGITAL barriers explicitly so the scope
  // honesty section on the home page lines up with what Ada says
  // when she opens the conversation.
  switch (level) {
    case 'simple':
      return `I'm Ada. If a place didn't let you in, or wouldn't help, because something got in your way, I can help. Take your time. Tell me what happened.`;
    case 'professional':
      return `I'm Ada. If you encountered a barrier, physical or digital, at a place covered by the ADA, I can help you identify the title that applies and the appropriate next step. Tell me what happened.`;
    case 'standard':
    default:
      return `I'm Ada. If a barrier kept you out, at a business, on a website, anywhere a place was supposed to be open to you, I'm here to help you figure out what to do. Take your time. Tell me what happened.`;
  }
}

function topicLead(pc: PageContext, level: ReadingLevel): string {
  // The acknowledgment line is the same register across reading levels
  // — same brevity, same voice. Title is rendered verbatim; we only
  // decide what frame to wrap it in based on where the user came from.
  if (pc.kind === 'chapter') {
    return level === 'simple'
      ? `You were reading about ${pc.title}.`
      : `You came from the ${pc.title} chapter.`;
  }
  // kind === 'guide'
  return level === 'simple'
    ? `You were reading about ${pc.title}.`
    : `You came from the ${pc.title} guide.`;
}

/**
 * Accept a page_context payload from the client and return a
 * well-formed PageContext or null. Rules:
 *   - kind must be 'chapter' or 'guide'
 *   - ref must be a non-empty string ≤ 128 chars
 *   - title must be a non-empty string ≤ 200 chars
 * Anything else returns null (silently dropped — the greeting falls
 * back to the default, the session is still created normally).
 */
function parsePageContext(raw: unknown): PageContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const kind = r.kind;
  if (kind !== 'chapter' && kind !== 'guide') return null;

  const ref = typeof r.ref === 'string' ? r.ref.trim() : '';
  if (!ref || ref.length > 128) return null;

  const title = typeof r.title === 'string' ? r.title.trim() : '';
  if (!title || title.length > 200) return null;

  return { kind, ref, title };
}

function isSecureRequest(req: VercelRequest): boolean {
  // Vercel edge sets x-forwarded-proto=https in production.
  const proto = (req.headers['x-forwarded-proto'] as string) ?? '';
  if (proto.startsWith('https')) return true;
  const host = (req.headers['host'] as string) ?? '';
  return !host.startsWith('localhost');
}
