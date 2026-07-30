/**
 * The Spot price is written down in four places that cannot import from
 * each other: a client constant, the upsell payload the analyzer returns,
 * the amount checkout actually charges, and the amount the test-payment
 * path stamps on a simulated session.
 *
 * Drift between them is a money bug, not a copy bug — a page that says one
 * number while Stripe collects another. It also fails quietly, because each
 * file on its own looks correct. So this pins them together: change the
 * price and this test tells you which file you forgot.
 *
 * Historical rows keep whatever they were charged. This is about the price
 * being quoted and collected today, not the ledger.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SPOT_DEFAULT_PRICE_USD } from '../../src/lib/spot/spotOffer.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const expectedCents = SPOT_DEFAULT_PRICE_USD * 100;

describe('every Spot price source states the same number', () => {
  it('the analyzer upsell quotes the client-side price', () => {
    const src = read('api/spot/analyze.ts');
    const match = src.match(/price_usd:\s*(\d+)/);
    expect(match?.[1]).toBe(String(SPOT_DEFAULT_PRICE_USD));
  });

  it('the anchor sentence names that same price', () => {
    // The anchor is prose, so it can drift from the field right above it.
    const src = read('api/spot/analyze.ts');
    const match = src.match(/anchor:\s*'([^']+)'/);
    expect(match?.[1]).toContain(`$${SPOT_DEFAULT_PRICE_USD}.`);
  });

  it('checkout charges that price when no env override is set', () => {
    const src = read('api/spot/create-checkout.ts');
    const match = src.match(/SPOT_PRICE_CENTS\s*=[^;]*\|\|\s*(\d+)/);
    expect(match?.[1]).toBe(String(expectedCents));
  });

  it('the simulated payment stamps that price too', () => {
    const src = read('api/spot/simulate-payment.ts');
    const match = src.match(/TEST_AMOUNT_CENTS\s*=\s*(\d+)/);
    expect(match?.[1]).toBe(String(expectedCents));
  });

  it('no Spot source still says $79', () => {
    // The previous price. Named explicitly so a half-finished change is
    // caught even if the regexes above are satisfied by something else.
    for (const rel of [
      'src/lib/spot/spotOffer.ts',
      'src/app/routes/public/SpotLanding.tsx',
      'src/app/routes/public/spot/SpotIntro.tsx',
      'src/app/routes/admin/AdminSettings.tsx',
      'api/spot/analyze.ts',
      'api/spot/create-checkout.ts',
      'api/spot/simulate-payment.ts',
    ]) {
      expect(read(rel), rel).not.toMatch(/\$79\b|\b7900\b/);
    }
  });
});
