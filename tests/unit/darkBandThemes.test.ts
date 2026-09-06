/**
 * Dark-band palette — per-display-mode completeness guard.
 *
 * Eight components paint a full-width dark band (the Standards Guide hero,
 * the landing hero / story / trust / final-CTA, Community Voices, the guide
 * report CTA, and GuideLegalOptions). They all paint through the `--dark-*`
 * token family in app.css.
 *
 * That family originally carried ONE set of navy literals and was deliberately
 * not tied to `[data-display]` — the band stayed navy in every display mode.
 * That was fine as Base44 visual parity and wrong as accessibility: a user who
 * selects Low Vision (gold on pure black) got the largest heading on the page
 * served in the palette they just told us they can't read, with no signal that
 * the setting had applied at all. The site's own axe pass never caught it,
 * because contrast INSIDE the band is fine — nothing asserted the band
 * responds to the mode.
 *
 * So the family is now themed per mode, the same shape as `--dx-*`
 * (diagramDarkModes.test.ts) and `--sg-cat-*`. This test guards the invariant
 * that made the original bug possible: EVERY token in the family must be
 * overridden in EVERY dark-canvas mode. A token that gets an override in two
 * modes and is forgotten in the third is the silent-drop shape — it reverts to
 * navy in exactly one mode and nothing else notices.
 *
 * Warm is deliberately NOT asserted here. Warm is a light cream canvas and
 * whether the band stays dark inside it is an open design decision (/plan
 * phase 3). When that lands, add 'warm' to MODES and this test covers it.
 *
 * Per-mode contrast of the resolved values is the rendered-contrast a11y
 * harness's job (tests/a11y/aaa-audit.spec.ts), not this file's.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_CSS = resolve(__dirname, '../../src/app.css');
const css = readFileSync(APP_CSS, 'utf8');

/** Every token in the dark-band family. Declared once at :root, overridden per mode. */
const DARK_BAND_TOKENS = [
  '--dark-bg',
  '--dark-bg-alt',
  '--dark-bg-deep',
  '--dark-bg-footer',
  '--dark-card-bg',
  '--dark-card-border',
  '--dark-border',
  '--dark-heading',
  '--dark-body',
  '--dark-body-secondary',
  '--dark-muted',
  '--dark-label',
  '--dark-highlight',
] as const;

/**
 * Every mode that overrides the band. Default is the base declaration, not an
 * override, so it is not listed.
 *
 * Warm was excluded while its treatment was undecided. It is now settled: the
 * band goes deep espresso rather than staying navy, so warm is enforced here
 * like every other mode. That also retires the `warm-keep-dark` class, which
 * was applied to seven components and defined in no stylesheet — it never did
 * anything, and now there is nothing for it to mean.
 */
const MODES = ['dark', 'contrast', 'low-vision', 'warm'] as const;

/**
 * app.css declares several separate `:root[data-display="X"]` blocks per mode
 * (palette, page-bg-alt, category hues, ...). Concatenate every block body for
 * a mode so a token declared in any of them counts.
 *
 * The trailing `\s*\{` matters: there are also DESCENDANT rules of the form
 * `:root[data-display="warm"] .lawyer-workspace { … }`, which reset the
 * attorney portal to a slate scale. A plain substring match swallows those
 * and reads portal values as if they were band values — which is exactly what
 * happened, and it reported the portal's slate heading as the band reusing
 * the default navy.
 */
function modeBlocks(mode: string): string {
  const re = new RegExp(`:root\\[data-display="${mode}"\\]\\s*\\{([^}]*)\\}`, 'g');
  return [...css.matchAll(re)].map((m) => m[1]).join('\n');
}

/**
 * Match a declaration of exactly this token — `--dark-bg:` must not be
 * satisfied by `--dark-bg-alt:`. Anchors on the colon.
 */
function declares(block: string, token: string): boolean {
  return new RegExp(`${token}\\s*:`).test(block);
}

describe('dark-band palette (per-mode completeness)', () => {
  it('app.css declares the full --dark-* family at :root', () => {
    for (const token of DARK_BAND_TOKENS) {
      expect(declares(css, token), `app.css never declares ${token}`).toBe(true);
    }
  });

  it('finds a real block for every dark-canvas mode (guards a vacuous pass)', () => {
    // If the selector shape ever changes, the per-token checks below would
    // pass against empty strings and assert nothing.
    for (const mode of MODES) {
      expect(
        modeBlocks(mode).length,
        `no :root[data-display="${mode}"] block found in app.css`,
      ).toBeGreaterThan(0);
    }
  });

  for (const mode of MODES) {
    it(`overrides every --dark-* token in ${mode} mode`, () => {
      const block = modeBlocks(mode);
      const missing = DARK_BAND_TOKENS.filter((t) => !declares(block, t));
      expect(
        missing,
        `${mode} mode does not override: ${missing.join(', ')}. An un-overridden ` +
          `token keeps its default navy literal, so the band ignores the user's ` +
          `display mode for that one property.`,
      ).toEqual([]);
    });
  }

  it('the dead warm-keep-dark class is gone from every component', () => {
    // It was applied to seven components and declared in no stylesheet, so it
    // never had an effect. It existed to say "in warm, keep this dark" -- a
    // rule the tokens now express properly.
    const survivors = readdirSync(resolve(__dirname, '../../src/app'), {
      recursive: true,
      encoding: 'utf8',
    })
      .filter((f) => /\.(jsx|tsx)$/.test(f))
      .filter((f) =>
        readFileSync(resolve(__dirname, '../../src/app', f), 'utf8').includes('warm-keep-dark'),
      );
    expect(survivors, 'warm-keep-dark is a no-op class; the tokens replace it').toEqual([]);
  });

  it('no mode reuses the default navy band background', () => {
    // #1E293B is the Default-mode band. If it shows up inside a dark-canvas
    // mode block, the override was copy-pasted rather than re-themed.
    for (const mode of MODES) {
      expect(
        /#1E293B/i.test(modeBlocks(mode)),
        `${mode} mode reuses the default navy #1E293B`,
      ).toBe(false);
    }
  });
});

/**
 * The surface tokens the band's own furniture paints through — card fills,
 * edges, buttons, hairlines, the carousel dot, the two decorative glows.
 *
 * These were written straight into the components as translucent white
 * (rgba(255,255,255,0.04) and friends). Translucent white works on the navy
 * and dark bands and fails completely on the pure-black ones: at 4% alpha a
 * chip on #000 has no visible fill and no visible edge, so the furniture
 * disappears in exactly the two modes a low-vision reader would pick. Both
 * of those modes already flatten transparency everywhere else on the site;
 * the band was the last place still using it.
 */
const GLASS_TOKENS = [
  '--dark-glass-bg',
  '--dark-glass-border',
  '--dark-glass-btn',
  '--dark-glass-btn-border',
  '--dark-glass-btn-hover',
  '--dark-hairline',
  '--dark-dot-idle',
  '--dark-glow-warm',
  '--dark-glow-deep',
  // The search block's own surfaces (phase 2 of the search-block plan).
  '--dark-input-border',
  '--dark-input-border-hover',
  '--dark-focus-ring',
  '--dark-chip-hover-bg',
  '--dark-chip-hover-border',
  '--dark-chip-hover-text',
] as const;

/**
 * Band components converted off written-in colour values, one phase at a
 * time. Phase 2 adds CommunityVoices.jsx; phase 3 adds HeroV2.jsx and
 * LandingV2Styles.jsx. The list is the contract — a file joins it only once
 * it is actually clean, so the checks below can never vacuously pass on a
 * file nobody has converted yet.
 */
const CONVERTED = ['src/app/components/standards/landing/StandardsHero.jsx'];

const REPO_ROOT = resolve(__dirname, '../..');

describe('dark-band surfaces (converted components)', () => {
  it('has converted files to check (guards against a silent empty pass)', () => {
    expect(CONVERTED.length).toBeGreaterThan(0);
  });

  it('app.css defines the full glass token set', () => {
    for (const token of GLASS_TOKENS) {
      expect(declares(css, token), `app.css never declares ${token}`).toBe(true);
    }
  });

  for (const mode of MODES) {
    it(`overrides every glass token in ${mode} mode`, () => {
      const block = modeBlocks(mode);
      const missing = GLASS_TOKENS.filter((t) => !declares(block, t));
      expect(missing, `${mode} mode does not override: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('converted components carry no written-in colour values', () => {
    const offenders: string[] = [];
    for (const file of CONVERTED) {
      const src = readFileSync(resolve(REPO_ROOT, file), 'utf8');
      const found = [
        ...(src.match(/rgba?\([^)]*\)/g) ?? []),
        ...(src.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []),
      ];
      if (found.length) offenders.push(`${file}: ${[...new Set(found)].join(', ')}`);
    }
    expect(
      offenders,
      'a written-in colour ignores the display-mode override — it must go ' +
        'through a token instead',
    ).toEqual([]);
  });

  it('every custom property a converted component asks for is actually defined', () => {
    // Two dead references have surfaced in two consecutive passes: the
    // `warm-keep-dark` class with no rule, and `--glass-border` with no
    // declaration (an unknown custom property invalidates the whole
    // declaration, so that border silently does not render). Neither was
    // caught by a build, a type check, or the axe pass. This is the guard.
    const landingStyles = readFileSync(
      resolve(REPO_ROOT, 'src/app/routes/public/components/landing/LandingV2Styles.jsx'),
      'utf8',
    );
    const undefinedRefs: string[] = [];
    for (const file of CONVERTED) {
      const src = readFileSync(resolve(REPO_ROOT, file), 'utf8');
      for (const match of src.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
        const name = match[1];
        // A property is defined if app.css declares it, the v2 landing style
        // block declares it, or the component sets it on itself inline.
        const defined =
          declares(css, name) || declares(landingStyles, name) || declares(src, name);
        if (!defined) undefinedRefs.push(`${file}: ${name}`);
      }
    }
    expect(
      [...new Set(undefinedRefs)],
      'an undefined custom property invalidates its whole declaration, so the ' +
        'property it was meant to set silently does not apply',
    ).toEqual([]);
  });
});
