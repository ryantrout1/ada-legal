/**
 * Narrative and summary extractors.
 *
 * These are deterministic functions that pull from session data
 * already present. No new AI calls at package-generation time — the
 * package is a projection of the session, not a new inference.
 *
 * narrative = the user's own words, preserved. Usually the first
 * substantive message the user sent. Never summarized by Ada.
 *
 * summary = a plain-language, user-centered 2-4 sentence recap
 * built from extracted facts + classification. Written in Ada's
 * voice ("You told Ada that...") — never in a legal voice.
 *
 * Ref: Step 18 plan, Commit 3.
 */

import type { Message, Classification, ExtractedFields } from '../../types/db.js';
import { labelFor } from './labels.js';

// ─── Narrative ────────────────────────────────────────────────────────────────

/**
 * Minimum length (chars) for a user message to be considered
 * substantive. Below this is likely a greeting or confirmation, not
 * the story of what happened.
 */
const MIN_NARRATIVE_LENGTH = 40;

/**
 * Extract the user's narrative from conversation history. Returns
 * the first user message that reads like a description of events
 * (length >= MIN_NARRATIVE_LENGTH). If no message meets the bar,
 * falls back to concatenating all user messages. If the history is
 * empty, returns null.
 *
 * Why first substantive message vs. full concatenation: the user's
 * INITIAL telling is the rawest and most important. Later messages
 * in a chat tend to be responses to Ada's follow-ups ("yes",
 * "Tuesday", "3 months ago") — valuable as facts but not as
 * narrative.
 */
export function extractNarrative(history: Message[]): string | null {
  const userMessages = history.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return null;

  for (const msg of userMessages) {
    const text = messageText(msg);
    if (text.length >= MIN_NARRATIVE_LENGTH) {
      return text.trim();
    }
  }

  // No substantive message found — concatenate everything as a fallback.
  const concat = userMessages.map(messageText).join(' ').trim();
  return concat.length > 0 ? concat : null;
}

function messageText(msg: Message): string {
  const raw =
    typeof msg.content === 'string'
      ? msg.content
      : msg.content
          .map((block) => {
            const content = block.content;
            return typeof content === 'string' ? content : '';
          })
          .join(' ');
  return stripEngineAnnotations(raw);
}

/**
 * Remove engine-internal annotations from user message text before
 * showing it to a human.
 *
 * The chat client appends `[User attached a photo. blob_key: <url>]`
 * to user messages so the model can see the photo reference. That's
 * fine for the model, but if it leaks into the summary 'What you
 * told Ada' block it reads as garbled text with a raw URL. Same
 * idea would apply to any future bracketed instruction we send
 * the model — strip them before display.
 *
 * Exported for tests.
 */
export function stripEngineAnnotations(text: string): string {
  // Strip any bracketed annotation that starts with "User attached"
  // or contains "blob_key:" — covers both the current photo wrapper
  // and minor variants. Strip leading/trailing whitespace + newlines
  // around the removed block so the result reads cleanly.
  return text
    .replace(/\s*\[User attached a photo[^\]]*\]\s*/g, ' ')
    .replace(/\s*\[[^\]]*blob_key:[^\]]*\]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Summary ──────────────────────────────────────────────────────────────────

/**
 * Build a plain-language summary from extracted facts + classification.
 * Deterministic — given the same inputs, always returns the same
 * string. No AI call at package time.
 *
 * Tone:
 *   - Addresses the user, in plain language.
 *   - Leads with what the user shared, not what the law says.
 *   - Never predicts outcomes, never names damages.
 *   - Short: 2-4 sentences total.
 *
 * The summary is a readable alternative to scrolling through the
 * whole conversation. It is NOT a legal document.
 */
export function buildSummary(
  facts: ExtractedFields,
  classification: Classification,
): string {
  const label = labelFor(classification.title);
  const parts: string[] = [];

  // Part 1: the situation, in plain language, from extracted facts.
  const situation = describeSituation(facts);
  if (situation) {
    parts.push(`You told Ada that ${situation}.`);
  } else {
    parts.push('You shared your experience with Ada.');
  }

  // Part 2: the classification outcome (plain language).
  if (classification.title === 'out_of_scope' || classification.title === 'none') {
    parts.push(
      'Based on what you described, this does not appear to be an ADA matter, but resources below can still help.',
    );
  } else if (classification.title === 'class_action') {
    parts.push(
      `Ada thinks this may be ${labelLower(label.shortLabel)}. ${label.plainDescription}`,
    );
  } else {
    parts.push(
      `Ada thinks this is ${labelLower(label.shortLabel)}. ${label.plainDescription}`,
    );
  }

  // Part 3: confidence caveat only when low.
  if (classification.tier === 'low') {
    parts.push(
      'Ada is not fully certain about the classification, so talking to someone like a lawyer or an ADA information line can help confirm.',
    );
  }

  return parts.join(' ');
}

/**
 * Turn extracted fields into a plain description of what happened.
 * Returns an empty string when no usable facts are present.
 */
function describeSituation(facts: ExtractedFields): string {
  const pieces: string[] = [];

  const business = fieldString(facts, 'business_name');
  const businessType = fieldString(facts, 'business_type');
  const city = fieldString(facts, 'location_city');
  const state = fieldString(facts, 'location_state');
  const subtype = fieldString(facts, 'violation_subtype');
  const date = fieldString(facts, 'incident_date');

  // Business: "a restaurant called Joe's Diner" or "Joe's Diner" or "a restaurant"
  if (business && businessType) {
    pieces.push(`${articleFor(businessType)} ${businessType.toLowerCase()} called ${business}`);
  } else if (business) {
    pieces.push(business);
  } else if (businessType) {
    pieces.push(`${articleFor(businessType)} ${businessType.toLowerCase()}`);
  }

  // Location
  if (city && state) {
    pieces.push(`in ${city}, ${state}`);
  } else if (state) {
    pieces.push(`in ${state}`);
  }

  // Subtype
  if (subtype) {
    pieces.push(`had a barrier related to ${subtype.toLowerCase()}`);
  }

  // Date
  if (date) {
    pieces.push(`on ${date}`);
  }

  return pieces.join(' ').replace(/\s+/g, ' ').trim();
}

function fieldString(facts: ExtractedFields, key: string): string | null {
  const f = facts[key];
  if (!f) return null;
  if (typeof f.value !== 'string') return null;
  const trimmed = f.value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function articleFor(word: string): string {
  const first = word.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

function labelLower(label: string): string {
  // "Public Accommodation" → "a public accommodation"
  // "Workplace / Employment" → "workplace or employment"
  // "Government Services" → "a government services matter"
  // Handled per known labels; falls back to the raw string.
  const lowered = label.toLowerCase().replace(' / ', ' or ');
  return /^(a|an|the) /.test(lowered) ? lowered : `a ${lowered} matter`;
}
