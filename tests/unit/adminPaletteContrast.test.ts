/**
 * Admin chrome palette — every pair measured, none assumed.
 *
 * The admin shell is styled to Base44's anatomy because Gina has used
 * that tool daily for months and M8 deletes it. But four of B44's hexes
 * fail this project's 7:1 floor against their own backgrounds, so the
 * ported values are hue-preserved corrections rather than copies:
 *
 *   section labels  #64748B on #0F172A   3.75:1  ->  #98A4B5   7.07:1
 *   white on pill   #F97316               2.80:1  ->  #953F04   7.02:1
 *   topbar text     #64748B on white      4.76:1  ->  #4D5A6C   7.01:1
 *   topbar divider  #E2E8F0 on white      1.24:1  ->  #7F97B5   3.00:1
 *
 * #CBD5E1 nav-idle on #0F172A already measures 12.02:1 and is kept
 * verbatim — correcting a passing value would be drift, not rigor.
 *
 * This computes the ratios from the CSS rather than restating them, so
 * editing a hex in app.css and not the floor fails here instead of in
 * production. The failure this prevents is the one the landing hit
 * twice today: a token changed for visual reasons, and the contrast
 * consequence surfaced only when someone looked at a screenshot.
 *
 * Ref: /plan admin visual parity, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const css = readFileSync(resolve(root, 'src/app.css'), 'utf8');

/** Relative luminance per WCAG 2.x. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const parts = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = parts.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pull a custom property's value out of the .admin-shell block. */
function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  expect(match, `--${name} not found in app.css`).not.toBeNull();
  return match![1];
}

const SIDEBAR = '#0f172a';
const WHITE = '#ffffff';

describe('admin palette — text clears 7:1', () => {
  const cases: [string, () => number][] = [
    ['nav idle on sidebar', () => ratio(token('admin-nav-idle'), SIDEBAR)],
    ['section kicker on sidebar', () => ratio(token('admin-kicker'), SIDEBAR)],
    ['white on the active pill', () => ratio(WHITE, token('admin-nav-active-bg'))],
    ['topbar text on white', () => ratio(token('admin-topbar-text'), WHITE)],
  ];

  for (const [label, compute] of cases) {
    it(`${label} is AAA`, () => {
      const r = compute();
      expect(r, `${label} measured ${r.toFixed(2)}:1, needs 7:1`).toBeGreaterThanOrEqual(7);
    });
  }
});

describe('admin palette — non-text clears 3:1', () => {
  it('the topbar divider is visible', () => {
    // B44 uses #E2E8F0 here, which is 1.24:1 — invisible to anyone who
    // needs contrast, and below 1.4.11.
    const r = ratio(token('admin-topbar-border'), WHITE);
    expect(r, `divider measured ${r.toFixed(2)}:1, needs 3:1`).toBeGreaterThanOrEqual(3);
  });

  it('the brand accent is legible on the dark sidebar', () => {
    const r = ratio(token('admin-brand-accent'), SIDEBAR);
    expect(r).toBeGreaterThanOrEqual(3);
  });
});

describe('admin palette — stays scoped', () => {
  it('every admin token is declared inside .admin-shell', () => {
    const block = css.slice(css.indexOf('.admin-shell {'));
    for (const name of [
      'admin-sidebar-bg',
      'admin-nav-idle',
      'admin-nav-active-bg',
      'admin-kicker',
      'admin-page-bg',
      'admin-topbar-text',
    ]) {
      expect(block, `--${name} escaped the .admin-shell scope`).toContain(`--${name}:`);
    }
  });

  it('does not redefine consumer-site tokens', () => {
    const block = css.slice(
      css.indexOf('.admin-shell {'),
      css.indexOf('.admin-sidebar {'),
    );
    // The slate palette must not reach the warm consumer surface.
    expect(block).not.toMatch(/--color-accent-\d/);
    expect(block).not.toMatch(/--color-ink-\d/);
    expect(block).not.toMatch(/--color-surface-\d/);
  });
});
