/**
 * finalize_intake tool.
 *
 * Ch1 (Step 20). Ada calls this when she has gathered everything the
 * listing's ListingConfig demands and the user has approved the
 * summary. finalize_intake is the closing move on a class-action
 * intake — it validates completeness and transitions the session to
 * 'completed' with an outcome recorded.
 *
 * Step 20 scope (what this commit delivers):
 *   - Hard gates: session must be bound to a listing, all listing
 *     required_fields must be present in extracted_fields
 *   - Outcome metadata written (qualified | disqualified)
 *   - Session transitions to 'completed'
 *   - Package generation for the attorney still runs through the
 *     existing package assembler (Step 18) — no changes there
 *
 * Explicitly NOT in Step 20 scope:
 *   - Email delivery to the firm (Step 24: Attorney package handoff)
 *   - Email delivery to the user (Step 24)
 *   - confirm_summary gate (the confirm_summary tool itself doesn't
 *     ship until a later step; for Step 20 we rely on Ada's prompt
 *     discipline)
 *
 * Two outcomes:
 *
 *   qualified=true
 *     - All required_fields present
 *     - Session completes with metadata.outcome='qualified'
 *     - Step 24 will later trigger a firm email from this state
 *
 *   qualified=false
 *     - Ada explicitly tells us the user doesn't meet the listing's
 *       eligibility (e.g. jurisdiction mismatch, timing, etc.)
 *     - disqualifying_reason is required (Ada supplies it)
 *     - Session completes with metadata.outcome='disqualified'
 *     - No firm email ever, even after Step 24
 *     - The user still gets the summary page (Step 18) — it just
 *       won't include a firm handoff card
 *
 * Ref: Step 20, Commit 1.
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import type { FieldSpec } from '../../../types/db.js';

interface FinalizeIntakeInput {
  qualified: boolean;
  disqualifying_reason?: string | null;
}

export const finalizeIntakeTool: AdaTool<FinalizeIntakeInput> = {
  name: 'finalize_intake',
  description:
    "Close out a class-action intake session. Call this ONLY when: " +
    "(1) the session is already bound to a listing via match_listing, " +
    "(2) you have extracted every required field the listing demands, and " +
    "(3) you have shown the user a summary and they have confirmed it. " +
    "Set qualified=true if the user meets the listing's eligibility. " +
    "Set qualified=false (with a disqualifying_reason) if you determined during the conversation " +
    "that the user falls outside the listing's criteria — e.g. wrong jurisdiction, " +
    "timing bars, or disqualifying conditions. Do NOT disqualify for missing information; " +
    "if you don't have a field, ask the user. Disqualification is for true eligibility misses.",
  inputSchema: {
    type: 'object',
    properties: {
      qualified: {
        type: 'boolean',
        description:
          'True if the user meets the listing\'s eligibility criteria. False if they don\'t.',
      },
      disqualifying_reason: {
        type: ['string', 'null'],
        description:
          "Required when qualified=false. A short plain-language reason " +
          "(e.g. 'claim is outside Arizona jurisdiction'). The user sees this; keep it " +
          "neutral and non-judgmental. Leave null when qualified=true.",
      },
    },
    required: ['qualified'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('finalize_intake: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.qualified !== 'boolean') {
      throw new Error('finalize_intake: qualified must be a boolean');
    }
    let reason: string | null = null;
    if (r.disqualifying_reason !== undefined && r.disqualifying_reason !== null) {
      if (typeof r.disqualifying_reason !== 'string') {
        throw new Error(
          'finalize_intake: disqualifying_reason must be a string or null',
        );
      }
      reason = r.disqualifying_reason;
    }
    if (!r.qualified && (!reason || reason.trim() === '')) {
      throw new Error(
        'finalize_intake: disqualifying_reason is required when qualified=false',
      );
    }
    return {
      qualified: r.qualified,
      disqualifying_reason: reason,
    };
  },
  async execute(ctx: ToolExecuteContext, input): Promise<ToolResult> {
    // Gate 1: session must be bound to a listing.
    if (!ctx.state.listingId) {
      return {
        ok: false,
        error:
          'finalize_intake can only run on a session bound to a listing. Call match_listing first.',
      };
    }
    if (ctx.state.sessionType !== 'class_action_intake') {
      return {
        ok: false,
        error: `finalize_intake requires session_type='class_action_intake' (got ${ctx.state.sessionType}).`,
      };
    }

    // Gate 2: all required fields must be present in extracted_fields.
    // Skip the completeness check when qualified=false — if Ada is
    // disqualifying, she doesn't need to have finished the intake;
    // in fact asking the user to answer more questions they'd have
    // been disqualified on would be cruel and pointless.
    if (input.qualified) {
      const config = await ctx.clients.db.readListingConfigForListing(
        ctx.state.listingId,
      );
      if (!config) {
        return {
          ok: false,
          error: `No ListingConfig found for listing ${ctx.state.listingId}. The firm has not finished setting up this listing.`,
        };
      }
      const requiredFields = (config.requiredFields as FieldSpec[]).filter(
        (f) => f.required,
      );
      const missing: string[] = [];
      for (const field of requiredFields) {
        const entry = ctx.state.extractedFields[field.name];
        if (
          !entry ||
          entry.value === null ||
          entry.value === undefined ||
          entry.value === ''
        ) {
          missing.push(field.name);
        }
      }
      if (missing.length > 0) {
        return {
          ok: false,
          error: `finalize_intake: required fields missing — ${missing.join(', ')}. Ask the user for these before finalizing.`,
        };
      }
    }

    // Success — transition to completed with outcome recorded.
    // The session package generator (Step 18, in api/ada/turn.ts) will
    // pick up the completed state and assemble the package.
    const outcome = input.qualified ? 'qualified' : 'disqualified';
    return {
      ok: true,
      content: {
        finalized: true,
        outcome,
        disqualifying_reason: input.disqualifying_reason,
      },
      stateChanges: {
        sessionTransition: 'complete',
        metadataPatch: {
          outcome,
          ...(input.disqualifying_reason
            ? { abandoned_at_step: `disqualified: ${input.disqualifying_reason}` }
            : {}),
        },
      },
    };
  },
};
