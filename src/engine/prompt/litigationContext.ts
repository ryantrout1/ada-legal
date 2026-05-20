/**
 * Litigation context renderer for the prompt assembler.
 *
 * Phase 2 of /plan ADALL Admin. Produces the LITIGATION CONTEXT section
 * of Ada's system prompt for public_ada sessions, mirroring the
 * pattern in listingContext.ts.
 *
 * The renderer is pure — it does not fetch. The caller (the prompt
 * assembler) loads active litigation rows via DbClient.listActiveLitigation
 * and passes them in.
 *
 * Output for an empty list is the empty string, so the prompt builder
 * can include the section unconditionally without producing a stub
 * header when there's nothing to surface.
 *
 * Ref: /plan Phase 2, acceptance criterion #5
 */

import type { LitigationKind, LitigationRow } from '../clients/types.js';

/**
 * Phase C3b-i: human-readable labels for each litigation kind. The
 * pre-C3b code used a `'class' ? 'class action' : 'mass action'`
 * binary that mislabeled every non-class row in the LITIGATION CONTEXT
 * section of Ada's prompt. The map below covers the full LitigationKind
 * enum (5 values as of Phase A1).
 *
 * Used by both renderActiveLitigationIndex (the catalog) and
 * renderFocusedLitigation (the focused block).
 */
const KIND_LABELS: Record<LitigationKind, string> = {
  class: 'class action',
  enforcement_action: 'DOJ enforcement',
  consent_decree: 'consent decree',
  pattern_of_practice: 'pattern of practice',
  regulatory_challenge: 'regulatory challenge',
};

function labelForKind(kind: LitigationKind): string {
  return KIND_LABELS[kind] ?? 'litigation';
}

/**
 * Render a condensed index of active and other surface-visible
 * litigation rows (class actions, DOJ enforcement, consent decrees,
 * patterns of practice, regulatory challenges).
 *
 * Each row gets a one-line entry with:
 *   - case name
 *   - kind label (one of the 5 LitigationKind enum values)
 *   - jurisdiction signal (court + affected_states, when present)
 *   - one-line eligibility summary (truncated)
 *
 * Designed to fit in Ada's prompt budget. Ada uses this index to
 * recognize when a user's situation may match an active case and
 * surface it; she never picks for them.
 */
export function renderActiveLitigationIndex(
  litigation: LitigationRow[],
): string {
  if (litigation.length === 0) return '';

  const parts: string[] = [];
  parts.push(
    `The following litigation is currently active, settled-and-being-monitored, under DOJ investigation, or being tracked as a regulatory challenge. If a user describes an experience that matches one of them, you may surface the case to the user, briefly explain it, and ask if they'd like more information. You do not enroll users in cases — that's the attorney's job. You're recognizing a potential match.`,
  );
  parts.push('');

  for (const row of litigation) {
    const kindLabel = labelForKind(row.kind);
    const states =
      row.affectedStates.length > 0 ? row.affectedStates.join(', ') : 'nationwide';
    const jurisdictionParts: string[] = [states];
    if (row.court) jurisdictionParts.push(row.court);

    const eligibility = (row.eligibility ?? row.shortDescription ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    const eligibilityShort =
      eligibility.length > 160 ? eligibility.slice(0, 157) + '…' : eligibility;
    const eligibilityClause = eligibilityShort ? ` Eligibility: ${eligibilityShort}` : '';

    parts.push(
      `- **${row.caseName}** (${kindLabel}, ${jurisdictionParts.join(' / ')}) — id: \`${row.id}\`.${eligibilityClause}`,
    );
  }

  return parts.join('\n');
}

/**
 * Phase 6a: render a focused intro block for a single litigation row
 * the user clicked into before opening the chat. Used when the
 * session's metadata.litigation_context is set.
 *
 * The block frames the case as the user's starting point ("they came
 * in already interested in this case") so Ada's first turn can
 * acknowledge it by name without having to discover it through
 * conversation. Ada is still expected to confirm the user's situation
 * actually matches the case eligibility — the deep-link expresses
 * interest, not enrollment.
 *
 * Output is plain markdown, embedded in the LITIGATION CONTEXT section
 * ahead of the standard active-cases index. The focused row is filtered
 * out of the index by the assembler so it doesn't appear twice.
 *
 * Phase C3b-ii: when the bound row has a populated
 * `ada_qualifying_questions` JSONB, append two sub-blocks:
 *
 *   QUALIFYING QUESTIONS — the questions Ada walks the user through
 *     one at a time. Each entry surfaces prompt + purpose so Ada can
 *     frame her ask with the legal reasoning behind it.
 *
 *   VOICE GUIDANCE — case-specific conversational direction
 *     (off-ramp rules, validation cues, redirect criteria) authored
 *     in the migration that populated the row.
 *
 * The JSONB shape is intentionally loose at the type level
 * (Record<string, unknown>), so renderQualifyingQuestionsBlock /
 * renderVoiceGuidanceBlock narrow defensively — a malformed payload
 * surfaces no sub-block rather than throwing.
 */
export function renderFocusedLitigation(row: LitigationRow): string {
  const kindLabel = labelForKind(row.kind);
  const parts: string[] = [];

  parts.push(
    `The user came in about **${row.caseName}** — a ${kindLabel} they were reading about on the public Active Cases page. Treat this as their starting point. Acknowledge the case by name in your first response, then confirm whether their situation actually matches the eligibility criteria below before discussing next steps.`,
  );
  parts.push('');

  parts.push(`**Case:** ${row.caseName}`);

  if (row.defendants.length > 0) {
    parts.push(`**Defendants:** ${row.defendants.join(', ')}`);
  }

  const jurisdictionParts: string[] = [];
  if (row.affectedStates.length > 0) {
    jurisdictionParts.push(row.affectedStates.join(', '));
  } else {
    jurisdictionParts.push('nationwide');
  }
  if (row.court) jurisdictionParts.push(row.court);
  if (row.docketNumber) jurisdictionParts.push(`docket ${row.docketNumber}`);
  parts.push(`**Jurisdiction:** ${jurisdictionParts.join(' / ')}`);

  if (row.filingDate) {
    parts.push(`**Filed:** ${row.filingDate}`);
  }

  if (row.eligibility) {
    parts.push('');
    parts.push(`**Eligibility:** ${row.eligibility.replace(/\s+/g, ' ').trim()}`);
  }

  if (row.shortDescription) {
    parts.push('');
    parts.push(row.shortDescription.replace(/\s+/g, ' ').trim());
  }

  // Phase C3b-ii — append the qualifying-question + voice-guidance
  // sub-blocks when the JSONB carries them. Defensive narrowing inside
  // the helpers; malformed payloads simply produce no sub-block.
  const qBlock = renderQualifyingQuestionsBlock(row.adaQualifyingQuestions);
  if (qBlock) {
    parts.push('');
    parts.push(qBlock);
  }
  const vBlock = renderVoiceGuidanceBlock(row.adaQualifyingQuestions);
  if (vBlock) {
    parts.push('');
    parts.push(vBlock);
  }

  return parts.join('\n');
}

/**
 * Phase C3b-ii — render the QUALIFYING QUESTIONS sub-block from the
 * `ada_qualifying_questions` JSONB. Returns the empty string when
 * the JSONB is missing, malformed, or carries an empty questions
 * array. Each question must be an object with a `prompt` string;
 * `purpose` is appended when present.
 */
function renderQualifyingQuestionsBlock(
  raw: Record<string, unknown> | null | undefined,
): string {
  if (!raw || typeof raw !== 'object') return '';
  const questions = (raw as Record<string, unknown>).questions;
  if (!Array.isArray(questions) || questions.length === 0) return '';

  const lines: string[] = [];
  lines.push('**QUALIFYING QUESTIONS** — walk the user through these one at a time, in order. Confirm understanding before moving to the next. Do not batch them.');

  let rendered = 0;
  for (const q of questions) {
    if (!q || typeof q !== 'object') continue;
    const entry = q as Record<string, unknown>;
    const prompt = typeof entry.prompt === 'string' ? entry.prompt.trim() : '';
    if (!prompt) continue;
    rendered += 1;
    const purpose = typeof entry.purpose === 'string' ? entry.purpose.trim() : '';
    if (purpose) {
      lines.push(`${rendered}. ${prompt} _(purpose: ${purpose})_`);
    } else {
      lines.push(`${rendered}. ${prompt}`);
    }
  }

  if (rendered === 0) return '';
  return lines.join('\n');
}

/**
 * Phase C3b-ii — render the VOICE GUIDANCE sub-block from the
 * `ada_qualifying_questions.voice_guidance` field. Returns the empty
 * string when the field is missing or not a non-empty string.
 */
function renderVoiceGuidanceBlock(
  raw: Record<string, unknown> | null | undefined,
): string {
  if (!raw || typeof raw !== 'object') return '';
  const vg = (raw as Record<string, unknown>).voice_guidance;
  if (typeof vg !== 'string') return '';
  const trimmed = vg.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return `**VOICE GUIDANCE** — ${trimmed}`;
}
