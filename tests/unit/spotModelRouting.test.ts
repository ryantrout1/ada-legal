/**
 * Model upgrade Phase 4a: Spot's report synthesis and pin placement read
 * Spot's own model slots; the shared compose+place core, when called
 * without models (the /photo analyzer path), stays on the shared slots.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdaClients, AiStreamChunk } from '@/engine/clients/types';
import type { PhotoAnalysisOutput } from '@/types/db';

const placementModels: string[] = [];
vi.mock('@/lib/spot/placeFindingAnthropic', async (orig) => {
  const real = await orig<typeof import('@/lib/spot/placeFindingAnthropic')>();
  return {
    ...real,
    makeAnthropicPlaceFn: (_key: string, model: string) => {
      placementModels.push(model);
      return async () => null;
    },
  };
});

const analysis = (): PhotoAnalysisOutput => ({
  scene: { standard: 'Entrance' },
  summary: { standard: 'One possible barrier.' },
  overall_risk: 'medium',
  positive_findings: { standard: [] },
  findings: [
    { title_standard: 'Door', finding_standard: 'Hard knob.', severity: 'major', standard: '§404.2.7', confidence: 0.7, confirmable: true },
  ],
  meta: { tool_call_present: true, stop_reason: 'tool_use' },
});

async function* composeStream(): AsyncIterable<AiStreamChunk> {
  yield { type: 'tool_use_start', toolId: 't1', toolName: 'compose_report' };
  yield {
    type: 'tool_use_stop',
    toolId: 't1',
    toolName: 'compose_report',
    toolInput: {
      overview: 'ok',
      areas: [{ title: 'Door', concern: 'Hard knob.', remediation: 'Lever handle.', severity: 'major', cited_section: '§404.2.7', confirmable: true }],
    },
  };
  yield { type: 'message_stop' };
}

function fakeClients(composeModels: string[]): AdaClients {
  const reader = { analyze: async () => ({ output: analysis(), modelVersion: 'x' }) };
  return {
    photo: reader,
    spotPhoto: reader,
    ai: {
      stream: (req: { model?: string }) => {
        composeModels.push(req.model ?? '');
        return composeStream();
      },
    },
  } as unknown as AdaClients;
}

beforeEach(() => {
  placementModels.length = 0;
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  vi.stubEnv('SPOT_REPORT_MODEL', '');
  delete process.env.SPOT_REPORT_MODEL;
});
afterEach(() => vi.unstubAllEnvs());

describe('Spot model routing', () => {
  it('the paid report composes and places on Spot slots', async () => {
    const { generateReport } = await import('@/lib/spot/generateReport');
    const { CLAUDE_MODELS } = await import('@/lib/claudeModels');
    const compose: string[] = [];
    await generateReport(fakeClients(compose), { photos: [{ blobUrl: 'https://blob/0.jpg' }], annotate: true });
    expect(compose[0]).toBe(CLAUDE_MODELS.spotReport);
    expect(placementModels).toEqual([CLAUDE_MODELS.spotPlacement]);
  });

  it('the shared core with no models (the /photo path) uses the shared slots', async () => {
    const { composeAndPlaceReport } = await import('@/lib/spot/composeAndPlaceReport');
    const { CLAUDE_MODELS } = await import('@/lib/claudeModels');
    const compose: string[] = [];
    await composeAndPlaceReport(fakeClients(compose), {
      analyses: [analysis()],
      photos: [{ blobUrl: 'https://blob/0.jpg' }],
      annotate: true,
    });
    expect(compose[0]).toBe(CLAUDE_MODELS.sharedReport);
    expect(placementModels).toEqual([CLAUDE_MODELS.sharedPlacement]);
  });

  it('Spot annotation preview defaults to the Spot placement model', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('api/spot/admin/annotation-preview.ts', 'utf8');
    expect(src).toMatch(/SPOT_PLACEMENT_MODEL/);
    expect(src).not.toMatch(/PLACEMENT_MODEL_DEFAULT/);
  });
});
