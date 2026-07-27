/**
 * Taxonomy Phase 5 — where to go when there is no contact.
 *
 * Twenty-six of thirty-nine cases have nobody to call. Ten of those are
 * not cases at all, they are barrier categories. Without this, filtering
 * to one of them and finding nothing is where a person's search ends.
 *
 * The government route is the floor: no case, no counsel, no class, and
 * anyone can still file. So it has to exist for every category, which is
 * why the test below loops the enum rather than listing routes by hand —
 * a category added later without a route fails here.
 *
 * Two rules matter more than the routing:
 *
 *   1. Filing a complaint is not representation, and it does not stop any
 *      clock. Someone who files, feels handled, and waits can lose their
 *      claim while the deadline runs. That warning travels with every
 *      route rather than being remembered at each call site.
 *
 *   2. We never state a deadline. Employment and air travel both have
 *      short hard limits, and a wrong date is worse than no date — same
 *      reason SOL is attorney-set and never computed.
 *
 * Ref: /plan litigation-taxonomy-and-contacts, Phase 5, AC7.
 */

import { describe, it, expect } from 'vitest';
import { BARRIER_CATEGORY_ORDER } from '@/app/lib/barrierCategories';
import {
  routeForCategory,
  COMPLAINT_IS_NOT_REPRESENTATION,
  STATE_PA_DIRECTORY,
} from '@/app/lib/governmentRoute';

describe('every category has somewhere to go', () => {
  it.each(BARRIER_CATEGORY_ORDER)('%s resolves to an agency', (category) => {
    const route = routeForCategory(category);
    expect(route).toBeTruthy();
    expect(route.agency.length).toBeGreaterThan(0);
    expect(route.url.startsWith('https://')).toBe(true);
    expect(route.what.length).toBeGreaterThan(0);
  });

  it('covers an uncategorised row rather than returning nothing', () => {
    // A row nobody has categorised still deserves a floor.
    const route = routeForCategory('unassigned');
    expect(route.agency).toContain('Justice');
  });

  it('covers a value it has never heard of', () => {
    expect(routeForCategory('something_invented').agency).toContain('Justice');
  });
});

describe('the route is not always the DOJ', () => {
  it('sends air travel to the DOT, because it is not an ADA matter', () => {
    const route = routeForCategory('air_travel');
    expect(route.agency).toContain('Transportation');
    expect(route.agency).not.toContain('Justice');
    // The law is different and the page has to say so, or someone files
    // the wrong complaint with the wrong agency.
    expect(route.law).toMatch(/Air Carrier Access Act/i);
    // Every airline must produce a resolution official on request — often
    // faster than any agency.
    expect(route.alsoTry).toMatch(/Complaints Resolution Official/i);
  });

  it('sends employment to the EEOC', () => {
    const route = routeForCategory('employment');
    expect(route.agency).toContain('Equal Employment');
    expect(route.agency).not.toContain('Justice');
  });

  it('sends both education categories to the Department of Education', () => {
    for (const c of ['education'] as const) {
      expect(routeForCategory(c).agency).toContain('Education');
    }
  });

  it('sends housing to HUD', () => {
    expect(routeForCategory('housing').agency).toContain('Housing');
  });

  it('sends everything else to the DOJ', () => {
    for (const c of ['sidewalks_streets', 'hotels_lodging', 'jails_prisons',
                     'websites_apps_kiosks', 'restaurants_stores_venues'] as const) {
      expect(routeForCategory(c).agency).toContain('Justice');
    }
  });
});

describe('urgency without stating a deadline', () => {
  it('flags the two categories with short hard limits', () => {
    expect(routeForCategory('employment').urgent).toBe(true);
    expect(routeForCategory('air_travel').urgent).toBe(true);
  });

  it('never states a number of days anywhere in any route', () => {
    // A wrong deadline is malpractice-shaped. Same discipline as SOL:
    // say it is urgent, let an attorney set the date.
    const fields = BARRIER_CATEGORY_ORDER.flatMap((c) => {
      const r = routeForCategory(c);
      return [r.what, r.law ?? '', r.alsoTry ?? '', r.agency];
    });
    for (const text of fields) {
      expect(text, `"${text}" states a deadline`).not.toMatch(/\b\d+\s*days?\b/i);
      expect(text).not.toMatch(/\b(180|300)\b/);
    }
  });

  it('says a deadline may apply without saying what it is', () => {
    const route = routeForCategory('employment');
    expect(route.urgentNote).toBeTruthy();
    expect(route.urgentNote!).toMatch(/deadline/i);
    expect(route.urgentNote!).not.toMatch(/\b\d+\s*days?\b/i);
  });
});

describe('the standing warnings', () => {
  it('says a complaint is neither representation nor a paused clock', () => {
    expect(COMPLAINT_IS_NOT_REPRESENTATION).toMatch(/not/i);
    expect(COMPLAINT_IS_NOT_REPRESENTATION).toMatch(/lawyer|represent/i);
    expect(COMPLAINT_IS_NOT_REPRESENTATION).toMatch(/deadline|clock|deadlines/i);
  });

  it('points at the protection and advocacy directory, which does take intake', () => {
    // The federal agency will not represent anyone. The state P&A might,
    // so the floor is the pair, not the agency alone.
    expect(STATE_PA_DIRECTORY.url).toContain('ndrn.org');
    expect(STATE_PA_DIRECTORY.what).toMatch(/free|intake|help/i);
  });
});
