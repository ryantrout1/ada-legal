/**
 * M5 Phase 1 — landing-v2 port guard.
 *
 * The homepage is the site's front door and the highest-traffic page
 * we have. This pins the things a later edit could quietly break:
 * that all nine B44 components are actually composed, that no Base44
 * SDK reference or Supabase-hosted asset survived the port, and that
 * the accessibility affordances B44 built into the landing are still
 * there.
 *
 * The Supabase assertion is not hypothetical. M1 recorded that "the
 * repo carries zero Supabase URLs"; it does not — StandardsHero.jsx
 * still renders a watermark logo straight from Base44 storage, which
 * will 404 the day the app is unpublished at M8. That claim went
 * unchecked because nothing tested it. This tests it for the landing.
 *
 * Absence assertions use readCode: several of these files carry header
 * comments naming what they diverge from, so matching raw source would
 * fire on the explanation.
 *
 * Ref: /plan M5 Phase 1, AC1.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readCode, readSource } from '../support/sourceText.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LANDING_DIR = 'src/app/routes/public/components/landing';
const HOME = 'src/app/routes/public/Home.tsx';

const COMPONENTS = [
  'LandingV2Styles',
  'AdaSoonModal',
  'HeroV2',
  'TwoPathsSection',
  'ThreeTitlesV2',
  'ScopeSection',
  'TrustV2',
  'StoryV2',
  'FinalCtaV2',
];

const homeCode = readCode(HOME);
const landingFiles = readdirSync(resolve(root, LANDING_DIR)).filter((f) =>
  f.endsWith('.jsx'),
);

describe('landing-v2 — the suite is complete and composed', () => {
  it('ships all nine B44 components', () => {
    for (const name of COMPONENTS) {
      expect(
        existsSync(resolve(root, LANDING_DIR, `${name}.jsx`)),
        `landing component missing: ${name}`,
      ).toBe(true);
    }
    expect(landingFiles).toHaveLength(9);
  });

  it('composes all seven sections on the page, in B44 order', () => {
    const order = [
      'HeroV2',
      'TwoPathsSection',
      'ThreeTitlesV2',
      'ScopeSection',
      'TrustV2',
      'StoryV2',
      'FinalCtaV2',
    ];
    let cursor = -1;
    for (const name of order) {
      const idx = homeCode.indexOf(`<${name} />`);
      expect(idx, `section not rendered: ${name}`).toBeGreaterThan(-1);
      expect(idx, `section out of B44 order: ${name}`).toBeGreaterThan(cursor);
      cursor = idx;
    }
  });

  it('wraps the sections in the AdaSoon provider and the v2 style scope', () => {
    // AdaSoonModal is a context provider — the CTAs inside call useAdaSoon.
    // Without the provider the hero's primary button throws on click.
    expect(homeCode).toContain('AdaSoonProvider');
    expect(homeCode).toContain('LandingV2Styles');
    expect(homeCode).toContain('home-v2-root');
  });
});

describe('landing-v2 — nothing Base44 survived the port', () => {
  it('references no Base44 SDK', () => {
    for (const file of landingFiles) {
      const code = readCode(`${LANDING_DIR}/${file}`);
      expect(code, `Base44 SDK reference in ${file}`).not.toContain('base44');
    }
    expect(homeCode).not.toContain('base44');
  });

  it('loads no asset from Base44 storage', () => {
    // The homepage must not depend on infrastructure being decommissioned
    // at M8. A Supabase-hosted image here 404s the day Base44 is
    // unpublished, on the site's front door.
    for (const file of landingFiles) {
      const code = readCode(`${LANDING_DIR}/${file}`);
      expect(code, `Supabase-hosted asset in ${file}`).not.toContain('supabase');
    }
  });

  it('uses real routes, not Base44 flat page names', () => {
    for (const file of landingFiles) {
      const code = readCode(`${LANDING_DIR}/${file}`);
      expect(code, `createPageUrl left in ${file}`).not.toContain('createPageUrl');
    }
  });

  it('does not carry B44\u2019s consumer-auth redirect', () => {
    // HomeV2 gated render on base44.auth.me() and redirected logged-in
    // users. There is no consumer identity here, so the branch is dead —
    // porting it would have left the homepage blocked on a call that
    // always throws.
    expect(homeCode).not.toContain('auth.me');
    expect(homeCode).not.toContain('MyCases');
    expect(homeCode).not.toContain('AdminDashboard');
  });
});

describe('landing-v2 — accessibility affordances survived', () => {
  it('keeps the reduced-motion and contrast media queries', () => {
    const styles = readSource(`${LANDING_DIR}/LandingV2Styles.jsx`);
    expect(styles, 'reduced-motion escape hatch dropped').toContain(
      'prefers-reduced-motion',
    );
    expect(styles, 'high-contrast border bump dropped').toContain(
      'prefers-contrast',
    );
  });

  it('keeps focus-visible outlines on every button class', () => {
    const styles = readSource(`${LANDING_DIR}/LandingV2Styles.jsx`);
    for (const cls of ['v2-btn-primary', 'v2-btn-secondary', 'v2-btn-ghost', 'v2-btn-ada']) {
      expect(styles, `focus-visible rule missing for .${cls}`).toContain(
        `.${cls}:focus-visible`,
      );
    }
  });

  it('keeps the labelled landmark headings', () => {
    for (const file of ['HeroV2', 'StoryV2']) {
      const src = readSource(`${LANDING_DIR}/${file}.jsx`);
      expect(src, `aria-labelledby dropped from ${file}`).toContain('aria-labelledby');
    }
  });
});

describe('landing-v2 — the founder photo is an honest empty state', () => {
  it('does not render a broken image while the asset is missing', () => {
    const code = readCode(`${LANDING_DIR}/StoryV2.jsx`);
    expect(code).toContain('STORY_PHOTO_AVAILABLE');
    // Guarded render, not an unconditional <img> pointed at a 404.
    expect(code).toMatch(/STORY_PHOTO_AVAILABLE\s*&&/);
  });

  it('points at a local path, not external storage', () => {
    const code = readCode(`${LANDING_DIR}/StoryV2.jsx`);
    expect(code).toContain("'/brand/gina-story.png'");
  });
});
