/**
 * A matched litigation must give the reader somebody to contact.
 *
 * buildLitigationMatchedListing resolved a firm from OUR network — the
 * litigation's lead firm, or its sole assignment — and returned null when
 * neither existed. Null means the readout falls back to a generic
 * class-action placeholder naming nobody.
 *
 * That is live on Niles. Its lead attorney and its firm assignment were
 * both removed on 2026-07-27 once it turned out the assigned firm was not
 * counsel on the case, so a wheelchair user who describes a Hilton
 * bed-transfer problem today gets a case summary and no way to reach
 * anyone at all.
 *
 * The deeper problem is that our own network is the wrong place to look.
 * Class counsel on Niles is a firm we have no row for and no relationship
 * with. The one place that distinction lives is litigation_contacts, whose
 * contact_kind separates class_counsel from referral_firm — built for the
 * public case pages and never read by anything on the intake side.
 *
 * So: prefer class counsel, fall back to our own display firm, and when
 * there is neither, say so rather than returning null. A person matched to
 * a case is never left with nothing.
 *
 * Ref: /plan class-action-match, Phase 1, AC2 + AC5.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { buildLitigationMatchedListing } from '@/engine/package/litigationMatchedListing';

const ORG = '00000000-0000-4000-8000-000000000001';

async function litigation(
  c: ReturnType<typeof makeInMemoryClients>,
  overrides: Record<string, unknown> = {},
) {
  return c.db.createLitigation({
    orgId: ORG,
    kind: 'class',
    caseName: 'Niles v. Hilton Worldwide Holdings Inc.',
    slug: 'niles-v-hilton-bed-heights',
    barrierCategory: 'hotels_lodging',
    ...overrides,
  } as never);
}

describe('class counsel is preferred over our own firms', () => {
  it('names the lawyers actually running the case', async () => {
    const c = makeInMemoryClients();
    const lit = await litigation(c);
    await c.db.createLitigationContact({
      orgId: ORG,
      litigationListingId: lit.id,
      contactKind: 'class_counsel',
      orgName: 'Real Class Counsel LLP',
      email: 'contact@example-counsel.invalid',
      phone: '(555) 010-0100',
      scopeNote: 'The lawyers running this case. Tell them what happened to you.',
    });

    const built = await buildLitigationMatchedListing(c, lit.id);
    expect(built).not.toBeNull();
    expect(built!.firmName).toBe('Real Class Counsel LLP');
    expect(built!.firmEmail).toBe('contact@example-counsel.invalid');
  });

  it('prefers class counsel over a referral firm on the same case', async () => {
    // A referral firm takes related work. It is not on the case, so it must
    // not be presented as though it were.
    const c = makeInMemoryClients();
    const lit = await litigation(c);
    await c.db.createLitigationContact({
      orgId: ORG,
      litigationListingId: lit.id,
      contactKind: 'referral_firm',
      orgName: 'Takes Related Work LLP',
      scopeNote: 'Takes cases like this one.',
      displayOrder: 1,
    });
    await c.db.createLitigationContact({
      orgId: ORG,
      litigationListingId: lit.id,
      contactKind: 'class_counsel',
      orgName: 'Actually On The Case LLP',
      scopeNote: 'Running this case.',
      displayOrder: 2,
    });

    const built = await buildLitigationMatchedListing(c, lit.id);
    expect(built!.firmName).toBe('Actually On The Case LLP');
  });

  it('carries the scope note, so the reader knows what the contact is for', async () => {
    const c = makeInMemoryClients();
    const lit = await litigation(c);
    await c.db.createLitigationContact({
      orgId: ORG,
      litigationListingId: lit.id,
      contactKind: 'class_counsel',
      orgName: 'Real Class Counsel LLP',
      scopeNote: 'Tell them what happened — it helps the case.',
    });

    const built = await buildLitigationMatchedListing(c, lit.id);
    expect(built!.contactScopeNote).toBe('Tell them what happened — it helps the case.');
    expect(built!.contactIsClassCounsel).toBe(true);
  });
});

describe('a matched case never leaves the reader with nothing', () => {
  it('still returns a listing when no contact and no firm exist', async () => {
    // The Niles case exactly. Returning null here is what produced a
    // readout naming nobody.
    const c = makeInMemoryClients();
    const lit = await litigation(c);

    const built = await buildLitigationMatchedListing(c, lit.id);
    expect(built).not.toBeNull();
    expect(built!.listingTitle).toContain('Niles');
    expect(built!.firmName).toBeNull();
    expect(built!.firmEmail).toBeNull();
  });

  it('carries the barrier category so the page can offer the government route', async () => {
    const c = makeInMemoryClients();
    const lit = await litigation(c);

    const built = await buildLitigationMatchedListing(c, lit.id);
    expect(built!.barrierCategory).toBe('hotels_lodging');
  });

  it('still returns null when the litigation itself does not exist', async () => {
    const c = makeInMemoryClients();
    expect(
      await buildLitigationMatchedListing(c, '20000000-0000-4000-8000-00000000dead'),
    ).toBeNull();
  });

  it('does not label our own display firm as class counsel', async () => {
    // Falling back to a firm in our network is fine. Claiming it runs the
    // case is not — that is the mistake Niles was carrying.
    const c = makeInMemoryClients();
    const lit = await litigation(c, { leadFirmId: null });

    const built = await buildLitigationMatchedListing(c, lit.id);
    expect(built!.contactIsClassCounsel).toBe(false);
  });
});
