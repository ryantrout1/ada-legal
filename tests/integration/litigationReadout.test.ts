/**
 * Integration — a litigation match now surfaces in the readout: the package
 * carries a MatchedListing naming the case + firm, and the generic
 * class-action placeholder is gone.
 *
 * Before: matchedListing was built only from the legacy Ch1 listingId, so a
 * litigation match rendered as "we're building this matching system" with no
 * firm named.
 *
 * Ref: /triage — litigation-matched readout renders as generic self-help.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import { buildLitigationMatchedListing } from '@/engine/package/litigationMatchedListing';
import { assemblePackage } from '@/engine/package/assemble';
import type { AdaSessionState } from '@/engine/types';
import type { LitigationAdminRow, LawFirmRow } from '@/engine/clients/types';

const LIT_ID = 'lit-hilton';
const FIRM_ID = 'firm-spinal';

function seed() {
  const db = new InMemoryDbClient();
  db.adminLitigation.push({
    id: LIT_ID,
    kind: 'class',
    caseName: 'Niles v. Hilton',
    slug: 'niles-v-hilton',
  } as unknown as LitigationAdminRow);
  db.litigationFirmAssignments.push({
    id: 'assign-1',
    litigationListingId: LIT_ID,
    lawFirmId: FIRM_ID,
    assignedByUserId: null,
    receivesMatches: false,
    optedInAt: null,
    createdAt: new Date(0).toISOString(),
  });
  db.lawFirms.push({
    id: FIRM_ID,
    name: 'The Spinal Cord Injury Law Firm',
    primaryContact: null,
    email: 'info@spinalcordinjurylawyers.com',
    phone: null,
  } as unknown as LawFirmRow);
  return db;
}

function litigationSession(): AdaSessionState {
  return {
    sessionId: 'sess-hilton',
    orgId: 'org-1',
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: LIT_ID,
    classification: { title: 'class_action', tier: 'medium', reasoning: 'r', standard: 'ADA Title III' },
    conversationHistory: [
      { role: 'user', content: 'Hilton bed too high to transfer', timestamp: '2026-07-08T00:00:00Z' },
    ],
    metadata: {},
    extractedFields: {
      business_name: { value: 'Hilton', confidence: 1, extracted_at: '2026-07-08T00:00:00Z' },
    },
  } as unknown as AdaSessionState;
}

describe('litigation match surfaces in the readout', () => {
  it('without matchedListing → class-action placeholder, no firm', () => {
    const pkg = assemblePackage({ state: litigationSession() });
    expect(pkg.classActionPlaceholder).toBe(true);
    expect(pkg.matchedListing).toBeNull();
  });

  it('with the litigation matchedListing → names the case + firm, no placeholder', async () => {
    const db = seed();
    const matchedListing = await buildLitigationMatchedListing({ db }, LIT_ID);
    const pkg = assemblePackage({ state: litigationSession(), matchedListing });

    expect(pkg.classActionPlaceholder).toBe(false);
    expect(pkg.matchedListing?.listingTitle).toBe('Niles v. Hilton');
    expect(pkg.matchedListing?.firmName).toBe('The Spinal Cord Injury Law Firm');
    expect(pkg.matchedListing?.firmEmail).toBe('info@spinalcordinjurylawyers.com');
  });
});
