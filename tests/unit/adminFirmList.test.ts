/**
 * Tests for listFirmsForAdmin on the in-memory DbClient.
 *
 * The in-memory impl mirrors the Neon view semantics: orgId is required
 * (scoping), filters are AND'd, search is a case-insensitive substring
 * match on name or primary_contact, pagination is 1-based, and results
 * are sorted newest-first by createdAt with name ASC as a deterministic
 * fallback when timestamps are missing.
 *
 * Ref: Step 25, Commit 1.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { LawFirmRow } from '@/engine/clients/types';

const ORG_A = '00000000-0000-4000-8000-0000000000a1';
const ORG_B = '00000000-0000-4000-8000-0000000000b1';

function firm(overrides: Partial<LawFirmRow> & { id: string; name: string }): LawFirmRow {
  return {
    id: overrides.id,
    orgId: overrides.orgId ?? ORG_A,
    name: overrides.name,
    primaryContact: overrides.primaryContact ?? null,
    email: overrides.email ?? null,
    phone: null,
    stripeCustomerId: null,
    status: overrides.status ?? 'active',
    isPilot: overrides.isPilot ?? false,
    createdAt: overrides.createdAt,
  };
}

async function seed(
  clients: ReturnType<typeof makeInMemoryClients>,
  rows: LawFirmRow[],
): Promise<void> {
  for (const r of rows) {
    await clients.db.writeLawFirm(r);
  }
}

// ─── Basic filtering ─────────────────────────────────────────────────────────

describe('listFirmsForAdmin', () => {
  it('scopes to orgId (does not leak cross-org firms)', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-000000000101', name: 'Acme A', orgId: ORG_A }),
      firm({ id: '00000000-0000-4000-8000-000000000102', name: 'Beta B', orgId: ORG_B }),
    ]);
    const result = await clients.db.listFirmsForAdmin({ orgId: ORG_A });
    expect(result.firms).toHaveLength(1);
    expect(result.firms[0]!.name).toBe('Acme A');
    expect(result.totalCount).toBe(1);
  });

  it('filters by status', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-000000000201', name: 'Active', status: 'active' }),
      firm({ id: '00000000-0000-4000-8000-000000000202', name: 'Suspended', status: 'suspended' }),
      firm({ id: '00000000-0000-4000-8000-000000000203', name: 'Churned', status: 'churned' }),
    ]);
    const onlyActive = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      status: 'active',
    });
    expect(onlyActive.firms).toHaveLength(1);
    expect(onlyActive.firms[0]!.name).toBe('Active');

    const onlyChurned = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      status: 'churned',
    });
    expect(onlyChurned.firms).toHaveLength(1);
    expect(onlyChurned.firms[0]!.name).toBe('Churned');
  });

  it('filters by isPilot', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-000000000301', name: 'Pilot', isPilot: true }),
      firm({ id: '00000000-0000-4000-8000-000000000302', name: 'Paid', isPilot: false }),
    ]);
    const pilots = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      isPilot: true,
    });
    expect(pilots.firms).toHaveLength(1);
    expect(pilots.firms[0]!.name).toBe('Pilot');

    const nonPilots = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      isPilot: false,
    });
    expect(nonPilots.firms).toHaveLength(1);
    expect(nonPilots.firms[0]!.name).toBe('Paid');
  });

  it('searches by name (case-insensitive substring)', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-000000000401', name: 'Desert Disability Rights' }),
      firm({ id: '00000000-0000-4000-8000-000000000402', name: 'Canyon Legal Group' }),
      firm({ id: '00000000-0000-4000-8000-000000000403', name: 'Monsoon Advocacy' }),
    ]);
    const result = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      search: 'CANYON',
    });
    expect(result.firms).toHaveLength(1);
    expect(result.firms[0]!.name).toBe('Canyon Legal Group');
  });

  it('searches by primary contact', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({
        id: '00000000-0000-4000-8000-000000000501',
        name: 'Firm One',
        primaryContact: 'Jane Partner',
      }),
      firm({
        id: '00000000-0000-4000-8000-000000000502',
        name: 'Firm Two',
        primaryContact: 'Bob Associate',
      }),
    ]);
    const result = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      search: 'jane',
    });
    expect(result.firms).toHaveLength(1);
    expect(result.firms[0]!.name).toBe('Firm One');
  });

  it('combines filters (AND semantics)', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({
        id: '00000000-0000-4000-8000-000000000601',
        name: 'Pilot Active',
        status: 'active',
        isPilot: true,
      }),
      firm({
        id: '00000000-0000-4000-8000-000000000602',
        name: 'Pilot Suspended',
        status: 'suspended',
        isPilot: true,
      }),
      firm({
        id: '00000000-0000-4000-8000-000000000603',
        name: 'Active Paid',
        status: 'active',
        isPilot: false,
      }),
    ]);
    const result = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      status: 'active',
      isPilot: true,
    });
    expect(result.firms).toHaveLength(1);
    expect(result.firms[0]!.name).toBe('Pilot Active');
  });
});

// ─── Pagination ─────────────────────────────────────────────────────────────

describe('listFirmsForAdmin pagination', () => {
  it('respects page + pageSize', async () => {
    const clients = makeInMemoryClients();
    const many: LawFirmRow[] = [];
    for (let i = 0; i < 25; i++) {
      many.push(
        firm({
          id: `00000000-0000-4000-8000-0000000007${String(i).padStart(2, '0')}`,
          name: `Firm ${String(i).padStart(2, '0')}`,
        }),
      );
    }
    await seed(clients, many);
    const pageOne = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      page: 1,
      pageSize: 10,
    });
    const pageTwo = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      page: 2,
      pageSize: 10,
    });
    const pageThree = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      page: 3,
      pageSize: 10,
    });

    expect(pageOne.firms).toHaveLength(10);
    expect(pageOne.totalCount).toBe(25);
    expect(pageTwo.firms).toHaveLength(10);
    expect(pageThree.firms).toHaveLength(5);

    // Pages should not overlap
    const pageOneIds = new Set(pageOne.firms.map((f) => f.id));
    for (const f of pageTwo.firms) {
      expect(pageOneIds.has(f.id)).toBe(false);
    }
  });

  it('clamps pageSize to 100 max', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-000000000801', name: 'Only' }),
    ]);
    const result = await clients.db.listFirmsForAdmin({
      orgId: ORG_A,
      pageSize: 500,
    });
    expect(result.pageSize).toBe(100);
  });

  it('defaults page=1, pageSize=50', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-000000000901', name: 'One' }),
    ]);
    const result = await clients.db.listFirmsForAdmin({ orgId: ORG_A });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
  });
});

// ─── Empty + deterministic order ────────────────────────────────────────────

describe('listFirmsForAdmin edge cases', () => {
  it('returns empty result for unknown orgId', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-00000000ab01', name: 'A' }),
    ]);
    const result = await clients.db.listFirmsForAdmin({
      orgId: '00000000-0000-4000-8000-0000000000ff',
    });
    expect(result.firms).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('returns firms in deterministic order', async () => {
    const clients = makeInMemoryClients();
    await seed(clients, [
      firm({ id: '00000000-0000-4000-8000-00000000ac01', name: 'Charlie' }),
      firm({ id: '00000000-0000-4000-8000-00000000ac02', name: 'Alpha' }),
      firm({ id: '00000000-0000-4000-8000-00000000ac03', name: 'Bravo' }),
    ]);
    const r1 = await clients.db.listFirmsForAdmin({ orgId: ORG_A });
    const r2 = await clients.db.listFirmsForAdmin({ orgId: ORG_A });
    expect(r1.firms.map((f) => f.name)).toEqual(r2.firms.map((f) => f.name));
  });
});
