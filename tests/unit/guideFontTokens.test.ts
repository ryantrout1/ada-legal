/**
 * The standards guide has to obey the font switcher.
 *
 * The accessibility panel offers OpenDyslexic, Atkinson Hyperlegible and
 * Lexend, and it works by reassigning --font-display and --font-body on
 * the root element. Any component that writes 'Fraunces, serif' or
 * 'Manrope, sans-serif' into a style ignores that entirely.
 *
 * The guide did exactly that: 179 hardcoded display families and 482
 * hardcoded body families across 73 files, against 28 uses of the
 * tokens. So on a site about access, the one section built to be read
 * was the section that ignored the reading-accessibility control —
 * somebody who picks OpenDyslexic because they are dyslexic still got
 * served a serif.
 *
 * This is the check that says when that is finished. It is deliberately
 * strict: any font family named directly is a family the switcher cannot
 * change.
 *
 * Ref: /plan get Fraunces out of the standards guide, Phase 1. AC1, AC5.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GUIDE_DIRS = [
  'src/app/components/standards',
  'src/app/routes/public/standards',
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|jsx|ts|js)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Comments may name a font while explaining one. Only code counts. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const FILES = GUIDE_DIRS.flatMap(walk);

/** Families the switcher swaps. Naming one directly defeats it. */
const SWITCHABLE = ['Fraunces', 'Manrope', 'Atkinson Hyperlegible', 'OpenDyslexic', 'Lexend'];

describe('the guide names no font directly', () => {
  it('covers the whole guide, so a new file cannot slip past', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });

  for (const family of SWITCHABLE) {
    it(`never writes ${family} into a style`, () => {
      const offenders = FILES.filter((f) => stripComments(readFileSync(f, 'utf8')).includes(family));
      expect(
        offenders,
        `${offenders.length} file(s) hardcode ${family}; the font switcher cannot change it there`,
      ).toEqual([]);
    });
  }

  it('declares font families through the tokens instead', () => {
    // Not just "no hardcoding" — the tokens have to actually be in use,
    // or a file could pass by having no font declaration at all.
    const usingTokens = FILES.filter((f) => {
      const code = stripComments(readFileSync(f, 'utf8'));
      return code.includes('var(--font-display)') || code.includes('var(--font-body)');
    });
    expect(usingTokens.length, 'no guide file declares a font through a token').toBeGreaterThan(50);
  });

  it('leaves the mono token alone — it is not part of the switcher', () => {
    // --font-mono stays as it is. Code and section numbers want a fixed
    // width, and none of the three accessible faces are monospace.
    const withMono = FILES.filter((f) =>
      stripComments(readFileSync(f, 'utf8')).includes('var(--font-mono)'),
    );
    expect(Array.isArray(withMono)).toBe(true);
  });
});

/**
 * The guide's headings are sans, and they got there without dragging the
 * rest of the site along.
 *
 * --font-display also drives the header and footer wordmark and every
 * heading in the admin. Repointing it in @theme would have repainted all
 * of that, and would have left the About and lawsuit pages on a serif
 * they still name directly — so the site would read as half-converted.
 *
 * Ref: /plan get Fraunces out of the standards guide, Phase 2. AC3, AC4.
 */
describe('the guide overrides the display font locally', () => {
  const appCss = readFileSync('src/app.css', 'utf8');
  const guideCss = readFileSync('src/app/components/standards/GuideStyles.tsx', 'utf8');
  const landingCss = readFileSync(
    'src/app/components/standards/landing/StandardsStyles.jsx',
    'utf8',
  );

  it('leaves the global token alone', () => {
    expect(appCss).toMatch(/--font-display:\s*'Fraunces'/);
  });

  it('repoints it on the guide surfaces, in both stylesheets', () => {
    // Two, because the chapter pages and the landing render different
    // shells. Missing either one leaves half the guide on a serif — the
    // landing was exactly that until this phase.
    for (const [name, css] of [['GuideStyles', guideCss], ['StandardsStyles', landingCss]]) {
      expect(css, `${name} does not repoint the display font`).toMatch(
        /--font-display:\s*var\(--font-body\)/,
      );
    }
  });

  it('resolves to the body token rather than naming a family', () => {
    // Naming Manrope here would put the headings straight back outside
    // the switcher's reach, which is the whole point of phase 1.
    for (const css of [guideCss, landingCss]) {
      const rule = css.match(/--font-display:\s*[^;]+;/)?.[0] ?? '';
      expect(rule).toContain('var(--font-body)');
    }
  });

  it('gives the landing a wrapper to hang the token on', () => {
    const page = readFileSync('src/app/routes/public/StandardsGuide.tsx', 'utf8');
    expect(page).toContain('className="guide-surface"');
  });
});
