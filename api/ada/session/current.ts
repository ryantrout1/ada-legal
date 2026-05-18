/**
 * GET /api/ada/session/current
 *
 * Session resume endpoint. Looks at the anon cookie; if the user has
 * an active conversation already, returns it with its full message
 * history so the UI can hydrate where they left off.
 *
 * Why this matters for accessibility:
 *   A chronically-ill, cognitively-different, or motor-impaired user
 *   may need to step away from a conversation for minutes, hours, or
 *   days. They should not have to re-explain their situation when they
 *   come back. The 30-day anon cookie plus this endpoint make that
 *   possible.
 *
 * This endpoint:
 *   - Does NOT mint a new cookie (the caller either has one or doesn't)
 *   - Does NOT create an ada_sessions row (read-only)
 *   - Does NOT create an anon_sessions row (uses findAnonSessionByHash)
 *
 * Response shape:
 *   200 { "session": null }                      — no resumable session
 *   200 { "session": { session_id, status, reading_level, messages: [...] } }
 *
 * Messages are filtered to user/assistant only. Tool_use/tool_result
 * blocks are internal and not part of the user-facing conversation
 * history.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv, resolveRequestContext } from '../../_shared.js';
import { hashAnonToken } from '../../../src/lib/anonCookie.js';
import type { LitigationContext, ReadingLevel } from '../../../src/types/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ctx = resolveRequestContext(req);
    // No cookie at all → no resumable session. This is a normal case
    // for first-time visitors; return null (not an error).
    if (!ctx.anonToken) {
      return res.status(200).json({ session: null });
    }

    const clients = makeClientsFromEnv();
    const tokenHash = await hashAnonToken(ctx.anonToken);
    const anonSessionId = await clients.db.findAnonSessionByHash(tokenHash);
    if (!anonSessionId) {
      // Cookie present but unknown to the DB — likely expired or from
      // a prior database state. Treat as no resumable session.
      return res.status(200).json({ session: null });
    }

    const state = await clients.db.findActiveSessionForAnon(anonSessionId);
    if (!state) {
      return res.status(200).json({ session: null });
    }

    // Project conversation history down to user/assistant messages only.
    // Tool calls are engine-internal; the UI only cares about the
    // bubbles a user saw.
    const messages = state.conversationHistory
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : extractText(m.content),
        timestamp: m.timestamp,
      }))
      // An assistant message that ONLY contains tool calls with no
      // visible text should be skipped — it's internal plumbing.
      .filter((m) => m.content.trim().length > 0);

    // If the resume would show zero visible messages, don't surface
    // it at all — there's nothing for the user to continue from.
    //
    // EXCEPTION 1: a class_action_intake session pre-bound via
    // listing_slug deep-link (Step 26) will have 0 messages at the
    // moment the user lands on /chat. Surface those so the resume
    // probe picks up the correct session instead of the UI clobbering
    // it with a fresh public_ada session.
    //
    // EXCEPTION 2 (Phase 6a): a public_ada session opened via a
    // litigation_id deep-link from the Active Cases detail page also
    // has 0 messages on first /chat load. Same fix — surface it so
    // the resume picks up the bound session and the prompt assembler
    // renders the focused litigation block on Ada's first turn.
    // Otherwise the freshly-created litigation-context session gets
    // orphaned and the user lands in an unbound public_ada session.
    const isPreBoundIntake =
      state.sessionType === 'class_action_intake' &&
      state.listingId !== null &&
      messages.length === 0;
    const isPreBoundLitigation =
      state.sessionType === 'public_ada' &&
      messages.length === 0 &&
      !!state.metadata?.litigation_context;
    const isPreBound = isPreBoundIntake || isPreBoundLitigation;
    if (messages.length === 0 && !isPreBound) {
      return res.status(200).json({ session: null });
    }

    // Phase 6a: for pre-bound litigation sessions, the greeting was
    // generated at POST /api/ada/session creation time and returned in
    // that POST's response — but the chat page reaches /chat via a
    // top-level navigation, so it never sees the POST response. Without
    // a greeting bubble the user lands on an empty chat panel. Rebuild
    // the same greeting here so the resume can seed it.
    let greeting: string | null = null;
    if (isPreBoundLitigation && state.metadata?.litigation_context) {
      greeting = buildLitigationGreeting(
        state.readingLevel,
        state.metadata.litigation_context,
      );
    }

    return res.status(200).json({
      session: {
        session_id: state.sessionId,
        status: state.status,
        reading_level: state.readingLevel,
        messages,
        is_prebound: isPreBound,
        greeting,
      },
    });
  } catch (err) {
    console.error('GET /api/ada/session/current failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
}

/**
 * Pull any text blocks out of a structured content array.
 * Mirrors the same helper in /api/ada/turn.
 */
function extractText(content: unknown): string {
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const block of content) {
    if (block && typeof block === 'object' && 'type' in block) {
      const b = block as { type: string; text?: string };
      if (b.type === 'text' && typeof b.text === 'string') parts.push(b.text);
    }
  }
  return parts.join('\n');
}

/**
 * Phase 6a: rebuild the same case-acknowledgment greeting that
 * POST /api/ada/session produces when litigation_id is set, so the
 * resume probe can seed it into the chat panel. Must stay in sync
 * with the litigationLead/baseGreeting copy in api/ada/session.ts.
 */
function buildLitigationGreeting(
  level: ReadingLevel,
  lc: LitigationContext,
): string {
  const lead =
    level === 'simple'
      ? `You came in about ${lc.case_name}. I can help you figure out if it might apply to you.`
      : `You came in about ${lc.case_name}. I can help you think through whether your situation matches what the case covers.`;
  const base =
    level === 'simple'
      ? `I'm Ada. If a place didn't let you in, or wouldn't help, because something got in your way, I can help. Take your time. Tell me what happened.`
      : level === 'professional'
        ? `I'm Ada. If you encountered a barrier, physical or digital, at a place covered by the ADA, I can help you identify the title that applies and the appropriate next step. Tell me what happened.`
        : `I'm Ada. If a barrier kept you out, at a business, on a website, anywhere a place was supposed to be open to you, I'm here to help you figure out what to do. Take your time. Tell me what happened.`;
  return `${lead} ${base}`;
}
