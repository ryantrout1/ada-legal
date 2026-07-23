/**
 * M3 Phase 1 — `lawsuits_ada_cta_enabled` kill switch.
 *
 * The "Talk to Ada about this case" CTA on the public lawsuit pages is
 * gated on this flag. It lives in the shared `admin` system-settings
 * jsonb blob (same row as the spot / ada / guide flags) and is read by
 * its OWN resolver, so nothing else can turn the CTA on as a side
 * effect of a different flag flip.
 *
 * Fail-closed is the whole point: the CTA hands a claimant off into an
 * intake conversation, so it must never appear because a read failed,
 * a key went missing, or someone stored the string "true". Only a
 * boolean literal `true` enables it.
 *
 * Ref: /plan M3 Phase 1, AC5.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import {
  LAWSUITS_ADA_CTA_KEY,
  LAWSUITS_ADA_CTA_SETTINGS_KEY,
  LAWSUITS_ADA_CTA_DEFAULT,
  resolveLawsuitsAdaCta,
  readLawsuitsAdaCta,
} from '@/lib/site/lawsuitsAdaCta';

describe('resolveLawsuitsAdaCta', () => {
  it('defaults OFF for every absent-ish input', () => {
    expect(LAWSUITS_ADA_CTA_DEFAULT).toBe(false);
    expect(resolveLawsuitsAdaCta(null)).toBe(false);
    expect(resolveLawsuitsAdaCta(undefined)).toBe(false);
    expect(resolveLawsuitsAdaCta({})).toBe(false);
  });

  it('only a boolean true enables it', () => {
    expect(resolveLawsuitsAdaCta({ [LAWSUITS_ADA_CTA_KEY]: true })).toBe(true);
    expect(resolveLawsuitsAdaCta({ [LAWSUITS_ADA_CTA_KEY]: false })).toBe(false);
    expect(resolveLawsuitsAdaCta({ [LAWSUITS_ADA_CTA_KEY]: 'true' })).toBe(false);
    expect(resolveLawsuitsAdaCta({ [LAWSUITS_ADA_CTA_KEY]: 1 })).toBe(false);
    expect(resolveLawsuitsAdaCta({ [LAWSUITS_ADA_CTA_KEY]: null })).toBe(false);
  });

  it('rejects non-object blobs rather than throwing', () => {
    expect(resolveLawsuitsAdaCta('lawsuits_ada_cta_enabled')).toBe(false);
    expect(resolveLawsuitsAdaCta(42)).toBe(false);
    expect(resolveLawsuitsAdaCta([true])).toBe(false);
  });

  it('reads its own key, independent of the sibling flags', () => {
    expect(LAWSUITS_ADA_CTA_KEY).toBe('lawsuits_ada_cta_enabled');
    expect(LAWSUITS_ADA_CTA_SETTINGS_KEY).toBe('admin');
    expect(
      resolveLawsuitsAdaCta({
        spot_enabled: true,
        guide_assistant_enabled: true,
        ada_universal_cta: true,
      }),
    ).toBe(false);
  });
});

describe('readLawsuitsAdaCta', () => {
  it('returns false when the admin blob has never been written', async () => {
    const c = makeInMemoryClients();
    expect(await readLawsuitsAdaCta(c.db)).toBe(false);
  });

  it('returns true only once the flag is explicitly true in the blob', async () => {
    const c = makeInMemoryClients();
    await c.db.setSystemSetting(LAWSUITS_ADA_CTA_SETTINGS_KEY, {
      spot_enabled: false,
      [LAWSUITS_ADA_CTA_KEY]: true,
    });
    expect(await readLawsuitsAdaCta(c.db)).toBe(true);
  });

  it('does not disturb the sibling flags in the shared blob', async () => {
    // The admin key holds ONE jsonb blob for every flag. Reading the CTA
    // flag must be a pure read — a resolver that rewrote the blob would
    // clobber spot_enabled, which is the standing hazard with this row.
    const c = makeInMemoryClients();
    const blob = { spot_enabled: true, [LAWSUITS_ADA_CTA_KEY]: false };
    await c.db.setSystemSetting(LAWSUITS_ADA_CTA_SETTINGS_KEY, blob);
    await readLawsuitsAdaCta(c.db);
    const after = await c.db.getSystemSetting<Record<string, unknown>>(
      LAWSUITS_ADA_CTA_SETTINGS_KEY,
    );
    expect(after).toEqual(blob);
  });
});
