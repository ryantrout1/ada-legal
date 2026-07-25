import { describe, it, expect } from 'vitest';
import {
  parseRegenerateBody,
  SPOT_REPORT_MODELS,
  SPOT_REPORT_DEFAULT_MODEL,
} from '@/lib/spot/parseRegenerateBody';

describe('parseRegenerateBody', () => {
  it('exposes the report model allowlist', () => {
    expect(SPOT_REPORT_MODELS).toContain('claude-opus-5');
  });

  it('no longer offers the models the A/B retired', () => {
    // Opus 4.8 produced tool calls that serialized the findings array into
    // the overview string and never emitted `areas` — reliably, on real
    // photos, twice including the retry. Fable 5 went with it.
    expect(SPOT_REPORT_MODELS).not.toContain('claude-opus-4-8');
    expect(SPOT_REPORT_MODELS).not.toContain('claude-fable-5');
  });

  it('accepts a session id + an allowlisted model', () => {
    const out = parseRegenerateBody({ sessionId: 'abc-123', model: 'claude-opus-5' });
    expect(out).toEqual({ ok: true, sessionId: 'abc-123', model: 'claude-opus-5' });
  });

  it('defaults to Opus 5 when no model is given', () => {
    const out = parseRegenerateBody({ sessionId: 'abc-123' });
    expect(out).toEqual({ ok: true, sessionId: 'abc-123', model: 'claude-opus-5' });
  });

  it('is the single definition the pipeline default reads', () => {
    // generateReport used to declare its own literal; two constants that had
    // to be kept in step by hand.
    expect(SPOT_REPORT_DEFAULT_MODEL).toBe(SPOT_REPORT_MODELS[0]);
  });

  it('rejects a missing session id', () => {
    expect(parseRegenerateBody({}).ok).toBe(false);
    expect(parseRegenerateBody({ model: 'claude-opus-5' }).ok).toBe(false);
  });

  it('rejects a model not on the allowlist (no arbitrary model strings)', () => {
    const out = parseRegenerateBody({ sessionId: 'x', model: 'claude-evil-9' });
    expect(out.ok).toBe(false);
  });
});
