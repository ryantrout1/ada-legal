/**
 * route tool.
 *
 * Step 22. Ada's way of handing a session off — either to a partner
 * organization (Ch2 destinations), to the local attorney directory,
 * or to end the conversation cleanly.
 *
 * Three destinations, each with different semantics:
 *
 *   external
 *     The user gets redirected to another organization's domain
 *     (gov.adalegallink.com/[org-code]). Requires:
 *       - target_org_id must match one of the routing matches the
 *         assembler surfaced to Ada this turn
 *       - user_agreed=true (the user has explicitly said yes in chat)
 *     On success: mint a hop token, transition session to 'completed'
 *     with metadata.outcome='redirected_to_{target_org_code}'.
 *     Returns the hop URL so the frontend can navigate.
 *
 *   attorney_directory
 *     A soft route — sends the user to the /attorneys page WITHOUT
 *     ending the session. Used when Ada wants the user to browse
 *     while staying in the same conversation. Writes an audit entry
 *     via metadata but doesn't close the session.
 *
 *   end_conversation
 *     Hard close, no destination. Used when Ada has done what she can
 *     and there's no redirect available. Transitions to completed
 *     with metadata.outcome='ended_by_ada'.
 *
 * The tool is deliberately thin in terms of side effects — all it does
 * is write state changes and optionally return a hop URL. Email
 * delivery, PDF generation, etc. happen via other paths (Step 24).
 *
 * Ref: Step 22.
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import { mintHopToken } from '../../routing/hopToken.js';

type RouteDestination = 'external' | 'attorney_directory' | 'end_conversation';

interface RouteToolInput {
  destination: RouteDestination;
  target_org_id?: string | null;
  user_agreed: boolean;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3,4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const routeTool: AdaTool<RouteToolInput> = {
  name: 'route',
  description:
    "Hand this conversation off. Three destinations:\n" +
    "  - external: redirect the user to another organization (e.g. a state agency). " +
    "Only use when the routing-context section of your system prompt lists a matching " +
    "destination AND the user has explicitly agreed to the redirect. " +
    "Requires target_org_id.\n" +
    "  - attorney_directory: suggest the user browse the attorney directory. Keeps the " +
    "session open.\n" +
    "  - end_conversation: close the session with no further action. Use when there's " +
    "nothing more you can do for the user and no external destination fits.\n" +
    "user_agreed must be true for external. It must reflect explicit user consent, not " +
    "your inference.",
  inputSchema: {
    type: 'object',
    properties: {
      destination: {
        type: 'string',
        enum: ['external', 'attorney_directory', 'end_conversation'],
        description: 'Where to route.',
      },
      target_org_id: {
        type: ['string', 'null'],
        description:
          'Required when destination=external. UUID of the target org from the routing-context section.',
      },
      user_agreed: {
        type: 'boolean',
        description:
          'True only when the user has explicitly agreed to the route in the conversation. Required true for external.',
      },
    },
    required: ['destination', 'user_agreed'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('route: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    const dest = r.destination;
    if (
      dest !== 'external' &&
      dest !== 'attorney_directory' &&
      dest !== 'end_conversation'
    ) {
      throw new Error(
        `route: destination must be external | attorney_directory | end_conversation (got ${JSON.stringify(dest)})`,
      );
    }
    if (typeof r.user_agreed !== 'boolean') {
      throw new Error('route: user_agreed must be a boolean');
    }
    let target: string | null = null;
    if (r.target_org_id !== undefined && r.target_org_id !== null) {
      if (typeof r.target_org_id !== 'string') {
        throw new Error('route: target_org_id must be a string or null');
      }
      if (!UUID_PATTERN.test(r.target_org_id)) {
        throw new Error(
          `route: target_org_id must be a UUID (got ${JSON.stringify(r.target_org_id)})`,
        );
      }
      target = r.target_org_id;
    }
    if (dest === 'external' && !target) {
      throw new Error(
        'route: target_org_id is required when destination=external',
      );
    }
    return {
      destination: dest,
      target_org_id: target,
      user_agreed: r.user_agreed,
    };
  },
  async execute(ctx: ToolExecuteContext, input): Promise<ToolResult> {
    if (ctx.state.status !== 'active') {
      return {
        ok: false,
        error: `route: session is ${ctx.state.status}, cannot route a non-active session.`,
      };
    }

    if (input.destination === 'end_conversation') {
      return {
        ok: true,
        content: { routed: true, destination: 'end_conversation' },
        stateChanges: {
          sessionTransition: 'complete',
          metadataPatch: { outcome: 'ended_by_ada' },
        },
      };
    }

    if (input.destination === 'attorney_directory') {
      // Soft route: doesn't end the session. Just records the action
      // so we can see in analytics that Ada pointed the user to the
      // directory.
      return {
        ok: true,
        content: { routed: true, destination: 'attorney_directory' },
        stateChanges: {
          metadataPatch: {
            outcome: ctx.state.metadata.outcome ?? 'routed_to_attorney_directory',
          },
        },
      };
    }

    // external — the one with the real guardrails.
    if (!input.user_agreed) {
      return {
        ok: false,
        error:
          'route: user_agreed must be true for destination=external. The user must explicitly consent to the redirect in conversation.',
      };
    }
    if (!input.target_org_id) {
      // Already caught in validateInput, but defensive.
      return {
        ok: false,
        error: 'route: target_org_id is required for destination=external.',
      };
    }

    // The target must be in the routing matches the assembler surfaced
    // this turn. We pass those matches via an engine-layer side channel
    // so the tool can verify without re-querying the DB.
    const allowed = ctx.state.routingMatches ?? [];
    const match = allowed.find((m) => m.targetOrgId === input.target_org_id);
    if (!match) {
      return {
        ok: false,
        error:
          `route: target_org_id ${input.target_org_id} is not in the routing destinations for this conversation. ` +
          `Only orgs listed in the routing-context section of the prompt are valid.`,
      };
    }

    // Mint the hop token. We derive the secret from env at mint time
    // so test harnesses can inject a fake secret via the clients seam.
    const secret = ctx.clients.hopSecret;
    if (!secret) {
      return {
        ok: false,
        error:
          'route: hop secret is not configured. External routing is unavailable.',
      };
    }

    let hopToken: string;
    try {
      hopToken = mintHopToken({
        fromSessionId: ctx.state.sessionId,
        targetOrgId: match.targetOrgId,
        anonSessionId: ctx.state.anonSessionId,
        userId: ctx.state.userId,
        secret,
      });
    } catch (err) {
      return {
        ok: false,
        error: `route: failed to mint hop token (${err instanceof Error ? err.message : 'unknown'}).`,
      };
    }

    const hopUrl =
      `https://gov.adalegallink.com/${encodeURIComponent(match.targetOrgCode)}` +
      `?hop=${encodeURIComponent(hopToken)}`;

    return {
      ok: true,
      content: {
        routed: true,
        destination: 'external',
        target_org_code: match.targetOrgCode,
        target_org_display_name: match.targetOrgDisplayName,
        hop_url: hopUrl,
      },
      stateChanges: {
        sessionTransition: 'complete',
        metadataPatch: {
          outcome: `redirected_to_${match.targetOrgCode}`,
        },
      },
    };
  },
};
