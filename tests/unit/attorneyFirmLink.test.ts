/**
 * Unit tests for resolveAttorneyFirmLink — the sync-on-write rule.
 *
 * Encodes Open Decision #2 (resolved) from /plan "Firms as a first-class
 * admin surface" Phase 2:
 *   - firm selected  → firm_name mirrors the firm's name (source of truth is
 *     the FK), regardless of any free text the form carried
 *   - solo / no firm → no link; the free-text name is preserved (empty → null)
 */

import { describe, it, expect } from 'vitest';
import { resolveAttorneyFirmLink } from '@/engine/attorneyFirmLink';

describe('resolveAttorneyFirmLink', () => {
  it('links to a firm and derives firm_name from the firm', () => {
    const out = resolveAttorneyFirmLink({
      lawFirmId: 'firm-1',
      firm: { name: 'The Spinal Cord Injury Law Firm' },
      firmName: 'whatever the form typed',
    });
    expect(out.lawFirmId).toBe('firm-1');
    // Synced: the firm's name wins over the form's free text.
    expect(out.firmName).toBe('The Spinal Cord Injury Law Firm');
  });

  it('keeps the free-text name when solo (no firm)', () => {
    const out = resolveAttorneyFirmLink({
      lawFirmId: null,
      firm: null,
      firmName: 'Jane Doe, Esq.',
    });
    expect(out.lawFirmId).toBeNull();
    expect(out.firmName).toBe('Jane Doe, Esq.');
  });

  it('normalizes an empty solo firm_name to null', () => {
    const out = resolveAttorneyFirmLink({
      lawFirmId: '',
      firm: null,
      firmName: '   ',
    });
    expect(out.lawFirmId).toBeNull();
    expect(out.firmName).toBeNull();
  });

  it('treats a lawFirmId with no resolved firm as solo (safe fallback)', () => {
    // Callers should 400 before this, but the rule must not fabricate a link.
    const out = resolveAttorneyFirmLink({
      lawFirmId: 'firm-x',
      firm: null,
      firmName: 'Fallback Name',
    });
    expect(out.lawFirmId).toBeNull();
    expect(out.firmName).toBe('Fallback Name');
  });

  it('handles undefined inputs (unlink to solo with no name)', () => {
    const out = resolveAttorneyFirmLink({
      lawFirmId: undefined,
      firm: null,
      firmName: undefined,
    });
    expect(out.lawFirmId).toBeNull();
    expect(out.firmName).toBeNull();
  });
});
