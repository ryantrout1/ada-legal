import { describe, it, expect } from 'vitest';
import { parseRegenerateBody, SPOT_REPORT_MODELS } from '@/lib/spot/parseRegenerateBody';

describe('parseRegenerateBody', () => {
  it('exposes the A/B model allowlist (Opus 4.8 + Fable 5)', () => {
    expect(SPOT_REPORT_MODELS).toContain('claude-opus-4-8');
    expect(SPOT_REPORT_MODELS).toContain('claude-fable-5');
  });

  it('accepts a session id + an allowlisted model', () => {
    const out = parseRegenerateBody({ sessionId: 'abc-123', model: 'claude-fable-5' });
    expect(out).toEqual({ ok: true, sessionId: 'abc-123', model: 'claude-fable-5' });
  });

  it('defaults to Opus 4.8 when no model is given', () => {
    const out = parseRegenerateBody({ sessionId: 'abc-123' });
    expect(out).toEqual({ ok: true, sessionId: 'abc-123', model: 'claude-opus-4-8' });
  });

  it('rejects a missing session id', () => {
    expect(parseRegenerateBody({}).ok).toBe(false);
    expect(parseRegenerateBody({ model: 'claude-fable-5' }).ok).toBe(false);
  });

  it('rejects a model not on the allowlist (no arbitrary model strings)', () => {
    const out = parseRegenerateBody({ sessionId: 'x', model: 'claude-evil-9' });
    expect(out.ok).toBe(false);
  });
});
