/**
 * match_litigation tool.
 *
 * Plan C Phase C3b-ii. Ada calls this when the user has confirmed
 * interest in a specific surface-visible litigation row from the
 * discovery catalog. This binds the session to that litigation via
 * the litigation_listing_id FK channel — the same channel that
 * api/ada/session.ts uses for deep-link binding.
 *
 * Sibling to match_listing (Ch1) but for the litigation channel.
 * The two differ in one important way: match_litigation does NOT
 * promote session_type. Litigation sessions stay 'public_ada' because
 * litigation is informational/discovery work, not a per-firm intake
 * flow. The session-type promotion is reserved for Ch1 listings,
 * which have firm-specific required-fields surfaces. The
 * sessionLitigationBinding integration test enforces the same rule
 * at session creation; this tool enforces it mid-conversation.
 *
 * Hard gates (mirroring match_listing's discipline):
 *
 *   1. user_confirmed MUST be true. Ada is told in the prompt to
 *      present candidates and only fire match_litigation once the user
 *      explicitly picks one. Hedged responses (maybe, I think so) are
 *      NOT confirmation. We enforce that with a boolean gate so there's
 *      no ambiguity if she misreads a maybe as a yes.
 *
 *   2. One-time binding. If litigationListingId is already set, the
 *      call fails. The user can't switch litigation horses mid-
 *      conversation. If they want a different case, they start a new
 *      session — by design, to keep the intake coherent.
 *
 *   3. session_type must be 'public_ada'. Ch1 listing sessions
 *      (class_action_intake) follow the match_listing path, not this.
 *
 *   4. The litigation must be surface-visible: status in
 *      {active, compliance, investigating, tracking}. This is the
 *      same set the discovery catalog renders (per Phase C3b-i and
 *      the focused-block resolution path in processAdaTurn). A row in
 *      draft / closed / archived must not be bindable, even if Ada
 *      somehow named it — those states are admin-only and the user
 *      shouldn't be routed into them.
 *
 * Side effects on success:
 *   - stateChanges.litigationListingId is set
 *   - sessionType stays 'public_ada' (no sessionTypeChange emitted)
 *   - The next turn's focused-block resolution picks up the FK and
 *     renders the case with QUALIFYING QUESTIONS + VOICE GUIDANCE
 *     (see litigationContext.renderFocusedLitigation, AC4)
 *
 * Ref: /plan Plan C, Phase C3b-ii, acceptance criterion 5.
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';

interface MatchLitigationInput {
  litigation_id: string;
  confidence: number;
  user_confirmed: boolean;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3,4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The set of statuses the public surface (Active Cases page + Ada's
 * discovery index) renders. Must match the filter set used in:
 *   - api/public/litigation.ts (the page's read)
 *   - processAdaTurn fetchFocusedLitigation (allowedStatuses)
 *   - api/ada/session.ts deep-link resolution
 * If this set drifts from the others, the tool may bind a row Ada
 * cannot see in her next-turn focused block, which is confusing.
 */
const SURFACE_VISIBLE_STATUSES: ReadonlySet<string> = new Set([
  'active',
  'compliance',
  'investigating',
  'tracking',
]);

export const matchLitigationTool: AdaTool<MatchLitigationInput> = {
  name: 'match_litigation',
  description:
    "Bind this session to a specific surface-visible litigation case (class action, DOJ enforcement, " +
    "consent decree, pattern of practice, or regulatory challenge). Call this ONLY after the user " +
    "has explicitly confirmed they want to focus on this specific case. " +
    "If you're showing the user multiple candidate cases, do not call this tool until they pick one — " +
    "your conversational message should present the options and ask which (if any) matches their " +
    "situation. " +
    "On success, the next turn's prompt will include the case's QUALIFYING QUESTIONS sub-block, " +
    "which you should walk the user through one at a time. " +
    "The tool will fail if the case is not surface-visible, if the session is already bound to " +
    "a litigation case, if the session is not a public Ada session, or if user_confirmed is false.",
  inputSchema: {
    type: 'object',
    properties: {
      litigation_id: {
        type: 'string',
        format: 'uuid',
        description:
          'The UUID of the litigation row the user wants to focus on. Must match an id from the active-litigation list you were shown.',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description:
          "Your confidence that this litigation fits the user's situation, 0..1. For audit purposes.",
      },
      user_confirmed: {
        type: 'boolean',
        description:
          'MUST be true. Set to true only if the user has said, in their own words, that they want to focus on this specific case. Hedged responses (maybe, I think so) are NOT confirmation.',
      },
    },
    required: ['litigation_id', 'confidence', 'user_confirmed'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('match_litigation: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.litigation_id !== 'string' || !UUID_PATTERN.test(r.litigation_id)) {
      throw new Error(
        `match_litigation: litigation_id must be a UUID (got ${JSON.stringify(r.litigation_id)})`,
      );
    }
    if (
      typeof r.confidence !== 'number' ||
      !Number.isFinite(r.confidence) ||
      r.confidence < 0 ||
      r.confidence > 1
    ) {
      throw new Error('match_litigation: confidence must be a number in [0, 1]');
    }
    if (typeof r.user_confirmed !== 'boolean') {
      throw new Error('match_litigation: user_confirmed must be a boolean');
    }
    return {
      litigation_id: r.litigation_id,
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
          'match_litigation requires user_confirmed=true. Present the case to the user first and only fire this tool once they explicitly agree to focus on it.',
      };
    }

    // Gate 2: one-time binding (same discipline as match_listing).
    if (ctx.state.litigationListingId) {
      return {
        ok: false,
        error:
          'This session is already bound to a litigation case. match_litigation is a one-time binding; if the user wants a different case, they should start a new conversation.',
      };
    }

    // Gate 3: session must be public_ada. Ch1 listing sessions follow
    // match_listing's path, not this one.
    if (ctx.state.sessionType !== 'public_ada') {
      return {
        ok: false,
        error: `match_litigation can only be called on a public_ada session (current type: ${ctx.state.sessionType}).`,
      };
    }

    // Gate 4: litigation row must exist and be surface-visible. We use
    // getLitigationById (returns admin row with status) rather than
    // listActiveLitigation because admin row lets us distinguish
    // "doesn't exist" from "exists but not surface-visible" — both are
    // failures but the audit log benefits from the distinction.
    let adminRow;
    try {
      adminRow = await ctx.clients.db.getLitigationById(input.litigation_id);
    } catch (err) {
      return {
        ok: false,
        error: `match_litigation: lookup failed (${err instanceof Error ? err.message : 'unknown error'}).`,
      };
    }
    if (!adminRow) {
      return {
        ok: false,
        error: `Litigation ${input.litigation_id} not found.`,
      };
    }
    if (!SURFACE_VISIBLE_STATUSES.has(adminRow.status)) {
      return {
        ok: false,
        error: `Litigation ${input.litigation_id} is not surface-visible (status: ${adminRow.status}). Only active / compliance / investigating / tracking rows can be bound.`,
      };
    }

    // Success. Bind via litigationListingId; do NOT promote session_type.
    return {
      ok: true,
      content: {
        matched: true,
        litigation_id: adminRow.id,
        case_name: adminRow.caseName,
        kind: adminRow.kind,
        confidence: input.confidence,
      },
      stateChanges: {
        litigationListingId: adminRow.id,
      },
    };
  },
};
