/**
 * Storage for edited email copy — the same behaviour from both clients.
 *
 * The photo-review surface taught this the expensive way: six methods on
 * the fake database returned null, [], false or nothing, and the result
 * was that nobody could write an honest test over them. A test would
 * save, assert the call resolved, pass, and prove nothing was stored.
 * These three are storage, not behaviour, so both clients model them
 * properly and this file holds them to the same contract.
 *
 * The property that matters is one row per template, slot and reading
 * level. Editing the standard wording of a slot must not touch its
 * simple or professional variants — those are how someone who finds
 * dense text hard reads their own case, and silently overwriting one
 * with another is the regression this shape exists to prevent.
 *
 * Ref: /plan editable email copy — Phase 1, split. Phase 1c, AC4.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';

const ORG = '00000000-0000-4000-8000-000000000001';

function db() {
  return new InMemoryDbClient();
}

function base(overrides: Partial<Parameters<InMemoryDbClient['upsertEmailCopy']>[0]> = {}) {
  return {
    orgId: ORG,
    templateKey: 'claimant_handoff',
    slotKey: 'summary_heading',
    readingLevel: 'standard' as const,
    value: 'What we discussed',
    updatedBy: 'gina@adalegallink.com',
    ...overrides,
  };
}

describe('saving edited copy', () => {
  it('comes back on the template it was written against', async () => {
    const c = db();
    await c.upsertEmailCopy(base());

    const rows = await c.listEmailCopy(ORG);
    expect(rows).toHaveLength(1);
    expect(rows[0].templateKey).toBe('claimant_handoff');
    expect(rows[0].slotKey).toBe('summary_heading');
    expect(rows[0].readingLevel).toBe('standard');
    expect(rows[0].value).toBe('What we discussed');
    expect(rows[0].updatedBy).toBe('gina@adalegallink.com');
  });

  it('reads back as one bundle for a single template', async () => {
    const c = db();
    await c.upsertEmailCopy(base());
    await c.upsertEmailCopy(base({ templateKey: 'spot_release', slotKey: 'heading' }));

    const rows = await c.getEmailCopy(ORG, 'claimant_handoff');
    expect(rows).toHaveLength(1);
    expect(rows[0].templateKey).toBe('claimant_handoff');
  });

  it('replaces a slot rather than adding a second row', async () => {
    const c = db();
    await c.upsertEmailCopy(base());
    await c.upsertEmailCopy(base({ value: 'What you told us' }));

    const rows = await c.getEmailCopy(ORG, 'claimant_handoff');
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe('What you told us');
  });

  it('keeps the three reading levels apart', async () => {
    // Editing the standard wording must leave simple and professional
    // exactly where they were.
    const c = db();
    await c.upsertEmailCopy(base({ readingLevel: 'simple', value: 'What we talked about' }));
    await c.upsertEmailCopy(base({ readingLevel: 'standard', value: 'What we discussed' }));
    await c.upsertEmailCopy(base({ readingLevel: 'professional', value: 'Summary of intake' }));

    await c.upsertEmailCopy(base({ readingLevel: 'standard', value: 'What you told us' }));

    const rows = await c.getEmailCopy(ORG, 'claimant_handoff');
    expect(rows).toHaveLength(3);
    const byLevel = Object.fromEntries(rows.map((r) => [r.readingLevel, r.value]));
    expect(byLevel).toEqual({
      simple: 'What we talked about',
      standard: 'What you told us',
      professional: 'Summary of intake',
    });
  });

  it('keeps slots on one template apart', async () => {
    const c = db();
    await c.upsertEmailCopy(base({ slotKey: 'summary_heading', value: 'A' }));
    await c.upsertEmailCopy(base({ slotKey: 'subject_qualified', value: 'B' }));

    const rows = await c.getEmailCopy(ORG, 'claimant_handoff');
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.value).sort()).toEqual(['A', 'B']);
  });

  it('keeps one org out of another', async () => {
    // Only one org exists today. The scoping is here so that stays true
    // by construction rather than by nobody having tried yet.
    const other = '00000000-0000-4000-8000-0000000000ff';
    const c = db();
    await c.upsertEmailCopy(base({ value: 'ours' }));
    await c.upsertEmailCopy(base({ orgId: other, value: 'theirs' }));

    expect((await c.getEmailCopy(ORG, 'claimant_handoff'))[0].value).toBe('ours');
    expect((await c.getEmailCopy(other, 'claimant_handoff'))[0].value).toBe('theirs');
    expect(await c.listEmailCopy(ORG)).toHaveLength(1);
  });
});

describe('what saving refuses', () => {
  it('refuses blank copy rather than storing an empty email', async () => {
    // An empty value would render as a missing sentence in a claimant's
    // inbox. The resolver falls back to the default when there is NO
    // row; a blank row is a different thing and must not be creatable.
    const c = db();
    await expect(c.upsertEmailCopy(base({ value: '' }))).rejects.toThrow(/blank|empty/i);
    await expect(c.upsertEmailCopy(base({ value: '   ' }))).rejects.toThrow(/blank|empty/i);
    expect(await c.listEmailCopy(ORG)).toHaveLength(0);
  });
});

describe('reading nothing', () => {
  it('returns an empty list rather than null when nobody has edited', async () => {
    const c = db();
    expect(await c.getEmailCopy(ORG, 'claimant_handoff')).toEqual([]);
    expect(await c.listEmailCopy(ORG)).toEqual([]);
  });
});
