/**
 * Dispatcher tests.
 *
 * The dispatcher is the only place that must never throw. All failure modes
 * — unknown tool, validation throw, execute() exception — must surface as
 * { ok: false, error } in the ToolInvocationRecord.result so Ada sees the
 * error conversationally.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients, type InMemoryAdaClients } from '@/engine/clients/inMemoryClients';
import { dispatchTool } from '@/engine/tools/dispatcher';
import { buildToolIndex, CH0_TOOLS } from '@/engine/tools/registry';
import type { AdaSessionState } from '@/engine/types';
import type { AnyAdaTool, ToolExecuteContext } from '@/engine/tools/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const SESSION_ID = '00000000-0000-4000-8000-000000000111';

function baseState(): AdaSessionState {
  return {
    sessionId: SESSION_ID,
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
  };
}

function makeCtx(): ToolExecuteContext & { clients: InMemoryAdaClients } {
  return {
    clients: makeInMemoryClients(),
    state: baseState(),
  };
}

describe('dispatchTool', () => {
  const registry = buildToolIndex(CH0_TOOLS);

  it('returns ok:false for unknown tool', async () => {
    const record = await dispatchTool({
      name: 'does_not_exist',
      input: {},
      ctx: makeCtx(),
      registry,
    });
    expect(record.result.ok).toBe(false);
    if (!record.result.ok) {
      expect(record.result.error).toMatch(/Unknown tool/);
    }
    expect(record.name).toBe('does_not_exist');
  });

  it('returns ok:false when validateInput throws', async () => {
    const record = await dispatchTool({
      name: 'set_classification',
      input: { title: 'IV', tier: 'high', reasoning: 'x', standard: 'y' },
      ctx: makeCtx(),
      registry,
    });
    expect(record.result.ok).toBe(false);
    if (!record.result.ok) {
      expect(record.result.error).toMatch(/title must be one of/);
    }
  });

  it('returns ok:false when execute throws', async () => {
    const throwingTool: AnyAdaTool = {
      name: 'throws',
      description: '',
      inputSchema: { type: 'object', properties: {} },
      validateInput: (raw) => raw,
      execute: async () => {
        throw new Error('boom');
      },
    };
    const smallRegistry = buildToolIndex([throwingTool]);
    const record = await dispatchTool({
      name: 'throws',
      input: {},
      ctx: makeCtx(),
      registry: smallRegistry,
    });
    expect(record.result.ok).toBe(false);
    if (!record.result.ok) {
      expect(record.result.error).toMatch(/threw during execution.*boom/);
    }
  });

  it('records the request with the real name and input', async () => {
    const record = await dispatchTool({
      name: 'extract_field',
      input: { field: 'location_state', value: 'AZ', confidence: 0.9 },
      ctx: makeCtx(),
      registry,
    });
    expect(record.name).toBe('extract_field');
    expect(record.input).toEqual({ field: 'location_state', value: 'AZ', confidence: 0.9 });
    expect(record.result.ok).toBe(true);
  });

  it('records a duration and timestamp', async () => {
    const ctx = makeCtx();
    ctx.clients.clock.set(new Date('2026-04-20T12:00:00Z'));
    const record = await dispatchTool({
      name: 'set_reading_level',
      input: { level: 'simple' },
      ctx,
      registry,
    });
    expect(record.timestamp).toBe('2026-04-20T12:00:00.000Z');
    expect(record.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('happy path passes through stateChanges from the tool', async () => {
    const record = await dispatchTool({
      name: 'set_reading_level',
      input: { level: 'professional' },
      ctx: makeCtx(),
      registry,
    });
    expect(record.result.ok).toBe(true);
    if (record.result.ok) {
      expect(record.result.stateChanges?.readingLevel).toBe('professional');
    }
  });
});

describe('buildToolIndex', () => {
  it('rejects duplicate tool names', () => {
    const a: AnyAdaTool = {
      name: 'same',
      description: '',
      inputSchema: { type: 'object', properties: {} },
      validateInput: (raw) => raw,
      execute: async () => ({ ok: true, content: null }),
    };
    const b: AnyAdaTool = { ...a };
    expect(() => buildToolIndex([a, b])).toThrow(/Duplicate/);
  });

  it('CH0_TOOLS registry has exactly the six expected tools', () => {
    const names = CH0_TOOLS.map((t) => t.name).sort();
    expect(names).toEqual([
      'analyze_photo',
      'end_session',
      'extract_field',
      'search_attorneys',
      'set_classification',
      'set_reading_level',
    ]);
  });
});
