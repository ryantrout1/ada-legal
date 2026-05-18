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
