/**
 * POST /api/ada/turn
 *
 * Runs one conversational turn. Takes a session_id + user message,
 * loads the session state, invokes processAdaTurn (which streams from
 * Anthropic internally, dispatches tools, applies state changes),
 * persists the updated session, returns the final assistant message.
 *
 * Two response modes, picked by the request's Accept header:
 *
 *   1. JSON (default — back-compat for any non-browser caller). Returns
 *      one shot:
 *        { assistant_message, tools_used, reading_level, status,
 *          photo_findings, package_slug }
 *
 *   2. SSE (Accept: text/event-stream — what the browser uses). Streams:
 *        event: text     data: { "delta": "..." }   (repeated)
 *        event: done     data: { assistant_message, tools_used, ... }
 *        event: error    data: { "error": "..." }   (on failure only)
 *      The `done` payload carries the same fields as the JSON response
 *      so the client can reconcile final state in one place.
 *
 * Request body (JSON):
 *   {
 *     "session_id": "<uuid>",
 *     "message": "<user text>",
 *     "photo_url": "<optional blob URL>"
 *   }
 *
 * Errors:
 *   400 — missing/invalid body
 *   404 — session not found
 *   405 — method not POST
 *   500 — any engine / DB / Anthropic failure (in SSE mode this surfaces
 *         as an `event: error` frame on an already-200 response)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processAdaTurn } from '../../src/engine/processAdaTurn.js';
import { runSessionQualityCheck } from '../../src/engine/observability/qualityCheck.js';
import { assemblePackage } from '../../src/engine/package/assemble.js';
import type { AdaTurnResult } from '../../src/engine/types.js';
import type { AdaClients } from '../../src/engine/clients/types.js';
import { hashAnonToken } from '../../src/lib/anonCookie.js';
import {
  makeClientsFromEnv,
  readJsonBody,
  resolveRequestContext,
} from '../_shared.js';

interface Body {
  session_id?: string;
  message?: string;
  /**
   * Optional public blob URL of a photo the user attached this turn.
   * Uploaded separately via /api/ada/upload-photo (client-direct). We
   * persist it in session.metadata.photos[] so attorney-routing packages
   * (Phase C/D) can include the actual image, not just Ada's description.
   * Ada's analyze_photo tool reads the URL from the message body, not
   * from this field.
   */
  photo_url?: string;
}

interface FinalPayload {
  assistant_message: string;
  tools_used: string[];
  reading_level: string;
  status: string;
  photo_findings: unknown;
  package_slug: string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Decide response mode up front. SSE clients send Accept: text/event-stream;
  // everything else gets the legacy JSON shape.
  const acceptHeader = String(req.headers['accept'] ?? '');
  const wantsSse = acceptHeader.includes('text/event-stream');

  try {
    const body = readJsonBody<Body>(req);
    if (typeof body.session_id !== 'string' || !body.session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }
    if (typeof body.message !== 'string' || !body.message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (body.message.length > 10_000) {
      return res
        .status(400)
        .json({ error: 'message is too long (max 10,000 chars)' });
    }

    if (body.photo_url !== undefined) {
      if (typeof body.photo_url !== 'string') {
        return res.status(400).json({ error: 'photo_url must be a string' });
      }
      if (
        !body.photo_url.startsWith('https://') &&
        !body.photo_url.startsWith('http://')
      ) {
        return res.status(400).json({ error: 'photo_url must be http(s)' });
      }
      if (body.photo_url.length > 1024) {
        return res.status(400).json({ error: 'photo_url is too long' });
      }
    }

    const ctx = resolveRequestContext(req);
    if (ctx.notFound) {
      return res.status(404).json({ error: 'Organization not found for this host' });
    }

    const clients = makeClientsFromEnv();

    const state = await clients.db.readSession({ sessionId: body.session_id });
    if (!state) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (state.status !== 'active') {
      return res
        .status(400)
        .json({ error: `Session is ${state.status}, cannot accept new messages` });
    }

    // Session-ownership gate (A3). Bind the turn to the originating
    // anon cookie so a leaked session_id (logs, browser history,
    // accidental support forwards) cannot be driven by a third party.
    //
    // Today every session is anon-bound (createSession is only called
    // with userId: null in api/ada/session.ts and the admin preview
    // route). The userId branch fails closed: when user-auth ever
    // lands on this endpoint, that branch must be expanded — defaulting
    // to "reject" prevents silent grant-of-access.
    //
    // The check runs BEFORE the SSE/JSON branch and BEFORE flushHeaders
    // so failure surfaces as a clean JSON 401, not a half-sent SSE
    // response. All failure cases use the same generic 401 body to
    // avoid helping an attacker enumerate which session_ids exist.
    if (state.userId !== null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (state.anonSessionId === null) {
      // Schema CHECK guarantees exactly one of anonSessionId/userId
      // is set, so this is a data-integrity 500, not a 401.
      console.error(
        `Session ${state.sessionId} has neither anonSessionId nor userId`,
      );
      return res.status(500).json({ error: 'Internal error' });
    }
    if (!ctx.anonToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const callerTokenHash = await hashAnonToken(ctx.anonToken);
    const callerAnonSessionId = await clients.db.findAnonSessionByHash(
      callerTokenHash,
    );
    if (
      callerAnonSessionId === null ||
      callerAnonSessionId !== state.anonSessionId
    ) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const org = await clients.db.getOrgByCode(ctx.orgCode ?? 'adall');

    if (wantsSse) {
      await runSseTurn(req, res, clients, state, body, org);
      return;
    }
    return runJsonTurn(res, clients, state, body, org);
  } catch (err) {
    console.error('POST /api/ada/turn failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    // If we already started an SSE response, surface as an error frame;
    // otherwise return a normal 500 JSON.
    if (wantsSse && res.headersSent) {
      writeSseFrame(res, 'error', { error: message });
      res.end();
      return;
    }
    return res.status(500).json({ error: message });
  }
}

// ─── JSON mode (back-compat) ──────────────────────────────────────────────────

type SessionState = NonNullable<Awaited<ReturnType<AdaClients['db']['readSession']>>>;
type OrgRow = Awaited<ReturnType<AdaClients['db']['getOrgByCode']>>;

async function runJsonTurn(
  res: VercelResponse,
  clients: AdaClients,
  state: SessionState,
  body: Body,
  org: OrgRow,
): Promise<VercelResponse> {
  const result = await processAdaTurn({
    clients,
    state,
    input: {
      userMessage: body.message!,
      photoBlobKeys: body.photo_url ? [body.photo_url] : undefined,
    },
    orgDisplayName: org?.displayName ?? 'ADA Legal Link',
    orgAdaIntroPrompt: org?.adaIntroPrompt ?? null,
  });

  const final = await finalizeTurn(clients, result);
  return res.status(200).json(final);
}

// ─── SSE mode ─────────────────────────────────────────────────────────────────

async function runSseTurn(
  req: VercelRequest,
  res: VercelResponse,
  clients: AdaClients,
  state: SessionState,
  body: Body,
  org: OrgRow,
): Promise<void> {
  // SSE headers. X-Accel-Buffering: no defeats reverse-proxy buffering;
  // Cache-Control: no-transform protects against compression-based
  // buffering in front of the function.
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  // flushHeaders gets bytes on the wire before processAdaTurn starts,
  // so the browser knows the stream is alive even if the model takes
  // a moment to start producing tokens.
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Cancel cleanly if the client disconnects mid-stream.
  let aborted = false;
  req.on('close', () => {
    aborted = true;
  });

  try {
    const result = await processAdaTurn({
      clients,
      state,
      input: {
        userMessage: body.message!,
        photoBlobKeys: body.photo_url ? [body.photo_url] : undefined,
        onTextDelta: (delta: string) => {
          if (aborted) return;
          writeSseFrame(res, 'text', { delta });
        },
      },
      orgDisplayName: org?.displayName ?? 'ADA Legal Link',
      orgAdaIntroPrompt: org?.adaIntroPrompt ?? null,
    });

    if (aborted) {
      // Client gave up. Still finalize server-side so session state
      // reflects what the model produced; just don't bother emitting
      // the done frame to nobody.
      await finalizeTurn(clients, result);
      res.end();
      return;
    }

    const final = await finalizeTurn(clients, result);
    writeSseFrame(res, 'done', final);
    res.end();
  } catch (err) {
    console.error('SSE turn failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    if (!aborted) {
      writeSseFrame(res, 'error', { error: message });
    }
    res.end();
  }
}

function writeSseFrame(res: VercelResponse, event: string, data: unknown): void {
  // Minimal SSE: event line, single data line (JSON-encoded so embedded
  // newlines survive), blank line to close the frame. Any write error
  // means the client closed the socket — swallow and let the close
  // handler stop further work.
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    /* socket already closed */
  }
}

// ─── Shared post-turn finalization ────────────────────────────────────────────

async function finalizeTurn(
  clients: AdaClients,
  result: AdaTurnResult,
): Promise<FinalPayload> {
  // Persist the new session state.
  await clients.db.writeSession({ state: result.nextState });

  let packageSlug: string | null = null;

  // On completion, record a quality check row + assemble the session
  // package. Both are wrapped so a failure here cannot block the
  // user-facing response.
  if (result.nextState.status === 'completed') {
    try {
      const qc = runSessionQualityCheck(result.nextState);
      await clients.db.writeSessionQualityCheck({
        sessionId: result.nextState.sessionId,
        passed: qc.passed,
        failures: qc.failures,
        warnings: qc.warnings,
      });
    } catch (qcErr) {
      console.error('quality check write failed', qcErr);
    }

    if (result.nextState.classification) {
      try {
        const toolsInvoked = result.nextState.metadata.tools_invoked ?? [];
        const attorneyMatched = toolsInvoked.some(
          (t) => t.name === 'search_attorneys' && t.result_kind === 'ok',
        );

        let matchedListing = null;
        const boundListingId = result.nextState.listingId;
        if (boundListingId) {
          try {
            const listing = await clients.db.readListingById(boundListingId);
            if (listing) {
              const firm = await clients.db.readLawFirmById(listing.lawFirmId);
              if (firm) {
                matchedListing = {
                  listingSlug: listing.slug,
                  listingTitle: listing.title,
                  listingCategory: listing.category,
                  firmName: firm.name,
                  firmPrimaryContact: firm.primaryContact,
                  firmEmail: firm.email,
                  firmPhone: firm.phone,
                };
              }
            }
          } catch (lookupErr) {
            console.error('matched listing lookup failed', lookupErr);
          }
        }

        const pkg = assemblePackage({
          state: result.nextState,
          attorneyMatched,
          matchedListing,
          knowledgeHits: [], // TODO: thread retrieved chunks from the turn when available
        });
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        await clients.db.writeSessionPackage({
          slug: pkg.slug,
          sessionId: pkg.sessionId,
          payload: pkg,
          classificationTitle: pkg.classification.title,
          generatedAt: pkg.generatedAt,
          expiresAt,
        });
        packageSlug = pkg.slug;
      } catch (pkgErr) {
        console.error('package generation failed', pkgErr);
      }
    }
  }

  const assistantText =
    typeof result.assistantMessage.content === 'string'
      ? result.assistantMessage.content
      : extractText(result.assistantMessage.content);

  return {
    assistant_message: assistantText,
    tools_used: result.toolInvocations.map((t) => t.name),
    reading_level: result.nextState.readingLevel,
    status: result.nextState.status,
    photo_findings: result.photoFindings ?? null,
    package_slug: packageSlug,
  };
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (
      block &&
      typeof block === 'object' &&
      (block as { type?: string }).type === 'text' &&
      typeof (block as { text?: unknown }).text === 'string'
    ) {
      parts.push((block as { text: string }).text);
    }
  }
  return parts.join('');
}
