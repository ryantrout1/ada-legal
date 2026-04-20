/**
 * Layer 2 integration tests for processAdaTurn.
 *
 * Exercises the full turn loop end-to-end against InMemoryAdaClients with
 * scripted AI responses. The AI responses are written inline rather than
 * loaded from fixtures because these tests cover the turn-loop mechanics
 * (tool dispatch, state changes, loop cap, final message assembly), NOT
 * the quality of Ada's actual prompt understanding — that's a Layer 3
 * persona concern.
 *
 * Fixture-based tests with real captured Anthropic chunks live in
 * tests/personas/ and are the contract for "Ada talking to real users".
 * Those fixtures are recorded once by running the real API manually, then
 * replayed by the InMemoryAiClient on every CI run.
 *
 * What's tested here:
 *   - Turn with no tool calls → plain assistant message, no state changes
 *   - Turn with one extract_field tool call → state.extractedFields patched,
 *     then final text response
 *   - Turn with multiple tool calls (extract + classify + respond)
 *   - Loop cap: 5 consecutive tool-call iterations returns a safety-net message
 *   - Tool error passthrough: invalid tool input → dispatcher error → Ada
 *     sees error and can continue
 */

import { describe, it, expect } from 'vitest';
import { processAdaTurn } from '@/engine/processAdaTurn';
import { createSession } from '@/engine/session/sessionRepo';
import {
  makeInMemoryClients,
  type InMemoryAdaClients,
} from '@/engine/clients/inMemoryClients';
import type { AiStreamChunk } from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ANON_ID = '00000000-0000-4000-8000-000000000abc';

function newSession(clients: InMemoryAdaClients) {
  return createSession(clients, {
    orgId: ORG_ID,
    sessionType: 'public_ada',
    anonSessionId: ANON_ID,
    userId: null,
  });
}

/** Helper: build a tool_use sequence chunk-by-chunk. */
function toolUseChunks(
  toolId: string,
  toolName: string,
  input: Record<string, unknown>,
): AiStreamChunk[] {
  return [
    { type: 'tool_use_start', toolId, toolName },
    { type: 'tool_use_stop', toolId, toolName, toolInput: input },
  ];
}

/** Helper: a turn that's just text, no tools. */
function textOnlyTurn(text: string): AiStreamChunk[] {
  return [
    { type: 'text_delta', content: text },
    { type: 'message_stop' },
  ];
}

describe('processAdaTurn — integration', () => {
  it('text-only response: no tool calls, returns plain assistant message', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    clients.ai.enqueueResponse(textOnlyTurn('Hi! What happened?'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });

    expect(result.assistantMessage.role).toBe('assistant');
    expect(result.assistantMessage.content).toBe('Hi! What happened?');
    expect(result.toolInvocations).toHaveLength(0);
    // History: user + assistant
    expect(result.nextState.conversationHistory).toHaveLength(2);
    expect(result.nextState.conversationHistory[0].role).toBe('user');
    expect(result.nextState.conversationHistory[0].content).toBe('hello');
  });

  it('one extract_field call: state.extractedFields is patched, then Ada replies', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Turn 1: Ada calls extract_field. Turn 2: Ada responds with text.
    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'extract_field', {
        field: 'location_state',
        value: 'AZ',
        confidence: 0.95,
      }),
    );
    clients.ai.enqueueResponse(textOnlyTurn('Got it — Arizona. Tell me more?'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'a restaurant in Phoenix refused my service dog' },
    });

    expect(result.toolInvocations).toHaveLength(1);
    expect(result.toolInvocations[0].name).toBe('extract_field');
    expect(result.toolInvocations[0].isError).toBe(false);
    expect(result.nextState.extractedFields.location_state?.value).toBe('AZ');
    expect(result.nextState.extractedFields.location_state?.confidence).toBe(0.95);
    expect(result.assistantMessage.content).toBe('Got it — Arizona. Tell me more?');
  });

  it('chain of tool calls: extract + classify + respond', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Turn 1: extract_field
    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'extract_field', {
        field: 'business_type',
        value: 'Restaurant',
        confidence: 0.9,
      }),
    );
    // Turn 2: set_classification
    clients.ai.enqueueResponse(
      toolUseChunks('tu_2', 'set_classification', {
        title: 'III',
        tier: 'high',
        reasoning: 'Service animal denial at a restaurant — classic Title III',
        standard: '28 CFR §36.302(c)',
      }),
    );
    // Turn 3: final text
    clients.ai.enqueueResponse(
      textOnlyTurn("This looks like a Title III violation. Let's find an attorney."),
    );

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'a restaurant in Phoenix refused my service dog' },
    });

    expect(result.toolInvocations.map((t) => t.name)).toEqual([
      'extract_field',
      'set_classification',
    ]);
    expect(result.nextState.extractedFields.business_type?.value).toBe('Restaurant');
    expect(result.nextState.classification?.title).toBe('III');
    expect(result.nextState.classification?.tier).toBe('high');
    expect(result.assistantMessage.content).toContain('Title III');
  });

  it('session transition via end_session: status moves active → completed', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'end_session', {
        outcome: 'referred_to_eeoc',
        summary: 'Title I — gave EEOC link',
      }),
    );
    clients.ai.enqueueResponse(textOnlyTurn('Thanks for reaching out.'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: "it's a workplace issue" },
    });

    expect(result.nextState.status).toBe('completed');
    expect(result.toolInvocations[0].name).toBe('end_session');
    expect(result.toolInvocations[0].isError).toBe(false);
  });

  it('set_reading_level: state.readingLevel updates mid-turn', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    expect(state.readingLevel).toBe('standard');

    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'set_reading_level', {
        level: 'simple',
        reason: 'user asked for plain language',
      }),
    );
    clients.ai.enqueueResponse(textOnlyTurn('Got it. I will use simpler words.'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'Can you say it simpler?' },
    });

    expect(result.nextState.readingLevel).toBe('simple');
  });

  it('invalid tool input: dispatcher returns error, Ada sees it and continues', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Ada calls set_classification with an invalid title.
    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'set_classification', {
        title: 'IV', // invalid
        tier: 'high',
        reasoning: 'testing',
        standard: '§',
      }),
    );
    clients.ai.enqueueResponse(
      textOnlyTurn('Sorry, let me reconsider — could you tell me more?'),
    );

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'something happened' },
    });

    expect(result.toolInvocations).toHaveLength(1);
    expect(result.toolInvocations[0].isError).toBe(true);
    // Classification NOT set because the tool errored.
    expect(result.nextState.classification).toBeNull();
    expect(result.assistantMessage.content).toContain('reconsider');
  });

  it('loop cap: after MAX_TOOL_LOOPS consecutive tool calls returns safety-net message', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Queue 6 tool-use responses — one more than the cap of 5.
    for (let i = 0; i < 6; i++) {
      clients.ai.enqueueResponse(
        toolUseChunks(`tu_${i}`, 'extract_field', {
          field: `field_${i}`,
          value: i,
          confidence: 0.5,
        }),
      );
    }
    // Plus a text response that shouldn't be reached.
    clients.ai.enqueueResponse(textOnlyTurn('Should not be reached.'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'test' },
    });

    // Exactly 5 tool invocations despite 6 scripted.
    expect(result.toolInvocations).toHaveLength(5);
    // Safety-net message shown to user.
    expect(result.assistantMessage.content).toMatch(/hit a limit/i);
  });
});
