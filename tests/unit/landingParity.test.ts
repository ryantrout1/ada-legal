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

  it('wraps the sections in the v2 style scope', () => {
    expect(homeCode).toContain('LandingV2Styles');
    expect(homeCode).toContain('home-v2-root');
  });

  it('gets the AdaSoon provider from the layout, not its own copy', () => {
    // It lived in Home until 2026-07-29, which meant the standards guide
    // could not open the same notice. Lifting it to PublicLayout gives
    // every public page one modal; a second copy here would give the home
    // page its own and quietly diverge.
    const layout = readCode('src/app/layouts/PublicLayout.tsx');
    expect(layout).toContain('AdaSoonProvider');
    expect(homeCode).not.toContain('AdaSoonProvider');
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

describe('landing-v2 — the founder photo', () => {
  it('stays a guarded render, so the next missing asset is not a broken image', () => {
    // The photo landed 2026-07-29 and the guard stays. It is what turned
    // "no asset yet" into a deliberate empty state rather than a 404 in a
    // frame, and the next photo swapped in here gets the same protection.
    const code = readCode(`${LANDING_DIR}/StoryV2.jsx`);
    expect(code).toContain('STORY_PHOTO_AVAILABLE');
    expect(code).toMatch(/STORY_PHOTO_AVAILABLE\s*&&/);
  });

  it('points at a local path, not external storage', () => {
    // Pinned the filename until 2026-07-29, which made changing the format
    // fail a test that was never about the extension. What matters is that
    // the founder photo ships from this repo rather than someone's CDN
    // that can rot or start charging.
    const code = readCode(`${LANDING_DIR}/StoryV2.jsx`);
    expect(code).toMatch(/const STORY_PHOTO_SRC = '\/brand\/[^']+'/);
    expect(code).not.toMatch(/STORY_PHOTO_SRC = '(https?:)?\/\//);
  });

  it('describes what is in the picture, not just who is in it', () => {
    // On a site about access, the alt text on the founder photo is not a
    // formality. Someone reading with a screen reader should get the
    // lawsuits and the pitchfork too, not just a name.
    const code = readCode(`${LANDING_DIR}/StoryV2.jsx`);
    const alt = code.match(/alt="([^"]+)"/)?.[1] ?? '';
    expect(alt.length, 'alt text is too short to describe anything').toBeGreaterThan(60);
    expect(alt).toContain('Gina Schuh');
  });

  it('reserves the space so the text below does not jump when it loads', () => {
    const code = readCode(`${LANDING_DIR}/StoryV2.jsx`);
    expect(code).toContain('width="546"');
    expect(code).toContain('height="683"');
  });
});
