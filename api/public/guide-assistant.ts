/**
 * POST /api/public/guide-assistant
 *
 * The Standards Guide AI helper, moved off Base44 credits onto our own
 * Anthropic engine (M2 Phase 4). Streams a short, grounded answer about
 * the ADA standards content on the page the reader is looking at.
 *
 * This is the first PUBLIC, unauthenticated LLM endpoint on the platform,
 * so the posture is deliberately conservative:
 *
 *   - Kill switch (`guide_assistant_enabled`) defaults OFF. Flip via a
 *     Neon upsert once Gina has reviewed the copy; no redeploy.
 *   - Rate limited per identity (IP + coarsened user agent) on two sliding
 *     windows. Runs BEFORE the SSE headers are written, so a rejection is a
 *     clean JSON 429 rather than a half-open stream. Spot's own limiter
 *     documents the same ordering requirement.
 *   - Question hard-capped at 500 chars and sanitized server-side; the
 *     browser's stripping is a hint, not a control, once anyone can POST.
 *   - History trimmed to 6 turns so a long thread cannot inflate spend.
 *   - Prompt caching on the stable prefix (the persona + rules + chapter
 *     map), which is identical on every request; only the reading level
 *     and the page's content vary.
 *   - Sonnet 5: grounded extraction from supplied context, on a per-question
 *     public surface. See src/lib/guide/guideAssistant.ts.
 *
 * Request:  { question, pageContext, pageTitle?, readingLevel?, history? }
 * Response: text/event-stream — `data: {"text": "..."}` deltas, then
 *           `data: {"done": true}`. Errors arrive as `data: {"error": ...}`
 *           when the stream has already opened, or as JSON before it has.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { applyCors } from '../_cors.js';
import { deriveRateLimitKey } from '../../src/lib/spot/spotRateLimitKey.js';
import {
  GUIDE_ASSISTANT_BUCKET,
  checkRateLimit,
} from '../../src/lib/rateLimit/apiRateLimit.js';
import { makeApiRateLimitStore } from '../../src/lib/rateLimit/apiRateLimitStore.js';
import {
  GUIDE_ASSISTANT_MODEL,
  GUIDE_ASSISTANT_SETTINGS_KEY,
  MAX_QUESTION_CHARS,
  buildPromptPrefix,
  buildPromptSuffix,
  resolveGuideAssistantEnabled,
  sanitizeQuestion,
  trimHistory,
  type GuideTurn,
  type ReadingLevel,
} from '../../src/lib/guide/guideAssistant.js';

export const config = { maxDuration: 30 };

/** Page context is our own content, but cap it so a caller cannot paste a novel. */
const MAX_CONTEXT_CHARS = 12_000;

const READING_LEVELS: ReadonlySet<string> = new Set(['simple', 'standard', 'professional']);

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return raw?.split(',')[0]?.trim() || '0.0.0.0';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const rawQuestion = typeof body.question === 'string' ? body.question : '';
  const question = sanitizeQuestion(rawQuestion).trim();
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  const pageContext =
    typeof body.pageContext === 'string' ? body.pageContext.slice(0, MAX_CONTEXT_CHARS) : '';
  if (!pageContext) {
    // Without page content the model has nothing to ground on, and rule 1
    // forbids answering from general knowledge. Refuse rather than let it
    // improvise.
    return res.status(400).json({ error: 'pageContext is required' });
  }

  const readingLevel: ReadingLevel = READING_LEVELS.has(String(body.readingLevel))
    ? (body.readingLevel as ReadingLevel)
    : 'standard';

  const history: GuideTurn[] = Array.isArray(body.history)
    ? trimHistory(
        (body.history as unknown[])
          .filter(
            (t): t is GuideTurn =>
              !!t
              && typeof t === 'object'
              && (('role' in t && (t as GuideTurn).role === 'user')
                || (t as GuideTurn).role === 'assistant')
              && typeof (t as GuideTurn).content === 'string',
          )
          .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_QUESTION_CHARS) })),
      )
    : [];

  let clients;
  try {
    clients = makeClientsFromEnv();
  } catch {
    return res.status(500).json({ error: 'Service unavailable' });
  }

  // Kill switch — checked before any spend.
  try {
    const stored = await clients.db.getSystemSetting<Record<string, unknown>>(
      GUIDE_ASSISTANT_SETTINGS_KEY,
    );
    if (!resolveGuideAssistantEnabled(stored)) {
      return res.status(503).json({ error: 'The guide assistant is not available right now.' });
    }
  } catch {
    // A settings read failure must fail closed: an unreadable flag is not
    // permission to spend.
    return res.status(503).json({ error: 'The guide assistant is not available right now.' });
  }

  // Throttle before spending. Every gate above this point returns a clean
  // JSON status; once the headers below are written the status is already
  // 200 and a rejection would have to travel as a stream event.
  const rateKey = deriveRateLimitKey(
    clientIp(req),
    (req.headers['user-agent'] as string) ?? '',
  );
  const limit = await checkRateLimit(
    makeApiRateLimitStore(),
    GUIDE_ASSISTANT_BUCKET,
    rateKey,
  );
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return res.status(429).json({
      error: "That's a lot of questions in a short time. Give it a few minutes and try again — the guide below has the answer to most of them.",
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // These answers are per-question and must never be cached at the edge.
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    // The engine's Message carries a timestamp; these turns are transient
    // (nothing about this endpoint is persisted), so stamp them at send.
    const now = new Date().toISOString();
    const messages = [...history, { role: 'user' as const, content: question }].map((t) => ({
      role: t.role,
      content: t.content,
      timestamp: now,
    }));

    const stream = clients.ai.stream({
      systemPromptCachePrefix: buildPromptPrefix(),
      systemPrompt: buildPromptSuffix(pageContext, readingLevel),
      messages,
      tools: [],
      maxTokens: 400, // 3-4 sentences; a ceiling, not a target
      model: GUIDE_ASSISTANT_MODEL,
    });

    let emitted = false;
    for await (const chunk of stream) {
      if (chunk.type === 'text_delta' && chunk.content) {
        emitted = true;
        send({ text: chunk.content });
      }
    }

    if (!emitted) {
      send({ error: "I wasn't able to answer that. Could you try rephrasing?" });
    }
    send({ done: true });
    res.end();
  } catch {
    // The stream is already open, so the error has to travel as an event
    // rather than a status code.
    send({ error: 'Something went wrong. Please try again.' });
    send({ done: true });
    res.end();
  }
}
