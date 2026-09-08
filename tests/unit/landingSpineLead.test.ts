/**
 * Landing spine — Spot lead-in strip (/plan Spot lead-in, Phase 1).
 *
 * The page offered three doors in the hero (Spot, Ada, the Guide) and then,
 * one scroll down, said there were two ways forward with Spot in neither.
 * The fix is NOT a third card: "Three ways forward" would sit directly
 * above "The ADA protects you in three places", and two consecutive
 * three-card rows with different meanings read as the same three things.
 *
 * Spot is also not a peer of the other two. The Guide and Ada are
 * destinations; Spot is how you work out which one you need, and it feeds
 * Ada. So it ships as a lighter lead-in step above the grid, and the
 * heading stays honest at two.
 *
 * These assertions guard the hierarchy, which is the whole point of the
 * change and the thing most likely to erode in a later edit.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readCode } from '../support/sourceText.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SECTION = resolve(
  root,
  'src/app/routes/public/components/landing/TwoPathsSection.jsx',
);
const STYLES = resolve(
  root,
  'src/app/routes/public/components/landing/LandingV2Styles.jsx',
);

const source = () => readFileSync(SECTION, 'utf8');
const code = () => readCode(SECTION);

describe('Spot lead-in strip', () => {
  it('renders a Spot lead-in above the two-card grid (AC1)', () => {
    expect(source()).toContain('v2-spine-lead');
  });

  it('keeps the grid at two columns (AC1)', () => {
    // The strip exists precisely so this does not become repeat(3, 1fr).
    expect(source()).toContain("gridTemplateColumns: 'repeat(2, 1fr)'");
    expect(code()).not.toContain("repeat(3, 1fr)");
  });

  it('gives the strip no filled button (AC1)', () => {
    // A filled CTA would make it a third card by another name and
    // reintroduce exactly the problem this change exists to fix. The two
    // real cards keep their buttons; the strip gets an inline link.
    const lead = source().slice(source().indexOf('v2-spine-lead'));
    const strip = lead.slice(0, lead.indexOf('v2-spine-grid'));
    expect(strip).not.toContain('v2-btn-primary');
    expect(strip).not.toContain('v2-btn-ada');
  });

  it('leaves the heading at two ways forward (AC2)', () => {
    // Spot is a step, not a way forward. The count was never wrong —
    // Spot was just missing from the page.
    expect(source()).toContain('Two ways forward');
    expect(code()).not.toContain('Three ways forward');
  });

  it('links to /spot, matching the hero (AC4)', () => {
    const lead = source().slice(source().indexOf('v2-spine-lead'));
    const strip = lead.slice(0, lead.indexOf('v2-spine-grid'));
    expect(strip).toMatch(/to="\/spot"/);
  });

  it('gives the strip link a 44px target (AC3)', () => {
    const lead = source().slice(source().indexOf('v2-spine-lead'));
    const strip = lead.slice(0, lead.indexOf('v2-spine-grid'));
    expect(strip).toContain("minHeight: '44px'");
  });

  it('does not colour strip link text with var(--accent) (AC3)', () => {
    // --accent resolves to --color-accent-500, which the token notes say
    // fails 7:1. The existing card buttons get away with it because accent
    // is a BACKGROUND there with --page-bg text on top. Link text on
    // --page-bg-alt has no such cover, so it must come from an
    // accent-600-backed token instead.
    const lead = code().slice(code().indexOf('v2-spine-lead'));
    const strip = lead.slice(0, lead.indexOf('v2-spine-grid'));
    expect(strip).not.toMatch(/color:\s*'var\(--accent\)'/);
  });

  it('collapses the strip on narrow viewports (AC5)', () => {
    // An avatar + copy + link in a row is the classic narrow-viewport
    // overflow. .v2-spine-grid already has a rule at this breakpoint;
    // the strip needs its own beside it.
    expect(readFileSync(STYLES, 'utf8')).toContain('.v2-spine-lead');
  });
});
