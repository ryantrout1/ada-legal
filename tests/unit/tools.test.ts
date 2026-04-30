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
      class_action_candidate: null,
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
        class_action_candidate: null,
      });
    }
  });

  // ─── Step 18: expanded classification taxonomy ───────────────────────────

  it('accepts out_of_scope classification', () => {
    const input = tool.validateInput({
      title: 'out_of_scope',
      tier: 'high',
      reasoning: 'consumer complaint, not a disability issue',
      standard: 'state consumer protection act',
    });
    expect(input.title).toBe('out_of_scope');
    expect(input.class_action_candidate).toBeNull();
  });

  it('accepts class_action classification with a candidate slug', () => {
    const input = tool.validateInput({
      title: 'class_action',
      tier: 'medium',
      reasoning: 'matches the hotel booking fraud pattern',
      standard: 'n/a',
      class_action_candidate: 'hotel-booking-fraud-2025',
    });
    expect(input.title).toBe('class_action');
    expect(input.class_action_candidate).toBe('hotel-booking-fraud-2025');
  });

  it('accepts class_action classification without a candidate slug', () => {
    // In Step 18 the registry is not live; Ada may flag class_action
    // without a specific candidate.
    const input = tool.validateInput({
      title: 'class_action',
      tier: 'low',
      reasoning: 'pattern suggests multi-plaintiff; no registered class yet',
      standard: 'n/a',
    });
    expect(input.title).toBe('class_action');
    expect(input.class_action_candidate).toBeNull();
  });

  it('rejects non-string class_action_candidate', () => {
    expect(() =>
      tool.validateInput({
        title: 'class_action',
        tier: 'high',
        reasoning: 'x',
        standard: 'n/a',
        class_action_candidate: 42,
      }),
    ).toThrow(/class_action_candidate/);
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

  it('accepts blob_keys with single entry', () => {
    expect(tool.validateInput({ blob_keys: ['photos/abc.jpg'] }))
      .toEqual({ blob_keys: ['photos/abc.jpg'], context_hint: undefined });
  });

  it('accepts blob_keys + context_hint', () => {
    expect(tool.validateInput({ blob_keys: ['photos/abc.jpg', 'photos/def.jpg'], context_hint: 'doorway width' }))
      .toEqual({ blob_keys: ['photos/abc.jpg', 'photos/def.jpg'], context_hint: 'doorway width' });
  });

  it('accepts up to 3 photos in a batch', () => {
    expect(tool.validateInput({ blob_keys: ['a', 'b', 'c'] }))
      .toEqual({ blob_keys: ['a', 'b', 'c'], context_hint: undefined });
  });

  it('rejects empty blob_keys array', () => {
    expect(() => tool.validateInput({ blob_keys: [] })).toThrow(/non-empty/);
  });

  it('rejects more than 3 photos', () => {
    expect(() => tool.validateInput({ blob_keys: ['a', 'b', 'c', 'd'] }))
      .toThrow(/maximum 3/);
  });

  it('rejects blob_keys with empty string entry', () => {
    expect(() => tool.validateInput({ blob_keys: ['photos/x.jpg', ''] }))
      .toThrow(/non-empty/);
  });

  it('rejects non-string context_hint', () => {
    expect(() => tool.validateInput({ blob_keys: ['x'], context_hint: 42 }))
      .toThrow(/context_hint/);
  });

  it('execute delegates to PhotoAnalysisClient and returns findings', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([
        makePhotoFinding({
          title: 'Step at entrance',
          text: 'Entrance has a 6-inch step with no ramp',
          severity: 'major',
          standard: '28 CFR §36.304',
          confidence: 0.9,
          confirmable: true,
          bounding_box: { x: 10, y: 20, w: 200, h: 150 },
        }),
      ]),
      modelVersion: 'test-v1',
    });
    const input = tool.validateInput({ blob_keys: ['photos/entrance.jpg'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stateChanges?.photoFindings).toHaveLength(1);
      expect(result.stateChanges?.photoAnalyses).toHaveLength(1);
      expect(clients.photo.requests).toHaveLength(1);
      expect(clients.photo.requests[0].blobKeys).toEqual(['photos/entrance.jpg']);
    }
  });

  it('execute returns ok:false if client throws', async () => {
    const clients = makeInMemoryClients();
    // No enqueue → InMemoryPhotoAnalysisClient will throw.
    const input = tool.validateInput({ blob_keys: ['photos/entrance.jpg'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Photo analysis failed/);
  });

  // ── guide_url enrichment (Commit 29/7) ─────────────────────────

  it('enriches findings with guide_url from section number match', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([
        makePhotoFinding({
          title: 'Ramp slope',
          text: 'Ramp slope exceeds 1:12',
          severity: 'major',
          standard: '§405.2',
          confidence: 0.9,
          confirmable: true,
        }),
      ]),
      modelVersion: 'test-v1',
    });
    const input = tool.validateInput({ blob_keys: ['photos/ramp.jpg'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const findings = result.stateChanges?.photoFindings;
      expect(findings).toBeDefined();
      expect(findings?.[0].guide_url).toBe('/standards-guide/guide/ramps');
    }
  });

  it('uses chapter URL when section matches a chapter-only topic', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([
        makePhotoFinding({
          title: 'Pool entry',
          text: 'Pool has no accessible means of entry',
          severity: 'critical',
          standard: '§1009',
          confidence: 0.95,
          confirmable: true,
        }),
      ]),
      modelVersion: 'test-v1',
    });
    const input = tool.validateInput({ blob_keys: ['photos/pool.jpg'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const findings = result.stateChanges?.photoFindings;
      expect(findings?.[0].guide_url).toBe('/standards-guide/guide/swimming-pools');
    }
  });

  it('falls back to keyword match when section number is not recognized', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([
        makePhotoFinding({
          title: 'Service animal denied',
          text: 'Service animal was turned away at entrance',
          severity: 'major',
          standard: '28 CFR §36.302(c)',
          confidence: 0.85,
          confirmable: true,
        }),
      ]),
      modelVersion: 'test-v1',
    });
    const input = tool.validateInput({ blob_keys: ['photos/entrance.jpg'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const findings = result.stateChanges?.photoFindings;
      expect(findings?.[0].guide_url).toBe('/standards-guide/guide/service-animals');
    }
  });

  it('leaves guide_url undefined when neither section nor keywords match', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([
        makePhotoFinding({
          title: 'Generic',
          text: 'Generic observation',
          severity: 'advisory',
          standard: 'Some unrelated reference',
          confidence: 0.5,
          confirmable: true,
        }),
      ]),
      modelVersion: 'test-v1',
    });
    const input = tool.validateInput({ blob_keys: ['photos/misc.jpg'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const findings = result.stateChanges?.photoFindings;
      expect(findings?.[0].guide_url).toBeUndefined();
    }
  });

  // ── cache against state.metadata.photo_analyses ─────────────────────

  it('returns cached output without invoking client when blob_keys match', async () => {
    const clients = makeInMemoryClients();
    // Don't enqueue a result — if the client is called, the in-memory
    // implementation throws, which would surface as ok:false. A cache
    // hit must skip the client entirely.
    const cachedOutput = {
      ...makeOutput([
        makePhotoFinding({
          title: 'Cached step',
          text: 'Cached finding text',
          severity: 'major' as const,
          standard: '§404.2.5',
          confidence: 0.9,
          confirmable: true,
        }),
      ]),
      blob_keys: ['photos/cached.jpg'],
    };
    const stateWithCache = baseState({
      metadata: { photo_analyses: [cachedOutput] },
    });
    const input = tool.validateInput({ blob_keys: ['photos/cached.jpg'] });
    const result = await tool.execute({ clients, state: stateWithCache }, input);
    expect(result.ok).toBe(true);
    expect(clients.photo.requests).toHaveLength(0);
    if (result.ok) {
      // Cache hits don't write back to state — the analysis is already there.
      expect(result.stateChanges).toBeUndefined();
      expect((result.content as { model: string }).model).toBe('cached');
    }
  });

  it('cache lookup is order-independent across blob_keys', async () => {
    const clients = makeInMemoryClients();
    const cachedOutput = {
      ...makeOutput([]),
      blob_keys: ['photos/a.jpg', 'photos/b.jpg', 'photos/c.jpg'],
    };
    const stateWithCache = baseState({
      metadata: { photo_analyses: [cachedOutput] },
    });
    // Request the same three photos in a different order.
    const input = tool.validateInput({
      blob_keys: ['photos/c.jpg', 'photos/a.jpg', 'photos/b.jpg'],
    });
    const result = await tool.execute({ clients, state: stateWithCache }, input);
    expect(result.ok).toBe(true);
    expect(clients.photo.requests).toHaveLength(0);
  });

  it('cache miss with subset of cached batch — does not match', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([]),
      modelVersion: 'test-v1',
    });
    const cachedOutput = {
      ...makeOutput([]),
      blob_keys: ['photos/a.jpg', 'photos/b.jpg'],
    };
    const stateWithCache = baseState({
      metadata: { photo_analyses: [cachedOutput] },
    });
    const input = tool.validateInput({ blob_keys: ['photos/a.jpg'] });
    const result = await tool.execute({ clients, state: stateWithCache }, input);
    expect(result.ok).toBe(true);
    // Subset doesn't match — fresh call is made.
    expect(clients.photo.requests).toHaveLength(1);
  });

  it('writes cache key onto the output and appends to metadata.photo_analyses', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([]),
      modelVersion: 'test-v1',
    });
    const input = tool.validateInput({ blob_keys: ['photos/z.jpg', 'photos/y.jpg'] });
    const result = await tool.execute({ clients, state: baseState() }, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const cache = result.stateChanges?.metadataPatch?.photo_analyses;
      expect(cache).toHaveLength(1);
      // Stored sorted regardless of input order.
      expect(cache?.[0].blob_keys).toEqual(['photos/y.jpg', 'photos/z.jpg']);
    }
  });

  it('pre-cache analyses (no blob_keys field) are skipped on lookup', async () => {
    const clients = makeInMemoryClients();
    clients.photo.enqueueResult({
      output: makeOutput([]),
      modelVersion: 'test-v1',
    });
    // Old-shape entry — written before cache support existed.
    const oldEntry = makeOutput([]);
    const stateWithCache = baseState({
      metadata: { photo_analyses: [oldEntry] },
    });
    const input = tool.validateInput({ blob_keys: ['photos/x.jpg'] });
    const result = await tool.execute({ clients, state: stateWithCache }, input);
    expect(result.ok).toBe(true);
    // Old entry has no blob_keys — must be ignored by the matcher.
    expect(clients.photo.requests).toHaveLength(1);
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

// ─── photo finding helpers ────────────────────────────────────────────────────

interface MakePhotoFindingArgs {
  title: string;
  text: string;
  severity: 'critical' | 'major' | 'minor' | 'advisory';
  standard: string;
  confidence: number;
  confirmable: boolean;
  bounding_box?: { x: number; y: number; w: number; h: number };
}

function makePhotoFinding(a: MakePhotoFindingArgs) {
  return {
    finding: a.text,
    title_simple: a.title,
    title_standard: a.title,
    title_professional: a.title,
    finding_simple: a.text,
    finding_standard: a.text,
    finding_professional: a.text,
    severity: a.severity,
    standard: a.standard,
    confidence: a.confidence,
    confirmable: a.confirmable,
    ...(a.bounding_box ? { bounding_box: a.bounding_box } : {}),
  };
}

function makeOutput(findings: ReturnType<typeof makePhotoFinding>[]) {
  return {
    scene: { simple: '', standard: '', professional: '' },
    summary: { simple: '', standard: '', professional: '' },
    overall_risk: 'medium' as const,
    positive_findings: { simple: [], standard: [], professional: [] },
    findings,
  };
}
