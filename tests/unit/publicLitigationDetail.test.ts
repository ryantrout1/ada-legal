/**
 * Phase A3a — `readActiveLitigationBySlug` statuses contract.
 *
 * The public detail page renders any of the 4 page-visible statuses
 * (active, compliance, investigating, tracking) — not just active.
 * Before A3, the method was hardcoded to `status='active'`, which
 * would 404 the Hilton 2010 consent decree (compliance) or the FlixBus
 * DOJ investigation (investigating) etc.
 *
 * This phase adds an optional `statuses?: LitigationStatus[]` option.
 * Default is back-compat: `['active']`. Public detail API passes the
 * 4 page-visible statuses.
 *
 * Ref: /plan Phase A3, AC5, AC6.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  CreateLitigationInput,
  LitigationStatus,
} from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';

function mkInput(
  slug: string,
  status: LitigationStatus,
  overrides: Partial<CreateLitigationInput> = {},
): CreateLitigationInput {
  return {
    orgId: ORG_ID,
    kind: 'class',
    caseName: `Case ${slug}`,
    slug,
    status,
    ...overrides,
  };
}

describe('Phase A3a — readActiveLitigationBySlug statuses filter', () => {
  it('defaults to status=[active] (404s a compliance row)', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('hilton-2010', 'compliance'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'hilton-2010',
    });
    expect(row).toBeNull();
  });

  it('returns a compliance row when statuses includes compliance', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('hilton-2010', 'compliance'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'hilton-2010',
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    expect(row).not.toBeNull();
    expect(row!.slug).toBe('hilton-2010');
  });

  it('returns an investigating row when statuses includes investigating', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('doj-flixbus', 'investigating'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'doj-flixbus',
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    expect(row).not.toBeNull();
  });

  it('returns a tracking row when statuses includes tracking', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('a4a-v-dot', 'tracking'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'a4a-v-dot',
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    expect(row).not.toBeNull();
  });

  it('404s a draft row even when caller passes the 4 page statuses', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('not-yet', 'draft'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'not-yet',
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    expect(row).toBeNull();
  });

  it('404s archived rows', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('old-case', 'archived'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'old-case',
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    expect(row).toBeNull();
  });
});

/**
 * Phase C1 — `relatedCases` inlining.
 *
 * The LawsuitDetail "Related cases" card needs caseName + kind + status
 * for each referenced id. Rather than make the front-end fan out N+1
 * fetches, the detail endpoint inlines the resolved rows.
 *
 * Surface-visibility filter matches the rest of the public detail API:
 * draft/closed/archived ids resolve to "skip" so users never see admin-
 * only rows in the related card.
 *
 * Ref: /plan Plan C, Phase C1.
 */
describe('Phase C1 — relatedCases inlining on readActiveLitigationBySlug', () => {
  const STATUSES: LitigationStatus[] = [
    'active',
    'compliance',
    'investigating',
    'tracking',
  ];

  it('returns empty relatedCases when relatedListingIds is empty', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('niles', 'active'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'niles',
      statuses: STATUSES,
    });
    expect(row).not.toBeNull();
    expect(row!.relatedCases).toEqual([]);
  });

  it('inlines a single surface-visible related case with id+slug+caseName+kind+status', async () => {
    const c = makeInMemoryClients();
    const hilton = await c.db.createLitigation(
      mkInput('hilton-2010', 'compliance', {
        kind: 'consent_decree',
        caseName: 'United States v. Hilton (2010 Consent Decree)',
      }),
    );
    await c.db.createLitigation(
      mkInput('niles', 'active', { relatedListingIds: [hilton.id] }),
    );
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'niles',
      statuses: STATUSES,
    });
    expect(row!.relatedCases).toHaveLength(1);
    expect(row!.relatedCases[0]).toEqual({
      id: hilton.id,
      slug: 'hilton-2010',
      caseName: 'United States v. Hilton (2010 Consent Decree)',
      kind: 'consent_decree',
      status: 'compliance',
    });
  });

  it('preserves relatedListingIds-authored ordering, not row insertion order', async () => {
    const c = makeInMemoryClients();
    const a = await c.db.createLitigation(mkInput('case-a', 'compliance'));
    const b = await c.db.createLitigation(mkInput('case-b', 'compliance'));
    const cc = await c.db.createLitigation(mkInput('case-c', 'compliance'));
    // Author the ids in non-sequential order so the test is meaningful.
    await c.db.createLitigation(
      mkInput('parent', 'active', { relatedListingIds: [cc.id, a.id, b.id] }),
    );
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'parent',
      statuses: STATUSES,
    });
    expect(row!.relatedCases.map((r) => r.slug)).toEqual([
      'case-c',
      'case-a',
      'case-b',
    ]);
  });

  it('skips ids whose status is draft/closed/archived (admin-only)', async () => {
    const c = makeInMemoryClients();
    const visible = await c.db.createLitigation(mkInput('visible', 'compliance'));
    const draft = await c.db.createLitigation(mkInput('draft', 'draft'));
    const closed = await c.db.createLitigation(mkInput('closed', 'closed'));
    const archived = await c.db.createLitigation(mkInput('archived', 'archived'));
    await c.db.createLitigation(
      mkInput('parent', 'active', {
        relatedListingIds: [draft.id, visible.id, closed.id, archived.id],
      }),
    );
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'parent',
      statuses: STATUSES,
    });
    expect(row!.relatedCases).toHaveLength(1);
    expect(row!.relatedCases[0].slug).toBe('visible');
  });

  it('skips ids that do not resolve to any row at all (deleted/stale)', async () => {
    const c = makeInMemoryClients();
    const real = await c.db.createLitigation(mkInput('real', 'compliance'));
    await c.db.createLitigation(
      mkInput('parent', 'active', {
        relatedListingIds: ['00000000-0000-4000-8000-deadbeefdead', real.id],
      }),
    );
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'parent',
      statuses: STATUSES,
    });
    expect(row!.relatedCases).toHaveLength(1);
    expect(row!.relatedCases[0].slug).toBe('real');
  });
});

/**
 * M3 Phase 1 — `status` on the public detail projection.
 *
 * LawsuitDetail's header renders a StatusBadge from `row.status`.
 * `LitigationDetailRow` extends `LitigationRow`, so the field lands
 * through the same projection the list endpoint uses — this pins it at
 * the detail seam too, because the two go through different client
 * methods and could drift independently.
 *
 * Ref: /plan M3 Phase 1, AC1.
 */
describe('M3 Phase 1 — status on the public detail projection', () => {
  it('projects status on the detail row', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('detail-status', 'compliance'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'detail-status',
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    expect(row).not.toBeNull();
    expect(row!.status).toBe('compliance');
  });

  it('keeps leadAttorneyName and relatedCases alongside it (additive-only)', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation(mkInput('detail-additive', 'active'));
    const row = await c.db.readActiveLitigationBySlug({
      orgId: ORG_ID,
      slug: 'detail-additive',
      statuses: ['active'],
    });
    expect(row).toHaveProperty('leadAttorneyName');
    expect(row).toHaveProperty('relatedCases');
    expect(row).toHaveProperty('status');
  });
});
