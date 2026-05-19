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
