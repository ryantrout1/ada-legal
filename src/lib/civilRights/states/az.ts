/**
 * Arizona: Attorney General's Office, Civil Rights Division,
 * Civil Rights Intake Questionnaire (2024 PDF edition).
 *
 * Fields are the union of the AG's online questionnaire and the paper PDF,
 * so the PDF comes out complete and nothing the AG asks for online is lost.
 * v1 scope is Public Accommodation > Disability, pre-selected.
 *
 * Required set: the AG marks nothing required, so these are the answers the
 * PDF cannot be complete without (decided in /plan, Oct 19 2026).
 *
 * Deadline wording is quoted from the AG's civil rights brochure table and
 * footnote. It is shown as a note only; nothing here compares it to a date.
 *
 * All labels and hints are DRAFT until Gina approves the copy.
 */

import type { Answers, PdfFillPlan, StateConfig } from '../types.js';
import { usDate } from '../summary.js';

const NARRATIVE = 'documents that will help explain what happened to you';
const AGENCY = 'crimination If the answer is yes please state the name and address of the agency';
const ATTORNEY =
  'Do you have an attorney If the answer is yes please tell us the name and address of your attorney';
const lines = (base: string, n: number) => Array.from({ length: n }, (_, i) => `${base} ${i + 1}`);
const yn = (v: string) => (v === 'yes' ? 'Yes' : 'No');

/**
 * Field names and circle positions read from the 2024 PDF itself
 * (scripts/inspect-pdf-fields.mjs + pdftotext -bbox). Page 1 has two
 * columns: left is the person, right is the business. Areas and bases are
 * "circle all that apply" with no fields, so we draw the circles.
 */
function azPlan(a: Answers, summary: string): PdfFillPlan {
  const first = a.first_incident_date ? usDate(a.first_incident_date) : '';
  const last = usDate(a.last_incident_date);
  return {
    fields: {
      Name: a.complainant_name,
      Address: a.address1,
      Address_3: a.address2,
      City: a.city,
      State: a.state,
      Zip: a.zip,
      Phone: a.phone,
      'Business Name': a.respondent_company
        ? `${a.respondent_name} (${a.respondent_company})`
        : a.respondent_name,
      Address_2: a.respondent_address1,
      Address_4: a.respondent_address2,
      City_2: a.respondent_city,
      State_2: a.respondent_state,
      Zip_2: a.respondent_zip,
      // "When" is left empty: its box straddles a table rule, so text in it
      // prints struck through. First/Last Time and the circled Continuous
      // answer carry the same information.
      'first time': first,
      'Last Time': last,
    },
    lineGroups: [
      { fields: lines(NARRATIVE, 8), text: summary, overflowLabel: 'What happened (continued)' },
      {
        fields: lines(AGENCY, 5),
        text: a.other_agencies || 'No',
        overflowLabel: 'Other agencies contacted (continued)',
      },
      {
        fields: lines(ATTORNEY, 5),
        text: a.has_attorney === 'yes' ? `Yes. ${a.attorney_name_address}` : 'No',
        overflowLabel: 'Attorney (continued)',
      },
    ],
    circles: [
      // "Public Accommodations" column heading
      { page: 0, x: 306, y: 366, width: 135, height: 23 },
      // "Disability" in the Public Accommodations column
      { page: 0, x: 345, y: 238, width: 58, height: 23 },
      // Continuous: (Yes or No)
      a.ongoing === 'yes'
        ? { page: 0, x: 395, y: 99, width: 25, height: 22 }
        : { page: 0, x: 431, y: 99, width: 23, height: 22 },
    ],
    extraPage: {
      title: 'Additional Information',
      intro:
        "Attached to the Civil Rights Intake Questionnaire. These are answers to questions on the Attorney General's online questionnaire that the paper form has no space for.",
      items: [
        { name: 'extra_email', label: 'Email', value: a.email },
        { name: 'extra_alt_name', label: 'Alternate contact', value: a.alt_contact_name },
        { name: 'extra_alt_phone', label: 'Alternate contact phone', value: a.alt_contact_phone },
        { name: 'extra_ongoing', label: 'Is the alleged discrimination ongoing?', value: yn(a.ongoing) },
        { name: 'extra_legal_action', label: 'Is any legal action pending?', value: yn(a.legal_action_pending) },
        {
          name: 'extra_comments',
          label: 'Additional comments',
          value: a.additional_comments,
          multiline: true,
        },
      ],
      declaration:
        'I declare, under penalty of perjury under the laws of the state of Arizona, that the information in this questionnaire is true and accurate.',
    },
  };
}

export const AZ: StateConfig = {
  code: 'az',
  slug: 'arizona',
  name: 'Arizona',
  agencyName: "Arizona Attorney General's Office, Civil Rights Division",
  formName: 'Civil Rights Intake Questionnaire',
  formVersion: '2024',
  formUrl: 'https://www.azag.gov/sites/default/files/2025-01/civil_rights_intake_form-2024.pdf',
  area: 'public_accommodation',
  basis: 'disability',
  areaLabel: 'Public accommodation',
  basisLabel: 'disability',
  deadline: {
    area: 'Public Accommodations',
    limit: '180 days',
    from: 'From the last alleged discriminatory act',
    sourceUrl:
      'https://azag.gov/sites/default/files/docs/civil-rights/brochures/AZCivilRightsBrochureENG.PDF',
  },
  channels: [
    {
      kind: 'online',
      label: "The Attorney General's online questionnaire",
      value: 'https://www.azag.gov/complaints/civil-rights',
    },
    {
      kind: 'mail',
      label: 'Print, sign and mail it to',
      value: "Arizona Attorney General's Office, Civil Rights Division, 2005 N Central Ave, Phoenix, AZ 85004",
    },
    { kind: 'phone', label: 'Questions? Call the Civil Rights Division', value: '(602) 542-5263' },
  ],
  fields: [
    { key: 'complainant_name', autocomplete: 'name', label: 'Your full name', kind: 'text', required: true, maxLength: 200 },
    { key: 'phone', autocomplete: 'tel', label: 'Phone number', kind: 'tel', required: true, maxLength: 40 },
    {
      key: 'email',
      autocomplete: 'email',
      label: 'Email (optional)',
      kind: 'email',
      maxLength: 320,
      hint: 'The Attorney General may use it to reach you.',
    },
    { key: 'address1', autocomplete: 'address-line1', label: 'Street address', kind: 'text', required: true, maxLength: 200 },
    { key: 'address2', autocomplete: 'address-line2', label: 'Apartment, suite, etc. (optional)', kind: 'text', maxLength: 200 },
    { key: 'city', autocomplete: 'address-level2', label: 'City or town', kind: 'text', required: true, maxLength: 120 },
    { key: 'state', autocomplete: 'address-level1', label: 'State', kind: 'usState', required: true, maxLength: 2 },
    { key: 'zip', autocomplete: 'postal-code', label: 'ZIP code', kind: 'zip', required: true, maxLength: 10 },
    {
      key: 'alt_contact_name',
      label: 'Another person we can list as a contact (optional)',
      kind: 'text',
      maxLength: 200,
    },
    { key: 'alt_contact_phone', label: "That person's phone (optional)", kind: 'tel', maxLength: 40 },
    {
      key: 'respondent_name',
      label: 'Name of the business or place',
      kind: 'text',
      required: true,
      maxLength: 200,
    },
    {
      key: 'respondent_company',
      label: 'Company that owns it, if different (optional)',
      kind: 'text',
      maxLength: 200,
    },
    {
      key: 'respondent_address1',
      label: 'Street address of the business (optional)',
      kind: 'text',
      maxLength: 200,
      hint: "If you don't know it, the city and state are enough.",
    },
    { key: 'respondent_address2', label: 'Suite or unit (optional)', kind: 'text', maxLength: 200 },
    { key: 'respondent_city', label: 'City or town of the business', kind: 'text', required: true, maxLength: 120 },
    { key: 'respondent_state', label: 'State of the business', kind: 'usState', required: true, maxLength: 2 },
    { key: 'respondent_zip', label: 'ZIP code of the business (optional)', kind: 'zip', maxLength: 10 },
    {
      key: 'what_happened',
      label: 'What happened?',
      kind: 'textarea',
      required: true,
      maxLength: 6000,
      hint: 'In your own words: what you could not do, and why.',
    },
    { key: 'witnesses', label: 'Names of any witnesses (optional)', kind: 'textarea', maxLength: 1000 },
    {
      key: 'first_incident_date',
      label: 'When did it first happen? (optional)',
      kind: 'date',
      maxLength: 10,
    },
    { key: 'last_incident_date', label: 'When did it last happen?', kind: 'date', required: true, maxLength: 10 },
    { key: 'ongoing', label: 'Is it still happening?', kind: 'yesno', required: true, maxLength: 3 },
    { key: 'has_attorney', label: 'Do you have a lawyer for this?', kind: 'yesno', required: true, maxLength: 3 },
    {
      key: 'attorney_name_address',
      label: "Your lawyer's name and address",
      kind: 'textarea',
      requiredWhen: { field: 'has_attorney', equals: 'yes' },
      maxLength: 500,
    },
    {
      key: 'legal_action_pending',
      label: 'Is there a lawsuit or other legal action going on about this?',
      kind: 'yesno',
      required: true,
      maxLength: 3,
    },
    {
      key: 'other_agencies',
      label: 'Have you complained to any other agency? If so, which ones? (optional)',
      kind: 'textarea',
      maxLength: 1000,
    },
    {
      key: 'additional_comments',
      label: 'Anything else you want the Attorney General to know? (optional)',
      kind: 'textarea',
      maxLength: 2000,
    },
  ],
  steps: [
    { id: 'name', title: 'About you', fields: ['complainant_name'] },
    { id: 'contact', title: 'How to reach you', fields: ['phone', 'email'] },
    { id: 'address', title: 'Your mailing address', fields: ['address1', 'address2', 'city', 'state', 'zip'] },
    { id: 'alternate', title: 'Another contact', fields: ['alt_contact_name', 'alt_contact_phone'] },
    { id: 'business', title: 'The business', fields: ['respondent_name', 'respondent_company'] },
    {
      id: 'business_address',
      title: 'Where the business is',
      fields: ['respondent_address1', 'respondent_address2', 'respondent_city', 'respondent_state', 'respondent_zip'],
    },
    { id: 'what_happened', title: 'What happened', fields: ['what_happened', 'witnesses'] },
    { id: 'dates', title: 'When it happened', fields: ['first_incident_date', 'last_incident_date', 'ongoing'] },
    { id: 'lawyer', title: 'Lawyers', fields: ['has_attorney', 'attorney_name_address'] },
    { id: 'legal', title: 'Other legal action', fields: ['legal_action_pending', 'other_agencies'] },
    { id: 'anything_else', title: 'Anything else', fields: ['additional_comments'] },
  ],
  pdf: {
    path: '/forms/az/civil_rights_intake_form-2024.pdf',
    previewImage: '/forms/az/form-page-1.png',
    sha256: '92e336c13c1e94171bf8f05dca33643c4e42110c30cf6a053a41c34c25d82c58',
    plan: azPlan,
  },
};
