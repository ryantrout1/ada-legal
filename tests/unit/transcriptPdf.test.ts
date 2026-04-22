/**
 * Tests for the transcript PDF module.
 *
 * We don't render-compare the PDF bytes - that's brittle and would
 * fail on @react-pdf version bumps. Instead:
 *
 *   1. buildTranscriptDocument is tested for shape: it returns a
 *      React element tree. We verify it renders without throwing
 *      against a variety of inputs (empty history, string-only
 *      messages, content-block messages, long messages).
 *
 *   2. renderAndUploadTranscript is tested end-to-end with an
 *      in-memory blob stub - we assert it uploads SOMETHING with
 *      the right content type, key prefix, and that the returned
 *      url is non-empty.
 *
 * Ref: Step 24, Commit 3.
 */

import { describe, it, expect } from 'vitest';
import {
  buildTranscriptDocument,
  renderAndUploadTranscript,
} from '@/engine/handoff/transcriptPdf';
import type { AdaSessionState } from '@/engine/types';
import type { AttorneyPackage } from '@/engine/handoff/attorneyPackage';
import type {
  BlobClient,
  BlobUploadOptions,
  BlobUploadResult,
} from '@/engine/clients/types';

function basePackage(
  overrides: Partial<AttorneyPackage> = {},
): AttorneyPackage {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    listing: {
      id: '00000000-0000-4000-8000-000000000a02',
      title: 'Hotel booking fraud class action',
      firmName: 'Acme ADA Law',
    },
    qualified: true,
    disqualifyingReason: null,
    claimant: {
      name: 'Alex Morales',
      email: 'alex@example.com',
      phone: null,
      preferredContact: 'email',
    },
    fields: {},
    missingRequiredFields: [],
    classification: {
      title: 'III',
      tier: 'high',
      reasoning: 'test',
      standard: 'ADA Title III',
      class_action_candidate: null,
    },
    photos: [],
    conversationSummary: 'Summary',
    conversationSummaryIsApproved: true,
    conversationTranscriptUrl: null,
    generatedAt: '2026-04-22T18:00:00.000Z',
    ...overrides,
  };
}

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    orgId: '00000000-0000-4000-8000-000000000001',
    sessionType: 'class_action_intake',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: null,
    userId: null,
    listingId: '00000000-0000-4000-8000-000000000a02',
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

class CapturingBlobClient implements BlobClient {
  uploads: BlobUploadOptions[] = [];
  async upload(opts: BlobUploadOptions): Promise<BlobUploadResult> {
    this.uploads.push(opts);
    return {
      url: `https://blob.test/${opts.key}`,
      key: opts.key,
    };
  }
  async getSignedUrl(key: string): Promise<string> {
    return `https://blob.test/${key}?sig=mock`;
  }
}

// ─── buildTranscriptDocument ──────────────────────────────────────────────────

describe('buildTranscriptDocument', () => {
  it('returns a React element with a valid type', () => {
    const el = buildTranscriptDocument({
      state: baseState(),
      pkg: basePackage(),
    });
    expect(el).toBeDefined();
    expect((el as unknown as { type: unknown }).type).toBeDefined();
  });

  it('handles an empty conversation history', () => {
    const el = buildTranscriptDocument({
      state: baseState({ conversationHistory: [] }),
      pkg: basePackage(),
    });
    // No throw; tree is well-formed (handled inside render).
    expect(el).toBeDefined();
  });

  it('handles string-content messages', () => {
    const el = buildTranscriptDocument({
      state: baseState({
        conversationHistory: [
          { role: 'user', content: 'hello ada', timestamp: '2026-04-22T00:00:00.000Z' },
          { role: 'assistant', content: 'hi', timestamp: '2026-04-22T00:00:01.000Z' },
        ],
      }),
      pkg: basePackage(),
    });
    expect(el).toBeDefined();
  });

  it('handles content-block messages (text blocks extracted)', () => {
    const el = buildTranscriptDocument({
      state: baseState({
        conversationHistory: [
          {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Got it, thanks.' },
              { type: 'tool_use', id: 'tool_1', name: 'extract_field', input: {} },
            ] as never,
            timestamp: '2026-04-22T00:00:00.000Z',
          },
        ],
      }),
      pkg: basePackage(),
    });
    expect(el).toBeDefined();
  });

  it('handles a disqualified package with reason', () => {
    const el = buildTranscriptDocument({
      state: baseState(),
      pkg: basePackage({
        qualified: false,
        disqualifyingReason: 'Outside jurisdiction',
      }),
    });
    expect(el).toBeDefined();
  });

  it('handles a package without classification', () => {
    const el = buildTranscriptDocument({
      state: baseState(),
      pkg: basePackage({ classification: null }),
    });
    expect(el).toBeDefined();
  });
});

// ─── renderAndUploadTranscript ────────────────────────────────────────────────

describe('renderAndUploadTranscript', () => {
  it('uploads a PDF blob with the expected key shape', async () => {
    const blob = new CapturingBlobClient();
    const url = await renderAndUploadTranscript(
      { state: baseState(), pkg: basePackage() },
      blob,
    );
    expect(url).toMatch(/^https:\/\/blob\.test\/transcripts\//);
    expect(blob.uploads).toHaveLength(1);
    const up = blob.uploads[0]!;
    expect(up.contentType).toBe('application/pdf');
    expect(up.key).toMatch(
      /^transcripts\/00000000-0000-4000-8000-000000000111-[0-9a-f]{32}\.pdf$/,
    );
  });

  it('body is a non-empty PDF (starts with %PDF)', async () => {
    const blob = new CapturingBlobClient();
    await renderAndUploadTranscript(
      { state: baseState(), pkg: basePackage() },
      blob,
    );
    const body = blob.uploads[0]!.body;
    expect(body).toBeInstanceOf(Uint8Array);
    const bytes = body as Uint8Array;
    expect(bytes.length).toBeGreaterThan(500); // tiny PDFs are ~1kb+
    // PDF magic number: %PDF
    expect(bytes[0]).toBe(0x25);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x44);
    expect(bytes[3]).toBe(0x46);
  });

  it('different sessions produce different keys', async () => {
    const blob = new CapturingBlobClient();
    await renderAndUploadTranscript(
      {
        state: baseState({
          sessionId: '00000000-0000-4000-8000-000000000aaa',
        }),
        pkg: basePackage({
          sessionId: '00000000-0000-4000-8000-000000000aaa',
        }),
      },
      blob,
    );
    await renderAndUploadTranscript(
      {
        state: baseState({
          sessionId: '00000000-0000-4000-8000-000000000bbb',
        }),
        pkg: basePackage({
          sessionId: '00000000-0000-4000-8000-000000000bbb',
        }),
      },
      blob,
    );
    expect(blob.uploads).toHaveLength(2);
    expect(blob.uploads[0]!.key).not.toBe(blob.uploads[1]!.key);
  });

  it('same session twice produces different random suffixes', async () => {
    const blob = new CapturingBlobClient();
    await renderAndUploadTranscript(
      { state: baseState(), pkg: basePackage() },
      blob,
    );
    await renderAndUploadTranscript(
      { state: baseState(), pkg: basePackage() },
      blob,
    );
    expect(blob.uploads[0]!.key).not.toBe(blob.uploads[1]!.key);
  });

  it('propagates blob upload errors', async () => {
    const badBlob: BlobClient = {
      async upload() {
        throw new Error('Blob down');
      },
      async getSignedUrl() {
        throw new Error('n/a');
      },
    };
    await expect(
      renderAndUploadTranscript({ state: baseState(), pkg: basePackage() }, badBlob),
    ).rejects.toThrow(/Blob down/);
  });
});
