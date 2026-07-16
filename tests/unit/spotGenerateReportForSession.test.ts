import { describe, it, expect } from 'vitest';
import { generateReportForSession } from '@/lib/spot/generateReportForSession';
import type { SpotStore } from '@/lib/spot/spotStore';
import type { AdaClients, AiStreamChunk } from '@/engine/clients/types';
import type { PhotoAnalysisOutput } from '@/types/db';

const analysis = (): PhotoAnalysisOutput => ({
  scene: { standard: 'Entrance' },
  summary: { standard: 'One possible barrier.' },
  overall_risk: 'medium',
  positive_findings: { standard: [] },
  findings: [],
  meta: { tool_call_present: true, stop_reason: 'tool_use' },
});

async function* composeStream(): AsyncIterable<AiStreamChunk> {
  yield { type: 'tool_use_start', toolId: 't1', toolName: 'compose_report' };
  yield {
    type: 'tool_use_stop',
    toolId: 't1',
    toolName: 'compose_report',
    toolInput: { overview: 'ok', areas: [] },
  };
  yield { type: 'message_stop' };
}

function fakeClients(): AdaClients {
  return {
    photo: {
      analyze: async () => ({ output: analysis(), modelVersion: 'opus-test' }),
    },
    ai: { stream: () => composeStream() },
  } as unknown as AdaClients;
}

interface StoreLog {
  inserted: number;
  markedInReview: number;
}

function fakeStore(opts: {
  existingReport?: boolean;
  photoCount?: number;
  insertThrows?: boolean;
  log: StoreLog;
}): SpotStore {
  return {
    getReportBySession: async () => (opts.existingReport ? { slug: 'r-existing' } : null),
    listSessionPhotos: async () =>
      Array.from({ length: opts.photoCount ?? 0 }, (_, i) => ({ blobUrl: `https://blob/${i}.jpg` })),
    insertReport: async () => {
      if (opts.insertThrows) throw new Error('duplicate key value violates unique constraint');
      opts.log.inserted += 1;
    },
    markInReview: async () => {
      opts.log.markedInReview += 1;
      return true;
    },
  } as unknown as SpotStore;
}

describe('generateReportForSession', () => {
  it('generates, inserts, and flips to in_review on the happy path', async () => {
    const log: StoreLog = { inserted: 0, markedInReview: 0 };
    const res = await generateReportForSession(fakeStore({ photoCount: 2, log }), fakeClients(), 's1');
    expect(res.kind).toBe('generated');
    expect(log.inserted).toBe(1);
    expect(log.markedInReview).toBe(1);
  });

  it('recovers without re-generating when a report already exists', async () => {
    const log: StoreLog = { inserted: 0, markedInReview: 0 };
    const res = await generateReportForSession(
      fakeStore({ existingReport: true, photoCount: 2, log }),
      fakeClients(),
      's1',
    );
    expect(res.kind).toBe('recovered');
    expect(log.inserted).toBe(0);
    expect(log.markedInReview).toBe(1);
  });

  it('flips an empty session to in_review without a model call', async () => {
    const log: StoreLog = { inserted: 0, markedInReview: 0 };
    const clients = {
      photo: {
        analyze: async () => {
          throw new Error('must not be called');
        },
      },
      ai: { stream: () => composeStream() },
    } as unknown as AdaClients;
    const res = await generateReportForSession(fakeStore({ photoCount: 0, log }), clients, 's1');
    expect(res.kind).toBe('empty');
    expect(log.markedInReview).toBe(1);
  });

  it('surfaces an insert failure (0039 unique-index race) and does NOT flip status', async () => {
    // Concurrent inline + cron: the loser's insert violates the unique
    // index. The runner must throw (session stays `uploaded` for the
    // sweeper, which then recovers via the existing-report path) and must
    // not mark the session in_review on the failed run.
    const log: StoreLog = { inserted: 0, markedInReview: 0 };
    await expect(
      generateReportForSession(
        fakeStore({ photoCount: 2, insertThrows: true, log }),
        fakeClients(),
        's1',
      ),
    ).rejects.toThrow(/unique/);
    expect(log.markedInReview).toBe(0);
  });
});
