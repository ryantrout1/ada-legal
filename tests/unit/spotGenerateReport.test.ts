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
      stream: () => composeStream({ overview: 'ok', areas: [{ title: 'Door', concern: 'Hard knob.', remediation: 'Lever handle.', severity: 'major', cited_section: '§404.2.7', confirmable: true }] }),
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

  it('runs batches in parallel and preserves batch order even when a later batch resolves first', async () => {
    // 4 photos → 2 batches. Batch 0 resolves SLOWER than batch 1; the
    // analyses array (and thus view-group numbering in the synthesis
    // prompt) must still be in batch order. Also proves parallelism:
    // both analyze calls start before either resolves.
    const started: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((r) => (releaseFirst = r));

    const outputFor = (label: string): PhotoAnalysisOutput => ({
      ...cannedOutput(),
      scene: { standard: label },
    });

    let sawSynthesisOrder = '';
    const clients = {
      photo: {
        analyze: async ({ blobKeys }: { blobKeys: string[] }) => {
          const label = blobKeys[0];
          started.push(label);
          if (label === 'https://blob/0.jpg') {
            await firstGate; // batch 0 stalls until batch 1 has resolved
          } else {
            releaseFirst();
          }
          return { output: outputFor(label), modelVersion: 'opus-test' };
        },
      },
      ai: {
        stream: (req: { messages: Array<{ content: string }> }) => {
          sawSynthesisOrder = req.messages[0].content;
          return composeStream({ overview: 'ok', areas: [{ title: 'Door', concern: 'Hard knob.', remediation: 'Lever handle.', severity: 'major', cited_section: '§404.2.7', confirmable: true }] });
        },
      },
    } as unknown as AdaClients;

    await generateReport(clients, { photos: photos(4), model: 'opus-test' });

    // Both batches started (parallel); a sequential loop would deadlock
    // here, because batch 0 awaits a gate only batch 1 releases.
    expect(started.length).toBe(2);
    // Batch 0's scene appears before batch 1's in the synthesis prompt.
    const i0 = sawSynthesisOrder.indexOf('https://blob/0.jpg');
    const i3 = sawSynthesisOrder.indexOf('https://blob/3.jpg');
    expect(i0).toBeGreaterThan(-1);
    expect(i3).toBeGreaterThan(-1);
    expect(i0).toBeLessThan(i3);
  });
});

/**
 * Retry exists because the malformation that shipped a zero-finding report to
 * a paying customer hit one of four generations on identical inputs. A buyer
 * should not lose their report to one bad roll.
 *
 * Ref: /triage Spot report generation.
 */
describe('generateReport — retries synthesis once', () => {
  const area = { title: 'Door', concern: 'Hard knob.', remediation: 'Lever handle.', severity: 'major', cited_section: '§404.2.7', confirmable: true };

  it('recovers when the first synthesis composes nothing', async () => {
    let streamCalls = 0;
    const clients = fakeClients({
      onAnalyze: () => {},
      stream: () => {
        streamCalls += 1;
        // First attempt reproduces the failure: the analyses found barriers,
        // compose_report returns none. Second attempt is healthy.
        return streamCalls === 1
          ? composeStream({ overview: 'ok', areas: [] })
          : composeStream({ overview: 'ok', areas: [area] });
      },
    });

    const out = await generateReport(clients, { photos: photos(1) });
    expect(streamCalls).toBe(2);
    expect(out.content.items).toHaveLength(1);
  });

  it('does not re-run the photo analyses on retry', async () => {
    // The vision calls are the expensive part and they already succeeded.
    let analyzeCalls = 0;
    let streamCalls = 0;
    const clients = fakeClients({
      onAnalyze: () => {
        analyzeCalls += 1;
      },
      stream: () => {
        streamCalls += 1;
        return streamCalls === 1
          ? composeStream({ overview: 'ok', areas: [] })
          : composeStream({ overview: 'ok', areas: [area] });
      },
    });

    await generateReport(clients, { photos: photos(1) });
    expect(streamCalls).toBe(2);
    expect(analyzeCalls).toBe(1);
  });

  it('gives up after the second failure rather than looping', async () => {
    let streamCalls = 0;
    const clients = fakeClients({
      onAnalyze: () => {},
      stream: () => {
        streamCalls += 1;
        return composeStream({ overview: 'ok', areas: [] });
      },
    });

    await expect(generateReport(clients, { photos: photos(1) })).rejects.toThrow();
    expect(streamCalls).toBe(2);
  });
});
