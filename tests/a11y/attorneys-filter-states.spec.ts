/**
 * attorneys-filter-states.spec.ts — verifies the thin-roster gate.
 *
 * Phase 2 of /plan thin-roster simplification adds a threshold-based
 * gate: when the approved-attorney network has fewer than 10 attorneys,
 * the filter UI on /attorneys is hidden; at 10 or more, it appears.
 *
 * This spec exercises both states by mocking /api/attorneys with
 * controlled total_approved counts. It also confirms the page passes
 * the same WCAG 2.2 AAA audit at each state (no serious or critical
 * violations) — the existing aaa-audit.spec.ts only runs against live
 * data, so this fills the gap for the over-threshold state.
 *
 * Acceptance criteria covered:
 *   #1 — under threshold (5 attorneys): no filter UI rendered
 *   #2 — at/over threshold (12 attorneys): filter UI rendered
 *   #4 — AAA audit passes at both states
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

test.describe('Attorneys filter visibility — thin-roster gate', () => {
  test('hides filter UI when total_approved is below threshold (5 < 10)', async ({
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

    // Filter UI must not be present.
    await expect(page.getByRole('group', { name: /filter/i })).toHaveCount(0);
    await expect(page.locator('fieldset')).toHaveCount(0);
    await expect(page.getByRole('combobox')).toHaveCount(0);
    await expect(page.getByRole('switch')).toHaveCount(0);

    // Cards must still render.
    await expect(page.getByRole('heading', { name: 'Mock Attorney 1' })).toBeVisible();

    // AAA audit at this state.
    const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    if (blocking.length > 0) {
      console.log(
        `\n[a11y] /attorneys (thin) — ${blocking.length} BLOCKING violation(s):`,
      );
      for (const v of blocking) {
        console.log(`  ✗ ${v.id} (${v.impact}): ${v.help}`);
      }
    }
    expect(
      blocking,
      'Thin-roster /attorneys has serious/critical accessibility violations.',
    ).toEqual([]);
  });

  test('shows filter UI when total_approved meets threshold (12 >= 10)', async ({
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
    await expect(page.getByRole('combobox')).toHaveCount(1); // State select
    // Practice-area chips render as switches; expect at least one.
    await expect(page.getByRole('switch').first()).toBeVisible();

    // Cards must render.
    await expect(page.getByRole('heading', { name: 'Mock Attorney 1' })).toBeVisible();

    // AAA audit at this state.
    const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    if (blocking.length > 0) {
      console.log(
        `\n[a11y] /attorneys (full) — ${blocking.length} BLOCKING violation(s):`,
      );
      for (const v of blocking) {
        console.log(`  ✗ ${v.id} (${v.impact}): ${v.help}`);
      }
    }
    expect(
      blocking,
      'Full-roster /attorneys has serious/critical accessibility violations.',
    ).toEqual([]);
  });
});
