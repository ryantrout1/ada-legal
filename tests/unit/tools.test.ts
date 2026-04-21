/**
 * Layer 1 tests for each Ch0 tool.
 *
 * Structure per tool:
 *   - validateInput happy path
 *   - validateInput rejections (one per required field / enum)
 *   - execute happy path produces correct stateChanges
 *
 * These tests do NOT cover the dispatcher (see dispatcher.test.ts).
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { setClassificationTool } from '@/engine/tools/impls/setClassification';
import { extractFieldTool } from '@/engine/tools/impls/extractField';
import { analyzePhotoTool } from '@/engine/tools/impls/analyzePhoto';
import { searchAttorneysTool } from '@/engine/tools/impls/searchAttorneys';
import { searchAdaStandardsTool } from '@/engine/tools/impls/searchAdaStandards';
import { setReadingLevelTool } from '@/engine/tools/impls/setReadingLevel';
import { endSessionTool } from '@/engine/tools/impls/endSession';
import type { AdaSessionState } from '@/engine/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    orgId: ORG_ID,
    sessionType: 'public_ada',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-000000000222',
    userId: null,
    listingId: null,
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

// ─── setClassification ────────────────────────────────────────────────────────

describe('set_classification', () => {
  const tool = setClassificationTool;

  it('validateInput accepts valid input', () => {
    expect(
      tool.validateInput({
        title: 'III',
        tier: 'high',
        reasoning: 'restaurant refused to seat service dog',
        standard: '28 CFR §36.302(c)',
      }),
    ).toEqual({
      title: 'III',
      tier: 'high',
      reasoning: 'restaurant refused to seat service dog',
      standard: '28 CFR §36.302(c)',
    });
  });

  it('rejects invalid title', () => {
    expect(() => tool.validateInput({ title: 'IV', tier: 'high', reasoning: 'x', standard: 'y' }))
      .toThrow(/title must be one of/);
  });

  it('rejects invalid tier', () => {
    expect(() => tool.validateInput({ title: 'III', tier: 'maybe', reasoning: 'x', standard: 'y' }))
      .toThrow(/tier must be one of/);
  });

  it('rejects empty reasoning', () => {
    expect(() => tool.validateInput({ title: 'III', tier: 'high', reasoning: '', standard: 'y' }))
      .toThrow(/reasoning/);
  });

  it('rejects empty standard', () => {
    expect(() => tool.validateInput({ title: 'III', tier: 'high', reasoning: 'x', standard: '' }))
      .toThrow(/standard/);
  });

  it('rejects non-object input', () => {
    expect(() => tool.validateInput(null)).toThrow();
    expect(() => tool.validateInput('string')).toThrow();
  });

  it('execute returns stateChanges.classification', async () => {
    const clients = makeInMemoryClients();
    const input = tool.validateInput({
      title: 'II',
      tier: 'medium',
      reasoning: 'city office denied accommodation',
      standard: '28 CFR §35.130',
    });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stateChanges?.classification).toEqual({
        title: 'II',
        tier: 'medium',
        reasoning: 'city office denied accommodation',
        standard: '28 CFR §35.130',
      });
    }
  });
});

// ─── extractField ─────────────────────────────────────────────────────────────

describe('extract_field', () => {
  const tool = extractFieldTool;

  it('accepts string value', () => {
    expect(tool.validateInput({ field: 'location_state', value: 'AZ', confidence: 0.95 }))
      .toEqual({ field: 'location_state', value: 'AZ', confidence: 0.95 });
  });

  it('accepts boolean value', () => {
    expect(tool.validateInput({ field: 'has_service_animal', value: true, confidence: 0.8 }))
      .toEqual({ field: 'has_service_animal', value: true, confidence: 0.8 });
  });

  it('accepts null value (explicit no)', () => {
    const out = tool.validateInput({ field: 'photos', value: null, confidence: 1.0 });
    expect(out.value).toBeNull();
  });

  it('rejects empty field name', () => {
    expect(() => tool.validateInput({ field: '', value: 'x', confidence: 0.5 }))
      .toThrow(/field/);
  });

  it('rejects confidence > 1', () => {
    expect(() => tool.validateInput({ field: 'x', value: 'y', confidence: 1.5 }))
      .toThrow(/confidence/);
  });

  it('rejects confidence < 0', () => {
    expect(() => tool.validateInput({ field: 'x', value: 'y', confidence: -0.1 }))
      .toThrow(/confidence/);
  });

  it('rejects missing value key', () => {
    expect(() => tool.validateInput({ field: 'x', confidence: 0.5 }))
      .toThrow(/value/);
  });

  it('execute patches extractedFields with timestamp', async () => {
    const clients = makeInMemoryClients();
    clients.clock.set(new Date('2026-04-20T12:00:00Z'));
    const input = tool.validateInput({ field: 'location_state', value: 'AZ', confidence: 0.95 });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stateChanges?.extractedFieldsPatch).toEqual({
        location_state: {
          value: 'AZ',
          confidence: 0.95,
          extracted_at: '2026-04-20T12:00:00.000Z',
        },
      });
    }
  });
});

// ─── analyzePhoto ─────────────────────────────────────────────────────────────

describe('analyze_photo', () => {
  const tool = analyzePhotoTool;

  it('accepts blob_key alone', () => {
    expect(tool.validateInput({ blob_key: 'photos/abc.jpg' }))
      .toEqual({ blob_key: 'photos/abc.jpg', context_hint: undefined });
  });

  it('accepts blob_key + context_hint', () => {
    expect(tool.validateInput({ blob_key: 'photos/abc.jpg', context_hint: 'doorway width' }))
      .toEqual({ blob_key: 'photos/abc.jpg', context_hint: 'doorway width' });
  });

  it('rejects empty blob_key', () => {
    expect(() => tool.validateInput({ blob_key: '' })).toThrow(/blob_key/);
  });

  it('rejects non-string context_hint', () => {
    expect(() => tool.validateInput({ blob_key: 'x', context_hint: 42 })).toThrow(/context_hint/);
  });

  it('execute delegates to PhotoAnalysisClient and returns findings', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      findings: [
        {
          finding: 'Entrance has a 6-inch step with no ramp',
          severity: 'major',
          standard: '28 CFR §36.304',
          confidence: 0.9,
          bounding_box: { x: 10, y: 20, w: 200, h: 150 },
        },
      ],
      modelVersion: 'test-v1',
    });
    const input = tool.validateInput({ blob_key: 'photos/entrance.jpg' });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stateChanges?.photoFindings).toHaveLength(1);
      expect(clients.photo.requests).toHaveLength(1);
    }
  });

  it('execute returns ok:false if client throws', async () => {
    const clients = makeInMemoryClients();
    // No enqueue → InMemoryPhotoAnalysisClient will throw.
    const input = tool.validateInput({ blob_key: 'photos/entrance.jpg' });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Photo analysis failed/);
  });
});

// ─── searchAttorneys ──────────────────────────────────────────────────────────

describe('search_attorneys', () => {
  const tool = searchAttorneysTool;

  it('accepts no filters (empty search)', () => {
    expect(tool.validateInput({})).toEqual({
      state: undefined, city: undefined, practice_areas: undefined, limit: 5,
    });
  });

  it('uppercases state code', () => {
    expect(tool.validateInput({ state: 'az' }).state).toBe('AZ');
  });

  it('rejects non-integer limit', () => {
    expect(() => tool.validateInput({ limit: 3.5 })).toThrow(/limit/);
  });

  it('rejects limit > 10', () => {
    expect(() => tool.validateInput({ limit: 20 })).toThrow(/limit/);
  });

  it('rejects non-string practice_areas entry', () => {
    expect(() => tool.validateInput({ practice_areas: ['ada', 42] })).toThrow(/practice_areas/);
  });

  it('execute returns matching attorneys', async () => {
    const clients = makeInMemoryClients();
    clients.db.attorneys.push(
      {
        id: 'a1', name: 'Jane Doe', firmName: 'Doe & Co',
        locationCity: 'Phoenix', locationState: 'AZ',
        practiceAreas: ['ada'], email: 'jane@doe.com',
        phone: null, websiteUrl: null,
      },
      {
        id: 'a2', name: 'Mary Smith', firmName: null,
        locationCity: 'LA', locationState: 'CA',
        practiceAreas: ['employment'], email: null,
        phone: null, websiteUrl: null,
      },
    );
    const input = tool.validateInput({ state: 'AZ', practice_areas: ['ada'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const content = result.content as { count: number; attorneys: Array<{ name: string }> };
      expect(content.count).toBe(1);
      expect(content.attorneys[0].name).toBe('Jane Doe');
    }
  });
});

// ─── setReadingLevel ──────────────────────────────────────────────────────────

describe('set_reading_level', () => {
  const tool = setReadingLevelTool;

  it.each(['simple', 'standard', 'professional'] as const)('accepts %s', (level) => {
    expect(tool.validateInput({ level }).level).toBe(level);
  });

  it('rejects unknown level', () => {
    expect(() => tool.validateInput({ level: 'legal' })).toThrow(/level/);
  });

  it('execute returns stateChanges.readingLevel', async () => {
    const clients = makeInMemoryClients();
    const input = tool.validateInput({ level: 'simple', reason: 'user asked' });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.stateChanges?.readingLevel).toBe('simple');
  });
});

// ─── endSession ───────────────────────────────────────────────────────────────

describe('end_session', () => {
  const tool = endSessionTool;

  it('validates outcome + summary required', () => {
    expect(() => tool.validateInput({ outcome: '' })).toThrow();
    expect(() => tool.validateInput({ outcome: 'x', summary: '' })).toThrow();
  });

  it('execute on active → requests sessionTransition=complete', async () => {
    const clients = makeInMemoryClients();
    const input = tool.validateInput({ outcome: 'referred', summary: 'gave attorney list' });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.stateChanges?.sessionTransition).toBe('complete');
  });

  it('execute on completed → returns ok:false', async () => {
    const clients = makeInMemoryClients();
    const input = tool.validateInput({ outcome: 'x', summary: 'y' });
    const result = await tool.execute(
      { clients, state: baseState({ status: 'completed' }) },
      input,
    );
    expect(result.ok).toBe(false);
  });

  it('execute on abandoned → returns ok:false', async () => {
    const clients = makeInMemoryClients();
    const input = tool.validateInput({ outcome: 'x', summary: 'y' });
    const result = await tool.execute(
      { clients, state: baseState({ status: 'abandoned' }) },
      input,
    );
    expect(result.ok).toBe(false);
  });
});

// ─── search_ada_standards ────────────────────────────────────────────────────

describe('search_ada_standards', () => {
  const tool = searchAdaStandardsTool;

  it('validateInput happy path', () => {
    const out = tool.validateInput({ query: 'service animal fees' });
    expect(out.query).toBe('service animal fees');
    expect(out.limit).toBe(5); // default
    expect(out.topic).toBeUndefined();
  });

  it('validateInput with all fields', () => {
    const out = tool.validateInput({
      query: 'effective communication',
      topic: 'effective_communication',
      limit: 3,
    });
    expect(out.query).toBe('effective communication');
    expect(out.topic).toBe('effective_communication');
    expect(out.limit).toBe(3);
  });

  it('validateInput trims whitespace from query', () => {
    const out = tool.validateInput({ query: '  §36.302  ' });
    expect(out.query).toBe('§36.302');
  });

  it('validateInput rejects missing query', () => {
    expect(() => tool.validateInput({})).toThrow(/query is required/);
  });

  it('validateInput rejects empty query', () => {
    expect(() => tool.validateInput({ query: '' })).toThrow(/at least 3 characters/);
  });

  it('validateInput rejects invalid topic', () => {
    expect(() =>
      tool.validateInput({ query: 'test query', topic: 'not_a_real_topic' }),
    ).toThrow(/topic must be one of/);
  });

  it('validateInput rejects non-integer limit', () => {
    expect(() => tool.validateInput({ query: 'test query', limit: 2.5 })).toThrow(
      /integer between 1 and 10/,
    );
  });

  it('validateInput rejects limit > 10', () => {
    expect(() => tool.validateInput({ query: 'test query', limit: 50 })).toThrow(
      /integer between 1 and 10/,
    );
  });

  it('execute returns knowledge base hits', async () => {
    const clients = makeInMemoryClients();
    clients.db.knowledgeChunks.push({
      id: 'chunk-1',
      topic: 'service_animals',
      title: '§36.302(c)(1) — Service animals — general rule',
      content: 'Generally, a public accommodation shall modify policies.',
      standardRefs: ['36.302(c)(1)', '36.302(c)', '36.302'],
      source: '28 CFR §36',
      similarity: null,
      matchType: 'citation',
    });

    const input = tool.validateInput({ query: 'What does §36.302(c)(1) say?' });
    const result = await tool.execute(
      { clients, state: baseState() },
      input,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const content = result.content as {
        count: number;
        results: Array<{ title: string; content: string }>;
      };
      expect(content.count).toBe(1);
      expect(content.results[0].title).toContain('§36.302(c)(1)');
    }
  });

  it('execute embeds the query when embeddings client is present', async () => {
    const clients = makeInMemoryClients();
    const input = tool.validateInput({ query: 'can a restaurant refuse my service dog' });
    await tool.execute({ clients, state: baseState() }, input);

    expect(clients.embeddings.embedCalls).toHaveLength(1);
    expect(clients.embeddings.embedCalls[0]).toContain('service dog');
  });

  it('execute proceeds without embedding when embeddings client throws', async () => {
    const clients = makeInMemoryClients();
    clients.embeddings.shouldFail = true;
    clients.db.knowledgeChunks.push({
      id: 'chunk-1',
      topic: 'service_animals',
      title: '§36.302(c)(1) — title',
      content: 'body',
      standardRefs: ['36.302(c)(1)'],
      source: '28 CFR §36',
      similarity: null,
      matchType: 'citation',
    });

    const input = tool.validateInput({ query: 'What does §36.302(c)(1) say?' });
    const result = await tool.execute(
      { clients, state: baseState() },
      input,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const content = result.content as { count: number };
      expect(content.count).toBe(1); // citation-match still worked
    }
  });

  it('execute respects the topic filter', async () => {
    const clients = makeInMemoryClients();
    clients.db.knowledgeChunks.push(
      {
        id: 'a',
        topic: 'service_animals',
        title: '§36.302(c)(1) — service',
        content: 'body',
        standardRefs: ['36.302(c)(1)'],
        source: '28 CFR §36',
        similarity: null,
        matchType: 'citation',
      },
      {
        id: 'b',
        topic: 'mobility_devices',
        title: '§36.311(a) — mobility',
        content: 'body',
        standardRefs: ['36.311(a)'],
        source: '28 CFR §36',
        similarity: null,
        matchType: 'citation',
      },
    );

    const input = tool.validateInput({
      query: 'rules about §36.302(c)(1)',
      topic: 'service_animals',
    });
    const result = await tool.execute(
      { clients, state: baseState() },
      input,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const content = result.content as {
        count: number;
        results: Array<{ topic: string }>;
      };
      expect(content.count).toBe(1);
      expect(content.results[0].topic).toBe('service_animals');
    }
  });
});
