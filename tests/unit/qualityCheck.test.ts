/**
 * Layer 1 tests for the deterministic session quality check.
 *
 * Covers every rule: 3 failures (no_classification, no_extracted_fields,
 * conversation_too_short) and 2 warnings (no_tool_use, missing_metadata,
 * missing_accessibility_settings). Also covers the all-green path.
 */

import { describe, it, expect } from 'vitest';
import { runSessionQualityCheck } from '@/engine/observability/qualityCheck';
import type { AdaSessionState } from '@/engine/types';
import type {
  Classification,
  ExtractedFields,
  Message,
} from '@/types/db';

function baseGoodState(
  overrides: Partial<AdaSessionState> = {},
): AdaSessionState {
  const classification: Classification = {
    title: 'III',
    tier: 'high',
    reasoning: 'Public accommodation — restaurant denied service.',
    standard: '42 USC 12182',
  };
  const extractedFields: ExtractedFields = {
    facility_type: {
      value: 'restaurant',
      confidence: 0.95,
      extracted_at: '2026-04-20T00:00:00Z',
    },
    state: {
      value: 'AZ',
      confidence: 0.92,
      extracted_at: '2026-04-20T00:00:01Z',
    },
  };
  const conversationHistory: Message[] = [
    {
      role: 'user',
      content: 'I was denied entry at a restaurant.',
      timestamp: '2026-04-20T00:00:00Z',
    },
    {
      role: 'assistant',
      content: 'What city and state?',
      timestamp: '2026-04-20T00:00:01Z',
      tool_calls: [
        {
          id: 'tc-1',
          name: 'extract_field',
          args: { field: 'facility_type', value: 'restaurant' },
          timestamp: '2026-04-20T00:00:01Z',
        },
      ],
    },
    {
      role: 'user',
      content: 'Phoenix, Arizona.',
      timestamp: '2026-04-20T00:00:02Z',
    },
    {
      role: 'assistant',
      content: 'Here are three attorneys near you.',
      timestamp: '2026-04-20T00:00:03Z',
      tool_calls: [
        {
          id: 'tc-2',
          name: 'set_classification',
          args: { title: 'Title III' },
          timestamp: '2026-04-20T00:00:03Z',
        },
      ],
    },
  ];

  return {
    sessionId: '00000000-0000-4000-8000-000000000001',
    orgId: '00000000-0000-4000-8000-000000000002',
    sessionType: 'public_ada',
    status: 'completed',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-000000000003',
    userId: null,
    listingId: null,
    conversationHistory,
    extractedFields,
    classification,
    metadata: { turnCount: 2 } as AdaSessionState['metadata'],
    accessibilitySettings: {
      readingLevel: 'standard',
    } as AdaSessionState['accessibilitySettings'],
    isTest: false,
    ...overrides,
  };
}

describe('runSessionQualityCheck', () => {
  it('passes a well-formed completed session with no issues', () => {
    const result = runSessionQualityCheck(baseGoodState());
    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('FAIL no_classification when classification is null', () => {
    const result = runSessionQualityCheck(
      baseGoodState({ classification: null }),
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain('no_classification');
  });

  it('FAIL no_extracted_fields when extractedFields is empty', () => {
    const result = runSessionQualityCheck(
      baseGoodState({ extractedFields: {} }),
    );
    expect(result.passed).toBe(false);
    const codes = result.failures.map((f) => f.code);
    expect(codes).toContain('no_extracted_fields');
  });

  it('FAIL conversation_too_short when fewer than 2 user messages', () => {
    const result = runSessionQualityCheck(
      baseGoodState({
        conversationHistory: [
          {
            role: 'user',
            content: 'Help.',
            timestamp: '2026-04-20T00:00:00Z',
          },
          {
            role: 'assistant',
            content: 'What happened?',
            timestamp: '2026-04-20T00:00:01Z',
          },
        ],
      }),
    );
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain('conversation_too_short');
  });

  it('WARN no_tool_use when no tool calls in conversation', () => {
    const result = runSessionQualityCheck(
      baseGoodState({
        conversationHistory: [
          { role: 'user', content: 'hello', timestamp: '2026-04-20T00:00:00Z' },
          {
            role: 'assistant',
            content: 'hi',
            timestamp: '2026-04-20T00:00:01Z',
          },
          { role: 'user', content: 'bye', timestamp: '2026-04-20T00:00:02Z' },
        ],
      }),
    );
    expect(result.warnings.map((w) => w.code)).toContain('no_tool_use');
  });

  it('WARN missing_metadata when metadata is empty', () => {
    const result = runSessionQualityCheck(
      baseGoodState({ metadata: {} as AdaSessionState['metadata'] }),
    );
    expect(result.warnings.map((w) => w.code)).toContain('missing_metadata');
  });

  it('WARN missing_accessibility_settings when accessibilitySettings is empty', () => {
    const result = runSessionQualityCheck(
      baseGoodState({
        accessibilitySettings: {} as AdaSessionState['accessibilitySettings'],
      }),
    );
    expect(result.warnings.map((w) => w.code)).toContain(
      'missing_accessibility_settings',
    );
  });

  it('warnings do not cause passed:false', () => {
    const result = runSessionQualityCheck(
      baseGoodState({
        metadata: {} as AdaSessionState['metadata'],
        accessibilitySettings: {} as AdaSessionState['accessibilitySettings'],
      }),
    );
    // Two warnings, zero failures → still passed.
    expect(result.passed).toBe(true);
    expect(result.warnings.length).toBe(2);
    expect(result.failures.length).toBe(0);
  });

  it('accumulates multiple failures when multiple rules are violated', () => {
    const result = runSessionQualityCheck(
      baseGoodState({
        classification: null,
        extractedFields: {},
        conversationHistory: [
          { role: 'user', content: 'x', timestamp: '2026-04-20T00:00:00Z' },
        ],
      }),
    );
    expect(result.passed).toBe(false);
    const codes = result.failures.map((f) => f.code).sort();
    expect(codes).toEqual([
      'conversation_too_short',
      'no_classification',
      'no_extracted_fields',
    ]);
  });
});
