/**
 * Where to go when there is no contact.
 *
 * Twenty-six of the thirty-nine cases in the directory have nobody to
 * call: the DOJ investigations, the consent decrees, the closed matters,
 * and the ten records that are barrier categories rather than cases. This
 * is the floor underneath all of them — no case, no counsel, no class,
 * and a person can still file.
 *
 * It is not one route. Sending an airline complaint to the DOJ is wrong:
 * air travel runs on the Air Carrier Access Act, not the ADA, and the
 * agency is the DOT. Employment is the EEOC. Schools are the Department
 * of Education. Housing is HUD. Getting this wrong sends someone to an
 * agency that will not act, and they find out months later.
 *
 * Two rules are carried in the data rather than left to each caller:
 *
 *   Filing a complaint is not representation and does not stop any clock.
 *   Somebody who files, feels handled, and waits can lose a claim while
 *   the deadline runs out. That warning ships with every route.
 *
 *   We never state a deadline. Employment and air travel both have short
 *   hard limits, and a wrong date is worse than none — the same reason
 *   SOL is attorney-set and never computed anywhere in this codebase.
 *   Routes say a deadline may apply and that it is urgent. An attorney
 *   sets the date.
 *
 * Every route also pairs with the state protection & advocacy agency,
 * because the federal agency will not represent anyone and the P&A often
 * will. The pair is the floor, not the agency on its own.
 *
 * Ref: /plan litigation-taxonomy-and-contacts, Phase 5.
 */

import type { BarrierCategory } from './barrierCategories.js';

export interface AgencyRoute {
  /** Full name, as a person would need to write it on a form. */
  agency: string;
  /** How it is usually referred to. */
  shortName: string;
  phone?: string;
  tty?: string;
  url: string;
  /** What this agency does about this kind of barrier. */
  what: string;
  /** Named only where the governing law is NOT the ADA. */
  law?: string;
  /** A faster or parallel route worth trying first. */
  alsoTry?: string;
  /** True where a short hard time limit applies. */
  urgent?: boolean;
  /** Says a deadline exists without saying what it is. */
  urgentNote?: string;
}

/**
 * Travels with every route. A government complaint is an investigation
 * request, not a lawyer and not a filing — and nothing about it protects
 * a deadline.
 */
export const COMPLAINT_IS_NOT_REPRESENTATION =
  'Filing a complaint is not the same as having a lawyer, and it does not pause any legal deadlines. ' +
  'If you may want to bring a case, talk to an attorney about your dates as well as filing.';

export const STATE_PA_DIRECTORY = {
  name: 'Protection & Advocacy agency for your state',
  url: 'https://www.ndrn.org',
  what:
    'Every state has one. They are free, they take intake directly, and unlike a federal agency they can represent you.',
} as const;

const DOJ: AgencyRoute = {
  agency: 'U.S. Department of Justice, Civil Rights Division',
  shortName: 'DOJ',
  phone: '800-514-0301',
  tty: '833-610-1264',
  url: 'https://civilrights.justice.gov/report',
  what:
    'Takes complaints about businesses open to the public and about state and local government. It investigates and enforces, but it does not represent individuals and cannot advise you on your own claim.',
};

const HHS_PAIR =
  'If the service takes federal funding, the Department of Health and Human Services Office for Civil Rights also takes these.';

const ROUTES: Record<BarrierCategory, AgencyRoute> = {
  // Getting around
  sidewalks_streets: DOJ,
  rideshare_taxis: {
    ...DOJ,
    what:
      DOJ.what + ' Your city or state may also license rideshare and taxi operators and take complaints directly.',
  },
  air_travel: {
    agency: 'U.S. Department of Transportation, Aviation Consumer Protection',
    shortName: 'DOT',
    phone: '1-800-778-4838',
    tty: '1-800-455-9880',
    url: 'https://www.transportation.gov/airconsumer',
    what:
      'Handles disability complaints about airlines — damaged or delayed wheelchairs, refused boarding, missing assistance.',
    law:
      'Air travel runs on the Air Carrier Access Act, not the ADA, so this does not go to the Department of Justice.',
    alsoTry:
      'Every airline must give you a Complaints Resolution Official on request, at the airport or by phone. That is usually faster than any agency, and you can do both.',
    urgent: true,
    urgentNote:
      'Complaints about air travel have a short deadline. Raise it as soon as you can and ask an attorney about your dates.',
  },
  buses_transit: {
    ...DOJ,
    what:
      'Takes complaints about intercity bus operators. The Department of Transportation and the Federal Transit Administration also handle transportation access.',
  },

  // Places that serve the public
  healthcare: { ...DOJ, what: DOJ.what + ' ' + HHS_PAIR },
  hotels_lodging: DOJ,
  restaurants_stores_venues: DOJ,

  // Online & digital
  websites_apps_kiosks: DOJ,

  // Government & civic life
  voting_elections: {
    ...DOJ,
    what:
      'Takes complaints about inaccessible polling places, ballots and vote-by-mail. Your state or county election office is also required to respond, and is often quicker before an election.',
    urgent: true,
    urgentNote:
      'If an election is coming, raise this immediately — the useful window closes when voting does.',
  },
  gov_services: { ...DOJ, what: DOJ.what + ' ' + HHS_PAIR },

  // Where you live, learn and work
  jails_prisons: {
    ...DOJ,
    what:
      DOJ.what + ' For someone currently in custody, the state Protection & Advocacy agency is usually the faster route — they have the right to enter facilities.',
  },
  community_living: { ...DOJ, what: DOJ.what + ' ' + HHS_PAIR },
  education: {
    agency: 'U.S. Department of Education, Office for Civil Rights',
    shortName: 'ED OCR',
    url: 'https://ocrcas.ed.gov',
    what:
      'Handles disability discrimination by schools, districts, colleges and universities — including inaccessible online learning and refused accommodations.',
    law: 'Schools are covered by Section 504 and the ADA together.',
    alsoTry:
      'For a K-12 student, the school district must also have its own complaint process, and your state education agency takes complaints.',
  },
  employment: {
    agency: 'U.S. Equal Employment Opportunity Commission',
    shortName: 'EEOC',
    phone: '1-800-669-4000',
    tty: '1-800-669-6820',
    url: 'https://www.eeoc.gov/filing-charge-discrimination',
    what:
      'Handles disability discrimination at work — refused accommodations, being removed from a job, being screened out by a medical policy.',
    urgent: true,
    urgentNote:
      'Employment discrimination has the shortest deadline of anything on this site, and it starts running from when the discrimination happened. Do not wait to ask an attorney about your dates.',
  },
  housing: {
    agency: 'U.S. Department of Housing and Urban Development, Office of Fair Housing',
    shortName: 'HUD',
    phone: '1-800-669-9777',
    tty: '1-800-877-8339',
    url: 'https://www.hud.gov/fair_housing_equal_opp',
    what:
      'Handles disability discrimination in housing — refused accommodations or modifications, inaccessible design, and rules that push disabled tenants out.',
    law: 'Housing is covered by the Fair Housing Act as well as the ADA.',
    urgent: true,
    urgentNote:
      'Housing complaints have a filing deadline. Raise it early and ask an attorney about your dates.',
  },
};

/**
 * The agency that handles this kind of barrier.
 *
 * Total by construction: `ROUTES` is a complete record over
 * `BarrierCategory`, so a category added without a route is a compile
 * error. Anything unrecognised — an uncategorised row, a stale link —
 * falls to the DOJ, which is the correct general answer rather than a
 * blank space.
 */
export function routeForCategory(category: string | null | undefined): AgencyRoute {
  if (!category) return DOJ;
  return ROUTES[category as BarrierCategory] ?? DOJ;
}
