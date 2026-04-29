/**
 * Layer 1 tests for AnthropicPhotoAnalysisClient helpers.
 *
 * The full client requires a real Anthropic API key + network call to
 * cover end-to-end — that's a Layer 3 / integration concern. These tests
 * cover the pure helpers:
 *   - parseBlobKeyToImageBlock: input format → Anthropic image block
 *   - extractOutputFromResponse: tool_use block → PhotoAnalysisOutput
 *   - findings validation: malformed/missing/out-of-range shapes
 */

import { describe, it, expect } from 'vitest';
import {
  parseBlobKeyToImageBlock,
  extractOutputFromResponse,
} from '@/engine/clients/anthropicPhotoAnalysisClient';
import type Anthropic from '@anthropic-ai/sdk';

describe('parseBlobKeyToImageBlock', () => {
  it('parses a valid base64 JPEG data URL', () => {
    const dataUrl =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';
    const block = parseBlobKeyToImageBlock(dataUrl);
    expect(block.type).toBe('image');
    expect(block.source.type).toBe('base64');
    if (block.source.type === 'base64') {
      expect(block.source.media_type).toBe('image/jpeg');
      expect(block.source.data).toBe('/9j/4AAQSkZJRgABAQ==');
    }
  });

  it('parses a valid base64 PNG data URL', () => {
    const block = parseBlobKeyToImageBlock(
      'data:image/png;base64,iVBORw0KGgo=',
    );
    expect(block.source.type).toBe('base64');
    if (block.source.type === 'base64') {
      expect(block.source.media_type).toBe('image/png');
    }
  });

  it('parses a valid base64 WEBP data URL', () => {
    const block = parseBlobKeyToImageBlock(
      'data:image/webp;base64,UklGRiIAAABXRUJQ',
    );
    expect(block.source.type).toBe('base64');
    if (block.source.type === 'base64') {
      expect(block.source.media_type).toBe('image/webp');
    }
  });

  it('parses a valid Vercel Blob URL as a url-source block', () => {
    const block = parseBlobKeyToImageBlock(
      'https://abc123.public.blob.vercel-storage.com/photos/test.jpg',
    );
    expect(block.source.type).toBe('url');
    if (block.source.type === 'url') {
      expect(block.source.url).toBe(
        'https://abc123.public.blob.vercel-storage.com/photos/test.jpg',
      );
    }
  });

  it('rejects an http URL (downgrade)', () => {
    expect(() =>
      parseBlobKeyToImageBlock(
        'http://abc123.public.blob.vercel-storage.com/photos/test.jpg',
      ),
    ).toThrow(/Vercel Blob URL/);
  });

  it('rejects a non-blob https host (SSRF allowlist, B3)', () => {
    expect(() =>
      parseBlobKeyToImageBlock('https://example.com/photo.jpg'),
    ).toThrow(/Vercel Blob URL/);
  });

  it('rejects a lookalike host that ends with the blob domain', () => {
    // The regex anchors at start and requires the trailing slash, so
    // attacker-controlled subdomains like
    // "https://attacker.com/public.blob.vercel-storage.com/x" fail.
    expect(() =>
      parseBlobKeyToImageBlock(
        'https://attacker.com/public.blob.vercel-storage.com/x',
      ),
    ).toThrow(/Vercel Blob URL/);
  });

  it('rejects a data URL without base64 encoding', () => {
    expect(() =>
      parseBlobKeyToImageBlock('data:image/jpeg,rawbytes'),
    ).toThrow(/unsupported data: URL/);
  });

  it('rejects a data URL with unsupported media type', () => {
    expect(() =>
      parseBlobKeyToImageBlock('data:image/tiff;base64,abcd'),
    ).toThrow(/unsupported data: URL/);
  });

  it('rejects a bare filename or local path', () => {
    expect(() => parseBlobKeyToImageBlock('photo.jpg')).toThrow(/must be a data:/);
    expect(() => parseBlobKeyToImageBlock('/uploads/photo.jpg')).toThrow(
      /must be a data:/,
    );
  });

  it('rejects an empty string', () => {
    expect(() => parseBlobKeyToImageBlock('')).toThrow(/must be a data:/);
  });
});

describe('extractOutputFromResponse', () => {
  it('extracts a complete output from a valid tool_use block', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          scene: makeRLT('A storefront entrance.'),
          summary: makeRLT('A 6-inch step blocks the entrance.'),
          overall_risk: 'high',
          positive_findings: makeRLSL(['Curb cut visible at sidewalk.']),
          findings: [
            makeFinding({
              title: 'Step at entrance',
              text: 'Entrance has a 6-inch step with no ramp',
              severity: 'critical',
              standard: '28 CFR §36.304',
              confidence: 0.95,
              confirmable: true,
              bounding_box: { x: 0.1, y: 0.7, w: 0.8, h: 0.2 },
            }),
            makeFinding({
              title: 'Narrow access aisle',
              text: 'Parking access aisle appears narrower than 60 inches',
              severity: 'major',
              standard: '§502.3',
              confidence: 0.7,
              confirmable: false,
            }),
          ],
        },
      },
    ]);
    const output = extractOutputFromResponse(response);
    expect(output.scene.professional).toBe('A storefront entrance.');
    expect(output.summary.simple).toBe('A 6-inch step blocks the entrance.');
    expect(output.overall_risk).toBe('high');
    expect(output.positive_findings.standard).toEqual([
      'Curb cut visible at sidewalk.',
    ]);
    expect(output.findings).toHaveLength(2);
    expect(output.findings[0].finding_professional).toContain('6-inch step');
    expect(output.findings[0].finding).toBe(output.findings[0].finding_standard); // deprecated alias
    expect(output.findings[0].severity).toBe('critical');
    expect(output.findings[0].confirmable).toBe(true);
    expect(output.findings[0].bounding_box).toEqual({ x: 0.1, y: 0.7, w: 0.8, h: 0.2 });
    expect(output.findings[1].confirmable).toBe(false);
    expect(output.findings[1].bounding_box).toBeUndefined();
  });

  it('returns an empty output when no tool_use block is present', () => {
    const response = makeFakeResponse([
      { type: 'text', text: 'I cannot analyze this image.' },
    ]);
    const out = extractOutputFromResponse(response);
    expect(out.findings).toEqual([]);
    expect(out.overall_risk).toBe('none');
    expect(out.scene.standard).toBe('');
    expect(out.summary.standard).toBe('');
    expect(out.positive_findings.standard).toEqual([]);
  });

  it('returns an empty output when tool_use is for the wrong tool', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'some_other_tool',
        input: { findings: [] },
      },
    ]);
    expect(extractOutputFromResponse(response).findings).toEqual([]);
  });

  it('tolerates a missing findings field', () => {
    const response = makeFakeResponse([
      { type: 'tool_use', id: 't1', name: 'report_findings', input: {} },
    ]);
    const out = extractOutputFromResponse(response);
    expect(out.findings).toEqual([]);
    expect(out.overall_risk).toBe('none');
  });

  it('tolerates findings: not-an-array', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          scene: makeRLT(''),
          summary: makeRLT(''),
          overall_risk: 'none',
          positive_findings: makeRLSL([]),
          findings: 'not-an-array',
        },
      },
    ]);
    expect(extractOutputFromResponse(response).findings).toEqual([]);
  });

  it('filters out findings missing required fields', () => {
    const valid = makeFinding({
      title: 'Valid one',
      text: 'Valid description',
      severity: 'minor',
      standard: '§X',
      confidence: 0.5,
      confirmable: true,
    });
    const missingTitle = { ...valid, title_simple: undefined };
    const missingSeverity = { ...valid, severity: undefined };
    const invalidSeverity = { ...valid, severity: 'high' };
    const missingConfirmable = { ...valid, confirmable: undefined };
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          scene: makeRLT(''),
          summary: makeRLT(''),
          overall_risk: 'medium',
          positive_findings: makeRLSL([]),
          findings: [valid, missingTitle, missingSeverity, invalidSeverity, missingConfirmable],
        },
      },
    ]);
    const out = extractOutputFromResponse(response);
    expect(out.findings).toHaveLength(1);
    expect(out.findings[0].title_professional).toBe('Valid one');
  });

  it('clamps confidence values outside 0..1', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          scene: makeRLT(''),
          summary: makeRLT(''),
          overall_risk: 'low',
          positive_findings: makeRLSL([]),
          findings: [
            makeFinding({ title: 'over', text: 'over', severity: 'minor', standard: '§A', confidence: 1.5, confirmable: true }),
            makeFinding({ title: 'under', text: 'under', severity: 'minor', standard: '§B', confidence: -0.3, confirmable: true }),
          ],
        },
      },
    ]);
    const out = extractOutputFromResponse(response);
    expect(out.findings[0].confidence).toBe(1);
    expect(out.findings[1].confidence).toBe(0);
  });

  it('ignores malformed bounding_box but keeps the finding', () => {
    const finding = makeFinding({
      title: 'bad bbox',
      text: 'missing bbox dims',
      severity: 'minor',
      standard: '§X',
      confidence: 0.5,
      confirmable: true,
    });
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          scene: makeRLT(''),
          summary: makeRLT(''),
          overall_risk: 'low',
          positive_findings: makeRLSL([]),
          findings: [{ ...finding, bounding_box: { x: 0.1, y: 0.2 } }], // missing w, h
        },
      },
    ]);
    const out = extractOutputFromResponse(response);
    expect(out.findings).toHaveLength(1);
    expect(out.findings[0].bounding_box).toBeUndefined();
  });

  it('falls back to overall_risk=none when value is invalid', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          scene: makeRLT(''),
          summary: makeRLT(''),
          overall_risk: 'extreme',
          positive_findings: makeRLSL([]),
          findings: [],
        },
      },
    ]);
    expect(extractOutputFromResponse(response).overall_risk).toBe('none');
  });
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRLT(s: string) {
  return { simple: s, standard: s, professional: s };
}

function makeRLSL(arr: string[]) {
  return { simple: arr, standard: arr, professional: arr };
}

interface FindingArgs {
  title: string;
  text: string;
  severity: string;
  standard: string;
  confidence: number;
  confirmable: boolean;
  bounding_box?: { x: number; y: number; w: number; h: number };
}

function makeFinding(a: FindingArgs): Record<string, unknown> {
  const out: Record<string, unknown> = {
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
  };
  if (a.bounding_box) out.bounding_box = a.bounding_box;
  return out;
}

function makeFakeResponse(content: unknown[]): Anthropic.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    content: content as Anthropic.Message['content'],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  } as Anthropic.Message;
}
