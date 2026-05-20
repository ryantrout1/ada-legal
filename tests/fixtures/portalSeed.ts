/**
 * Portal test fixture seed helper.
 *
 * Seeds the shared data shape every portal test needs: 2 test law firms, 2
 * Clerk-paired test attorneys (one per firm), 1 active litigation row assigned
 * to BOTH firms, and 2 ada_sessions bound to that litigation row.
 *
 * PHASE 1 (test infrastructure) lands the TYPED SIGNATURES ONLY. The live seed
 * bodies insert rows into litigation_firm_assignments and firm_session_handled
 * and set attorneys.user_id / attorneys.law_firm_id — none of which exist until
 * the Phase 2 migration (0019_attorney_portal.sql) applies and the in-memory
 * client mirrors the new reader methods. Every function therefore throws until
 * Phase 2 fills the bodies in as part of its own commit.
 *
 * The signatures are the contract the Phase 1 data-logic and integration
 * shells are written against; they reference only types that exist today
 * (LawFirmRow, AttorneyRow) plus primitives.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 2 (data infra,
 *      "tests/fixtures/portalSeed.ts (live seed body)").
 */

import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { LawFirmRow, AttorneyRow } from '@/engine/clients/types';

type InMemoryClients = ReturnType<typeof makeInMemoryClients>;

const NOT_IMPL =
  'portalSeed: live seed body lands in Phase 2 (migration 0019 + in-memory mirrors)';

/** The two test law firms that share the seeded litigation row. */
export interface SeededFirms {
  firmA: LawFirmRow;
  firmB: LawFirmRow;
}

/** A test attorney paired to a Clerk user and bound to one firm. */
export interface SeededAttorney {
  attorney: AttorneyRow;
  /** Clerk user id paired via attorneys.user_id (linkage set in Phase 2). */
  clerkUserId: string;
  /** law_firms.id this attorney belongs to (attorneys.law_firm_id in Phase 2). */
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

/** Seed 2 test law firms (Firm A + Firm B). */
export async function seedTestFirms(clients: InMemoryClients): Promise<SeededFirms> {
  void clients;
  throw new Error(`${NOT_IMPL} — seedTestFirms`);
}

/** Seed 2 test attorneys, each Clerk-paired and bound to one firm. */
export async function seedTestAttorneys(
  clients: InMemoryClients,
  firms: SeededFirms,
): Promise<SeededAttorneys> {
  void clients;
  void firms;
  throw new Error(`${NOT_IMPL} — seedTestAttorneys`);
}

/** Seed 1 active litigation row assigned to both firms. */
export async function seedSharedLitigation(
  clients: InMemoryClients,
  firms: SeededFirms,
): Promise<SeededLitigation> {
  void clients;
  void firms;
  throw new Error(`${NOT_IMPL} — seedSharedLitigation`);
}

/** Seed 2 ada_sessions bound to the shared litigation row. */
export async function seedBoundSessions(
  clients: InMemoryClients,
  litigation: SeededLitigation,
): Promise<SeededSessions> {
  void clients;
  void litigation;
  throw new Error(`${NOT_IMPL} — seedBoundSessions`);
}

/**
 * Seed the full portal fixture in one call: 2 firms, 2 Clerk-paired attorneys,
 * 1 shared litigation row assigned to both firms, 2 bound ada_sessions.
 */
export async function seedPortalFixture(clients: InMemoryClients): Promise<PortalFixture> {
  void clients;
  throw new Error(`${NOT_IMPL} — seedPortalFixture`);
}
