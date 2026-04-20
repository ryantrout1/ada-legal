/**
 * Layer 1 tests for AnthropicPhotoAnalysisClient helpers.
 *
 * The full client requires a real Anthropic API key + network call to
 * cover end-to-end — that's a Layer 3 / integration concern. These tests
 * cover the pure helpers:
 *   - parseBlobKeyToImageBlock: input format → Anthropic image block
 *   - extractFindingsFromResponse: tool_use block → PhotoFinding[]
 *   - findings validation: malformed/missing/out-of-range shapes
 */

import { describe, it, expect } from 'vitest';
import {
  parseBlobKeyToImageBlock,
  extractFindingsFromResponse,
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

  it('parses an https URL as a url-source block', () => {
    const block = parseBlobKeyToImageBlock('https://example.com/photo.jpg');
    expect(block.source.type).toBe('url');
    if (block.source.type === 'url') {
      expect(block.source.url).toBe('https://example.com/photo.jpg');
    }
  });

  it('parses an http URL as a url-source block', () => {
    const block = parseBlobKeyToImageBlock('http://example.com/photo.jpg');
    expect(block.source.type).toBe('url');
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

describe('extractFindingsFromResponse', () => {
  it('extracts findings from a valid tool_use block', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          findings: [
            {
              finding: 'Entrance has a 6-inch step with no ramp',
              severity: 'critical',
              standard: '28 CFR §36.304',
              confidence: 0.95,
              bounding_box: { x: 0.1, y: 0.7, w: 0.8, h: 0.2 },
            },
            {
              finding: 'Parking access aisle appears narrower than 60 inches',
              severity: 'major',
              standard: '§502.3',
              confidence: 0.7,
            },
          ],
        },
      },
    ]);
    const findings = extractFindingsFromResponse(response);
    expect(findings).toHaveLength(2);
    expect(findings[0].finding).toContain('6-inch step');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].bounding_box).toEqual({ x: 0.1, y: 0.7, w: 0.8, h: 0.2 });
    expect(findings[1].bounding_box).toBeUndefined();
  });

  it('returns empty array when no tool_use block is present', () => {
    const response = makeFakeResponse([
      { type: 'text', text: 'I cannot analyze this image.' },
    ]);
    expect(extractFindingsFromResponse(response)).toEqual([]);
  });

  it('returns empty array when tool_use is for wrong tool', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'some_other_tool',
        input: { findings: [] },
      },
    ]);
    expect(extractFindingsFromResponse(response)).toEqual([]);
  });

  it('returns empty array when findings field is missing', () => {
    const response = makeFakeResponse([
      { type: 'tool_use', id: 't1', name: 'report_findings', input: {} },
    ]);
    expect(extractFindingsFromResponse(response)).toEqual([]);
  });

  it('returns empty array when findings is not an array', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: { findings: 'not-an-array' },
      },
    ]);
    expect(extractFindingsFromResponse(response)).toEqual([]);
  });

  it('filters out findings missing required fields', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          findings: [
            {
              finding: 'Valid one',
              severity: 'minor',
              standard: '§X',
              confidence: 0.5,
            },
            // missing `finding`
            { severity: 'critical', standard: '§Y', confidence: 0.9 },
            // missing `severity`
            { finding: 'Missing severity', standard: '§Z', confidence: 0.3 },
            // invalid severity value
            {
              finding: 'Bad severity',
              severity: 'high',
              standard: '§W',
              confidence: 0.8,
            },
          ],
        },
      },
    ]);
    const findings = extractFindingsFromResponse(response);
    expect(findings).toHaveLength(1);
    expect(findings[0].finding).toBe('Valid one');
  });

  it('clamps confidence values outside 0..1', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          findings: [
            {
              finding: 'over',
              severity: 'minor',
              standard: '§A',
              confidence: 1.5,
            },
            {
              finding: 'under',
              severity: 'minor',
              standard: '§B',
              confidence: -0.3,
            },
          ],
        },
      },
    ]);
    const findings = extractFindingsFromResponse(response);
    expect(findings[0].confidence).toBe(1);
    expect(findings[1].confidence).toBe(0);
  });

  it('ignores malformed bounding_box but keeps the finding', () => {
    const response = makeFakeResponse([
      {
        type: 'tool_use',
        id: 't1',
        name: 'report_findings',
        input: {
          findings: [
            {
              finding: 'missing bbox dims',
              severity: 'minor',
              standard: '§X',
              confidence: 0.5,
              bounding_box: { x: 0.1, y: 0.2 }, // missing w, h
            },
          ],
        },
      },
    ]);
    const findings = extractFindingsFromResponse(response);
    expect(findings).toHaveLength(1);
    expect(findings[0].bounding_box).toBeUndefined();
  });
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeFakeResponse(content: unknown[]): Anthropic.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-haiku-4-5-20251001',
    content: content as Anthropic.Message['content'],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  } as Anthropic.Message;
}
