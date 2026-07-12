import { describe, it, expect } from 'vitest';
import {
  resolveSpotEnabled,
  SPOT_ENABLED_DEFAULT,
  SPOT_ENABLED_KEY,
  SPOT_SETTINGS_KEY,
} from '@/lib/spot/spotAvailability';

describe('resolveSpotEnabled', () => {
  it('defaults OFF (launch fail-safe for a public Opus vision endpoint)', () => {
    expect(SPOT_ENABLED_DEFAULT).toBe(false);
    expect(resolveSpotEnabled(undefined)).toBe(false);
    expect(resolveSpotEnabled(null)).toBe(false);
    expect(resolveSpotEnabled({})).toBe(false);
  });

  it('enables only on a boolean literal true', () => {
    expect(resolveSpotEnabled({ [SPOT_ENABLED_KEY]: true })).toBe(true);
    expect(resolveSpotEnabled({ [SPOT_ENABLED_KEY]: false })).toBe(false);
  });

  it('ignores non-boolean values (strings/numbers do not enable)', () => {
    expect(resolveSpotEnabled({ [SPOT_ENABLED_KEY]: 'true' })).toBe(false);
    expect(resolveSpotEnabled({ [SPOT_ENABLED_KEY]: 1 })).toBe(false);
  });

  it('is independent of the ada flags (ada_photo_enabled does not enable Spot)', () => {
    expect(resolveSpotEnabled({ ada_photo_enabled: true, ada_chat_enabled: true })).toBe(false);
  });

  it('reads from the shared admin settings blob', () => {
    expect(SPOT_SETTINGS_KEY).toBe('admin');
  });
});
