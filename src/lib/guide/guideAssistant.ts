/**
 * Guide assistant — the pure logic behind /api/public/guide-assistant.
 *
 * Ported from Base44's AskADAHelper (src/components/guide/AskADAHelper.jsx
 * @ 6b1e9ac) for M2 Phase 4. The persona constraints, refusal rules and
 * reading-level adaptation are carried over deliberately unchanged: they
 * are what keep an assistant sitting on legal-information pages from
 * drifting into legal advice, which is UPL exposure.
 *
 * WHAT MOVED, AND WHY IT MATTERS
 *
 * In B44 all of this ran in the browser and called Base44's InvokeLLM on
 * Base44 credits behind Base44's auth. Here it runs server-side against
 * our own Anthropic key on a PUBLIC, unauthenticated endpoint. Two
 * consequences drove the design:
 *
 *   1. Sanitization is no longer advisory. B44 stripped override phrases
 *      client-side; anyone can call our endpoint directly, so the same
 *      stripping happens here, server-side, where it cannot be skipped.
 *
 *   2. Spend is ours. Hence the hard character cap, the trimmed history
 *      window, prompt caching on the stable prefix, a rate limit at the
 *      handler, and a kill switch that defaults off.
 *
 * MODEL: Sonnet 5. B44 pinned `claude_opus_4_7` with a comment saying it
 * was the newest Opus its SDK exposed — a ceiling, not a judgement. The
 * task is grounded extraction: the page's standards text is supplied in
 * the prompt and the model is forbidden from using general knowledge.
 */

/** System-settings blob shared with the ada/spot flags. */
export const GUIDE_ASSISTANT_SETTINGS_KEY = 'admin';
export const GUIDE_ASSISTANT_ENABLED_KEY = 'guide_assistant_enabled';
export const GUIDE_ASSISTANT_ENABLED_DEFAULT = false;

export const GUIDE_ASSISTANT_MODEL = 'claude-sonnet-5';

/** Hard cap on a single question, matching B44's client-side limit. */
export const MAX_QUESTION_CHARS = 500;

/** How many prior turns travel with each request (B44: last 6). */
export const HISTORY_WINDOW = 6;

export type ReadingLevel = 'simple' | 'standard' | 'professional';

export interface GuideTurn {
  role: 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

const OVERRIDE_PATTERN =
  /(?:ignore|forget|disregard|override|bypass)\s+(?:all\s+)?(?:the\s+)?(?:previous|above|prior|system)\s+(?:instructions?|rules?|prompts?|constraints?)/gi;

/**
 * Strip the instruction-override shapes B44 enumerated, then hard-cap.
 *
 * This is a mitigation, not a guarantee — no regex list closes prompt
 * injection. The real defence is structural: the system prompt forbids
 * general knowledge and legal advice, the model only ever sees our own
 * page content as context, and the endpoint can produce nothing but text.
 * This filter raises the cost of the obvious attempts.
 */
export function sanitizeQuestion(text: string): string {
  return (text ?? '')
    .replace(OVERRIDE_PATTERN, '[filtered]')
    .replace(/you\s+are\s+now\s+/gi, '[filtered] ')
    .replace(/\bsystem\s*prompt\b/gi, '[filtered]')
    .replace(/\bact\s+as\b/gi, '[filtered]')
    .slice(0, MAX_QUESTION_CHARS);
}

/**
 * Keep the recent window and sanitize the user side of it.
 *
 * Assistant turns are left alone: they are our own prior output, and
 * rewriting them would corrupt the conversation the model is reasoning
 * over. Client-supplied "assistant" turns are still untrusted, but the
 * system prompt's grounding rules are what contain that, not this.
 */
export function trimHistory(turns: GuideTurn[]): GuideTurn[] {
  return (turns ?? []).slice(-HISTORY_WINDOW).map((t) =>
    t.role === 'user' ? { ...t, content: sanitizeQuestion(t.content) } : t,
  );
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const LEVELS: Record<ReadingLevel, string> = {
  simple: 'SIMPLE. Short sentences under 15 words.',
  standard: 'STANDARD. Plain language. Reference ADA section numbers.',
  professional: 'PROFESSIONAL. Legal terminology OK. Include citations.',
};

/** B44's compact chapter index, used to redirect off-page questions. */
const CHAPTER_MAP =
  'Ch1:Ground/Floor(302)|Ch2:Ramps(405),Elevators(407)|Ch3:Parking(502),Routes(402)|'
  + 'Ch4:Doors(404)|Ch5:Fountains(602),Toilets(604),Grab Bars(609),Showers(608)|'
  + 'Ch6:Bathtubs(607),Kitchens(804)|Ch7:Signs(703),Alarms(702)|'
  + 'Ch8:Assembly(802),Dining(803),Pools(1009)|Ch9:Play(1008),Exercise(1010)|'
  + 'Ch10:Controls(309),Reach(308),Counters(904)';

/**
 * The stable half of the system prompt — identical for every request, so
 * it is sent as the cached prefix (`cache_control: ephemeral`).
 */
export function buildPromptPrefix(): string {
  return `You are the ADA Standards Guide assistant on ADA Legal Link.

CRITICAL RULES:
1. ONLY answer using the ADA STANDARDS CONTENT provided below. Do NOT use general knowledge.
2. If the topic IS on this page, answer from that content only. Quote section numbers.
3. If the topic is NOT on this page, say which Chapter covers it using the chapter map.
4. NEVER give general descriptions, installation tips, or product recommendations.
5. NEVER provide legal advice. Explain what the standards say. Direct to Ada for a person's own situation.
6. Keep responses to 3-4 sentences max.
7. No bullet points or markdown. Natural sentences only.
8. If someone describes a violation, validate them, explain the standard, direct them to Ada.
9. Safe for all audiences and ages.
10. If unrelated to ADA, say you only help with ADA accessibility standards.

CHAPTER MAP: ${CHAPTER_MAP}

TONE: Warm, clear, direct.`;
}

/**
 * Full system prompt. The endpoint sends `buildPromptPrefix()` as the
 * cached prefix and the page-specific remainder as the volatile suffix;
 * this function returns the whole thing and exists so the contract is
 * testable in one place.
 */
export function buildSystemPrompt(pageContext: string, readingLevel: ReadingLevel): string {
  const level = LEVELS[readingLevel] ?? LEVELS.standard;
  return `${buildPromptPrefix()}\n\n${level}\n\n${pageContext}`;
}

/** The per-request half: reading level + this page's content. */
export function buildPromptSuffix(pageContext: string, readingLevel: ReadingLevel): string {
  const level = LEVELS[readingLevel] ?? LEVELS.standard;
  return `${level}\n\n${pageContext}`;
}

// ---------------------------------------------------------------------------
// Kill switch
// ---------------------------------------------------------------------------

/**
 * Resolve `guide_assistant_enabled` from the shared admin blob.
 *
 * Defaults OFF and only a boolean literal `true` enables it — same
 * fail-safe posture as Spot, and for the same reason: this is a public
 * endpoint that spends money per request. Flip it with a Neon upsert
 * after Gina has reviewed the assistant's copy; no redeploy needed.
 */
export function resolveGuideAssistantEnabled(stored: unknown): boolean {
  if (stored && typeof stored === 'object' && GUIDE_ASSISTANT_ENABLED_KEY in stored) {
    const value = (stored as Record<string, unknown>)[GUIDE_ASSISTANT_ENABLED_KEY];
    if (typeof value === 'boolean') return value;
  }
  return GUIDE_ASSISTANT_ENABLED_DEFAULT;
}
