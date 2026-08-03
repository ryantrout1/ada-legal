import { describe, it, expect } from 'vitest';
import { placeFinding, placementPrompt, type PlaceCall } from '@/lib/spot/placeFinding';
import type { PlaceTarget } from '@/lib/spot/annotationTypes';

const target: PlaceTarget = {
  title: 'Shower Curb — Raised Threshold',
  detail: 'A raised curb blocks wheelchair entry.',
};

const callReturning = (value: unknown): PlaceCall => async () => value;

describe('placementPrompt', () => {
  it('names the specific concern so the model places one object', () => {
    const p = placementPrompt(target);
    expect(p).toContain('Shower Curb — Raised Threshold');
    expect(p).toContain('A raised curb blocks wheelchair entry.');
    expect(p).toContain('placeable:false');
  });
});

describe('placeFinding', () => {
  it('returns a rounded pin for a valid in-range response', async () => {
    const pin = await placeFinding(callReturning({ x: 0.2412, y: 0.7188, confidence: 0.834 }), 'u', target);
    expect(pin).toEqual({ x: 0.241, y: 0.719, confidence: 0.834, label: undefined });
  });

  it('carries a trimmed short label when the model returns one', async () => {
    const pin = await placeFinding(
      callReturning({ x: 0.3, y: 0.5, confidence: 0.8, label: '  Raised curb  ' }),
      'u',
      target,
    );
    expect(pin?.label).toBe('Raised curb');
  });

  it('returns null when the model declines with placeable:false', async () => {
    expect(await placeFinding(callReturning({ placeable: false }), 'u', target)).toBeNull();
  });

  it('returns null when a coordinate is out of the 0..1 range', async () => {
    expect(await placeFinding(callReturning({ x: 1.4, y: 0.5, confidence: 0.8 }), 'u', target)).toBeNull();
    expect(await placeFinding(callReturning({ x: -0.1, y: 0.5, confidence: 0.8 }), 'u', target)).toBeNull();
  });

  it('returns null when confidence is missing or non-numeric', async () => {
    expect(await placeFinding(callReturning({ x: 0.5, y: 0.5 }), 'u', target)).toBeNull();
    expect(await placeFinding(callReturning({ x: 0.5, y: 0.5, confidence: 'high' }), 'u', target)).toBeNull();
  });

  it('returns null for a non-object or empty response', async () => {
    expect(await placeFinding(callReturning(null), 'u', target)).toBeNull();
    expect(await placeFinding(callReturning('nope'), 'u', target)).toBeNull();
  });

  it('returns null (never throws) when the model call itself throws', async () => {
    const throwing: PlaceCall = async () => {
      throw new Error('network');
    };
    await expect(placeFinding(throwing, 'u', target)).resolves.toBeNull();
  });
});
