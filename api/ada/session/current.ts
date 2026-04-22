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
    // EXCEPTION: a class_action_intake session pre-bound via
    // listing_slug deep-link (Step 26) will have 0 messages at the
    // moment the user lands on /chat. Surface those so the resume
    // probe picks up the correct session instead of the UI clobbering
    // it with a fresh public_ada session.
    const isPreBoundIntake =
      state.sessionType === 'class_action_intake' &&
      state.listingId !== null &&
      messages.length === 0;
    if (messages.length === 0 && !isPreBoundIntake) {
      return res.status(200).json({ session: null });
    }

    return res.status(200).json({
      session: {
        session_id: state.sessionId,
        status: state.status,
        reading_level: state.readingLevel,
        messages,
        is_prebound: isPreBoundIntake,
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
