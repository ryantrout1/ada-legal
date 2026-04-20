/**
 * end_session tool.
 *
 * Ada calls this when the conversation has reached a natural conclusion
 * — typically after she's given a final answer, suggested attorneys, or
 * referred the user elsewhere. Transitions status active → completed via
 * the state machine, and records an outcome slug for observability.
 *
 * Only legal from 'active' status. If Ada tries to end a session that's
 * already terminal, the tool returns an error (not a throw).
 *
 * Ref: docs/ARCHITECTURE.md §7
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types';
import { canTransition } from '@/engine/session/stateMachine';

interface EndSessionInput {
  outcome: string;
  summary: string;
}

export const endSessionTool: AdaTool<EndSessionInput> = {
  name: 'end_session',
  description:
    "Conclude this session. Call this only after you've given a useful final answer, " +
    "suggested attorneys, or referred the user. The outcome slug summarizes what happened " +
    "(examples: 'referred_to_eeoc', 'provided_attorney_list', 'no_ada_issue', 'user_declined'). " +
    "The summary is a 1-2 sentence recap that will appear in the admin review queue.",
  inputSchema: {
    type: 'object',
    properties: {
      outcome: {
        type: 'string',
        description: "Short outcome slug, snake_case. Examples: 'referred_to_eeoc', 'provided_attorney_list', 'no_ada_issue'.",
      },
      summary: {
        type: 'string',
        description: "1-2 sentence recap of what was decided. Used by admin reviewers.",
      },
    },
    required: ['outcome', 'summary'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('end_session: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.outcome !== 'string' || r.outcome.trim() === '') {
      throw new Error('end_session: outcome must be a non-empty string');
    }
    if (typeof r.summary !== 'string' || r.summary.trim() === '') {
      throw new Error('end_session: summary must be a non-empty string');
    }
    return { outcome: r.outcome, summary: r.summary };
  },
  async execute({ state }: ToolExecuteContext, input): Promise<ToolResult> {
    if (!canTransition(state.status, 'complete')) {
      return {
        ok: false,
        error: `Cannot end session: already in status '${state.status}'.`,
      };
    }
    return {
      ok: true,
      content: {
        ended: true,
        outcome: input.outcome,
      },
      stateChanges: {
        sessionTransition: 'complete',
      },
    };
  },
};
