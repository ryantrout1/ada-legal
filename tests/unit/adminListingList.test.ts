/**
 * Tests for listListingsForAdmin on the in-memory DbClient.
 *
 * Org scoping is indirect — listings don't carry org_id, so the query
 * joins through law_firms. The InMemory impl mirrors this with a
 * firmId → orgId lookup map.
 *
 * Ref: Step 25, Commit 3.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { LawFirmRow, ListingRow } from '@/engine/clients/types';

const ORG_A = '00000000-0000-4000-8000-0000000000a1';
const ORG_B = '00000000-0000-4000-8000-0000000000b1';
const FIRM_A1 = '00000000-0000-4000-8000-00000000aa01';
const FIRM_A2 = '00000000-0000-4000-8000-00000000aa02';
const FIRM_B1 = '00000000-0000-4000-8000-00000000bb01';

function firm(id: string, orgId: string, name: string): LawFirmRow {
  return {
    id,
    orgId,
    name,
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: false,
  };
}

function listing(
  id: string,
  lawFirmId: string,
  title: string,
  overrides: Partial<ListingRow> = {},
): ListingRow {
  return {
    id,
    lawFirmId,
    title,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    category: 'ada_title_iii',
    shortDescription: null,
    fullDescription: null,
    eligibilitySummary: null,
    status: 'draft',
    tier: 'basic',
    ...overrides,
  };
}

async function seed(
  clients: ReturnType<typeof makeInMemoryClients>,
  firms: LawFirmRow[],
  listings: ListingRow[],
): Promise<void> {
  for (const f of firms) await clients.db.writeLawFirm(f);
  for (const l of listings) await clients.db.writeListing(l);
}

// ─── Scoping ─────────────────────────────────────────────────────────────────

describe('listListingsForAdmin — scoping', () => {
  it('scopes to orgId via firm join (does not leak cross-org listings)', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'Org A firm'), firm(FIRM_B1, ORG_B, 'Org B firm')],
      [
        listing('00000000-0000-4000-8000-000000001101', FIRM_A1, 'A listing'),
        listing('00000000-0000-4000-8000-000000001102', FIRM_B1, 'B listing'),
      ],
    );
    const result = await clients.db.listListingsForAdmin({ orgId: ORG_A });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0]!.title).toBe('A listing');
    expect(result.totalCount).toBe(1);
  });

  it('filters by lawFirmId within the org', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'A1'), firm(FIRM_A2, ORG_A, 'A2')],
      [
        listing('00000000-0000-4000-8000-000000001201', FIRM_A1, 'A1 one'),
        listing('00000000-0000-4000-8000-000000001202', FIRM_A2, 'A2 one'),
        listing('00000000-0000-4000-8000-000000001203', FIRM_A2, 'A2 two'),
      ],
    );
    const result = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      lawFirmId: FIRM_A2,
    });
    expect(result.listings).toHaveLength(2);
    expect(result.listings.every((l) => l.lawFirmId === FIRM_A2)).toBe(true);
  });
});

// ─── Filtering ──────────────────────────────────────────────────────────────

describe('listListingsForAdmin — filters', () => {
  it('filters by status', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'A')],
      [
        listing('00000000-0000-4000-8000-000000001301', FIRM_A1, 'Draft one', {
          status: 'draft',
        }),
        listing('00000000-0000-4000-8000-000000001302', FIRM_A1, 'Published one', {
          status: 'published',
        }),
        listing('00000000-0000-4000-8000-000000001303', FIRM_A1, 'Archived one', {
          status: 'archived',
        }),
      ],
    );
    const published = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      status: 'published',
    });
    expect(published.listings).toHaveLength(1);
    expect(published.listings[0]!.title).toBe('Published one');
  });

  it('filters by category', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'A')],
      [
        listing('00000000-0000-4000-8000-000000001401', FIRM_A1, 'Title II one', {
          category: 'ada_title_ii',
        }),
        listing('00000000-0000-4000-8000-000000001402', FIRM_A1, 'Title III one', {
          category: 'ada_title_iii',
        }),
      ],
    );
    const t3 = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      category: 'ada_title_iii',
    });
    expect(t3.listings).toHaveLength(1);
    expect(t3.listings[0]!.title).toBe('Title III one');
  });

  it('searches on title (case-insensitive)', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'A')],
      [
        listing(
          '00000000-0000-4000-8000-000000001501',
          FIRM_A1,
          'Hotel booking fraud',
        ),
        listing('00000000-0000-4000-8000-000000001502', FIRM_A1, 'Parking lot access'),
      ],
    );
    const result = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      search: 'HOTEL',
    });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0]!.title).toBe('Hotel booking fraud');
  });

  it('searches on slug', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'A')],
      [
        listing('00000000-0000-4000-8000-000000001601', FIRM_A1, 'Hotel fraud', {
          slug: 'hotel-fraud',
        }),
        listing('00000000-0000-4000-8000-000000001602', FIRM_A1, 'Parking', {
          slug: 'parking-issues',
        }),
      ],
    );
    const result = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      search: 'parking',
    });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0]!.slug).toBe('parking-issues');
  });

  it('combines filters with AND semantics', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'A')],
      [
        listing(
          '00000000-0000-4000-8000-000000001701',
          FIRM_A1,
          'Published Title III',
          { status: 'published', category: 'ada_title_iii' },
        ),
        listing(
          '00000000-0000-4000-8000-000000001702',
          FIRM_A1,
          'Draft Title III',
          { status: 'draft', category: 'ada_title_iii' },
        ),
        listing(
          '00000000-0000-4000-8000-000000001703',
          FIRM_A1,
          'Published Title II',
          { status: 'published', category: 'ada_title_ii' },
        ),
      ],
    );
    const result = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      status: 'published',
      category: 'ada_title_iii',
    });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0]!.title).toBe('Published Title III');
  });
});

// ─── Pagination ─────────────────────────────────────────────────────────────

describe('listListingsForAdmin — pagination', () => {
  it('respects page + pageSize', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A1, ORG_A, 'A'));
    const many: ListingRow[] = [];
    for (let i = 0; i < 12; i++) {
      many.push(
        listing(
          `00000000-0000-4000-8000-00000000180${i}`,
          FIRM_A1,
          `Item ${String.fromCharCode(65 + i)}`, // A..L for alphabetical stability
        ),
      );
    }
    for (const l of many) await clients.db.writeListing(l);

    const p1 = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      page: 1,
      pageSize: 5,
    });
    const p2 = await clients.db.listListingsForAdmin({
      orgId: ORG_A,
      page: 2,
      pageSize: 5,
    });
    expect(p1.listings).toHaveLength(5);
    expect(p2.listings).toHaveLength(5);
    expect(p1.totalCount).toBe(12);
    // Pages should not overlap
    const p1Ids = new Set(p1.listings.map((l) => l.id));
    for (const l of p2.listings) expect(p1Ids.has(l.id)).toBe(false);
  });

  it('returns empty result for unknown org', async () => {
    const clients = makeInMemoryClients();
    await seed(
      clients,
      [firm(FIRM_A1, ORG_A, 'A')],
      [listing('00000000-0000-4000-8000-000000001901', FIRM_A1, 'one')],
    );
    const result = await clients.db.listListingsForAdmin({
      orgId: '00000000-0000-4000-8000-0000000000ff',
    });
    expect(result.listings).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});
