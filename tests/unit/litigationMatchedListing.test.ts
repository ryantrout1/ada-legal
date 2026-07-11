/**
 * Unit — buildLitigationMatchedListing turns a bound litigation + its
 * resolved firm into the MatchedListing the readout renders (so a
 * litigation match names the case + firm instead of the generic
 * class-action placeholder).
 *
 * Ref: /triage — litigation-matched readout renders as generic self-help.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import { buildLitigationMatchedListing } from '@/engine/package/litigationMatchedListing';
import type { LitigationAdminRow, LawFirmRow } from '@/engine/clients/types';

const LIT_ID = 'lit-hilton';
const FIRM_ID = 'firm-spinal';

function seed(opts: { withAssignment: boolean; withFirmRow: boolean }) {
  const db = new InMemoryDbClient();
  db.adminLitigation.push({
    id: LIT_ID,
    kind: 'class',
    caseName: 'Niles v. Hilton',
    slug: 'niles-v-hilton',
  } as unknown as LitigationAdminRow);
  if (opts.withAssignment) {
    db.litigationFirmAssignments.push({
      id: 'assign-1',
      litigationListingId: LIT_ID,
      lawFirmId: FIRM_ID,
      assignedByUserId: null,
      receivesMatches: false,
      optedInAt: null,
      createdAt: new Date(0).toISOString(),
    });
  }
  if (opts.withFirmRow) {
    db.lawFirms.push({
      id: FIRM_ID,
      name: 'The Spinal Cord Injury Law Firm',
      primaryContact: 'Kelley Simoneaux',
      email: 'info@spinalcordinjurylawyers.com',
      phone: '555-0100',
    } as unknown as LawFirmRow);
  }
  return db;
}

describe('buildLitigationMatchedListing', () => {
  it('builds a MatchedListing naming the case + firm', async () => {
    const db = seed({ withAssignment: true, withFirmRow: true });
    const ml = await buildLitigationMatchedListing({ db }, LIT_ID);
    expect(ml).not.toBeNull();
    expect(ml?.listingTitle).toBe('Niles v. Hilton');
    expect(ml?.listingSlug).toBe('niles-v-hilton');
    expect(ml?.firmName).toBe('The Spinal Cord Injury Law Firm');
    expect(ml?.firmEmail).toBe('info@spinalcordinjurylawyers.com');
  });

  it('returns null when the litigation row is missing', async () => {
    const db = seed({ withAssignment: true, withFirmRow: true });
    expect(await buildLitigationMatchedListing({ db }, 'nope')).toBeNull();
  });

  it('returns null when no firm resolves (leaves the placeholder — honest)', async () => {
    const db = seed({ withAssignment: false, withFirmRow: true });
    expect(await buildLitigationMatchedListing({ db }, LIT_ID)).toBeNull();
  });

  it('returns null when the resolved firm row is missing', async () => {
    const db = seed({ withAssignment: true, withFirmRow: false });
    expect(await buildLitigationMatchedListing({ db }, LIT_ID)).toBeNull();
  });
});
