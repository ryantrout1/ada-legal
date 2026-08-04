/**
 * Integration — the /photo field-test composed path (/plan phase 2, AC3).
 *
 * Encodes the sequence api/ada/analyze-photo runs: analyze the photo ONCE,
 * persist the raw row (the review queue Peter uses), then hand that SAME
 * analysis to the shared composeAndPlaceReport — never a second vision pass.
 * The guard is the analyze call count: if anyone later makes the composed path
 * re-analyze (double cost, and a display that can disagree with the saved row),
 * this fails.
 */

import { describe, it, expect } from 'vitest';
import { composeAndPlaceReport } from '@/lib/spot/composeAndPlaceReport';
import type { AdaClients, AiStreamChunk } from '@/engine/clients/types';
import type { PhotoAnalysisOutput } from '@/types/db';
import type { PlaceFn } from '@/lib/spot/buildPhotoAnnotations';

const analysis = (): PhotoAnalysisOutput => ({
  scene: { standard: 'Bathroom' },
  summary: { standard: 'A possible barrier.' },
  overall_risk: 'medium',
  positive_findings: { standard: [] },
  findings: [
    {
      title_standard: 'Raised shower curb',
      finding_standard: 'A raised curb at the shower entry.',
      severity: 'major',
      standard: '§608',
      confidence: 0.8,
      confirmable: true,
    },
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
      overview: 'One possible barrier at the shower.',
      areas: [
        {
          title: 'Raised shower curb',
          concern: 'The curb may block a roll-in entry.',
          remediation: 'Consider a curbless conversion.',
          severity: 'major',
          cited_section: '§608',
          confirmable: true,
        },
      ],
    } as Record<string, unknown>,
  };
  yield { type: 'message_stop' };
}

const stubPlace: PlaceFn = async () => ({ x: 0.3, y: 0.7, confidence: 0.9, label: 'Curb' });

describe('/photo composed path (analyze once → persist → compose)', () => {
  it('reuses the persisted analysis and never re-analyzes', async () => {
    let analyzeCalls = 0;
    const saved: Array<{ findings: unknown }> = [];
    const clients = {
      photo: {
        analyze: async () => {
          analyzeCalls++;
          return { output: analysis(), modelVersion: 'opus-test' };
        },
      },
      ai: { stream: () => composeStream() },
    } as unknown as AdaClients;

    // Step 1: the endpoint analyzes once.
    const out = (await clients.photo.analyze({ blobKeys: ['https://blob/a.jpg'] })).output;
    // Step 2: the endpoint persists the raw row (review queue). Stand-in save.
    saved.push({ findings: out.findings });
    // Step 3: the shared core composes+places from THAT analysis.
    const report = await composeAndPlaceReport(clients, {
      analyses: [out],
      photos: [{ blobUrl: 'https://blob/a.jpg' }],
      model: 'opus-test',
      annotate: true,
      placeFn: stubPlace,
    });

    expect(analyzeCalls, 'exactly one vision pass for the whole path').toBe(1);
    expect(saved).toHaveLength(1);
    expect(report.content.items[0].title).toBe('Raised shower curb');
    expect(report.content.photoAnnotations?.[0].pins).toHaveLength(1);
  });
});
