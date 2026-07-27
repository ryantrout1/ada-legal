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

  const base = {
    listingSlug: litigation.slug,
    listingTitle: litigation.caseName,
    listingCategory: litigation.kind,
    barrierCategory: litigation.barrierCategory ?? null,
  };

  // Class counsel first. They are the lawyers actually running the case,
  // and they are usually a firm we have no relationship with and no row
  // for — which is exactly why looking only at our own network was wrong.
  const contacts = await clients.db.listContactsForLitigation(litigationListingId);
  const counsel = contacts.find((c) => c.contactKind === 'class_counsel');
  if (counsel) {
    return {
      ...base,
      firmName: counsel.orgName,
      firmPrimaryContact: counsel.personName,
      firmEmail: counsel.email,
      firmPhone: counsel.phone,
      contactIsClassCounsel: true,
      contactScopeNote: counsel.scopeNote,
    };
  }

  // Then a firm from our network, if one resolves. Useful, but NOT counsel
  // of record — the flag keeps the page from implying otherwise.
  const firmId = await resolveDisplayFirm(clients, litigationListingId);
  const firm = firmId ? await clients.db.readLawFirmById(firmId) : null;
  if (firm) {
    return {
      ...base,
      firmName: firm.name,
      firmPrimaryContact: firm.primaryContact,
      firmEmail: firm.email,
      firmPhone: firm.phone,
      contactIsClassCounsel: false,
      contactScopeNote: null,
    };
  }

  // Neither. Return the listing anyway rather than null: null made the
  // readout fall back to a placeholder naming nobody, which is what a
  // Niles match produces today. The page can offer the government route
  // for the barrier category instead.
  return {
    ...base,
    firmName: null,
    firmPrimaryContact: null,
    firmEmail: null,
    firmPhone: null,
    contactIsClassCounsel: false,
    contactScopeNote: null,
  };
}
