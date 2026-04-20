/**
 * set_reading_level tool.
 *
 * Ada calls this when she picks up signals that the user needs a different
 * reading level. The three levels are exactly:
 *   - 'simple'       — short sentences, no jargon, no citations in prose
 *   - 'standard'     — default, accessible but not dumbed down
 *   - 'professional' — full legal terminology, citations inline, denser prose
 *
 * Per docs/DO_NOT_TOUCH.md rule 12, these are the only three valid levels.
 *
 * Ref: docs/ARCHITECTURE.md §7
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types';
import type { ReadingLevel } from '@/types/db';

interface SetReadingLevelInput {
  level: ReadingLevel;
  reason?: string;
}

const VALID_LEVELS: ReadingLevel[] = ['simple', 'standard', 'professional'];

export const setReadingLevelTool: AdaTool<SetReadingLevelInput> = {
  name: 'set_reading_level',
  description:
    "Change the reading level for this session. 'simple' for short sentences and no jargon " +
    "(use when the user requests simpler language or seems to be struggling). " +
    "'standard' is the default. 'professional' for dense legal prose with citations inline " +
    "(use when the user is clearly an attorney or case worker).",
  inputSchema: {
    type: 'object',
    properties: {
      level: {
        type: 'string',
        enum: VALID_LEVELS,
        description: "The new reading level.",
      },
      reason: {
        type: 'string',
        description: "Brief reason for the change, for admin review.",
      },
    },
    required: ['level'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('set_reading_level: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (!VALID_LEVELS.includes(r.level as ReadingLevel)) {
      throw new Error(`set_reading_level: level must be one of ${VALID_LEVELS.join(', ')} (got ${JSON.stringify(r.level)})`);
    }
    return {
      level: r.level as ReadingLevel,
      reason: typeof r.reason === 'string' ? r.reason : undefined,
    };
  },
  async execute(_ctx: ToolExecuteContext, input): Promise<ToolResult> {
    return {
      ok: true,
      content: { reading_level: input.level },
      stateChanges: { readingLevel: input.level },
    };
  },
};
