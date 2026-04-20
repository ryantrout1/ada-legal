/**
 * set_classification tool.
 *
 * Ada calls this once she's confident about which ADA title applies.
 * This is the single source of truth for ada_sessions.classification.
 *
 * Per the existing Classification type in src/types/db.ts:
 *   - title: 'I' | 'II' | 'III' | 'none'
 *   - tier:  'high' | 'medium' | 'low'  (confidence)
 *   - reasoning: free-form explanation (required)
 *   - standard:  cited ADA section, e.g. '28 CFR §35.130' (required)
 *
 * Ref: docs/ARCHITECTURE.md §7, src/types/db.ts Classification
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types';
import type { Classification, AdaTitle, ConfidenceTier } from '@/types/db';

interface SetClassificationInput {
  title: AdaTitle;
  tier: ConfidenceTier;
  reasoning: string;
  standard: string;
}

const VALID_TITLES: AdaTitle[] = ['I', 'II', 'III', 'none'];
const VALID_TIERS: ConfidenceTier[] = ['high', 'medium', 'low'];

export const setClassificationTool: AdaTool<SetClassificationInput> = {
  name: 'set_classification',
  description:
    "Record your classification of the ADA title that applies to this session. " +
    "Title I = employment (EEOC jurisdiction); Title II = state/local government; " +
    "Title III = public accommodations. Use 'none' if no ADA title applies. " +
    "Cite the relevant ADA standard section (e.g. '28 CFR §35.130' for Title II non-discrimination). " +
    "Call once you have enough information — don't call with low tier unless you genuinely cannot narrow it further.",
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        enum: VALID_TITLES,
        description: "ADA title: 'I', 'II', 'III', or 'none'.",
      },
      tier: {
        type: 'string',
        enum: VALID_TIERS,
        description: "Your confidence tier for this classification.",
      },
      reasoning: {
        type: 'string',
        description: 'Brief plain-language explanation of why this title fits.',
      },
      standard: {
        type: 'string',
        description: "Cited section, e.g. '§404.2.3', '28 CFR §35.130', or '42 USC §12112'.",
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
      throw new Error(`set_classification: title must be one of ${VALID_TITLES.join(', ')} (got ${JSON.stringify(r.title)})`);
    }
    if (!VALID_TIERS.includes(r.tier as ConfidenceTier)) {
      throw new Error(`set_classification: tier must be one of ${VALID_TIERS.join(', ')} (got ${JSON.stringify(r.tier)})`);
    }
    if (typeof r.reasoning !== 'string' || r.reasoning.trim() === '') {
      throw new Error('set_classification: reasoning must be a non-empty string');
    }
    if (typeof r.standard !== 'string' || r.standard.trim() === '') {
      throw new Error('set_classification: standard must be a non-empty string');
    }
    return {
      title: r.title as AdaTitle,
      tier: r.tier as ConfidenceTier,
      reasoning: r.reasoning,
      standard: r.standard,
    };
  },
  async execute(_ctx: ToolExecuteContext, input): Promise<ToolResult> {
    const classification: Classification = {
      title: input.title,
      tier: input.tier,
      reasoning: input.reasoning,
      standard: input.standard,
    };
    return {
      ok: true,
      content: { classified: true, classification },
      stateChanges: { classification },
    };
  },
};
