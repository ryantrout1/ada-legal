/**
 * composeAndPlaceReport — the compose+place core shared by the Spot buyer
 * report and the /photo field test (/plan phase 1).
 *
 * The defining guarantee is architectural: it works from ANALYSES ALREADY
 * COMPUTED, so a caller that already analyzed (and, on /photo, persisted the
 * raw row) never analyzes a second time. generateReport's own behavior is
 * covered by spotGenerateReport.test.ts; this pins the extracted seam.
 */

import { describe, it, expect } from 'vitest';
import { composeAndPlaceReport } from '@/lib/spot/composeAndPlaceReport';
import type { AdaClients, AiStreamChunk } from '@/engine/clients/types';
import type { PhotoAnalysisOutput } from '@/types/db';
import type { PlaceFn } from '@/lib/spot/buildPhotoAnnotations';

const cannedOutput = (): PhotoAnalysisOutput => ({
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
});

async function* composeStream(input: unknown): AsyncIterable<AiStreamChunk> {
  yield { type: 'tool_use_start', toolId: 't1', toolName: 'compose_report' };
  yield {
    type: 'tool_use_stop',
    toolId: 't1',
    toolName: 'compose_report',
    toolInput: input as Record<string, unknown>,
  };
  yield { type: 'message_stop' };
}
async function* emptyStream(): AsyncIterable<AiStreamChunk> {
  yield { type: 'text_delta', content: 'no tool call' };
  yield { type: 'message_stop' };
}

function fakeClients(opts: {
  onAnalyze: () => void;
  streams: Array<() => AsyncIterable<AiStreamChunk>>;
}): AdaClients {
  let call = 0;
  return {
    photo: {
      analyze: async () => {
        opts.onAnalyze();
        return { output: cannedOutput(), modelVersion: 'opus-test' };
      },
    },
    ai: { stream: () => opts.streams[Math.min(call++, opts.streams.length - 1)]() },
  } as unknown as AdaClients;
}

const AREA = {
  overview: 'The entrance has one possible barrier.',
  areas: [
    {
      title: 'Door',
      concern: 'Hard knob.',
      remediation: 'Lever handle.',
      severity: 'major',
      cited_section: '§404.2.7',
      confirmable: true, locatable: true,
    },
  ],
};

const stubPlace: PlaceFn = async () => ({ x: 0.5, y: 0.5, confidence: 0.9, label: 'Door' });

describe('composeAndPlaceReport', () => {
  it('composes and places from provided analyses WITHOUT re-analyzing', async () => {
    let analyzeCalls = 0;
    const clients = fakeClients({
      onAnalyze: () => {
        analyzeCalls++;
      },
      streams: [() => composeStream(AREA)],
    });
    const out = await composeAndPlaceReport(clients, {
      analyses: [cannedOutput()],
      photos: [{ blobUrl: 'https://blob/0.jpg' }],
      model: 'opus-test',
      annotate: true,
      placeFn: stubPlace,
    });
    expect(analyzeCalls, 'must not re-analyze — the caller already did').toBe(0);
    expect(out.modelVersion).toBe('opus-test');
    expect(out.content.items[0].title).toBe('Door');
    expect(out.content.photoAnnotations?.[0].pins).toHaveLength(1);
  });

  it('retries the synthesis once, then succeeds', async () => {
    const clients = fakeClients({
      onAnalyze: () => {},
      streams: [() => emptyStream(), () => composeStream(AREA)],
    });
    const out = await composeAndPlaceReport(clients, {
      analyses: [cannedOutput()],
      photos: [{ blobUrl: 'https://blob/0.jpg' }],
      model: 'opus-test',
    });
    expect(out.content.items[0].title).toBe('Door');
  });

  it('throws when the model returns no tool call after the retry', async () => {
    const clients = fakeClients({
      onAnalyze: () => {},
      streams: [() => emptyStream(), () => emptyStream()],
    });
    await expect(
      composeAndPlaceReport(clients, {
        analyses: [cannedOutput()],
        photos: [{ blobUrl: 'https://blob/0.jpg' }],
        model: 'opus-test',
      }),
    ).rejects.toThrow();
  });

  it('ships without pins when placement throws (never fails the report)', async () => {
    const clients = fakeClients({ onAnalyze: () => {}, streams: [() => composeStream(AREA)] });
    const throwingPlace: PlaceFn = async () => {
      throw new Error('placement down');
    };
    const out = await composeAndPlaceReport(clients, {
      analyses: [cannedOutput()],
      photos: [{ blobUrl: 'https://blob/0.jpg' }],
      model: 'opus-test',
      annotate: true,
      placeFn: throwingPlace,
    });
    expect(out.content.items[0].title).toBe('Door');
    expect(out.content.photoAnnotations).toBeUndefined();
  });
});

describe('pins only what can be pointed at', () => {
  /**
   * The product rule: mark the curb, the fixed bench and the closed cabinet —
   * physical things a reader can see. Do not mark absent grab bars or
   * insufficient turning space; there is no object there, and a marker would
   * point at empty floor and imply a measurement we never took.
   *
   * A concern can be locatable and unconfirmable at once: the bench is plainly
   * visible even though its height needs a tape measure on site.
   */
  it('pins locatable items, including hedged ones, and skips the rest', async () => {
    const areas = {
      overview: 'Several concerns.',
      areas: [
        { title: 'Raised shower curb', concern: 'Blocks roll-in.', remediation: 'Curbless.', severity: 'critical', confirmable: true, locatable: true },
        { title: 'Fixed shower bench', concern: 'Not folding.', remediation: 'Folding seat.', severity: 'major', confirmable: false, locatable: true },
        { title: 'No grab bars at shower', concern: 'None visible.', remediation: 'Install bars.', severity: 'major', confirmable: false, locatable: false },
        { title: 'Turning space', concern: 'May be too small.', remediation: 'Measure.', severity: 'major', confirmable: false, locatable: false },
        // Visible object, so locatable — but minor. A marker here competes
        // with the critical curb for attention and is not worth it.
        { title: 'Shower controls', concern: 'Reach range.', remediation: 'Verify.', severity: 'minor', confirmable: false, locatable: true },
      ],
    };
    const clients = fakeClients({ onAnalyze: () => {}, streams: [() => composeStream(areas)] });
    const out = await composeAndPlaceReport(clients, {
      analyses: [cannedOutput()],
      photos: [{ blobUrl: 'https://blob/0.jpg' }],
      model: 'opus-test',
      annotate: true,
      placeFn: stubPlace,
    });

    const pins = out.content.photoAnnotations?.[0].pins ?? [];
    expect(pins).toHaveLength(2);
    // Bound by itemIndex: curb is item 0, bench item 1. The minor shower
    // controls (item 4) are locatable but not pinned.
    expect(pins.map((p) => p.itemIndex).sort()).toEqual([0, 1]);
    // All five concerns still appear in the report text.
    expect(out.content.items).toHaveLength(5);
  });
});
