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

import type { LitigationRow } from '../clients/types.js';

/**
 * Render a condensed index of active class actions and mass actions.
 *
 * Each row gets a one-line entry with:
 *   - case name
 *   - kind (class | mass)
 *   - jurisdiction signal (court + affected_states, when present)
 *   - one-line eligibility summary (truncated)
 *
 * Designed to fit in Ada's prompt budget — we cap rows in the caller
 * (LIMIT 20 by default in listActiveLitigation), and each entry is
 * kept short. Ada uses this index to recognize when a user's situation
 * may match an active case and surface it; she never picks for them.
 */
export function renderActiveLitigationIndex(
  litigation: LitigationRow[],
): string {
  if (litigation.length === 0) return '';

  const parts: string[] = [];
  parts.push(
    `The following class actions and mass actions are currently active. If a user describes an experience that matches one of them, you may surface the case to the user, briefly explain it, and ask if they'd like more information. You do not enroll users in cases — that's the attorney's job. You're recognizing a potential match.`,
  );
  parts.push('');

  for (const row of litigation) {
    const kindLabel = row.kind === 'class' ? 'class action' : 'mass action';
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
 */
export function renderFocusedLitigation(row: LitigationRow): string {
  const kindLabel = row.kind === 'class' ? 'class action' : 'mass action';
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

  return parts.join('\n');
}
