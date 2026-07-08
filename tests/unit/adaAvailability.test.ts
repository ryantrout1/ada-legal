/**
 * Tests the Ada availability resolver — the kill-switch gate for the
 * public LLM surfaces (§2 abuse/cost, /plan Phase 2).
 *
 * Two independent flags live in the 'admin' system-settings blob:
 *   - ada_chat_enabled  — the live claimant chat. Defaults ENABLED;
 *     only an explicit `false` takes it dark (real traffic flows today,
 *     so a missing/malformed row must never accidentally kill chat).
 *   - ada_photo_enabled — the Opus field-test photo path (/photo →
 *     analyze-photo/upload-photo). Defaults DISABLED ("dark for launch"):
 *     an admin must explicitly set `true` to open the expensive public
 *     Opus button. This is the fail-safe posture for a public,
 *     unauthenticated, per-press-budgeted endpoint.
 *
 * Strictness: only a boolean literal counts. Strings ("false"), numbers
 * (0/1), null, or a missing key all fall back to the per-flag default.
 *
 * Ref: /plan Phase 2 (§2 a6 + a7). Encodes AC2 (chat 503 when off) and
 * AC3 (photo 503 when off) at the resolver seam; the handler-level 503
 * is verified live (no Vercel req/res unit seam).
 */

import { describe, it, expect } from 'vitest';
import {
  resolveAdaAvailability,
  ADA_AVAILABILITY_DEFAULTS,
  ADA_CHAT_ENABLED_KEY,
  ADA_PHOTO_ENABLED_KEY,
} from '@/lib/adaAvailability';

describe('resolveAdaAvailability', () => {
  it('defaults chat ENABLED and photo DISABLED when the blob is missing', () => {
    expect(resolveAdaAvailability(null)).toEqual({
      chatEnabled: true,
      photoEnabled: false,
    });
    expect(resolveAdaAvailability(undefined)).toEqual({
      chatEnabled: true,
      photoEnabled: false,
    });
    expect(resolveAdaAvailability({})).toEqual({
      chatEnabled: true,
      photoEnabled: false,
    });
  });

  it('exposes the same defaults via ADA_AVAILABILITY_DEFAULTS', () => {
    expect(ADA_AVAILABILITY_DEFAULTS).toEqual({
      chatEnabled: true,
      photoEnabled: false,
    });
  });

  it('takes chat dark only on an explicit boolean false', () => {
    expect(resolveAdaAvailability({ [ADA_CHAT_ENABLED_KEY]: false }).chatEnabled).toBe(false);
    expect(resolveAdaAvailability({ [ADA_CHAT_ENABLED_KEY]: true }).chatEnabled).toBe(true);
  });

  it('opens photo only on an explicit boolean true', () => {
    expect(resolveAdaAvailability({ [ADA_PHOTO_ENABLED_KEY]: true }).photoEnabled).toBe(true);
    expect(resolveAdaAvailability({ [ADA_PHOTO_ENABLED_KEY]: false }).photoEnabled).toBe(false);
  });

  it('honors both flags together', () => {
    expect(
      resolveAdaAvailability({
        [ADA_CHAT_ENABLED_KEY]: false,
        [ADA_PHOTO_ENABLED_KEY]: true,
      }),
    ).toEqual({ chatEnabled: false, photoEnabled: true });
  });

  it('ignores non-boolean values and falls back to the per-flag default', () => {
    // Strings, numbers, and null are NOT booleans — a truthy "false"
    // string must not silently disable chat, and a "1" must not open photo.
    expect(
      resolveAdaAvailability({
        [ADA_CHAT_ENABLED_KEY]: 'false',
        [ADA_PHOTO_ENABLED_KEY]: 1,
      }),
    ).toEqual({ chatEnabled: true, photoEnabled: false });
    expect(
      resolveAdaAvailability({
        [ADA_CHAT_ENABLED_KEY]: null,
        [ADA_PHOTO_ENABLED_KEY]: 'true',
      }),
    ).toEqual({ chatEnabled: true, photoEnabled: false });
  });

  it('preserves unrelated settings keys without reading them', () => {
    // The 'admin' blob also holds data_collection_enabled; the resolver
    // must not choke on sibling keys.
    expect(
      resolveAdaAvailability({
        data_collection_enabled: false,
        [ADA_CHAT_ENABLED_KEY]: false,
      }),
    ).toEqual({ chatEnabled: false, photoEnabled: false });
  });
});
