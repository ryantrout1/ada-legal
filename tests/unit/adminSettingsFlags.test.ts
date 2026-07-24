/**
 * M6 Phase 5 — admin settings over the shared flag blob.
 *
 * `system_settings.admin` is ONE jsonb document holding every feature
 * flag on the platform. Until M6 this endpoint knew about three of the
 * six keys, and the UI showed those three — the rest could only be
 * flipped by a hand-written Neon upsert.
 *
 * The property that matters most here is that a PATCH merges rather
 * than replaces. A save that wrote only the keys it knew about would
 * silently drop the others: turning off data collection would switch
 * Spot back on, or clear a CTA flag Gina had just set. That failure is
 * invisible until someone notices the site behaving differently.
 *
 * Ref: /plan M6 Phase 5, AC6.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const endpoint = readCode('api/admin/settings.ts');
const ui = readCode('src/app/routes/admin/AdminSettings.tsx');

const ALL_FLAGS = [
  'data_collection_enabled',
  'ada_chat_enabled',
  'ada_photo_enabled',
  'spot_enabled',
  'spot_test_payment',
  'lawsuits_ada_cta_enabled',
  'ada_universal_cta',
];

describe('settings endpoint — knows every flag in the blob', () => {
  it('declares all seven keys', () => {
    for (const flag of ALL_FLAGS) {
      expect(endpoint, `settings shape is missing ${flag}`).toContain(flag);
    }
  });

  it('defaults the four gating flags OFF', () => {
    // Each gates something that charges money or hands a claimant
    // onward. "Not configured" must never mean "on".
    const defaults = endpoint.slice(
      endpoint.indexOf('const DEFAULTS'),
      endpoint.indexOf('export default'),
    );
    for (const flag of [
      'spot_enabled',
      'spot_test_payment',
      'lawsuits_ada_cta_enabled',
      'ada_universal_cta',
    ]) {
      expect(defaults, `${flag} must default false`).toMatch(
        new RegExp(`${flag}:\\s*false`),
      );
    }
  });

  it('merges over the stored blob rather than replacing it', () => {
    // The spread is what stops a save from dropping keys this endpoint
    // does not know about — including any added later by another surface.
    expect(endpoint).toMatch(/\{\s*\.\.\.DEFAULTS,\s*\.\.\.\(stored \?\? \{\}\)\s*\}/);
  });

  it('writes a flag only when the body carries an explicit boolean', () => {
    // A missing key must leave the stored value alone, not coerce it.
    expect(endpoint).toContain("typeof body[key] === 'boolean'");
  });

  it('is admin-gated', () => {
    expect(endpoint).toContain('requireAdmin');
  });
});

describe('settings UI — surfaces every flag', () => {
  it('renders a control for each flag', () => {
    for (const flag of ALL_FLAGS) {
      expect(ui, `no UI control for ${flag}`).toContain(flag);
    }
  });

  it('explains what each flag does, not just its name', () => {
    // These get flipped rarely and under pressure. A bare toggle label
    // is not enough to know what turning it off does to the site.
    expect(ui).toContain('description:');
    expect(ui).toContain('nobody can be charged while this is off');
    expect(ui).toContain('Must be OFF in production');
  });

  it('uses 44px-class targets', () => {
    expect(ui).toContain('min-h-[44px]');
  });
});
