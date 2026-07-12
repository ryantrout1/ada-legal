/**
 * propose_summary tool (R5a).
 *
 * The required step before end_session / finalize_intake on a live session. Ada
 * calls this to present the user a short, plain-language summary of what she
 * found and what happens next, THEN shows it and waits for the user's reply.
 * It records the current user-turn count so the finalize tools can verify the
 * user got a turn to correct the summary before the one-way finalize.
 *
 * It does not complete the session and has no side effects beyond stamping the
 * proposal marker into metadata.
 *
 * Ref: /plan R5, Phase R5a (confirm-before-finalize gate).
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import { countUserTurns } from '../finalizeGuard.js';

interface ProposeSummaryInput {
  summary: string;
}

export const proposeSummaryTool: AdaTool<ProposeSummaryInput> = {
  name: 'propose_summary',
  description:
    'Show the user a short, plain-language summary of what you found and what happens next, ' +
    'BEFORE ending the session. Call this, present the summary to the user in your reply, and ' +
    'then WAIT for their response. You must call propose_summary and let the user take another ' +
    'turn before you call end_session or finalize_intake — this gives them a chance to correct ' +
    'anything. The summary is what the user reads, so write it for them: no jargon, one idea per ' +
    'sentence.',
  inputSchema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'The plain-language summary to show the user: what you understood, how you classified it, ' +
          'and what their options / next steps are.',
      },
    },
    required: ['summary'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('propose_summary: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.summary !== 'string' || r.summary.trim() === '') {
      throw new Error('propose_summary: summary must be a non-empty string');
    }
    return { summary: r.summary };
  },
  async execute(ctx: ToolExecuteContext, input): Promise<ToolResult> {
    return {
      ok: true,
      content: {
        proposed: true,
        summary: input.summary,
      },
      stateChanges: {
        metadataPatch: {
          summary_proposed_at_user_turns: countUserTurns(ctx.state.conversationHistory),
          summary_proposed_at: ctx.clients.clock.now().toISOString(),
        },
      },
    };
  },
};
