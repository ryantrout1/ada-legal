/**
 * The save path for POST /api/public/civil-rights/submit, kept free of
 * Vercel and the database so it can be tested with in-memory stores.
 *
 * Order matters:
 *   1. Honeypot: a filled hidden field gets a quiet 201 and nothing else.
 *      No row, no rate count, no hint to a bot that it was caught.
 *   2. Rate limit (soft throttle, fails open; see apiRateLimit.ts).
 *   3. State, id, answers, consents.
 *   4. One write. The id is made in the browser, so a retry or a double
 *      tap lands on the same row instead of making a second one.
 */

import { isUuid } from '../uuid.js';
import { checkRateLimit, CIVIL_RIGHTS_SUBMIT_BUCKET, type RateLimitStore } from '../rateLimit/apiRateLimit.js';
import { resolveState } from './states/index.js';
import { validateAnswers } from './validate.js';
import { buildSummary } from './summary.js';
import { CONSENTS, COPY_VERSION, type ConsentKind } from './copy.js';
import type { Answers } from './types.js';

export interface SubmissionRecord {
  id: string;
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
  answers: Answers;
}

export interface ConsentRecord {
  submissionId: string;
  kind: ConsentKind;
  granted: boolean;
  wording: string;
  wordingVersion: string;
}

export interface CivilRightsStore {
  /** Writes both together. Returns 'duplicate' when the id already exists. */
  saveSubmission(row: SubmissionRecord, consents: ConsentRecord[]): Promise<'created' | 'duplicate'>;
}

export interface SubmitDeps {
  store: CivilRightsStore;
  rateLimitStore: RateLimitStore;
  rateKey: string;
}

export interface SubmitResult {
  status: number;
  body: { ok?: true; error?: string; field?: string; errors?: { field: string; message: string }[] };
  retryAfterSeconds?: number;
}

const UTM_MAX = 100;

function utm(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, UTM_MAX) : null;
}

function orNull(v: string): string | null {
  return v ? v : null;
}

export async function handleSubmit(input: unknown, deps: SubmitDeps): Promise<SubmitResult> {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { status: 201, body: { ok: true } };
  }

  const limit = await checkRateLimit(deps.rateLimitStore, CIVIL_RIGHTS_SUBMIT_BUCKET, deps.rateKey);
  if (!limit.allowed) {
    return {
      status: 429,
      retryAfterSeconds: limit.retryAfterSeconds,
      body: { error: 'Too many forms from here in a short time. Please wait a few minutes and try again.' },
    };
  }

  const config = resolveState(typeof body.state === 'string' ? body.state : '');
  if (!config) return { status: 404, body: { error: 'That state is not available yet.', field: 'state' } };

  if (!isUuid(body.id)) return { status: 400, body: { error: 'Missing form id.', field: 'id' } };
  const id = body.id;

  const result = validateAnswers(config, body.answers);
  if (!result.ok) {
    return {
      status: 400,
      body: { error: result.errors[0].message, field: result.errors[0].field, errors: result.errors },
    };
  }
  const a = result.value;

  // Consents: one row per checkbox, checked or not. Missing means not
  // granted. A version we do not recognize means the page showed wording
  // we cannot prove, so the save is refused rather than guessed.
  const sent = Array.isArray(body.consents) ? (body.consents as Record<string, unknown>[]) : [];
  const consents: ConsentRecord[] = [];
  for (const c of CONSENTS) {
    const entry = sent.find((s) => s && s.kind === c.kind);
    if (entry && entry.wordingVersion !== c.version) {
      return {
        status: 400,
        body: { error: 'This page is out of date. Please reload and try again.', field: 'consents' },
      };
    }
    consents.push({
      submissionId: id,
      kind: c.kind,
      granted: entry?.granted === true,
      wording: c.wording,
      wordingVersion: c.version,
    });
  }

  const u = (body.utm && typeof body.utm === 'object' ? body.utm : {}) as Record<string, unknown>;

  const row: SubmissionRecord = {
    id,
    stateCode: config.code,
    formVersion: config.formVersion,
    area: config.area,
    basis: config.basis,
    complainantName: a.complainant_name,
    email: orNull(a.email),
    phone: a.phone,
    address1: a.address1,
    address2: orNull(a.address2),
    city: a.city,
    state: a.state,
    zip: a.zip,
    altContactName: orNull(a.alt_contact_name),
    altContactPhone: orNull(a.alt_contact_phone),
    respondentName: a.respondent_name,
    respondentCompany: orNull(a.respondent_company),
    respondentAddress1: orNull(a.respondent_address1),
    respondentAddress2: orNull(a.respondent_address2),
    respondentCity: a.respondent_city,
    respondentState: a.respondent_state,
    respondentZip: orNull(a.respondent_zip),
    whatHappened: a.what_happened,
    witnesses: orNull(a.witnesses),
    firstIncidentDate: orNull(a.first_incident_date),
    lastIncidentDate: a.last_incident_date,
    ongoing: a.ongoing,
    hasAttorney: a.has_attorney,
    attorneyNameAddress: orNull(a.attorney_name_address),
    legalActionPending: a.legal_action_pending,
    otherAgencies: orNull(a.other_agencies),
    additionalComments: orNull(a.additional_comments),
    summaryText: buildSummary(config, a),
    copyVersion: COPY_VERSION,
    utmSource: utm(u.source),
    utmMedium: utm(u.medium),
    utmCampaign: utm(u.campaign),
    answers: a,
  };

  try {
    await deps.store.saveSubmission(row, consents);
  } catch (err) {
    console.error('[civil-rights/submit] save failed:', err);
    return { status: 500, body: { error: 'We could not save your answers. You can still download your form.' } };
  }
  return { status: 201, body: { ok: true } };
}
