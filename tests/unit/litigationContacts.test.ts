/**
 * Taxonomy Phase 3 — who to contact about a case.
 *
 * The research behind this found that 30 of 39 cases have a contact that
 * is not a law firm in our system: settlement administrators, the DOJ, a
 * city 311 line, a hospital's own complaint process, state protection &
 * advocacy agencies. `law_firms` is the wrong home for those — it carries
 * subscription state and feeds routing eligibility, so storing CPT Group
 * there would make a settlement administrator routable.
 *
 * It also found contacts are many-per-case. Bryant has two co-counsel,
 * Dunsmore three, the Uber settlement four. Flattening to columns would
 * lose exactly the cases that matter most.
 *
 * The load-bearing rule here is `scope_note NOT NULL`. Nearly every
 * contact is bounded — Reynoldson's line covers Seattle, Willits covers
 * Los Angeles city limits, Bryant covers Harris County. The directory
 * shows contacts to everyone regardless of where they are, so a contact
 * that cannot say who it serves must not be storable. That way no
 * rendering path can produce a bare phone number, and an Arizonan is
 * never sent to a Seattle curb-ramp line.
 *
 * Ref: /plan litigation-taxonomy-and-contacts, Phase 3.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  CreateLitigationContactInput,
  LitigationContactKind,
} from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const LIT_ID = '20000000-0000-4000-8000-00000000c001';
const OTHER_LIT = '20000000-0000-4000-8000-00000000c002';

function contact(
  overrides: Partial<CreateLitigationContactInput> = {},
): CreateLitigationContactInput {
  return {
    orgId: ORG_ID,
    litigationListingId: LIT_ID,
    contactKind: 'class_counsel',
    orgName: 'Example Legal Center',
    scopeNote: 'Covers people who use sidewalks in the City of Example.',
    ...overrides,
  };
}

describe('litigation contacts — many per case', () => {
  it('stores several contacts of different kinds against one case', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigationContact(
      contact({ contactKind: 'class_counsel', orgName: 'Disability Rights Texas' }),
    );
    await c.db.createLitigationContact(
      contact({ contactKind: 'referral_firm', orgName: 'Brown, Goldstein & Levy' }),
    );
    await c.db.createLitigationContact(
      contact({ contactKind: 'government_agency', orgName: 'DOJ Disability Rights' }),
    );

    const rows = await c.db.listContactsForLitigation(LIT_ID);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.contactKind).sort()).toEqual([
      'class_counsel',
      'government_agency',
      'referral_firm',
    ]);
  });

  it('returns them in display order, not insertion order', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigationContact(
      contact({ orgName: 'Third', displayOrder: 3 }),
    );
    await c.db.createLitigationContact(
      contact({ orgName: 'First', displayOrder: 1 }),
    );
    await c.db.createLitigationContact(
      contact({ orgName: 'Second', displayOrder: 2 }),
    );

    const rows = await c.db.listContactsForLitigation(LIT_ID);
    expect(rows.map((r) => r.orgName)).toEqual(['First', 'Second', 'Third']);
  });

  it('keeps each case to its own contacts', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigationContact(contact({ orgName: 'Ours' }));
    await c.db.createLitigationContact(
      contact({ litigationListingId: OTHER_LIT, orgName: 'Theirs' }),
    );

    expect((await c.db.listContactsForLitigation(LIT_ID)).map((r) => r.orgName))
      .toEqual(['Ours']);
    expect((await c.db.listContactsForLitigation(OTHER_LIT)).map((r) => r.orgName))
      .toEqual(['Theirs']);
  });

  it('returns an empty list for a case with no contacts, not an error', async () => {
    const c = makeInMemoryClients();
    expect(await c.db.listContactsForLitigation(LIT_ID)).toEqual([]);
  });
});

describe('litigation contacts — the scope note is mandatory', () => {
  it('refuses a contact with no scope note', async () => {
    const c = makeInMemoryClients();
    await expect(
      c.db.createLitigationContact(contact({ scopeNote: '' })),
    ).rejects.toThrow(/scope/i);
  });

  it('refuses a scope note that is only whitespace', async () => {
    const c = makeInMemoryClients();
    await expect(
      c.db.createLitigationContact(contact({ scopeNote: '   ' })),
    ).rejects.toThrow(/scope/i);
  });

  it('every stored contact has a usable scope note', async () => {
    // The guarantee the rendering side relies on: if a contact came back
    // from the database, it can be shown with its guardrail attached.
    const c = makeInMemoryClients();
    await c.db.createLitigationContact(contact({ orgName: 'A' }));
    await c.db.createLitigationContact(contact({ orgName: 'B', displayOrder: 2 }));

    for (const row of await c.db.listContactsForLitigation(LIT_ID)) {
      expect(row.scopeNote.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('litigation contacts — intake open is opt-in', () => {
  it('defaults to closed', async () => {
    // Most of these contacts monitor a settlement or take government
    // complaints; they are not accepting new clients. Defaulting to
    // false means a contact can only claim to be open if someone said so.
    const c = makeInMemoryClients();
    const made = await c.db.createLitigationContact(contact());
    expect(made.intakeOpen).toBe(false);
  });

  it('can be set for a contact that is genuinely taking intake', async () => {
    const c = makeInMemoryClients();
    const made = await c.db.createLitigationContact(
      contact({ orgName: 'Disability Rights Texas', intakeOpen: true }),
    );
    expect(made.intakeOpen).toBe(true);
  });
});

describe('litigation contacts — the kinds we actually found', () => {
  const KINDS: LitigationContactKind[] = [
    'class_counsel',
    'settlement_administrator',
    'government_agency',
    'state_pa',
    'referral_firm',
    'defendant_process',
  ];

  it.each(KINDS)('accepts contact_kind=%s', async (contactKind) => {
    const c = makeInMemoryClients();
    const made = await c.db.createLitigationContact(contact({ contactKind }));
    expect(made.contactKind).toBe(contactKind);
  });

  it('carries phone, TTY, email, url and address when present', async () => {
    const c = makeInMemoryClients();
    const made = await c.db.createLitigationContact(
      contact({
        orgName: 'CPT Group, Inc.',
        contactKind: 'settlement_administrator',
        phone: '1-888-678-2596',
        tty: '1-833-610-1264',
        email: 'case@example.invalid',
        url: 'https://example.invalid',
        address: '50 Corporate Park, Irvine, CA 92606',
      }),
    );
    expect(made.phone).toBe('1-888-678-2596');
    expect(made.tty).toBe('1-833-610-1264');
    expect(made.email).toBe('case@example.invalid');
    expect(made.url).toBe('https://example.invalid');
    expect(made.address).toContain('Irvine');
  });

  it('leaves the optional fields null rather than empty strings', async () => {
    // A contact with no phone must read as "no phone", not as a blank
    // one the page might render as an empty link.
    const c = makeInMemoryClients();
    const made = await c.db.createLitigationContact(contact());
    expect(made.phone).toBeNull();
    expect(made.tty).toBeNull();
    expect(made.email).toBeNull();
    expect(made.address).toBeNull();
    expect(made.personName).toBeNull();
  });
});
