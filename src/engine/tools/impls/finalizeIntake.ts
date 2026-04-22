/**
 * finalize_intake tool.
 *
 * Ch1 (Step 20). Ada calls this when she has gathered everything the
 * listing's ListingConfig demands and the user has approved the
 * summary. finalize_intake is the closing move on a class-action
 * intake — it validates completeness and transitions the session to
 * 'completed' with an outcome recorded.
 *
 * Step 24 adds the email handoff on top of the Step 20 base:
 *   - Assemble an AttorneyPackage from session + listing + firm + config
 *   - For qualified intakes: render + upload transcript PDF, send firm email
 *   - For all intakes: send user confirmation email (no transcript link)
 *   - Emails fail soft — a Resend outage won't block the session from
 *     completing. The structured_output + metadata.outcome are the
 *     source-of-truth for "the handoff happened".
 *
 * Two outcomes:
 *
 *   qualified=true
 *     - All required_fields present
 *     - Session completes with metadata.outcome='qualified'
 *     - Firm email fires (with transcript link)
 *     - User confirmation email fires
 *
 *   qualified=false
 *     - Ada explicitly tells us the user doesn't meet the listing's
 *       eligibility (e.g. jurisdiction mismatch, timing, etc.)
 *     - disqualifying_reason is required (Ada supplies it)
 *     - Session completes with metadata.outcome='disqualified'
 *     - NO firm email
 *     - User email fires with the disqualified copy + reason
 *     - The user still gets the summary page (Step 18) — it just
 *       won't include a firm handoff card
 *
 * Idempotency: if the session is already completed when finalize_intake
 * runs, it's a no-op. The first finalize wins; a second call (from a
 * retry or a bug) returns a success-shaped result without re-sending
 * emails or re-generating the PDF.
 *
 * Ref: Step 20 (base) + Step 24 (email + PDF handoff).
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import type { FieldSpec } from '../../../types/db.js';
import { assembleAttorneyPackage } from '../../handoff/attorneyPackage.js';
import {
  renderFirmEmail,
  renderUserEmail,
} from '../../handoff/emailTemplates.js';
import { renderAndUploadTranscript } from '../../handoff/transcriptPdf.js';

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
    // Idempotency guard: if the session is already completed, don't
    // re-send emails. Return a success-shaped result so the model's
    // tool-result handler doesn't trip.
    if (ctx.state.status === 'completed') {
      return {
        ok: true,
        content: {
          finalized: true,
          already_finalized: true,
          outcome: ctx.state.metadata.outcome ?? 'unknown',
        },
      };
    }

    // is_test short-circuit (Step 25 Commit 5).
    //
    // Preview/sandbox sessions must NOT fire real side effects:
    //   - No transcript PDF (no Blob upload)
    //   - No firm email (Resend would charge, firms would be confused)
    //   - No user email (same)
    //
    // Instead we write a synthetic handoff receipt marked is_test=true
    // and transition to completed. The admin previewing gets the exact
    // same finalized UX — Ada reports finalized=true, the session-end
    // card renders — without any outbound calls.
    //
    // Gates 1 & 2 below (listing bound + required-fields complete) are
    // intentionally skipped: the whole point of preview is that the
    // admin can stop the flow at any point and see what would happen.
    // Validation failures would be noise in an environment where the
    // admin's goal is to exercise Ada, not to satisfy the gates.
    if (ctx.state.isTest) {
      const outcome = input.qualified ? 'qualified' : 'disqualified';
      // Cast for same reason as the main path below (line ~290): the
      // handoff receipt shape lives in metadata as free-form JSON and
      // is not declared in SessionMetadata.
      const testHandoffMeta: Record<string, unknown> = {
        outcome,
        handoff: {
          is_test: true,
          firm_email_id: null,
          firm_email_error: 'skipped: is_test session',
          user_email_id: null,
          user_email_error: 'skipped: is_test session',
          transcript_url: null,
          transcript_error: 'skipped: is_test session',
          generated_at: ctx.clients.clock.now().toISOString(),
        },
      };
      return {
        ok: true,
        content: {
          finalized: true,
          is_test: true,
          outcome,
          disqualifying_reason: input.disqualifying_reason,
          firm_email_sent: false,
          user_email_sent: false,
          transcript_generated: false,
        },
        stateChanges: {
          sessionTransition: 'complete',
          metadataPatch: testHandoffMeta,
        },
      };
    }

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
    const config = await ctx.clients.db.readListingConfigForListing(
      ctx.state.listingId,
    );
    if (!config) {
      return {
        ok: false,
        error: `No ListingConfig found for listing ${ctx.state.listingId}. The firm has not finished setting up this listing.`,
      };
    }
    if (input.qualified) {
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

    // Fetch the listing + firm so we have firm name + email addresses
    // for the handoff. If either is missing, fail hard — this is a
    // data-setup problem, not a runtime hiccup.
    const listing = await ctx.clients.db.readListingById(ctx.state.listingId);
    if (!listing) {
      return {
        ok: false,
        error: `Listing ${ctx.state.listingId} not found. The session is bound to a listing that no longer exists.`,
      };
    }
    const lawFirm = await ctx.clients.db.readLawFirmById(listing.lawFirmId);
    if (!lawFirm) {
      return {
        ok: false,
        error: `Law firm ${listing.lawFirmId} not found for listing ${listing.id}. Data integrity issue — a listing without a firm should not exist.`,
      };
    }

    // Assemble the package. Pure function; no side effects yet.
    let pkg = assembleAttorneyPackage({
      state: ctx.state,
      listing,
      lawFirm,
      config,
      qualified: input.qualified,
      disqualifyingReason: input.disqualifying_reason,
      generatedAt: ctx.clients.clock.now().toISOString(),
    });

    // Step 24: side effects.
    // 1. For qualified intakes, render + upload the transcript PDF.
    //    The URL is attached to the package BEFORE the firm email fires.
    //    A failure here shouldn't block the rest of the handoff — we
    //    log, mark the url as null, and proceed.
    let transcriptError: string | null = null;
    if (input.qualified) {
      try {
        const transcriptUrl = await renderAndUploadTranscript(
          { state: ctx.state, pkg },
          ctx.clients.blob,
        );
        pkg = { ...pkg, conversationTranscriptUrl: transcriptUrl };
      } catch (err) {
        transcriptError = err instanceof Error ? err.message : String(err);
        // Continue without transcript URL; firm email will omit the link.
      }
    }

    // 2. Firm email — qualified intakes only. Failures are logged but
    //    don't block the session from completing. If the firm email
    //    bounces we'll see it in logs and the user has still been told
    //    their info was sent (we consider the intent enough).
    let firmEmailId: string | null = null;
    let firmEmailError: string | null = null;
    if (input.qualified) {
      if (!lawFirm.email) {
        firmEmailError = 'law firm has no email address on file';
      } else {
        try {
          const rendered = renderFirmEmail(pkg);
          const result = await ctx.clients.email.send({
            to: lawFirm.email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
          });
          firmEmailId = result.id;
        } catch (err) {
          firmEmailError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    // 3. User email — both paths. User must have provided an email
    //    during intake; if not, we skip silently (and log). For
    //    disqualified paths with no user email, we still complete the
    //    session — the user will see the summary page.
    let userEmailId: string | null = null;
    let userEmailError: string | null = null;
    if (pkg.claimant.email) {
      try {
        const rendered = renderUserEmail({
          pkg,
          readingLevel: ctx.state.readingLevel,
        });
        const result = await ctx.clients.email.send({
          to: pkg.claimant.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        });
        userEmailId = result.id;
      } catch (err) {
        userEmailError = err instanceof Error ? err.message : String(err);
      }
    } else {
      userEmailError = 'no claimant email on file';
    }

    // Success — transition to completed with outcome + handoff receipts
    // in metadata so audits can tell whether emails actually made it.
    const outcome = input.qualified ? 'qualified' : 'disqualified';
    const handoffMeta: Record<string, unknown> = {
      outcome,
      handoff: {
        firm_email_id: firmEmailId,
        firm_email_error: firmEmailError,
        user_email_id: userEmailId,
        user_email_error: userEmailError,
        transcript_url: pkg.conversationTranscriptUrl,
        transcript_error: transcriptError,
        generated_at: pkg.generatedAt,
      },
    };
    if (input.disqualifying_reason) {
      handoffMeta.abandoned_at_step = `disqualified: ${input.disqualifying_reason}`;
    }

    return {
      ok: true,
      content: {
        finalized: true,
        outcome,
        disqualifying_reason: input.disqualifying_reason,
        firm_email_sent: firmEmailId !== null,
        user_email_sent: userEmailId !== null,
        transcript_generated: pkg.conversationTranscriptUrl !== null,
      },
      stateChanges: {
        sessionTransition: 'complete',
        metadataPatch: handoffMeta,
      },
    };
  },
};
