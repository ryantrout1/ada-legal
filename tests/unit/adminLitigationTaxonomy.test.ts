/**
 * Admin editing for barrier category and intake status.
 *
 * Both fields have been settable only by hand-written SQL since they
 * landed. This is the first write path a person drives, so the guards
 * matter more than the form: a value that reaches the database CHECK
 * surfaces as a Postgres error nobody can act on.
 *
 * The guards are derived from the same runtime lists the UI builds its
 * dropdowns from, for the reason the kind list just taught us — a
 * hand-written copy drifts, and the failure is a control that offers
 * something it will not save, or refuses something it displays.
 *
 * These guards also behave differently from the ones around them, on
 * purpose. The existing PATCH silently drops any field failing its check.
 * That is exactly how a blank Kind dropdown survived a save without
 * complaint. These return the field name instead.
 *
 * Ref: /plan admin-editing, Phase 2, AC2 + AC3 + AC6.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { INTAKE_STATUSES } from '@/engine/clients/types';
import {
  BARRIER_CATEGORY_ORDER,
  BARRIER_CATEGORY_STORED,
} from '@/app/lib/barrierCategories';
import { isBarrierCategory, isIntakeStatus } from '../../api/admin/litigation/[id].js';

const ORG_ID = '00000000-0000-4000-8000-000000000001';

async function seed() {
  const c = makeInMemoryClients();
  const row = await c.db.createLitigation({
    orgId: ORG_ID,
    kind: 'class',
    caseName: 'Seeded v. Defendant',
    slug: 'seeded-v-defendant',
  });
  return { c, row };
}

describe('barrier category guard', () => {
  it('accepts every category the dropdown offers', () => {
    for (const category of BARRIER_CATEGORY_STORED) {
      expect(isBarrierCategory(category), `${category} would be refused`).toBe(true);
    }
  });

  it('accepts unassigned, so a wrong category can be cleared', () => {
    // Deliberate. A wrong category actively misleads someone — it puts a
    // case on a page it does not belong to and names the wrong agency in
    // its fallback route. An absent one merely fails to help. Admin needs
    // to be able to undo, not only to change.
    expect(isBarrierCategory('unassigned')).toBe(true);
    expect(BARRIER_CATEGORY_STORED).toContain('unassigned');
    // But it is still not a browsable option on the public side.
    expect(BARRIER_CATEGORY_ORDER).not.toContain('unassigned');
  });

  it('rejects anything else', () => {
    for (const bad of ['sidewalks', 'SIDEWALKS_STREETS', '', null, undefined, 3, {}]) {
      expect(isBarrierCategory(bad)).toBe(false);
    }
  });
});

describe('intake status guard', () => {
  it('accepts exactly the three stored values', () => {
    expect([...INTAKE_STATUSES].sort()).toEqual(['mechanism', 'none', 'open']);
    for (const s of INTAKE_STATUSES) expect(isIntakeStatus(s)).toBe(true);
  });

  it('rejects anything else', () => {
    // 'active' and 'closed' are statuses, not intake statuses. Confusing
    // the two is the likeliest mistake here.
    for (const bad of ['active', 'closed', 'compliance', '', null, 1]) {
      expect(isIntakeStatus(bad)).toBe(false);
    }
  });
});

describe('the fields survive a round trip', () => {
  it('stores a category and reads it back', async () => {
    const { c, row } = await seed();
    await c.db.updateLitigation(row.id, { barrierCategory: 'voting_elections' });
    const read = await c.db.getLitigationById(row.id);
    expect(read!.barrierCategory).toBe('voting_elections');
  });

  it('stores each intake status and reads it back', async () => {
    for (const intakeStatus of INTAKE_STATUSES) {
      const { c, row } = await seed();
      await c.db.updateLitigation(row.id, { intakeStatus });
      const read = await c.db.getLitigationById(row.id);
      expect(read!.intakeStatus).toBe(intakeStatus);
    }
  });

  it('leaves the stored value alone when the field is absent', async () => {
    // The patch is additive: an absent key means unchanged, matching every
    // other field on this endpoint.
    const { c, row } = await seed();
    await c.db.updateLitigation(row.id, { barrierCategory: 'housing' });
    await c.db.updateLitigation(row.id, { caseName: 'Renamed' });
    const read = await c.db.getLitigationById(row.id);
    expect(read!.barrierCategory).toBe('housing');
    expect(read!.caseName).toBe('Renamed');
  });

  it('can clear a category back to unassigned', async () => {
    const { c, row } = await seed();
    await c.db.updateLitigation(row.id, { barrierCategory: 'air_travel' });
    await c.db.updateLitigation(row.id, { barrierCategory: 'unassigned' });
    const read = await c.db.getLitigationById(row.id);
    expect(read!.barrierCategory).toBe('unassigned');
  });
});

describe('uncategorised records stay countable', () => {
  it('a new record is unassigned until someone sets it', async () => {
    // AC6: the gap has to be visible, or 38-of-39 quietly becomes 30-of-45
    // as records are added and nobody notices the ones with no category.
    const { row } = await seed();
    expect(row.barrierCategory).toBe('unassigned');
  });
});
