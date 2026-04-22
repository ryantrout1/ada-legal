/**
 * Listing context renderer for the prompt assembler.
 *
 * Step 21 (ListingConfig prompt assembly). Produces the LISTING CONTEXT
 * section of Ada's system prompt. Two modes:
 *
 *   Bound mode (full listing context):
 *     When session.sessionType === 'class_action_intake' and listingId
 *     is set, we load the ListingConfig and render the case description,
 *     eligibility criteria, required fields, and any ada_prompt_override
 *     from the firm. Ada becomes an intake specialist for THIS case.
 *
 *   Discovery mode (condensed index):
 *     When session.sessionType === 'public_ada' and there are active
 *     listings, we render a short index of all live listings so Ada
 *     can recognize a match and present candidates to the user. She
 *     never picks for them — the user chooses, then Ada fires
 *     match_listing (Step 20).
 *
 * This module does NOT fetch anything itself. The caller (the prompt
 * assembler) is responsible for loading the data via DbClient. Keeping
 * fetching separate from rendering means this file is pure and
 * trivially testable.
 *
 * Ref: Step 21.
 */

import type {
  ListingRow,
  ListingConfigRow,
  ActiveListingRow,
} from '../clients/types.js';
import type { FieldSpec, EligibilityCriterion } from '../../types/db.js';

// ─── Bound mode ────────────────────────────────────────────────────────────────

export interface BoundListingContext {
  listing: ListingRow;
  config: ListingConfigRow;
}

/**
 * Render the full LISTING CONTEXT section for a bound session. Output
 * is plain markdown, suitable for embedding in the system prompt.
 */
export function renderBoundListingContext(ctx: BoundListingContext): string {
  const { listing, config } = ctx;
  const parts: string[] = [];

  parts.push(
    `You are running an intake for a specific class-action case: **${listing.title}**.`,
  );
  parts.push('');
  parts.push(`## About this case`);
  parts.push(config.caseDescription.trim());
  parts.push('');

  // Eligibility criteria, grouped by kind.
  const criteria = (config.eligibilityCriteria as EligibilityCriterion[]) ?? [];
  if (criteria.length > 0) {
    parts.push(`## Eligibility`);
    const required = criteria.filter((c) => c.kind === 'required');
    const preferred = criteria.filter((c) => c.kind === 'preferred');
    const disqualifying = criteria.filter((c) => c.kind === 'disqualifying');

    if (required.length > 0) {
      parts.push(`**Must be true:**`);
      for (const c of required) parts.push(`- ${c.description}`);
      parts.push('');
    }
    if (preferred.length > 0) {
      parts.push(`**Strengthens the case (not required):**`);
      for (const c of preferred) parts.push(`- ${c.description}`);
      parts.push('');
    }
    if (disqualifying.length > 0) {
      parts.push(`**Disqualifying — if any of these are true, finalize_intake with qualified=false:**`);
      for (const c of disqualifying) parts.push(`- ${c.description}`);
      parts.push('');
    }
  }

  // Hard disqualifying conditions (separate list from criteria, per schema).
  const hardDisqual = (config.disqualifyingConditions ?? []) as string[];
  if (hardDisqual.length > 0) {
    parts.push(`**Immediate disqualifications:**`);
    for (const cond of hardDisqual) parts.push(`- ${cond}`);
    parts.push('');
  }

  // Required fields — what Ada must extract.
  const requiredFields = (config.requiredFields as FieldSpec[]) ?? [];
  if (requiredFields.length > 0) {
    parts.push(`## Fields to collect`);
    parts.push(
      `Use \`extract_field\` with these names only — field names outside this list will be rejected.`,
    );
    parts.push('');
    for (const field of requiredFields) {
      const tags: string[] = [field.type];
      if (field.required) tags.push('required');
      if (field.enum_values && field.enum_values.length > 0) {
        tags.push(`values: ${field.enum_values.join(', ')}`);
      }
      parts.push(`- \`${field.name}\` (${tags.join('; ')}) — ${field.description}`);
      if (field.validation_hint) {
        parts.push(`  *${field.validation_hint}*`);
      }
    }
    parts.push('');
  }

  // Firm-provided override, if any. Appended AFTER the structured
  // context so the firm can add nuance without overriding basics.
  if (config.adaPromptOverride && config.adaPromptOverride.trim().length > 0) {
    parts.push(`## Additional guidance from the firm`);
    parts.push(config.adaPromptOverride.trim());
    parts.push('');
  }

  // Close with the call-to-action that ties this all to the tools.
  parts.push(
    `When you have gathered every required field and the user has confirmed the summary, call \`finalize_intake\` with qualified=true. If during the conversation you determine the user doesn't meet the eligibility criteria, call \`finalize_intake\` with qualified=false and a short disqualifying_reason — do NOT disqualify for missing information, ask the user instead.`,
  );

  return parts.join('\n');
}

// ─── Discovery mode ────────────────────────────────────────────────────────────

/**
 * Render a condensed index of active listings. Used for public_ada
 * sessions so Ada can recognize when a user's situation matches a
 * listing and propose it.
 *
 * Each listing gets title + one-line shortDescription. No eligibility
 * detail — that's only loaded when Ada has actually matched.
 * Truncation here is deliberate: the full context per listing would
 * blow the prompt budget when there are dozens of active cases, and
 * Ada doesn't need the fine-grained criteria to recognize a potential
 * match.
 */
export function renderDiscoveryListingIndex(
  listings: ActiveListingRow[],
): string {
  if (listings.length === 0) return '';

  // Deduplicate by listingId — v_active_listings may return multiple
  // rows per listing if there are multiple active subscriptions.
  const seen = new Set<string>();
  const uniq: ActiveListingRow[] = [];
  for (const row of listings) {
    if (seen.has(row.listingId)) continue;
    seen.add(row.listingId);
    uniq.push(row);
  }

  const parts: string[] = [];
  parts.push(
    `The following class-action cases are currently active on this platform. If a user describes an experience that matches one of them, you may present the case to the user and ask if they'd like to pursue it. Only call \`match_listing\` after they explicitly confirm.`,
  );
  parts.push('');
  for (const row of uniq) {
    const desc = row.shortDescription?.trim() || '(no short description available)';
    parts.push(`- **${row.title}** (listing_id: \`${row.listingId}\`) — ${desc}`);
  }
  return parts.join('\n');
}
