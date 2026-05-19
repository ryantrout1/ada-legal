/**
 * Tests the `is_test` flag gating for /api/ada/session.
 *
 * /photo (field-capture page) needs to flag its sessions so they don't
 * pollute production session analytics. We extend POST /api/ada/session
 * to accept an optional `is_test: boolean` body field, but only honor
 * it when the request also includes header `X-Ada-Field-Capture: 1`.
 *
 * Without the header the flag is silently ignored. This prevents
 * random callers (including bots) from opting their sessions out of
 * analytics by sending `is_test: true`. The header isn't real auth
 * (anyone hitting /photo can see it in the page source), but it's a
 * clean discriminator that documents intent.
 *
 * Ref: /plan: /photo field-test capture page, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { resolveFieldCaptureFlag } from '@/lib/fieldCaptureFlag';

describe('resolveFieldCaptureFlag', () => {
  it('returns true when is_test=true AND the field-capture header is "1"', () => {
    expect(
      resolveFieldCaptureFlag({
        body: { is_test: true },
        header: '1',
      }),
    ).toBe(true);
  });

  it('returns false when is_test=true but the header is absent', () => {
    expect(
      resolveFieldCaptureFlag({
        body: { is_test: true },
        header: null,
      }),
    ).toBe(false);
  });

  it('returns false when is_test=true but the header is the wrong value', () => {
    expect(
      resolveFieldCaptureFlag({
        body: { is_test: true },
        header: 'yes',
      }),
    ).toBe(false);
  });

  it('returns false when the header is present but is_test is not set', () => {
    expect(
      resolveFieldCaptureFlag({
        body: {},
        header: '1',
      }),
    ).toBe(false);
  });

  it('returns false when the header is present but is_test=false', () => {
    expect(
      resolveFieldCaptureFlag({
        body: { is_test: false },
        header: '1',
      }),
    ).toBe(false);
  });

  it('returns false when is_test is not a boolean (defensive)', () => {
    expect(
      resolveFieldCaptureFlag({
        // Simulate a malformed client sending a string. We require
        // strict boolean true — any other shape is treated as absent.
        body: { is_test: 'true' as unknown as boolean },
        header: '1',
      }),
    ).toBe(false);
  });

  it('returns false when both are absent (the default for real users)', () => {
    expect(
      resolveFieldCaptureFlag({
        body: {},
        header: null,
      }),
    ).toBe(false);
  });

  it('accepts the header in array form (Node sometimes hands headers as string[])', () => {
    // VercelRequest.headers values can be string | string[] | undefined.
    // The helper should accept the first element when the value is an
    // array, to match how Node represents repeated headers.
    expect(
      resolveFieldCaptureFlag({
        body: { is_test: true },
        header: ['1'],
      }),
    ).toBe(true);
  });
});
