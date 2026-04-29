/**
 * Glossary — single source of truth for acronyms and unusual terms
 * used across ADA Legal Link.
 *
 * Powers the /glossary route (the AAA 3.1.3 / 3.1.4 mechanism)
 * and is structured for future use by an inline <Abbr> component
 * if we choose to add per-occurrence markup later.
 *
 * Authoring guide:
 *   - term: the display string ("ADA", "Good faith")
 *   - expansion: full form for acronyms; null for non-abbreviation
 *     jargon. Used by <abbr title="..."> if/when wired inline.
 *   - definition: 1-3 plain-language sentences. Audience: a person
 *     reading their first ADA-related thing. Avoid jargon inside the
 *     definition itself — if you have to use a term that's also in
 *     the glossary, link via seeAlso.
 *   - seeAlso: slugs of related entries
 *
 * Slugs (object keys) are kebab-case, stable for URL deep-linking
 * via /glossary#slug.
 *
 * Round 3 AAA+COGA Group D, items #45 (D1) and #46 (D2).
 */

export interface GlossaryEntry {
  /** Display term (acronym or short label). */
  term: string;
  /** Full form if this is an abbreviation; null for jargon entries. */
  expansion: string | null;
  /** 1–3 sentence plain-language explanation. */
  definition: string;
  /** Slugs of related glossary entries. */
  seeAlso?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ─── Acronyms ──────────────────────────────────────────────────

  'ada': {
    term: 'ADA',
    expansion: 'Americans with Disabilities Act',
    definition:
      'The 1990 federal law that prohibits discrimination against people with disabilities in employment, government services, public accommodations, and telecommunications. The most important U.S. disability rights law.',
    seeAlso: ['title-i', 'title-ii', 'title-iii', 'doj'],
  },

  'aaa': {
    term: 'AAA',
    expansion: 'WCAG conformance level AAA',
    definition:
      'The highest of three conformance levels in the Web Content Accessibility Guidelines. ADA Legal Link targets AAA — stricter than the AA level most websites aim for.',
    seeAlso: ['wcag'],
  },

  'wcag': {
    term: 'WCAG',
    expansion: 'Web Content Accessibility Guidelines',
    definition:
      'The international standard for web accessibility, published by the World Wide Web Consortium (W3C). Used by U.S. courts and federal agencies as the technical reference for what "accessible" means online.',
    seeAlso: ['aaa', 'doj'],
  },

  'doj': {
    term: 'DOJ',
    expansion: 'U.S. Department of Justice',
    definition:
      'The federal agency that enforces the ADA in most situations — government services (Title II) and businesses open to the public (Title III). You can file an ADA complaint with the DOJ for free.',
    seeAlso: ['title-ii', 'title-iii', 'eeoc'],
  },

  'eeoc': {
    term: 'EEOC',
    expansion: 'Equal Employment Opportunity Commission',
    definition:
      'The federal agency that enforces the ADA at work (Title I). If a job application, hiring decision, or workplace situation discriminated against you because of a disability, the EEOC is where you file. There is a strict 180-day deadline (300 days in some states).',
    seeAlso: ['title-i', 'doj'],
  },

  'hud': {
    term: 'HUD',
    expansion: 'U.S. Department of Housing and Urban Development',
    definition:
      'The federal agency that enforces fair housing laws, including disability protections under the Fair Housing Act. If a landlord, condo board, or housing provider discriminated against you because of a disability, HUD is where you file. The deadline is one year from the discrimination.',
    seeAlso: ['fha'],
  },

  'fha': {
    term: 'FHA',
    expansion: 'Fair Housing Act',
    definition:
      'A federal law that prohibits housing discrimination, including against people with disabilities. It requires landlords to allow reasonable modifications and accommodations, and applies to most housing — apartments, condos, single-family rentals.',
    seeAlso: ['hud'],
  },

  'adaag': {
    term: 'ADAAG',
    expansion: 'ADA Accessibility Guidelines',
    definition:
      'The technical specifications for what "physically accessible" means under the ADA — measurements for ramps, doorways, parking, signage, restrooms, and so on. Now incorporated into the 2010 ADA Standards for Accessible Design.',
    seeAlso: ['title-iii'],
  },

  'fmla': {
    term: 'FMLA',
    expansion: 'Family and Medical Leave Act',
    definition:
      'A federal law giving eligible workers up to 12 weeks of unpaid, job-protected leave for a serious health condition (their own or a family member\'s). Often used alongside or after ADA accommodations at work.',
    seeAlso: ['title-i'],
  },

  'section-504': {
    term: 'Section 504',
    expansion: 'Section 504 of the Rehabilitation Act of 1973',
    definition:
      'The first federal civil rights law for people with disabilities. Applies to any program receiving federal funding — most schools, hospitals, and many social services. Often invoked alongside the ADA, especially in education contexts.',
    seeAlso: ['ada'],
  },

  'tty': {
    term: 'TTY',
    expansion: 'Text Telephone (also Teletypewriter or TDD)',
    definition:
      'A device that lets people who are deaf or hard of hearing communicate over the telephone by typing. Modern equivalents include relay services, video relay, and IP-based text communication. Some accessibility laws still reference TTYs by name.',
    seeAlso: ['vri'],
  },

  'vri': {
    term: 'VRI',
    expansion: 'Video Remote Interpreting',
    definition:
      'A sign-language interpreter joining via video call. Allowed under the ADA for some communications but not always — for medical or legal situations, an in-person interpreter is often required for "effective communication."',
    seeAlso: ['tty'],
  },

  // ─── Concepts (sub-divisions of major laws) ────────────────────

  'title-i': {
    term: 'Title I',
    expansion: 'ADA Title I — Employment',
    definition:
      'The part of the ADA covering jobs. Applies to employers with 15 or more employees. Requires reasonable accommodations and prohibits discrimination in hiring, firing, pay, and promotion. Enforced by the EEOC.',
    seeAlso: ['ada', 'eeoc'],
  },

  'title-ii': {
    term: 'Title II',
    expansion: 'ADA Title II — State and Local Government',
    definition:
      'The part of the ADA covering state and local government services — courts, schools, public transit, government buildings, police interactions. Requires program access and reasonable modifications. Enforced by the DOJ.',
    seeAlso: ['ada', 'doj'],
  },

  'title-iii': {
    term: 'Title III',
    expansion: 'ADA Title III — Public Accommodations',
    definition:
      'The part of the ADA covering businesses open to the public — restaurants, stores, hotels, doctors\' offices, gyms, theaters. Requires removing architectural barriers where readily achievable, and policy modifications where reasonable. Enforced by the DOJ and through private lawsuits.',
    seeAlso: ['ada', 'doj', 'adaag'],
  },

  // ─── Legal jargon ──────────────────────────────────────────────

  'reasonable-accommodation': {
    term: 'Reasonable accommodation',
    expansion: null,
    definition:
      'A change to a job, workplace, or service that lets a person with a disability participate equally — without imposing an "undue hardship" on the employer or business. Examples: a quiet workspace, a flexible schedule, a screen reader, a service animal exception. The exact accommodation is decided through an interactive conversation between the person and the employer or business.',
    seeAlso: ['undue-hardship', 'fundamental-alteration'],
  },

  'undue-hardship': {
    term: 'Undue hardship',
    expansion: null,
    definition:
      'The legal threshold an employer or business has to clear to refuse a reasonable accommodation. It means the accommodation would be very expensive, very disruptive, or fundamentally change what the business does. Hard to prove in court — most accommodations are not an undue hardship.',
    seeAlso: ['reasonable-accommodation'],
  },

  'fundamental-alteration': {
    term: 'Fundamental alteration',
    expansion: null,
    definition:
      'A change so significant it would alter the nature of a service or program. The ADA does not require fundamental alterations — but the bar is high. A wheelchair ramp at a restaurant is not a fundamental alteration; rewriting a college\'s entire curriculum probably would be.',
    seeAlso: ['reasonable-accommodation'],
  },

  'good-faith': {
    term: 'Good faith',
    expansion: null,
    definition:
      'Acting honestly, with genuine intent to do the right thing — not pretending or going through the motions. In ADA cases, employers and businesses are expected to engage in good faith when an accommodation is requested: actually listening, actually considering options, not just refusing on principle.',
  },

  'conflict-of-law': {
    term: 'Conflict-of-law principles',
    expansion: null,
    definition:
      'The rules courts use to figure out which state\'s law applies when a legal dispute spans multiple states. Mostly a procedural detail. When you see "without regard to conflict-of-law principles" in a contract, it means: this contract uses [State X] law no matter where you are or where the dispute happens.',
  },

  'effective-communication': {
    term: 'Effective communication',
    expansion: null,
    definition:
      'An ADA standard requiring government agencies and many businesses to make sure people with hearing, vision, or speech disabilities can understand and be understood. May require interpreters, written materials in alternate formats, captioning, or other auxiliary aids — depending on what the situation calls for.',
    seeAlso: ['title-ii', 'title-iii', 'vri'],
  },

  'readily-achievable': {
    term: 'Readily achievable',
    expansion: null,
    definition:
      'Something that can be done without much difficulty or expense. A Title III standard for older buildings — they have to remove barriers that are "readily achievable" to remove, even if they don\'t have to do a full renovation. The standard scales with the size of the business: a small bookstore and a national chain are held to different "readily achievable" thresholds.',
    seeAlso: ['title-iii'],
  },

  'place-of-public-accommodation': {
    term: 'Place of public accommodation',
    expansion: null,
    definition:
      'A business open to the general public — covered by Title III of the ADA. The list is in the law: restaurants, hotels, stores, theaters, doctors\' offices, banks, parks, schools, gyms, and so on. Private clubs and religious entities are usually not covered.',
    seeAlso: ['title-iii'],
  },
};

/** Return all entries sorted alphabetically by term. */
export function getSortedEntries(): Array<GlossaryEntry & { slug: string }> {
  return Object.entries(GLOSSARY)
    .map(([slug, entry]) => ({ slug, ...entry }))
    .sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase()));
}
