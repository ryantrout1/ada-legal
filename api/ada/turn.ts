/**
 * POST /api/ada/turn
 *
 * Runs one conversational turn. Takes a session_id + user message,
 * loads the session state, invokes processAdaTurn (which streams from
 * Anthropic internally, dispatches tools, applies state changes),
 * persists the updated session, returns the final assistant message.
 *
 * Non-streaming HTTP in Ch0. The engine already uses an AsyncIterable
 * under the hood; we just collect the final text + tool record and
 * return it as JSON. Streaming transport can be added later (Edge
 * runtime or a framework with proper SSE support) without touching
 * the engine.
 *
 * Request body (JSON):
 *   {
 *     "session_id": "<uuid>",
 *     "message": "<user text>"
 *   }
 *
 * Response:
 *   200 OK
 *   { "assistant_message": "...", "tools_used": ["set_classification", ...],
 *     "reading_level": "standard", "status": "active" | "completed" }
 *
 * Errors:
 *   400 — missing/invalid body
 *   404 — session not found
 *   405 — method not POST
 *   500 — any engine / DB / Anthropic failure
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processAdaTurn } from '../../src/engine/processAdaTurn.js';
import { runSessionQualityCheck } from '../../src/engine/observability/qualityCheck.js';
import {
  makeClientsFromEnv,
  readJsonBody,
  resolveRequestContext,
} from '../_shared.js';

interface Body {
  session_id?: string;
  message?: string;
}

// Vercel's default request body size limit is 4.5 MB. A user-attached
// photo arrives as an inline data URL in the message field and can
// base64-encode to several megabytes. Raise the cap to 8 MB for this
// endpoint until Vercel Blob uploads are wired (follow-up), at which
// point messages will carry only short blob keys and this can drop
// back to the default.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody<Body>(req);
    if (typeof body.session_id !== 'string' || !body.session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }
    if (typeof body.message !== 'string' || !body.message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    // Length cap protects against abuse but must tolerate the photo-attach
    // case, where the message contains an inline data URL. A 2-3MB photo
    // base64-encodes to roughly 3-4MB of characters, so 6MB is a comfortable
    // headroom before we add real Vercel Blob uploads (tracked as follow-up:
    // wire VercelBlobClient and move uploads to /api/ada/upload-photo). Plain
    // text messages are still capped at 10k.
    const hasDataUrl = body.message.includes('data:image/');
    const maxLen = hasDataUrl ? 6_000_000 : 10_000;
    if (body.message.length > maxLen) {
      const limitDesc = hasDataUrl ? '6 MB with photo' : '10,000 chars';
      return res
        .status(400)
        .json({ error: `message is too long (max ${limitDesc})` });
    }

    const ctx = resolveRequestContext(req);
    if (ctx.notFound) {
      return res.status(404).json({ error: 'Organization not found for this host' });
    }

    const clients = makeClientsFromEnv();

    // Load the session.
    const state = await clients.db.readSession({ sessionId: body.session_id });
    if (!state) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Guard against turning a terminal session.
    if (state.status !== 'active') {
      return res
        .status(400)
        .json({ error: `Session is ${state.status}, cannot accept new messages` });
    }

    // Resolve org display name for the prompt.
    const org = await clients.db.getOrgByCode(ctx.orgCode ?? 'adall');

    // Run the turn. processAdaTurn does all the heavy lifting:
    //   - assemble prompt
    //   - stream from Anthropic
    //   - dispatch tools
    //   - apply state changes
    //   - loop up to MAX_TOOL_LOOPS
    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: body.message },
      orgDisplayName: org?.displayName ?? 'ADA Legal Link',
      orgAdaIntroPrompt: org?.adaIntroPrompt ?? null,
    });

    // Persist the new session state.
    await clients.db.writeSession({ state: result.nextState });

    // On completion, record a quality check row. Run inline so any
    // persistence error surfaces in logs immediately; the check itself
    // is pure, fast, and non-blocking for the user. Wrap in a catch
    // because a quality-check failure must never block the response.
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
        // Log — do not propagate.
        console.error('quality check write failed', qcErr);
      }
    }

    // Pull a flat content string from the assistant message. The content
    // field is string | ContentBlock[]; for final messages (no tool_use)
    // it's always a string.
    const assistantText =
      typeof result.assistantMessage.content === 'string'
        ? result.assistantMessage.content
        : extractText(result.assistantMessage.content);

    return res.status(200).json({
      assistant_message: assistantText,
      tools_used: result.toolInvocations.map((t) => t.name),
      reading_level: result.nextState.readingLevel,
      status: result.nextState.status,
      photo_findings: result.photoFindings ?? null,
    });
  } catch (err) {
    console.error('POST /api/ada/turn failed', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ error: message });
  }
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
