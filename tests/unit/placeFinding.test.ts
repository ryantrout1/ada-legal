import { describe, it, expect } from 'vitest';
import { placeFinding, placementPrompt, type PlaceCall } from '@/lib/spot/placeFinding';
import type { PhotoFinding } from '@/types/db';

const finding = {
  title_standard: 'Shower Curb — Raised Threshold',
  finding_standard: 'A raised curb blocks wheelchair entry.',
  severity: 'critical',
  standard: '§608.7',
  confirmable: true,
  confidence: 0.9,
} as unknown as PhotoFinding;

const callReturning = (value: unknown): PlaceCall => async () => value;

describe('placementPrompt', () => {
  it('names the specific finding so the model places one object', () => {
    const p = placementPrompt(finding);
    expect(p).toContain('Shower Curb — Raised Threshold');
    expect(p).toContain('A raised curb blocks wheelchair entry.');
    expect(p).toContain('placeable:false');
  });
});

describe('placeFinding', () => {
  it('returns a rounded pin for a valid in-range response', async () => {
    const pin = await placeFinding(callReturning({ x: 0.2412, y: 0.7188, confidence: 0.834 }), 'u', finding);
    expect(pin).toEqual({ x: 0.241, y: 0.719, confidence: 0.834, label: undefined });
  });

  it('carries a trimmed short label when the model returns one', async () => {
    const pin = await placeFinding(
      callReturning({ x: 0.3, y: 0.5, confidence: 0.8, label: '  Raised curb  ' }),
      'u',
      finding,
    );
    expect(pin?.label).toBe('Raised curb');
  });

  it('returns null when the model declines with placeable:false', async () => {
    expect(await placeFinding(callReturning({ placeable: false }), 'u', finding)).toBeNull();
  });

  it('returns null when a coordinate is out of the 0..1 range', async () => {
    expect(await placeFinding(callReturning({ x: 1.4, y: 0.5, confidence: 0.8 }), 'u', finding)).toBeNull();
    expect(await placeFinding(callReturning({ x: -0.1, y: 0.5, confidence: 0.8 }), 'u', finding)).toBeNull();
  });

  it('returns null when confidence is missing or non-numeric', async () => {
    expect(await placeFinding(callReturning({ x: 0.5, y: 0.5 }), 'u', finding)).toBeNull();
    expect(await placeFinding(callReturning({ x: 0.5, y: 0.5, confidence: 'high' }), 'u', finding)).toBeNull();
  });

  it('returns null for a non-object or empty response', async () => {
    expect(await placeFinding(callReturning(null), 'u', finding)).toBeNull();
    expect(await placeFinding(callReturning('nope'), 'u', finding)).toBeNull();
  });

  it('returns null (never throws) when the model call itself throws', async () => {
    const throwing: PlaceCall = async () => {
      throw new Error('network');
    };
    await expect(placeFinding(throwing, 'u', finding)).resolves.toBeNull();
  });
});
