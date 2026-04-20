/**
 * Layer 2 integration test.
 *
 * Exercises the engine seam via InMemoryAdaClients end-to-end. This is
 * what every later feature-level engine test will look like: spin up fakes,
 * seed any needed state, call through the engine, assert on both outputs
 * and side effects.
 *
 * Right now the engine body isn't written yet (Phase A Step 6+), so these
 * tests assert on the seam itself — that the client bundle wires together
 * correctly, that a scripted AI response flows through the AiClient and
 * shows up in the request log, and that session state round-trips the DB.
 *
 * When the engine body lands, these tests get replaced by real turn-level
 * integration tests. The pattern stays the same.
 *
 * Ref: docs/ARCHITECTURE.md §13
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';

describe('engine seam — end-to-end integration', () => {
  it('a turn-shaped flow: read session, stream AI response, write updated session', async () => {
    const clients = makeInMemoryClients();

    // Seed a session (simulates what the API layer will do before calling processAdaTurn).
    const initial: AdaSessionState = {
      sessionId: clients.random.uuid(),
      orgId: '00000000-0000-4000-8000-000000000001',
      sessionType: 'public_ada',
      status: 'active',
      readingLevel: 'standard',
      anonSessionId: '00000000-0000-4000-8000-000000000abc',
      userId: null,
      listingId: null,
      conversationHistory: [],
      extractedFields: {},
      classification: null,
      metadata: {},
      accessibilitySettings: {},
      isTest: true,
    };
    await clients.db.writeSession({ state: initial });

    // Script the AI response Ada would return for a first user turn.
    clients.ai.enqueueText("Hi, I'm Ada. What happened?");

    // Simulate a turn (the real processAdaTurn will wrap this in Step 6+).
    const loaded = await clients.db.readSession({ sessionId: initial.sessionId });
    expect(loaded).not.toBeNull();

    const assistantText: string[] = [];
    for await (const chunk of clients.ai.stream({
      systemPrompt: 'placeholder system prompt',
      messages: loaded!.conversationHistory,
      tools: [],
    })) {
      if (chunk.type === 'text_delta' && chunk.content) {
        assistantText.push(chunk.content);
      }
    }
    expect(assistantText.join('')).toBe("Hi, I'm Ada. What happened?");

    // Persist an updated state.
    const updated: AdaSessionState = {
      ...loaded!,
      conversationHistory: [
        {
          role: 'assistant',
          content: assistantText.join(''),
          timestamp: clients.clock.now().toISOString(),
        },
      ],
    };
    await clients.db.writeSession({ state: updated });

    // Assertions: the round-trip worked, the AI request was captured, audit has no
    // noise we didn't explicitly log.
    const final = await clients.db.readSession({ sessionId: initial.sessionId });
    expect(final?.conversationHistory).toHaveLength(1);
    expect(final?.conversationHistory[0].role).toBe('assistant');
    expect(clients.ai.requests).toHaveLength(1);
    expect(clients.audit.entries).toHaveLength(0);
  });

  it('multiple turns accumulate conversation history correctly', async () => {
    const clients = makeInMemoryClients();
    const sessionId = clients.random.uuid();

    let state: AdaSessionState = {
      sessionId,
      orgId: '00000000-0000-4000-8000-000000000001',
      sessionType: 'public_ada',
      status: 'active',
      readingLevel: 'standard',
      anonSessionId: '00000000-0000-4000-8000-000000000abc',
      userId: null,
      listingId: null,
      conversationHistory: [],
      extractedFields: {},
      classification: null,
      metadata: {},
      accessibilitySettings: {},
      isTest: true,
    };
    await clients.db.writeSession({ state });

    // Three back-and-forths.
    for (const reply of ['First reply.', 'Second reply.', 'Third reply.']) {
      clients.ai.enqueueText(reply);
      const loaded = await clients.db.readSession({ sessionId });
      expect(loaded).not.toBeNull();

      const text: string[] = [];
      for await (const chunk of clients.ai.stream({
        systemPrompt: 'sys',
        messages: loaded!.conversationHistory,
        tools: [],
      })) {
        if (chunk.type === 'text_delta' && chunk.content) text.push(chunk.content);
      }

      state = {
        ...loaded!,
        conversationHistory: [
          ...loaded!.conversationHistory,
          {
            role: 'assistant',
            content: text.join(''),
            timestamp: clients.clock.now().toISOString(),
          },
        ],
      };
      await clients.db.writeSession({ state });
    }

    const final = await clients.db.readSession({ sessionId });
    expect(final?.conversationHistory.map((m) => m.content)).toEqual([
      'First reply.',
      'Second reply.',
      'Third reply.',
    ]);
    expect(clients.ai.requests).toHaveLength(3);
  });
});
