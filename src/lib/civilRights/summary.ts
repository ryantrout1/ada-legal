/**
 * The narrative that goes in the agency form's "explain what happened" box.
 *
 * A fixed template filled with the person's own answers. No AI, no ADA
 * Legal Link analysis, no legal conclusions, no deadline talk. If a part
 * is blank it says so plainly instead of leaving a gap.
 */

import type { Answers, StateConfig } from './types.js';

const NOT_GIVEN = 'Not given';

/** yyyy-mm-dd -> mm/dd/yyyy by string parts (no Date, no time zone). */
export function usDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : NOT_GIVEN;
}

function yesNo(v: string): string {
  return v === 'yes' ? 'Yes' : v === 'no' ? 'No' : NOT_GIVEN;
}

export function buildSummary(config: StateConfig, a: Answers): string {
  const business = [
    a.respondent_company ? `${a.respondent_name} (${a.respondent_company})` : a.respondent_name,
    a.respondent_address1,
    a.respondent_address2,
    a.respondent_city,
    [a.respondent_state, a.respondent_zip].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  return [
    `Type of complaint: ${config.areaLabel}, ${config.basisLabel}.`,
    `Business: ${business}.`,
    '',
    'What happened, in my own words:',
    a.what_happened,
    '',
    `First time: ${a.first_incident_date ? usDate(a.first_incident_date) : NOT_GIVEN}. ` +
      `Last time: ${usDate(a.last_incident_date)}. Still happening: ${yesNo(a.ongoing)}.`,
    `Witnesses: ${a.witnesses || 'None listed'}`,
  ].join('\n');
}
