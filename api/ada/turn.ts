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
import { assemblePackage } from '../../src/engine/package/assemble.js';
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
    // Messages carry plain text + optional short blob URLs (from
    // /api/ada/upload-photo). 10k chars is ample for both.
    if (body.message.length > 10_000) {
      return res
        .status(400)
        .json({ error: 'message is too long (max 10,000 chars)' });
    }

    // Optional photo URL — validate that it's either absent or a
    // reasonable http(s) URL. We deliberately don't enforce the
    // blob.vercel-storage.com host because the analyze_photo tool
    // accepts any http(s) URL and that flexibility is useful for
    // future cases (eg user-provided existing photos).
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
      input: {
        userMessage: body.message,
        photoBlobKeys: body.photo_url ? [body.photo_url] : undefined,
      },
      orgDisplayName: org?.displayName ?? 'ADA Legal Link',
      orgAdaIntroPrompt: org?.adaIntroPrompt ?? null,
    });

    // Persist the new session state.
    await clients.db.writeSession({ state: result.nextState });

    // Set by the completion block below when a package is generated.
    // Included in the response so the client can link to /s/{slug}.
    let packageSlug: string | null = null;

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

      // Step 18: generate and persist the session package. This is the
      // artifact the user takes away — the /s/{slug} page, the PDF,
      // the demand letter, the routing destinations. Ada's final
      // message will include the slug so the frontend can link to it.
      //
      // Guarded by classification presence; if Ada ends a session
      // without classifying (shouldn't happen per prompt but could on
      // abnormal termination), skip package generation rather than
      // throwing. Wrapped in try/catch so a package failure never
      // blocks the response.
      if (result.nextState.classification) {
        try {
          // Check for an attorney match during the session by scanning
          // tool invocations. searchAttorneys returning hits is the
          // signal we use in routing.
          const toolsInvoked = result.nextState.metadata.tools_invoked ?? [];
          const attorneyMatched = toolsInvoked.some(
            (t) => t.name === 'search_attorneys' && t.result_kind === 'ok',
          );
          const pkg = assemblePackage({
            state: result.nextState,
            attorneyMatched,
            knowledgeHits: [], // TODO: thread retrieved chunks from the turn when available
          });
          // Default 90-day retention.
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
          // Log — do not propagate. The user still gets a conversational
          // ending from Ada even if the package isn't persisted.
          console.error('package generation failed', pkgErr);
        }
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
      package_slug: packageSlug,
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
