/**
 * Admin side of the civil rights complaint page: the list view and the
 * retention period. Pure, so it is tested without a database.
 *
 * There is no bulk export. Submissions live in the database only; admins
 * read them one at a time on the detail page.
 */

import type { ConsentKind } from './copy.js';

/** Stored submissions are deleted this long after they arrive (cron). Pending Gina's sign-off. */
export const RETENTION_MONTHS = 24;

export interface AdminConsent {
  kind: ConsentKind;
  granted: boolean;
  wording: string;
  wordingVersion: string;
  recordedAt: string;
}

/** One stored submission as the admin endpoints return it. */
export interface AdminSubmission {
  id: string;
  createdAt: string;
  stateCode: string;
  formVersion: string;
  area: string;
  basis: string;
  complainantName: string;
  email: string | null;
  phone: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  altContactName: string | null;
  altContactPhone: string | null;
  respondentName: string;
  respondentCompany: string | null;
  respondentAddress1: string | null;
  respondentAddress2: string | null;
  respondentCity: string;
  respondentState: string;
  respondentZip: string | null;
  whatHappened: string;
  witnesses: string | null;
  firstIncidentDate: string | null;
  lastIncidentDate: string;
  ongoing: string;
  hasAttorney: string;
  attorneyNameAddress: string | null;
  legalActionPending: string;
  otherAgencies: string | null;
  additionalComments: string | null;
  summaryText: string;
  copyVersion: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  consents: AdminConsent[];
}

function consent(row: AdminSubmission, kind: ConsentKind): string {
  const c = row.consents.find((x) => x.kind === kind);
  return c ? (c.granted ? 'yes' : 'no') : '';
}

/** The short form the list page shows. */
export function listView(r: AdminSubmission) {
  return {
    id: r.id,
    createdAt: r.createdAt,
    stateCode: r.stateCode,
    complainantName: r.complainantName,
    respondentName: r.respondentName,
    respondentCity: r.respondentCity,
    lastIncidentDate: r.lastIncidentDate,
    ongoing: r.ongoing,
    consentUpdates: consent(r, 'updates'),
    consentContact: consent(r, 'contact'),
    preview: r.utmSource === 'admin-preview',
  };
}

export type AdminListRow = ReturnType<typeof listView>;

