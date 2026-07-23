/**
 * M4 Phase 1 — AttorneyCard public-field guard.
 *
 * Base44's card carries a header comment listing the fields it must
 * never render: phone (stale — see below), bar_numbers, account_status,
 * subscription_status, stripe fields, marketplace_rules_accepted,
 * flagged, flag_reason, admin_notes, admin_rating. A comment is not a
 * mechanism. This is.
 *
 * Two layers protect the same rule: PublicAttorneyRow structurally
 * omits every forbidden field, so rendering one is a compile error;
 * and this guard catches the case where someone widens the type or
 * reaches around it with a cast.
 *
 * ON PHONE: B44's comment says never render it, and B44's card renders
 * it anyway, and the endpoint has returned it in its public contract
 * throughout. The comment is stale, not the code. We match what the
 * live site actually shows; if phone should come out it comes out of
 * the endpoint too, and that is an endpoint decision, not a card one.
 *
 * Absence assertions use readCode — the card's own header comment
 * discusses the forbidden fields by name, so matching raw source would
 * fire on the explanation.
 *
 * Ref: /plan M4 Phase 1, AC3.
 */

import { describe, it, expect } from 'vitest';
import { readCode, readSource } from '../support/sourceText.js';

const CARD = 'src/app/components/attorneys/AttorneyCard.tsx';
const TYPES = 'src/app/lib/attorneyTypes.ts';
const code = readCode(CARD);
const source = readSource(CARD);

describe('AttorneyCard — never renders non-public fields', () => {
  it('references no admin or billing field', () => {
    for (const field of [
      'bar_number',
      'barNumber',
      'account_status',
      'subscription_status',
      'stripe',
      'marketplace_rules_accepted',
      'flag_reason',
      'admin_notes',
      'admin_rating',
    ]) {
      expect(code, `forbidden field referenced: ${field}`).not.toContain(field);
    }
  });

  it('does not render the row status', () => {
    // status is how an attorney is approved/suspended. The endpoint
    // filters to approved, so surfacing it would be both redundant and
    // a disclosure of moderation state.
    expect(code).not.toMatch(/attorney\.status/);
  });

  it('keeps those fields off the public type too', () => {
    const types = readCode(TYPES);
    for (const field of ['bar_number', 'admin_notes', 'admin_rating', 'flagged']) {
      expect(types, `forbidden field typed as public: ${field}`).not.toContain(
        `${field}:`,
      );
    }
  });
});

describe('AttorneyCard — B44 anatomy is present', () => {
  it('renders the sections B44 renders', () => {
    for (const marker of ['Licensed in', 'Practice areas', 'Visit website']) {
      expect(source, `B44 section missing: ${marker}`).toContain(marker);
    }
  });

  it('names the attorney in every contact aria-label', () => {
    // A bare "Email" link is useless in a screen-reader link list when
    // the page has one per attorney.
    for (const label of ['Visit ${attorney.name}', 'Email ${attorney.name}', 'Call ${attorney.name}']) {
      expect(source, `aria-label missing the attorney name: ${label}`).toContain(label);
    }
  });

  it('routes every render decision through the tested mapper', () => {
    // The sparse-row behaviour is pinned in attorneyCardFields.test.ts.
    // Inline truthiness checks in the JSX would escape that coverage.
    expect(code).toContain('toCardFields');
    for (const flag of ['showLocation', 'showChips', 'showStates', 'showBio', 'showContact']) {
      expect(code, `render decision not sourced from the mapper: ${flag}`).toContain(flag);
    }
  });

  it('opens external links safely', () => {
    expect(code).toContain('rel="noopener noreferrer"');
    expect(code).toContain('target="_blank"');
  });
});

/**
 * M4 Phase 2 — the page keeps the data layer B44 has no equivalent of.
 *
 * The plan's risk register named exactly one way this milestone could
 * go wrong: a "faithful port" of B44's page deletes useAttorneys and
 * with it the facets endpoint, the debounced server-side filtering,
 * and the thin-roster gate — because B44 fetches the whole roster once
 * and filters it in memory, and matching that would look like fidelity.
 *
 * That is the same shape M2 caught on the guide shells and M3 caught on
 * the lawsuit detail page. Third time it gets a test.
 */
describe('Attorneys page — ahead-of-B44 data layer survives', () => {
  const PAGE = 'src/app/routes/public/Attorneys.tsx';
  const pageCode = readCode(PAGE);

  // NOTE: these assert on CALL SITES, not bare identifiers. An earlier
  // version checked `toContain('shouldShowFilters')`, which the import
  // line satisfied on its own — deleting the actual call left the guard
  // green. Caught by mutation-checking it; a guard that cannot fail is
  // worse than no guard, because it reads as coverage.
  it('still routes its data through useAttorneys', () => {
    expect(pageCode, 'the facets + debounce + server-filter layer was dropped').toMatch(
      /useAttorneys\(\)/,
    );
  });

  it('still gates the filter UI on the thin-roster threshold', () => {
    expect(pageCode, 'thin-roster gate no longer consulted').toMatch(
      /shouldShowFilters\(\s*totalApproved\s*\)/,
    );
  });

  it('still applies the client-side search filter', () => {
    expect(pageCode).toMatch(/filterAttorneys\(/);
  });

  it('does not fetch /api/attorneys directly, bypassing the hook', () => {
    // A direct fetch here would silently strip the debounce and the
    // facets call while still appearing to work.
    expect(pageCode).not.toMatch(/fetch\(\s*['"`]\/api\/attorneys/);
  });

  it('renders the ported card, not an inline one', () => {
    // The old page declared its own AttorneyCard at the bottom of the
    // file. That is the thing this milestone replaces.
    expect(pageCode).toContain('AttorneyCard');
    expect(pageCode, 'card re-declared inline instead of imported').not.toMatch(
      /function AttorneyCard/,
    );
  });
});
