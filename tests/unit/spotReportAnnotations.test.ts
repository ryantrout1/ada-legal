import { describe, it, expect } from 'vitest';
import { generateReport } from '@/lib/spot/generateReport';
import type { AdaClients, AiStreamChunk } from '@/engine/clients/types';
import type { PhotoAnalysisOutput } from '@/types/db';
import type { PlaceFn } from '@/lib/spot/buildPhotoAnnotations';

const cannedOutput = (): PhotoAnalysisOutput =>
  ({
    scene: { standard: 'Entrance' },
    summary: { standard: 'One possible barrier.' },
    overall_risk: 'medium',
    positive_findings: { standard: [] },
    findings: [
      {
        title_standard: 'Door',
        finding_standard: 'Hard knob.',
        severity: 'major',
        standard: '§404.2.7',
        confidence: 0.7,
        confirmable: true,
      },
    ],
    meta: { tool_call_present: true, stop_reason: 'tool_use' },
  }) as unknown as PhotoAnalysisOutput;

async function* composeStream(input: unknown): AsyncIterable<AiStreamChunk> {
  yield { type: 'tool_use_start', toolId: 't1', toolName: 'compose_report' };
  yield { type: 'tool_use_stop', toolId: 't1', toolName: 'compose_report', toolInput: input as Record<string, unknown> };
  yield { type: 'message_stop' };
}

function fakeClients(): AdaClients {
  return {
    photo: {
      analyze: async () => ({ output: cannedOutput(), modelVersion: 'opus-test' }),
    },
    ai: {
      stream: () =>
        composeStream({
          overview: 'ok',
          areas: [
            { title: 'Door', concern: 'Hard knob.', remediation: 'Lever.', severity: 'major', confirmable: true },
          ],
        }),
    },
  } as unknown as AdaClients;
}

const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ blobUrl: `https://blob/${i}.jpg` }));

const stubPlacer: PlaceFn = async () => ({ x: 0.3, y: 0.6, confidence: 0.9 });

describe('generateReport — annotate branch', () => {
  it('off: content carries no photoAnnotations and prose is composed normally', async () => {
    const out = await generateReport(fakeClients(), { photos: photos(2), model: 'opus-test' });
    expect(out.content.items.length).toBeGreaterThan(0);
    expect('photoAnnotations' in out.content).toBe(false);
  });

  it('on: attaches one annotation entry per photo, each with a pin for the confirmable finding', async () => {
    const out = await generateReport(fakeClients(), {
      photos: photos(2),
      model: 'opus-test',
      annotate: true,
      placeFn: stubPlacer,
    });
    expect(out.content.photoAnnotations).toHaveLength(2);
    expect(out.content.photoAnnotations?.[0].photoUrl).toBe('https://blob/0.jpg');
    expect(out.content.photoAnnotations?.[0].pins).toHaveLength(1);
    expect(out.content.photoAnnotations?.[0].pins[0]).toMatchObject({ label: 'Door', severity: 'major' });
    // Prose is untouched by annotation (1b: synthesis path unchanged).
    expect(out.content.items.length).toBeGreaterThan(0);
  });

  it('failure-safe: a throwing placer never breaks the report — pins dropped, report still generated', async () => {
    const throwingPlacer: PlaceFn = async () => {
      throw new Error('placement exploded');
    };
    const out = await generateReport(fakeClients(), {
      photos: photos(2),
      model: 'opus-test',
      annotate: true,
      placeFn: throwingPlacer,
    });
    expect(out.content.items.length).toBeGreaterThan(0);
    expect(out.content.photoAnnotations).toBeUndefined();
  });
});
