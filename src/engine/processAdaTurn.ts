/**
 * processAdaTurn — the engine's turn loop.
 *
 * Takes the current session state + a new user message + an AdaClients
 * bundle, and returns the next state + the assistant's response.
 *
 * Contract:
 *   - Never throws for user-fixable errors. Tool failures surface as
 *     tool_result blocks with is_error=true; Ada sees them and responds
 *     conversationally.
 *   - Deterministic given fixed clients. (With InMemoryAdaClients +
 *     scripted AI responses, two runs with the same inputs return the
 *     same outputs.)
 *   - DOES mutate state through state-machine transitions and tool
 *     stateChanges, but does not touch the DB directly — all persistence
 *     goes through clients.db via the sessionRepo.
 *
 * Turn loop:
 *   1. Append the user's new message to history
 *   2. Assemble the system prompt from current state + tool registry
 *   3. Stream from clients.ai.stream() until message_stop
 *   4. If the stream emitted any tool_use blocks, dispatch each via the
 *      tool dispatcher, apply their stateChanges, append a tool_result
 *      block for each, and loop back to step 3
 *   5. Hard cap: MAX_TOOL_LOOPS iterations per turn. If hit, we append a
 *      system note and return whatever Ada has said so far.
 *   6. Once Ada emits text without requesting more tools, we're done.
 *      Append the final assistant message and return.
 *
 * Ref: docs/ARCHITECTURE.md §9
 */

import type { AdaClients, AiStreamChunk, AiToolDefinition, KnowledgeChunkHit } from './clients/types.js';
import type {
  AdaSessionState,
  AdaTurnInput,
  AdaTurnResult,
  ToolInvocation,
} from './types.js';
import type { Message, AttachedPhoto } from '../types/db.js';
import { assemblePrompt } from './prompt/assemble.js';
import { CH0_TOOLS, buildToolIndex } from './tools/registry.js';
import { CH1_TOOLS } from './tools/registryCh1.js';
import { dispatchTool } from './tools/dispatcher.js';
import type { ToolStateChanges } from './tools/types.js';
import { applyTransition } from './session/stateMachine.js';
import { evaluateRoutingRules } from './routing/evaluate.js';

/** Maximum tool-use loops per turn. Safety cap against runaway tool chains. */
const MAX_TOOL_LOOPS = 5;

export interface ProcessAdaTurnParams {
  clients: AdaClients;
  state: AdaSessionState;
  input: AdaTurnInput;
  /** Org display name for the prompt. Default: 'ADA Legal Link'. */
  orgDisplayName?: string;
  /** Optional org intro prompt overlay. */
  orgAdaIntroPrompt?: string | null;
  /** Optional listing-specific prompt overlay (Ch1+). */
  listingAdaPromptOverride?: string | null;
}

export async function processAdaTurn({
  clients,
  state,
  input,
  orgDisplayName = 'ADA Legal Link',
  orgAdaIntroPrompt = null,
  listingAdaPromptOverride = null,
}: ProcessAdaTurnParams): Promise<AdaTurnResult> {
  // Build the user message and append to history.
  const userMessage: Message = {
    role: 'user',
    content: input.userMessage,
    timestamp: clients.clock.now().toISOString(),
  };

  // If the user attached photos this turn, persist their URLs in
  // session metadata. This is how photos survive beyond the session
  // for attorney-routing packages (Phase C/D). The URLs themselves
  // live in Vercel Blob storage; we only carry the references.
  const now = clients.clock.now().toISOString();
  const newPhotos: AttachedPhoto[] =
    input.photoBlobKeys?.map((url) => ({ url, uploadedAt: now })) ?? [];
  const mergedPhotos = newPhotos.length
    ? [...(state.metadata.photos ?? []), ...newPhotos]
    : state.metadata.photos;

  let workingState: AdaSessionState = {
    ...state,
    conversationHistory: [...state.conversationHistory, userMessage],
    metadata: {
      ...state.metadata,
      photos: mergedPhotos,
    },
  };

  // Ch0 tools are universal; Ch1 tools (match_listing, finalize_intake)
  // are added globally so Ada can promote any public_ada session that
  // matches an active listing. A future step may gate based on whether
  // active listings exist in the DB (no listings → don't surface
  // match_listing), but for now the tool's own executor rejects calls
  // on sessions that can't use it.
  const allTools = [...CH0_TOOLS, ...CH1_TOOLS];
  const toolRegistry = buildToolIndex(allTools);
  const toolDefs = toolRegistryToDefinitions(allTools);
  const toolInvocations: ToolInvocation[] = [];
  const photoFindingsAccum: AdaTurnResult['photoFindings'] = [];

  // ── Knowledge-base retrieval (Step 10.5) ─────────────────────────────────
  // Retrieve ONCE per turn, before the model-tool loop starts. The user
  // query doesn't change across loop iterations; only the conversation
  // history grows as Ada uses tools. We embed the user's message, run a
  // hybrid vector + citation search, and pass the results into every
  // assemblePrompt call below.
  //
  // All failures here are swallowed. RAG is an enhancement, not a hard
  // dependency — if embeddings or the DB search fail, we still want to
  // answer the user's question.
  let knowledgeChunks: KnowledgeChunkHit[] = [];
  try {
    let queryEmbedding: number[] | undefined;
    if (clients.embeddings) {
      try {
        queryEmbedding = await clients.embeddings.embedQuery(input.userMessage);
      } catch {
        // Embedding failed; fall through to citation-only search.
      }
    }
    knowledgeChunks = await clients.db.searchKnowledgeBase({
      query: input.userMessage,
      queryEmbedding,
      k: 5,
    });
  } catch {
    knowledgeChunks = [];
  }

  // ── Listing context loading (Step 21) ────────────────────────────────────
  // If this session is bound to a listing, load the listing row + its
  // config so the prompt assembler can render the full LISTING CONTEXT
  // section. If it's a public_ada session, load a condensed index of
  // active listings so Ada can propose matches.
  //
  // Loaded ONCE per turn (like knowledge retrieval). Failures swallowed
  // — listing context is an enhancement, not a requirement.
  let boundListing:
    | { listing: import('./clients/types.js').ListingRow;
        config: import('./clients/types.js').ListingConfigRow }
    | null = null;
  let discoveryListings: import('./clients/types.js').ActiveListingRow[] = [];

  try {
    if (
      workingState.listingId &&
      workingState.sessionType === 'class_action_intake'
    ) {
      const listing = await clients.db.readListingById(workingState.listingId);
      const config = listing
        ? await clients.db.readListingConfigForListing(listing.id)
        : null;
      if (listing && config) {
        boundListing = { listing, config };
      }
    } else if (workingState.sessionType === 'public_ada') {
      discoveryListings = await clients.db.listActiveListings();
    }
  } catch {
    // Listing context is non-critical; proceed without it.
  }

  // ── Routing rule evaluation (Step 22) ────────────────────────────────────
  // Fetch active routing rules and evaluate against the current session.
  // Rules that match become RoutingMatch[] entries, which:
  //   1. Get surfaced to Ada in the ROUTING DESTINATIONS prompt section
  //   2. Get attached to workingState.routingMatches so the `route` tool
  //      can validate target_org_id without a second DB round-trip.
  //
  // Failures swallowed for the same reason as listing context — routing
  // is an enhancement, not a precondition for a useful conversation.
  let routingMatches: import('./routing/evaluate.js').RoutingMatch[] = [];
  try {
    const activeRules = await clients.db.listActiveRoutingRules();
    routingMatches = evaluateRoutingRules({
      session: workingState,
      rules: activeRules,
    });
    if (routingMatches.length > 0) {
      workingState = { ...workingState, routingMatches };
    }
  } catch {
    // Routing is non-critical.
  }

  let assistantMessage: Message | null = null;
  let loopCount = 0;

  while (loopCount < MAX_TOOL_LOOPS) {
    loopCount += 1;

    const systemPrompt = assemblePrompt({
      state: workingState,
      orgDisplayName,
      orgAdaIntroPrompt,
      listingAdaPromptOverride,
      boundListing,
      discoveryListings,
      routingMatches,
      knowledgeChunks,
      now: clients.clock.now(),
    });

    // Stream one model turn. Collect text + any tool_use calls.
    const turnOutput = await consumeStream(
      clients.ai.stream({
        systemPrompt,
        messages: workingState.conversationHistory,
        tools: toolDefs,
      }),
    );

    // If there are tool calls, execute them and loop again.
    if (turnOutput.toolCalls.length > 0) {
      // Append the assistant turn to history (mixed text + tool_use blocks).
      const assistantTurnContent: ContentBlockLite[] = [];
      if (turnOutput.text.length > 0) {
        assistantTurnContent.push({ type: 'text', text: turnOutput.text });
      }
      for (const call of turnOutput.toolCalls) {
        assistantTurnContent.push({
          type: 'tool_use',
          id: call.id,
          name: call.name,
          input: call.input,
        });
      }
      workingState = appendAssistantBlocks(
        workingState,
        assistantTurnContent,
        clients.clock.now().toISOString(),
      );

      // Dispatch each tool in order. Collect tool_result blocks and state changes.
      const toolResultBlocks: ContentBlockLite[] = [];
      for (const call of turnOutput.toolCalls) {
        const record = await dispatchTool({
          name: call.name,
          input: call.input,
          ctx: { clients, state: workingState },
          registry: toolRegistry,
        });
        toolInvocations.push({
          name: record.name,
          args: asRecord(record.input),
          result: record.result,
          isError: !record.result.ok,
          timestamp: record.timestamp,
        });

        // Apply state changes from successful tools.
        if (record.result.ok && record.result.stateChanges) {
          workingState = applyStateChanges(workingState, record.result.stateChanges);
          const ph = record.result.stateChanges.photoFindings;
          if (ph && ph.length > 0) {
            photoFindingsAccum.push(...ph);
          }
        }

        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: record.result.ok
            ? JSON.stringify(record.result.content ?? null)
            : record.result.error,
          is_error: !record.result.ok,
        });
      }

      // Append the user-role message carrying tool_result blocks. Per
      // Anthropic's protocol, tool_result blocks go back to the model on
      // the user side of the conversation.
      workingState = {
        ...workingState,
        conversationHistory: [
          ...workingState.conversationHistory,
          {
            role: 'user',
            content: toolResultBlocks as never, // see Message.content union in types/db
            timestamp: clients.clock.now().toISOString(),
          },
        ],
      };
      // Loop — Ada sees the tool results and continues.
      continue;
    }

    // No tool calls this iteration → this is Ada's final response.
    assistantMessage = {
      role: 'assistant',
      content: turnOutput.text,
      timestamp: clients.clock.now().toISOString(),
    };
    workingState = {
      ...workingState,
      conversationHistory: [...workingState.conversationHistory, assistantMessage],
    };
    break;
  }

  // Safety net: if we bailed at MAX_TOOL_LOOPS without a clean text response,
  // produce a stub assistant message so the caller always gets one.
  if (!assistantMessage) {
    assistantMessage = {
      role: 'assistant',
      content:
        "I hit a limit while working on that — let me try a different approach. Could you rephrase your question?",
      timestamp: clients.clock.now().toISOString(),
    };
    workingState = {
      ...workingState,
      conversationHistory: [...workingState.conversationHistory, assistantMessage],
    };
  }

  return {
    nextState: workingState,
    assistantMessage,
    toolInvocations,
    photoFindings: photoFindingsAccum.length > 0 ? photoFindingsAccum : undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Content blocks we append to history. Intentionally matches Anthropic shapes. */
type ContentBlockLite =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error: boolean };

interface StreamConsumeResult {
  text: string;
  toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>;
}

async function consumeStream(
  stream: AsyncIterable<AiStreamChunk>,
): Promise<StreamConsumeResult> {
  const textParts: string[] = [];
  const toolCalls: StreamConsumeResult['toolCalls'] = [];
  // Track in-flight tool_use by toolId so the _stop chunk can finalize it.
  const pendingTools = new Map<string, { name: string }>();

  for await (const chunk of stream) {
    switch (chunk.type) {
      case 'text_delta':
        if (chunk.content) textParts.push(chunk.content);
        break;
      case 'tool_use_start':
        if (chunk.toolId && chunk.toolName) {
          pendingTools.set(chunk.toolId, { name: chunk.toolName });
        }
        break;
      case 'tool_use_delta':
        // The accumulator lives in the AnthropicAiClient itself — deltas
        // here are just heartbeat signals that a tool_use is in progress.
        break;
      case 'tool_use_stop':
        if (chunk.toolId && chunk.toolName) {
          const input = (chunk.toolInput ?? {}) as Record<string, unknown>;
          toolCalls.push({
            id: chunk.toolId,
            name: chunk.toolName,
            input,
          });
          pendingTools.delete(chunk.toolId);
        }
        break;
      case 'message_stop':
        break;
    }
  }

  return { text: textParts.join(''), toolCalls };
}

function toolRegistryToDefinitions(
  tools: ReadonlyArray<{ name: string; description: string; inputSchema: AiToolDefinition['input_schema'] }>,
): AiToolDefinition[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}

function appendAssistantBlocks(
  state: AdaSessionState,
  blocks: ContentBlockLite[],
  timestamp: string,
): AdaSessionState {
  return {
    ...state,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        content: blocks as never, // ContentBlock union in types/db
        timestamp,
      },
    ],
  };
}

function applyStateChanges(
  state: AdaSessionState,
  changes: ToolStateChanges,
): AdaSessionState {
  let next = state;
  if (changes.classification) {
    next = { ...next, classification: changes.classification };
  }
  if (changes.readingLevel) {
    next = { ...next, readingLevel: changes.readingLevel };
  }
  if (changes.extractedFieldsPatch) {
    const patch: Record<string, import('@/types/db').ExtractedField> = {};
    for (const [k, v] of Object.entries(changes.extractedFieldsPatch)) {
      if (v !== undefined) patch[k] = v;
    }
    next = {
      ...next,
      extractedFields: { ...next.extractedFields, ...patch },
    };
  }
  if (changes.sessionTransition) {
    next = {
      ...next,
      status: applyTransition(next.status, changes.sessionTransition),
    };
  }
  if (changes.listingId) {
    // match_listing binds the session to a specific listing. This is a
    // one-way transition; the tool executor is responsible for rejecting
    // re-binding attempts. At the merge layer we just overwrite.
    next = { ...next, listingId: changes.listingId };
  }
  if (changes.sessionTypeChange) {
    next = { ...next, sessionType: changes.sessionTypeChange };
  }
  if (changes.metadataPatch) {
    next = {
      ...next,
      metadata: { ...next.metadata, ...changes.metadataPatch },
    };
  }
  return next;
}

function asRecord(x: unknown): Record<string, unknown> {
  return x && typeof x === 'object' && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
}
