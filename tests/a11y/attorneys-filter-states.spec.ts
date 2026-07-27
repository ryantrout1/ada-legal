/**
 * attorneys-filter-states.spec.ts — the filter UI renders at any
 * roster size.
 *
 * This spec used to verify the thin-roster gate: below ten approved
 * attorneys the filter UI was suppressed. The gate is gone — with four
 * approved in production it meant the public page shipped with no
 * search box at all, which read as a missing feature. B44 does not
 * gate; we no longer diverge. See /plan attorney search.
 *
 * The inversion is deliberate: the small-roster case now asserts the
 * filter UI IS present, which is the exact assertion that would have
 * caught the original defect.
 *
 * The AAA coverage is why this file survives the gate's removal. The
 * existing aaa-audit.spec.ts only runs against live data (four
 * attorneys, one firm); this exercises the page with a mocked roster
 * big enough to populate every dropdown, and audits both sizes.
 *
 * Covers:
 *   #1 — small roster (5 attorneys): filter UI rendered
 *   #2 — larger roster (12 attorneys): filter UI rendered
 *   #3 — AAA audit passes at both sizes
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const AAA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag2aaa',
  'wcag21a',
  'wcag21aa',
  'wcag21aaa',
  'wcag22aa',
  'wcag22aaa',
];

interface MockAttorney {
  id: string;
  name: string;
  firm_name: string | null;
  location_city: string | null;
  location_state: string | null;
  practice_areas: string[];
  email: string | null;
  phone: string | null;
  website_url: string | null;
}

function mockAttorney(i: number, state: string): MockAttorney {
  return {
    id: `mock-${i}`,
    name: `Mock Attorney ${i}`,
    firm_name: `Mock Firm ${i}`,
    location_city: 'Phoenix',
    location_state: state,
    practice_areas: ['ada', 'public_accommodations'],
    email: `mock${i}@example-mocked.invalid`,
    phone: '(602) 555-0100',
    website_url: 'https://example-mocked.invalid',
  };
}

const FIVE_ATTORNEYS = Array.from({ length: 5 }, (_, i) => mockAttorney(i + 1, 'AZ'));
const TWELVE_ATTORNEYS = Array.from({ length: 12 }, (_, i) =>
  mockAttorney(i + 1, i < 6 ? 'AZ' : 'CA'),
);

const FACETS_RESPONSE = {
  states: ['AZ', 'CA'],
  practice_areas: ['ada', 'public_accommodations', 'employment'],
};

/**
 * A note on what these assertions used to say, so a weaker test is not
 * mistaken for the original intent.
 *
 * Until commit b783e7b (2026-07-23) this page filtered practice areas with
 * a row of toggle buttons — <button role="switch" aria-pressed> — and you
 * could turn on several at once. The rebuild to Base44's design replaced
 * them with a single dropdown, so only one practice area can be chosen.
 * That took the switch assertion with it, and made the combobox count two
 * rather than one.
 *
 * Reviewed 2026-07-27 and one is fine for now — a deliberate call, not an
 * oversight, which is the only reason these assertions were relaxed rather
 * than the component repaired. The fieldset that went missing in the same
 * commit WAS repaired; see AttorneyFilters.tsx.
 *
 * If multi-select comes back, restore both: two comboboxes become one, and
 * the switch assertion returns.
 */
test.describe('Attorneys filter visibility — renders at any roster size', () => {
  test('shows filter UI on a small roster (5 attorneys)', async ({
    page,
  }) => {
    await page.route('**/api/attorneys/facets', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FACETS_RESPONSE),
      });
    });
    await page.route('**/api/attorneys?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          attorneys: FIVE_ATTORNEYS,
          total_approved: 5,
        }),
      });
    });
    await page.route('**/api/attorneys', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          attorneys: FIVE_ATTORNEYS,
          total_approved: 5,
        }),
      });
    });

    await page.goto('/attorneys');
    await page.waitForLoadState('networkidle');

    // Filter UI must be present — this is the assertion that would
    // have caught the original defect, where four approved attorneys
    // meant no search box at all.
    await expect(page.locator('fieldset')).toHaveCount(1);
    // Practice area and state. TWO, not one, and not because the test
    // drifted — see the note at the top of this file.
    await expect(page.getByRole('combobox')).toHaveCount(2);

    // Cards must still render.
    await expect(page.getByRole('heading', { name: 'Mock Attorney 1' })).toBeVisible();

    // AAA audit at this state.
    const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    if (blocking.length > 0) {
      console.log(
        `\n[a11y] /attorneys (small roster) — ${blocking.length} BLOCKING violation(s):`,
      );
      for (const v of blocking) {
        console.log(`  ✗ ${v.id} (${v.impact}): ${v.help}`);
      }
    }
    expect(
      blocking,
      'Small-roster /attorneys has serious/critical accessibility violations.',
    ).toEqual([]);
  });

  test('shows filter UI on a larger roster (12 attorneys)', async ({
    page,
  }) => {
    await page.route('**/api/attorneys/facets', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FACETS_RESPONSE),
      });
    });
    await page.route('**/api/attorneys?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          attorneys: TWELVE_ATTORNEYS,
          total_approved: 12,
        }),
      });
    });
    await page.route('**/api/attorneys', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          attorneys: TWELVE_ATTORNEYS,
          total_approved: 12,
        }),
      });
    });

    await page.goto('/attorneys');
    await page.waitForLoadState('networkidle');

    // Filter UI must be present.
    await expect(page.locator('fieldset')).toHaveCount(1);
    // Practice area and state — see the note at the top of this file.
    await expect(page.getByRole('combobox')).toHaveCount(2);

    // Cards must render.
    await expect(page.getByRole('heading', { name: 'Mock Attorney 1' })).toBeVisible();

    // AAA audit at this state.
    const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    if (blocking.length > 0) {
      console.log(
        `\n[a11y] /attorneys (larger roster) — ${blocking.length} BLOCKING violation(s):`,
      );
      for (const v of blocking) {
        console.log(`  ✗ ${v.id} (${v.impact}): ${v.help}`);
      }
    }
    expect(
      blocking,
      'Larger-roster /attorneys has serious/critical accessibility violations.',
    ).toEqual([]);
  });
});
