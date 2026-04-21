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

import type { AdaClients, AiStreamChunk, AiToolDefinition } from './clients/types.js';
import type {
  AdaSessionState,
  AdaTurnInput,
  AdaTurnResult,
  ToolInvocation,
} from './types.js';
import type { Message } from '../types/db.js';
import { assemblePrompt } from './prompt/assemble.js';
import { CH0_TOOLS, buildToolIndex } from './tools/registry.js';
import { dispatchTool } from './tools/dispatcher.js';
import type { ToolStateChanges } from './tools/types.js';
import { applyTransition } from './session/stateMachine.js';

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
  let workingState: AdaSessionState = {
    ...state,
    conversationHistory: [...state.conversationHistory, userMessage],
  };

  const toolRegistry = buildToolIndex(CH0_TOOLS);
  const toolDefs = toolRegistryToDefinitions(CH0_TOOLS);
  const toolInvocations: ToolInvocation[] = [];
  const photoFindingsAccum: AdaTurnResult['photoFindings'] = [];

  let assistantMessage: Message | null = null;
  let loopCount = 0;

  while (loopCount < MAX_TOOL_LOOPS) {
    loopCount += 1;

    const systemPrompt = assemblePrompt({
      state: workingState,
      orgDisplayName,
      orgAdaIntroPrompt,
      listingAdaPromptOverride,
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
  return next;
}

function asRecord(x: unknown): Record<string, unknown> {
  return x && typeof x === 'object' && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
}
