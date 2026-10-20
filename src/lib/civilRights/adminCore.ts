/**
 * Admin side of the civil rights complaint page: the list, the CSV export,
 * and the retention period. Pure, so it is tested without a database.
 *
 * The CSV holds contact details for people who asked for help, so:
 *   - every export is written to audit_log first, and no audit means no
 *     export (fail closed);
 *   - any cell a spreadsheet could run as a formula is neutralized.
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

/** Column header -> value. Order is the CSV's column order. */
export const CSV_COLUMNS: [string, (r: AdminSubmission) => string | null][] = [
  ['submitted_at', (r) => r.createdAt],
  ['id', (r) => r.id],
  ['state', (r) => r.stateCode],
  ['form_version', (r) => r.formVersion],
  ['area', (r) => r.area],
  ['basis', (r) => r.basis],
  ['name', (r) => r.complainantName],
  ['email', (r) => r.email],
  ['phone', (r) => r.phone],
  ['address1', (r) => r.address1],
  ['address2', (r) => r.address2],
  ['city', (r) => r.city],
  ['address_state', (r) => r.state],
  ['zip', (r) => r.zip],
  ['alt_contact_name', (r) => r.altContactName],
  ['alt_contact_phone', (r) => r.altContactPhone],
  ['business_name', (r) => r.respondentName],
  ['business_company', (r) => r.respondentCompany],
  ['business_address1', (r) => r.respondentAddress1],
  ['business_address2', (r) => r.respondentAddress2],
  ['business_city', (r) => r.respondentCity],
  ['business_state', (r) => r.respondentState],
  ['business_zip', (r) => r.respondentZip],
  ['what_happened', (r) => r.whatHappened],
  ['witnesses', (r) => r.witnesses],
  ['first_incident_date', (r) => r.firstIncidentDate],
  ['last_incident_date', (r) => r.lastIncidentDate],
  ['ongoing', (r) => r.ongoing],
  ['has_attorney', (r) => r.hasAttorney],
  ['attorney_name_address', (r) => r.attorneyNameAddress],
  ['legal_action_pending', (r) => r.legalActionPending],
  ['other_agencies', (r) => r.otherAgencies],
  ['additional_comments', (r) => r.additionalComments],
  ['consent_updates', (r) => consent(r, 'updates')],
  ['consent_contact', (r) => consent(r, 'contact')],
  ['utm_source', (r) => r.utmSource],
  ['utm_medium', (r) => r.utmMedium],
  ['utm_campaign', (r) => r.utmCampaign],
  ['copy_version', (r) => r.copyVersion],
];

/**
 * One CSV cell. A leading = + - @ tab or carriage return would let a
 * spreadsheet run the text as a formula, so it gets a leading apostrophe.
 * Quotes, commas and line breaks are quoted the standard way.
 */
export function csvCell(value: string | null | undefined): string {
  let v = value ?? '';
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: AdminSubmission[]): string {
  const lines = [CSV_COLUMNS.map(([h]) => h).join(',')];
  for (const r of rows) lines.push(CSV_COLUMNS.map(([, get]) => csvCell(get(r))).join(','));
  // CRLF + BOM so Excel opens it as UTF-8 with names intact.
  return `﻿${lines.join('\r\n')}\r\n`;
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

/**
 * Audit first, then build the file. If the audit write fails, the export
 * fails: contact details never leave without a record of who took them.
 */
export async function exportWithAudit(
  rows: AdminSubmission[],
  logAudit: (count: number) => Promise<void>,
): Promise<string> {
  await logAudit(rows.length);
  return toCsv(rows);
}
