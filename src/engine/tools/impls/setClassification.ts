/**
 * set_classification tool.
 *
 * Ada calls this once she's confident about which ADA title applies
 * (or determines no ADA title applies at all). This is the single
 * source of truth for ada_sessions.classification.
 *
 * Per the Classification type in src/types/db.ts:
 *   - title: 'I' | 'II' | 'III' | 'class_action' | 'out_of_scope' | 'none'
 *   - tier:  'high' | 'medium' | 'low'  (confidence)
 *   - reasoning: free-form explanation (required)
 *   - standard:  cited ADA section, e.g. '28 CFR §35.130' (required)
 *   - class_action_candidate: slug of a matched class action or null
 *
 * Classification widened in Step 18 (Triage & Routing). 'class_action'
 * is a signal for Ada when the situation matches a pattern of an active
 * class action; the class-action registry ships in Phase D (Step 26).
 * Until then, Ada may flag class_action when she sees the pattern, and
 * the Step 18 package tells the user the matching system is coming.
 * 'out_of_scope' replaces most legitimate uses of 'none' — when a
 * situation isn't ADA-covered but Ada can still be useful (documenting
 * the experience, referring to the right civil-rights resource). 'none'
 * remains as a legacy value for genuinely-no-signal sessions.
 *
 * Ref: docs/ARCHITECTURE.md §7, src/types/db.ts Classification
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import type { Classification, AdaTitle, ConfidenceTier } from '../../../types/db.js';

interface SetClassificationInput {
  title: AdaTitle;
  tier: ConfidenceTier;
  reasoning: string;
  standard: string;
  /** Optional slug for a matched class action. Always null in Step 18. */
  class_action_candidate?: string | null;
}

const VALID_TITLES: AdaTitle[] = [
  'I',
  'II',
  'III',
  'class_action',
  'out_of_scope',
  'none',
];
const VALID_TIERS: ConfidenceTier[] = ['high', 'medium', 'low'];

export const setClassificationTool: AdaTool<SetClassificationInput> = {
  name: 'set_classification',
  description:
    "Record your classification of the ADA title that applies to this session. " +
    "Title I = employment / workplace (EEOC jurisdiction). " +
    "Title II = state or local government services, programs, or activities (DOJ complaint). " +
    "Title III = public accommodations — private businesses serving the public. " +
    "class_action = the situation matches a pattern of an active class action; use only " +
    "when the facts strongly fit a known class-wide pattern (not just any barrier at a chain). " +
    "out_of_scope = the user's experience is not ADA-covered but Ada can still be useful " +
    "(a civil-rights matter under a different law, a consumer issue, etc.). Use this instead " +
    "of 'none' whenever you can point the user somewhere useful. " +
    "none = truly no identifiable issue and no useful referral possible (rare). " +
    "Cite the relevant ADA standard section when it applies (e.g. '28 CFR §35.130' for Title II " +
    "non-discrimination). For out_of_scope, cite the regime you think DOES apply " +
    "(e.g. 'state civil rights act' or 'FCRA'). For class_action and none, 'n/a' is acceptable. " +
    "Call once you have enough information — don't call with low tier unless you genuinely cannot narrow it further.",
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        enum: VALID_TITLES,
        description:
          "Classification: 'I' (employment/EEOC), 'II' (government/DOJ), 'III' (public accommodation), " +
          "'class_action' (matches active class action pattern), 'out_of_scope' (not ADA but useful referral), " +
          "or 'none' (no identifiable issue).",
      },
      tier: {
        type: 'string',
        enum: VALID_TIERS,
        description: "Your confidence tier for this classification.",
      },
      reasoning: {
        type: 'string',
        description: 'Brief plain-language explanation of why this classification fits.',
      },
      standard: {
        type: 'string',
        description:
          "Cited section, e.g. '§404.2.3', '28 CFR §35.130', or '42 USC §12112'. " +
          "For out_of_scope, cite the regime you think applies. For class_action / none, 'n/a' is acceptable.",
      },
      class_action_candidate: {
        type: ['string', 'null'],
        description:
          "Optional slug of a matched class action. Always pass null in Step 18 — " +
          "the class-action registry is not yet live.",
      },
    },
    required: ['title', 'tier', 'reasoning', 'standard'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('set_classification: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (!VALID_TITLES.includes(r.title as AdaTitle)) {
      throw new Error(
        `set_classification: title must be one of ${VALID_TITLES.join(', ')} (got ${JSON.stringify(r.title)})`,
      );
    }
    if (!VALID_TIERS.includes(r.tier as ConfidenceTier)) {
      throw new Error(
        `set_classification: tier must be one of ${VALID_TIERS.join(', ')} (got ${JSON.stringify(r.tier)})`,
      );
    }
    if (typeof r.reasoning !== 'string' || r.reasoning.trim() === '') {
      throw new Error('set_classification: reasoning must be a non-empty string');
    }
    if (typeof r.standard !== 'string' || r.standard.trim() === '') {
      throw new Error('set_classification: standard must be a non-empty string');
    }
    // class_action_candidate is optional; only validate shape when present.
    let candidate: string | null = null;
    if (r.class_action_candidate !== undefined && r.class_action_candidate !== null) {
      if (typeof r.class_action_candidate !== 'string') {
        throw new Error(
          'set_classification: class_action_candidate must be a string or null',
        );
      }
      candidate = r.class_action_candidate;
    }
    return {
      title: r.title as AdaTitle,
      tier: r.tier as ConfidenceTier,
      reasoning: r.reasoning,
      standard: r.standard,
      class_action_candidate: candidate,
    };
  },
  async execute(_ctx: ToolExecuteContext, input): Promise<ToolResult> {
    const classification: Classification = {
      title: input.title,
      tier: input.tier,
      reasoning: input.reasoning,
      standard: input.standard,
      class_action_candidate: input.class_action_candidate ?? null,
    };
    return {
      ok: true,
      content: { classified: true, classification },
      stateChanges: { classification },
    };
  },
};
