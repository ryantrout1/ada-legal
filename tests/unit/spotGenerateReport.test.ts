import { describe, it, expect } from 'vitest';
import { generateReport } from '@/lib/spot/generateReport';
import type { AdaClients, AiStreamChunk } from '@/engine/clients/types';
import type { PhotoAnalysisOutput } from '@/types/db';

const cannedOutput = (): PhotoAnalysisOutput => ({
  scene: { standard: 'Entrance' },
  summary: { standard: 'One possible barrier.' },
  overall_risk: 'medium',
  positive_findings: { standard: [] },
  findings: [
    { title_standard: 'Door', finding_standard: 'Hard knob.', severity: 'major', standard: '§404.2.7', confidence: 0.7, confirmable: true },
  ],
  meta: { tool_call_present: true, stop_reason: 'tool_use' },
});

async function* composeStream(input: unknown): AsyncIterable<AiStreamChunk> {
  yield { type: 'tool_use_start', toolId: 't1', toolName: 'compose_report' };
  yield { type: 'tool_use_stop', toolId: 't1', toolName: 'compose_report', toolInput: input as Record<string, unknown> };
  yield { type: 'message_stop' };
}
async function* emptyStream(): AsyncIterable<AiStreamChunk> {
  yield { type: 'text_delta', content: 'no tool call' };
  yield { type: 'message_stop' };
}

function fakeClients(opts: {
  onAnalyze: (blobKeys: string[]) => void;
  stream: () => AsyncIterable<AiStreamChunk>;
}): AdaClients {
  return {
    photo: {
      analyze: async ({ blobKeys }: { blobKeys: string[] }) => {
        opts.onAnalyze(blobKeys);
        return { output: cannedOutput(), modelVersion: 'opus-test' };
      },
    },
    ai: { stream: () => opts.stream() },
  } as unknown as AdaClients;
}

const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ blobUrl: `https://blob/${i}.jpg` }));

describe('generateReport', () => {
  it('batches photos to the analyzer max of 3 per call', async () => {
    const batches: number[] = [];
    const clients = fakeClients({
      onAnalyze: (keys) => batches.push(keys.length),
      stream: () => composeStream({ overview: 'ok', areas: [] }),
    });
    await generateReport(clients, { photos: photos(7), model: 'opus-test' });
    expect(batches).toEqual([3, 3, 1]); // 7 photos → 3 calls, none over 3
  });

  it('composes a report from the tool output', async () => {
    const clients = fakeClients({
      onAnalyze: () => {},
      stream: () =>
        composeStream({
          overview: 'The entrance has one possible barrier.',
          areas: [{ title: 'Door', concern: 'Hard knob.', remediation: 'Lever handle.', severity: 'major', cited_section: '§404.2.7', confirmable: true }],
        }),
    });
    const out = await generateReport(clients, { photos: photos(2), model: 'opus-test' });
    expect(out.modelVersion).toBe('opus-test');
    expect(out.content.kind).toBe('findings');
    expect(out.content.items[0].citedSection).toBe('§404.2.7');
    expect(out.content.disclaimer).toBeTruthy();
  });

  it('throws when the model returns no compose_report tool call (no empty report persisted)', async () => {
    const clients = fakeClients({ onAnalyze: () => {}, stream: () => emptyStream() });
    await expect(generateReport(clients, { photos: photos(1), model: 'opus-test' })).rejects.toThrow();
  });
});
