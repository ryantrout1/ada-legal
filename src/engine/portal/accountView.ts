/**
 * Shared response shapes for the portal Account surfaces (/plan Phase 3.1).
 *
 * Used by the attorney's own Account (api/portal/account) and the owner's
 * read-only view of a firm lawyer (api/portal/account/lawyers/[id]) so the
 * two render identically.
 */

import type { AttorneyAdminRow, LawFirmRow } from '../clients/types.js';

export function toAccountAttorney(a: AttorneyAdminRow) {
  return {
    id: a.id,
    name: a.name,
    location_city: a.locationCity,
    location_state: a.locationState,
    practice_areas: a.practiceAreas,
    additional_states: a.additionalStates,
    specialty_tags: a.specialtyTags,
    email: a.email,
    phone: a.phone,
    website_url: a.websiteUrl,
    bio: a.bio,
    photo_url: a.photoUrl,
    bar_number: a.barNumber ?? null,
    status: a.status,
    firm_role: a.firmRole ?? 'member',
    accepting_referrals: a.acceptingReferrals ?? true,
    routing_paused: a.routingPaused ?? false,
    max_active_cases: a.maxActiveCases ?? null,
  };
}

export function toAccountFirm(f: LawFirmRow) {
  return {
    id: f.id,
    name: f.name,
    primary_contact: f.primaryContact,
    email: f.email,
    phone: f.phone,
    status: f.status,
  };
}
