/**
 * Contract tests for the AdaClients seam.
 *
 * These tests exercise the behaviour every AdaClients implementation must
 * provide. Right now they run only against InMemoryAdaClients. In Step 4,
 * an integration harness will run the same suite against a real Neon test
 * branch for the DbClient surface, and a recorded-fixtures AiClient for
 * the AI surface.
 *
 * What's asserted here:
 *   - fresh factory produces independent instances
 *   - InMemoryDb round-trips session state by value (deep clones)
 *   - InMemoryAi raises if stream is called with nothing queued
 *   - InMemoryAi yields chunks in queued order
 *   - InMemoryBlob upload + getSignedUrl symmetry
 *   - InMemoryClock advance() returns monotonic-increasing times
 *   - InMemoryRandom uuids are distinct and valid shape
 *   - InMemoryAudit records entries in order
 *   - InMemoryEmail records sends and returns ids
 *
 * No engine logic is tested here. Engine tests live in tests/unit/engine/
 * (to be added in Step 4).
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';

function sampleState(sessionId: string): AdaSessionState {
  return {
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
}

describe('AdaClients seam — InMemory contract', () => {
  it('factory produces independent client instances', () => {
    const a = makeInMemoryClients();
    const b = makeInMemoryClients();
    expect(a.ai).not.toBe(b.ai);
    expect(a.db).not.toBe(b.db);
    expect(a.email).not.toBe(b.email);
  });

  describe('db', () => {
    it('round-trips a session state by value', async () => {
      const { db } = makeInMemoryClients();
      const state = sampleState('sess-1');
      await db.writeSession({ state });

      const read = await db.readSession({ sessionId: 'sess-1' });
      expect(read).toEqual(state);
    });

    it('deep-clones on write so caller mutation does not affect stored state', async () => {
      const { db } = makeInMemoryClients();
      const state = sampleState('sess-2');
      await db.writeSession({ state });

      // Mutate the original after writing.
      state.conversationHistory.push({
        role: 'user',
        content: 'after write',
        timestamp: '2026-04-20T12:00:00Z',
      });

      const read = await db.readSession({ sessionId: 'sess-2' });
      expect(read?.conversationHistory).toEqual([]);
    });

    it('returns null for an unknown session', async () => {
      const { db } = makeInMemoryClients();
      const read = await db.readSession({ sessionId: 'does-not-exist' });
      expect(read).toBeNull();
    });

    it('filters attorney search by state + practice area', async () => {
      const { db } = makeInMemoryClients();
      db.attorneys.push(
        {
          id: 'a1',
          name: 'A',
          firmName: null,
          locationCity: 'Phoenix',
          locationState: 'AZ',
          practiceAreas: ['ada'],
          email: null,
          phone: null,
          websiteUrl: null,
        },
        {
          id: 'a2',
          name: 'B',
          firmName: null,
          locationCity: 'LA',
          locationState: 'CA',
          practiceAreas: ['ada', 'employment'],
          email: null,
          phone: null,
          websiteUrl: null,
        },
        {
          id: 'a3',
          name: 'C',
          firmName: null,
          locationCity: 'Phoenix',
          locationState: 'AZ',
          practiceAreas: ['employment'],
          email: null,
          phone: null,
          websiteUrl: null,
        },
      );

      const azAdaOnly = await db.searchAttorneys({
        orgId: 'any',
        state: 'AZ',
        practiceAreas: ['ada'],
      });
      expect(azAdaOnly.map((a) => a.id)).toEqual(['a1']);
    });
  });

  describe('ai', () => {
    it('raises a helpful error if no response is queued', async () => {
      const { ai } = makeInMemoryClients();
      await expect(async () => {
        for await (const _ of ai.stream({
          systemPrompt: 'sys',
          messages: [],
          tools: [],
        })) {
          // nothing
        }
      }).rejects.toThrow(/enqueueResponse/);
    });

    it('yields queued chunks in order and records the request', async () => {
      const { ai } = makeInMemoryClients();
      ai.enqueueText('hello world');

      const chunks = [];
      for await (const chunk of ai.stream({
        systemPrompt: 'sys',
        messages: [],
        tools: [],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        { type: 'text_delta', content: 'hello world' },
        { type: 'message_stop' },
      ]);
      expect(ai.requests).toHaveLength(1);
      expect(ai.requests[0].systemPrompt).toBe('sys');
    });
  });

  describe('blob', () => {
    it('upload then getSignedUrl returns a memory: URL referencing the key', async () => {
      const { blob } = makeInMemoryClients();
      const { key } = await blob.upload({
        key: 'photos/abc.jpg',
        contentType: 'image/jpeg',
        body: new Uint8Array([1, 2, 3]),
      });
      const url = await blob.getSignedUrl(key);
      expect(url).toContain('photos/abc.jpg');
    });

    it('getSignedUrl throws for an unknown key', async () => {
      const { blob } = makeInMemoryClients();
      await expect(blob.getSignedUrl('nope')).rejects.toThrow(/no blob/);
    });
  });

  describe('clock', () => {
    it('now() returns a fresh Date each call (not a shared mutable reference)', () => {
      const { clock } = makeInMemoryClients();
      const a = clock.now();
      const b = clock.now();
      expect(a).not.toBe(b);
      expect(a.getTime()).toBe(b.getTime());
    });

    it('advance moves time forward', () => {
      const { clock } = makeInMemoryClients();
      const before = clock.now().getTime();
      clock.advance(1000);
      const after = clock.now().getTime();
      expect(after - before).toBe(1000);
    });
  });

  describe('random', () => {
    it('uuid() is unique across calls and has v4 shape', () => {
      const { random } = makeInMemoryClients();
      const a = random.uuid();
      const b = random.uuid();
      expect(a).not.toBe(b);
      expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('token() values are distinct', () => {
      const { random } = makeInMemoryClients();
      const t1 = random.token();
      const t2 = random.token();
      expect(t1).not.toBe(t2);
    });
  });

  describe('email + audit', () => {
    it('email.send records each send with a unique id', async () => {
      const { email } = makeInMemoryClients();
      const r1 = await email.send({ to: 'a@x', subject: 's1', html: '<p>1</p>' });
      const r2 = await email.send({ to: 'b@x', subject: 's2', html: '<p>2</p>' });
      expect(r1.id).not.toBe(r2.id);
      expect(email.sent).toHaveLength(2);
      expect(email.sent[0].to).toBe('a@x');
    });

    it('audit.log records entries in order', async () => {
      const { audit } = makeInMemoryClients();
      await audit.log({
        orgId: null,
        actorType: 'system',
        actorId: null,
        action: 'test.one',
        resourceType: null,
        resourceId: null,
        metadata: {},
      });
      await audit.log({
        orgId: null,
        actorType: 'ada',
        actorId: null,
        action: 'test.two',
        resourceType: null,
        resourceId: null,
        metadata: {},
      });
      expect(audit.entries.map((e) => e.action)).toEqual(['test.one', 'test.two']);
    });
  });
});
