/**
 * match_listing tool.
 *
 * Ch1 (Step 20). Ada calls this when the user has confirmed interest in
 * pursuing a specific class-action listing. This binds the session to
 * that listing and promotes session_type from 'public_ada' to
 * 'class_action_intake'. Downstream (Step 21), the prompt assembler
 * will load the ListingConfig and tighten Ada's required-fields surface.
 *
 * Design rules enforced by this tool's executor:
 *
 *   1. The listing must exist AND be 'live' — i.e. surfaceable via
 *      v_active_listings (published listing + active firm + active
 *      subscription, non-expired). If a listing is in draft, suspended,
 *      or out of billing, match_listing fails.
 *
 *   2. user_confirmed MUST be true. Ada is told in the prompt that she
 *      must present candidates and only fire match_listing when the user
 *      explicitly picks one. We enforce that with a dumb boolean gate so
 *      there's no ambiguity if she misreads a maybe as a yes.
 *
 *   3. One-time promotion. If the session is already bound (listingId
 *      set, or sessionType is already 'class_action_intake'),
 *      match_listing fails. The user can't switch horses mid-conversation.
 *      If they want a different case, they start a new session — that's
 *      by design, to keep the intake coherent.
 *
 *   4. The listing's category must be a class-action listing. In the
 *      current iteration, every Ch1 listing is treated as a class action
 *      candidate (that's the only Ch1 use case that's live). In future
 *      phases the listing category may branch, and this tool will need
 *      to check category at that point.
 *
 * Side effects on success:
 *   - state.listingId is set
 *   - state.sessionType becomes 'class_action_intake'
 *   - (audit log entry is deferred to Step 22 when the routing engine
 *     ships the audit writer — for Step 20, the state change is the
 *     audit trail)
 *
 * Ref: Step 20, Commit 1.
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';

interface MatchListingInput {
  listing_id: string;
  confidence: number;
  user_confirmed: boolean;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3,4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const matchListingTool: AdaTool<MatchListingInput> = {
  name: 'match_listing',
  description:
    "Bind this session to an active class-action listing. Call this ONLY after the user has " +
    "explicitly confirmed they want to pursue this specific case. " +
    "If you're showing the user multiple candidate listings, do not call this tool until they " +
    "pick one — your conversational message should present the options and ask which (if any) " +
    "matches their situation. " +
    "The tool will fail if the listing is not currently live, if the session is already bound " +
    "to a listing, or if user_confirmed is false.",
  inputSchema: {
    type: 'object',
    properties: {
      listing_id: {
        type: 'string',
        format: 'uuid',
        description:
          'The UUID of the listing the user wants to pursue. Must match an id from the active-listings list you were shown.',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description:
          'Your confidence that this listing fits the user\'s situation, 0..1. For audit purposes.',
      },
      user_confirmed: {
        type: 'boolean',
        description:
          "MUST be true. Set to true only if the user has said, in their own words, that they want to proceed with this specific listing. Hedged responses (maybe, I think so) are NOT confirmation.",
      },
    },
    required: ['listing_id', 'confidence', 'user_confirmed'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('match_listing: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.listing_id !== 'string' || !UUID_PATTERN.test(r.listing_id)) {
      throw new Error(
        `match_listing: listing_id must be a UUID (got ${JSON.stringify(r.listing_id)})`,
      );
    }
    if (
      typeof r.confidence !== 'number' ||
      !Number.isFinite(r.confidence) ||
      r.confidence < 0 ||
      r.confidence > 1
    ) {
      throw new Error(
        'match_listing: confidence must be a number in [0, 1]',
      );
    }
    if (typeof r.user_confirmed !== 'boolean') {
      throw new Error('match_listing: user_confirmed must be a boolean');
    }
    return {
      listing_id: r.listing_id,
      confidence: r.confidence,
      user_confirmed: r.user_confirmed,
    };
  },
  async execute(ctx: ToolExecuteContext, input): Promise<ToolResult> {
    // Gate 1: user must have confirmed.
    if (!input.user_confirmed) {
      return {
        ok: false,
        error:
          'match_listing requires user_confirmed=true. Present the listing to the user first and only fire this tool once they explicitly agree to proceed.',
      };
    }

    // Gate 2: one-time promotion.
    if (ctx.state.listingId) {
      return {
        ok: false,
        error:
          'This session is already bound to a listing. match_listing is a one-time promotion; if the user wants a different case, they should start a new conversation.',
      };
    }
    if (ctx.state.sessionType !== 'public_ada') {
      return {
        ok: false,
        error: `match_listing can only be called on a public_ada session (current type: ${ctx.state.sessionType}).`,
      };
    }

    // Gate 3: listing must exist and be currently live. We check via
    // listActiveListings rather than readListingById because the view
    // applies the full eligibility logic (firm active, subscription
    // active, period not past). A listing that exists but isn't
    // billable should be invisible to Ada.
    const active = await ctx.clients.db.listActiveListings();
    const match = active.find((row) => row.listingId === input.listing_id);
    if (!match) {
      return {
        ok: false,
        error: `Listing ${input.listing_id} is not currently live. It may be in draft, its firm may be suspended, or the subscription may be expired.`,
      };
    }

    // Success. Bind the listing and promote the session type.
    return {
      ok: true,
      content: {
        matched: true,
        listing_id: match.listingId,
        listing_title: match.title,
        law_firm_name: match.lawFirmName,
        confidence: input.confidence,
      },
      stateChanges: {
        listingId: match.listingId,
        sessionTypeChange: 'class_action_intake',
      },
    };
  },
};
