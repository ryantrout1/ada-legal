/**
 * buildLitigationMatchedListing — turn a bound litigation into the
 * MatchedListing the readout renders.
 *
 * finalizeTurn's original matchedListing lookup only reads the legacy Ch1
 * `listingId` (readListingById). A litigation match binds
 * `litigationListingId` (a different table), so the readout never saw the
 * match — it fell back to the generic "we're building this matching system"
 * class-action placeholder and named no firm. This builds the same
 * MatchedListing shape from the litigation + its resolved display firm (lead
 * counsel / sole assignment, eligibility-independent — the readout shows a
 * matched firm's public contact whether or not the case routes to them), so
 * the readout names the case and shows the firm's contact details.
 *
 * Returns null when there's no litigation row or no firm resolves (e.g.
 * multi-firm with no lead) — in that case the placeholder stays, which is
 * the honest state.
 *
 * Ref: /triage — litigation-matched readout renders as generic self-help.
 */

import type { AdaClients } from '../clients/types.js';
import type { MatchedListing } from './types.js';
import { resolveDisplayFirm } from '../routing/createCaseForSession.js';

export async function buildLitigationMatchedListing(
  clients: Pick<AdaClients, 'db'>,
  litigationListingId: string,
): Promise<MatchedListing | null> {
  const litigation = await clients.db.getLitigationById(litigationListingId);
  if (!litigation) return null;

  const firmId = await resolveDisplayFirm(clients, litigationListingId);
  if (!firmId) return null;

  const firm = await clients.db.readLawFirmById(firmId);
  if (!firm) return null;

  return {
    listingSlug: litigation.slug,
    listingTitle: litigation.caseName,
    listingCategory: litigation.kind,
    firmName: firm.name,
    firmPrimaryContact: firm.primaryContact,
    firmEmail: firm.email,
    firmPhone: firm.phone,
  };
}
