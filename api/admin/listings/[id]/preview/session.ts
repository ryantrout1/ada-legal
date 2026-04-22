/**
 * /api/admin/listings/[id]/preview/session
 *
 *   POST — create a preview (is_test=true) Ada session pre-bound to
 *   this listing, so an admin can exercise Ada's behavior against
 *   the listing's config without generating real emails, transcripts,
 *   or analytics noise.
 *
 * Admin-only. The listing must exist and belong to this admin's org.
 *
 * The returned session can be used against POST /api/ada/turn exactly
 * like a public session — the frontend embeds the existing chat UI
 * and targets this session id. finalize_intake short-circuits on
 * is_test (Step 25 Commit 5) so no side effects fire.
 *
 * Ref: Step 25, Commit 5.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSession } from '../../../../../src/engine/session/sessionRepo.js';
import {
  ANON_COOKIE_TTL_SECONDS,
  buildAnonCookieHeader,
  hashAnonToken,
  mintAnonToken,
} from '../../../../../src/lib/anonCookie.js';
import type { ReadingLevel } from '../../../../../src/types/db.js';
import { requireAdmin } from '../../../../_admin.js';
import {
  makeClientsFromEnv,
  readJsonBody,
  resolveRequestContext,
} from '../../../../_shared.js';

interface Body {
  reading_level?: ReadingLevel;
}

const ALLOWED_LEVELS: ReadingLevel[] = ['simple', 'standard', 'professional'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    return res.status(400).json({ error: 'listing id is required' });
  }

  try {
    const clients = makeClientsFromEnv();

    // Validate listing exists + belongs to this admin's org.
    const listing = await clients.db.readListingById(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const firm = await clients.db.readLawFirmById(listing.lawFirmId);
    if (!firm) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const org = await clients.db.getOrgByCode('adall');
    if (!org || firm.orgId !== org.id) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const body = readJsonBody<Body>(req);
    const readingLevel: ReadingLevel =
      body.reading_level && ALLOWED_LEVELS.includes(body.reading_level)
        ? body.reading_level
        : 'standard';

    // Mint an anon cookie even for admin preview — the chat turn
    // handler requires one. We mint fresh each time so preview
    // sessions never clobber each other.
    const ctx = resolveRequestContext(req);
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

    // Create a class_action_intake session pre-bound to the listing
    // with is_test=true. createSession accepts isTest + listingId
    // directly, so we skip the match_listing tool entirely — the
    // session starts bound.
    const session = createSession(clients, {
      orgId: org.id,
      sessionType: 'class_action_intake',
      anonSessionId,
      userId: null,
      readingLevel,
      listingId: listing.id,
      isTest: true,
    });
    await clients.db.writeSession({ state: session });

    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }
    return res.status(200).json({
      session_id: session.sessionId,
      listing_id: listing.id,
      listing_title: listing.title,
      reading_level: session.readingLevel,
      is_test: true,
    });
  } catch (err) {
    console.error('[admin/listings/:id/preview/session] failed:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

function isSecureRequest(req: VercelRequest): boolean {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? '';
  return proto.includes('https');
}
