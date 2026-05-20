/**
 * Portal test fixture seed helper.
 *
 * Seeds the shared data shape every portal test needs: 2 test law firms, 2
 * Clerk-paired test attorneys (one per firm), 1 active litigation row assigned
 * to BOTH firms, and 2 ada_sessions bound to that litigation row.
 *
 * Phase 2 fills in the live body (the Phase 1 commit landed typed signatures
 * only — the new tables/columns didn't exist yet). The seed runs against the
 * in-memory client (makeInMemoryClients), which mirrors the Neon reader/writer
 * methods, so the data-logic unit tests need no real database.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 2 (data infra,
 *      "tests/fixtures/portalSeed.ts (live seed body)").
 */

import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { LawFirmRow, AttorneyRow } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

type InMemoryClients = ReturnType<typeof makeInMemoryClients>;

const ORG_ID = '00000000-0000-4000-8000-0000000000a1';
const FIRM_A_ID = '11110000-0000-4000-8000-0000000000a1';
const FIRM_B_ID = '11110000-0000-4000-8000-0000000000b1';
const SESSION_1_ID = '33330000-0000-4000-8000-000000000001';
const SESSION_2_ID = '33330000-0000-4000-8000-000000000002';

/** The two test law firms that share the seeded litigation row. */
export interface SeededFirms {
  firmA: LawFirmRow;
  firmB: LawFirmRow;
}

/** A test attorney paired to a Clerk user and bound to one firm. */
export interface SeededAttorney {
  attorney: AttorneyRow;
  /** Clerk user id paired via attorneys.user_id. */
  clerkUserId: string;
  /** law_firms.id this attorney belongs to (attorneys.law_firm_id). */
  lawFirmId: string;
}

export interface SeededAttorneys {
  attorneyA: SeededAttorney;
  attorneyB: SeededAttorney;
}

/** One active litigation row assigned to both firms (litigation_firm_assignments). */
export interface SeededLitigation {
  litigationListingId: string;
  /** Both firm ids assigned to the shared litigation row. */
  assignedFirmIds: [string, string];
}

/** Two ada_sessions bound to the shared litigation row via litigation_listing_id. */
export interface SeededSessions {
  sessionIds: [string, string];
}

/** The full seeded portal fixture. */
export interface PortalFixture {
  firms: SeededFirms;
  attorneys: SeededAttorneys;
  litigation: SeededLitigation;
  sessions: SeededSessions;
}

function lawFirm(id: string, name: string): LawFirmRow {
  return {
    id,
    orgId: ORG_ID,
    name,
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: false,
    createdAt: new Date(0).toISOString(),
  };
}

/** Seed 2 test law firms (Firm A + Firm B). */
export async function seedTestFirms(clients: InMemoryClients): Promise<SeededFirms> {
  const firmA = lawFirm(FIRM_A_ID, 'Firm A LLP');
  const firmB = lawFirm(FIRM_B_ID, 'Firm B LLP');
  await clients.db.writeLawFirm(firmA);
  await clients.db.writeLawFirm(firmB);
  return { firmA, firmB };
}

/** Seed 2 test attorneys, each Clerk-paired and bound to one firm. */
export async function seedTestAttorneys(
  clients: InMemoryClients,
  firms: SeededFirms,
): Promise<SeededAttorneys> {
  async function makeAttorney(
    name: string,
    lawFirmId: string,
    clerkUserId: string,
    userId: string,
  ): Promise<SeededAttorney> {
    const created = await clients.db.createAttorney({
      orgId: ORG_ID,
      name,
      practiceAreas: ['title_iii'],
      status: 'approved',
    });
    // Pair to a Clerk-backed user + firm (migration 0019 columns). The admin
    // attorney store is the source of truth resolveAttorneyByClerkUserId reads.
    const admin = clients.db.adminAttorneys.find((a) => a.id === created.id);
    if (admin) {
      admin.userId = userId;
      admin.lawFirmId = lawFirmId;
    }
    clients.db.linkClerkUser(clerkUserId, created.id);
    return { attorney: created, clerkUserId, lawFirmId };
  }

  const attorneyA = await makeAttorney(
    'Attorney A',
    firms.firmA.id,
    'clerk_user_a',
    '44440000-0000-4000-8000-0000000000a1',
  );
  const attorneyB = await makeAttorney(
    'Attorney B',
    firms.firmB.id,
    'clerk_user_b',
    '44440000-0000-4000-8000-0000000000b1',
  );
  return { attorneyA, attorneyB };
}

/** Seed 1 active litigation row assigned to both firms. */
export async function seedSharedLitigation(
  clients: InMemoryClients,
  firms: SeededFirms,
): Promise<SeededLitigation> {
  const created = await clients.db.createLitigation({
    orgId: ORG_ID,
    kind: 'class',
    caseName: 'Shared v. Defendant',
    slug: 'shared-v-defendant',
    status: 'active',
  });
  await clients.db.replaceFirmAssignmentsForLitigation(created.id, [
    firms.firmA.id,
    firms.firmB.id,
  ]);
  return {
    litigationListingId: created.id,
    assignedFirmIds: [firms.firmA.id, firms.firmB.id],
  };
}

function boundSession(
  sessionId: string,
  litigationListingId: string,
  claimantName: string,
  claimantEmail: string,
): AdaSessionState {
  const now = new Date(0).toISOString();
  return {
    sessionId,
    orgId: ORG_ID,
    sessionType: 'public_ada',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-0000000000aa',
    userId: null,
    listingId: null,
    litigationListingId,
    conversationHistory: [
      { role: 'user', content: 'I think I qualify.', timestamp: now },
      { role: 'assistant', content: 'Tell me what happened.', timestamp: now },
    ],
    extractedFields: {
      claimant_name: { value: claimantName, confidence: 1, extracted_at: now },
      claimant_email: { value: claimantEmail, confidence: 1, extracted_at: now },
      booked_accessible_room: { value: 'yes', confidence: 1, extracted_at: now },
    },
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
  };
}

/** Seed 2 ada_sessions bound to the shared litigation row. */
export async function seedBoundSessions(
  clients: InMemoryClients,
  litigation: SeededLitigation,
): Promise<SeededSessions> {
  await clients.db.writeSession({
    state: boundSession(
      SESSION_1_ID,
      litigation.litigationListingId,
      'Jane Claimant',
      'jane@example.com',
    ),
  });
  await clients.db.writeSession({
    state: boundSession(
      SESSION_2_ID,
      litigation.litigationListingId,
      'John Claimant',
      'john@example.com',
    ),
  });
  return { sessionIds: [SESSION_1_ID, SESSION_2_ID] };
}

/**
 * Seed the full portal fixture in one call: 2 firms, 2 Clerk-paired attorneys,
 * 1 shared litigation row assigned to both firms, 2 bound ada_sessions.
 */
export async function seedPortalFixture(clients: InMemoryClients): Promise<PortalFixture> {
  const firms = await seedTestFirms(clients);
  const attorneys = await seedTestAttorneys(clients, firms);
  const litigation = await seedSharedLitigation(clients, firms);
  const sessions = await seedBoundSessions(clients, litigation);
  return { firms, attorneys, litigation, sessions };
}
