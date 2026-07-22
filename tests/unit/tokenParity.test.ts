/**
 * Token parity — guards the Base44 → Vercel design-token migration.
 *
 * `adalegallink.com` (Base44) is the visual source of truth while the two
 * sites coexist. This file is the machine-readable record of which tokens
 * this app shares with it, and which deliberately diverge.
 *
 * It reads `src/app.css` as text rather than restating values, so the test
 * cannot drift from the stylesheet: change the CSS without changing this
 * file and the test fails. That is the point — the parity table is a guard,
 * not documentation.
 *
 * Phase 1 scope (/plan: B44 → Vercel CSS parity): the dead-token gap.
 * Later phases extend this file with the typography and palette tables.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

const APP_CSS = resolve(__dirname, '../../src/app.css');
const SRC_DIR = resolve(__dirname, '../../src');
const css = readFileSync(APP_CSS, 'utf8');

/**
 * The Base44 alias vocabulary this app re-exposes on :root so the ported
 * Standards Guide content (authored against B44's token names) resolves.
 * See the "Standards Guide token aliases" block in app.css.
 *
 * Every name here must be DECLARED in app.css. A name that is referenced by
 * a component but never declared renders as an invalid value — the browser
 * drops the declaration and the element inherits, which is how `--link`
 * shipped broken across eight guide pages.
 */
const B44_ALIAS_TOKENS = [
  '--page-bg',
  '--page-bg-alt',
  '--page-bg-subtle',
  '--heading',
  '--body',
  '--body-secondary',
  '--section-label',
  '--link',
  '--card-bg',
  '--card-border',
  '--card-bg-tinted',
  '--card-bg-warm',
  '--border',
  '--border-lighter',
  '--accent',
  '--accent-light',
  '--accent-lighter',
  '--accent-success',
  '--accent-success-bg',
  '--btn-text',
] as const;

/** Recursively collect every source file that could reference a token. */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, acc);
    } else if (['.ts', '.tsx', '.js', '.jsx', '.css'].includes(extname(entry))) {
      acc.push(full);
    }
  }
  return acc;
}

describe('B44 alias tokens', () => {
  it.each(B44_ALIAS_TOKENS)('declares %s in app.css', (token) => {
    // Match a real declaration (`--token:`), not a `var(--token)` reference.
    const declared = new RegExp(`(^|[;{\\s])${token}\\s*:`, 'm').test(css);
    expect(declared, `${token} is referenced by components but never declared`).toBe(true);
  });

  it('never references an alias token it does not declare', () => {
    // The generalised form of the --link bug: catches the next one too.
    const files = sourceFiles(SRC_DIR);
    const undeclared: string[] = [];

    for (const token of B44_ALIAS_TOKENS) {
      const declared = new RegExp(`(^|[;{\\s])${token}\\s*:`, 'm').test(css);
      if (declared) continue;
      const referencedIn = files.filter((f) =>
        readFileSync(f, 'utf8').includes(`var(${token})`),
      );
      if (referencedIn.length > 0) {
        undeclared.push(`${token} (referenced in ${referencedIn.length} file(s))`);
      }
    }

    expect(undeclared).toEqual([]);
  });

  it('points --link at the accent token, matching B44', () => {
    // (Phase 1) See the typography block below for Phase 3.
    // B44 sets --link and --section-label to the same value (#9A3412 in its
    // default mode; both are its terracotta link tone). Aliasing --link to the
    // accent token keeps that relationship AND inherits every per-display-mode
    // override for free, rather than pinning a hex that would go unreadable in
    // dark / contrast / low-vision.
    expect(css).toMatch(/--link:\s*var\(--color-accent-500\)/);
  });
});

/**
 * Phase 3 — typography parity.
 *
 * adalegallink.com sets `body { font-family: 'Manrope' }` with Fraunces
 * headings (B44 src/Layout.jsx). This app defaulted to IBM Plex Sans, so the
 * two sites read as different products. Phase 3 flips the default.
 */
describe('typography parity with B44', () => {
  /**
   * The @theme block, where Tailwind's design tokens are declared.
   *
   * Comments are stripped before slicing: a `}` inside a comment (this file
   * quotes B44's `body { font-family: 'Manrope' }` rule) would otherwise
   * terminate the block early and the assertions below would read an empty
   * string. Found the hard way — the test failed against a correct stylesheet.
   */
  const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const themeStart = cssNoComments.indexOf('@theme');
  const theme = cssNoComments.slice(themeStart, cssNoComments.indexOf('}', themeStart));

  it('defaults --font-body to Manrope, matching B44 body copy', () => {
    expect(theme).toMatch(/--font-body:\s*'Manrope'/);
  });

  it('keeps --font-display on Fraunces, matching B44 headings', () => {
    expect(theme).toMatch(/--font-display:\s*'Fraunces'/);
  });

  it('never declares --font-body on a descendant of :root', () => {
    // The load-bearing rule, and the reason this test exists.
    //
    // Custom properties substitute at computed-value time and inherit from the
    // NEAREST ancestor that declares them. Specificity does not enter into it
    // when the two rules match DIFFERENT elements. So a wrapper like
    // `.lawyer-workspace { --font-body: Manrope }` beats :root[data-font="..."]
    // outright and silently strips a user's chosen accessibility font — inside
    // the portal, for the attorneys most likely to depend on it.
    //
    // This is exactly why the Spot rule is authored as :root:has(.spot-surface)
    // rather than .spot-surface (see spotFontScope.test.ts). The portal block
    // had the bug the Spot block documents; Phase 3 removed it.
    //
    // Any :root-based selector is fine — those compete on source order with the
    // data-font block, which deliberately comes last.
    const declarations = [...css.matchAll(/([^{}]*)\{[^{}]*--font-body\s*:/g)].map((m) =>
      m[1].trim().split('\n').pop()!.trim(),
    );
    // `@theme` is Tailwind 4's token block — it compiles down to :root, so it
    // is a root-level declaration site, not a descendant override.
    const onDescendants = declarations.filter(
      (sel) => !sel.startsWith(':root') && !sel.startsWith('@theme'),
    );
    expect(
      onDescendants,
      'these selectors declare --font-body off :root and will override a user a11y font',
    ).toEqual([]);
  });
});

/**
 * Phase 4a — one elevation stack.
 *
 * The app had two independent card systems: the Tailwind utility `bg-white`
 * (186 uses, app surfaces) and the alias `var(--card-bg)` (234 uses, ported
 * Standards Guide content). Both mean "the lifted surface above the page",
 * both were maintained by hand, and in default mode they had already drifted
 * apart — #FFFFFF vs #FAF8F4.
 *
 * `--color-surface-0` is now the single card tier. Both systems read it, so
 * they cannot disagree again. Asserted structurally (each reads the same
 * token) rather than by comparing resolved literals, because the structural
 * form is what actually prevents the drift.
 */
describe('card elevation tier', () => {
  const DISPLAY_MODES = ['dark', 'warm', 'contrast', 'low-vision'] as const;

  it('declares --color-surface-0 in the @theme default', () => {
    const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const start = cssNoComments.indexOf('@theme');
    const theme = cssNoComments.slice(start, cssNoComments.indexOf('}', start));
    expect(theme).toMatch(/--color-surface-0:\s*#[0-9A-Fa-f]{6}/);
  });

  it.each(DISPLAY_MODES)('declares --color-surface-0 for %s mode', (mode) => {
    // Each display mode re-tints the card tier. Missing one means cards in
    // that mode silently fall back to the default (white) and blow out.
    const block = blockFor(`:root[data-display="${mode}"]`);
    expect(block, `no :root[data-display="${mode}"] block declares --color-surface-0`)
      .toMatch(/--color-surface-0:/);
  });

  it('points --card-bg at the shared tier, not a per-mode literal', () => {
    const declarations = [...css.matchAll(/--card-bg:\s*([^;]+);/g)].map((m) => m[1].trim());
    expect(declarations.length, '--card-bg not declared').toBeGreaterThan(0);
    const notShared = declarations.filter((v) => v !== 'var(--color-surface-0)');
    expect(
      notShared,
      '--card-bg must read var(--color-surface-0) everywhere; per-mode literals reintroduce the drift',
    ).toEqual([]);
  });

  it('points every .bg-white override at the shared tier', () => {
    const overrides = [...css.matchAll(/\.bg-white\s*\{\s*background-color:\s*([^;!]+)/g)]
      .map((m) => m[1].trim());
    expect(overrides.length, 'no .bg-white override found').toBeGreaterThan(0);
    const notShared = overrides.filter((v) => v !== 'var(--color-surface-0)');
    expect(notShared, '.bg-white must read var(--color-surface-0)').toEqual([]);
  });
});

/**
 * Concatenate the bodies of EVERY rule whose selector starts with `selector`.
 *
 * Scanning all of them is load-bearing: each display mode has several separate
 * :root[data-display="..."] rules (one sets color-scheme, another the surface
 * stack, another the alias overrides). Reading only the first found the
 * color-scheme block and reported a correct stylesheet as broken.
 */
function blockFor(selector: string): string {
  const bodies: string[] = [];
  let from = 0;
  for (;;) {
    const at = css.indexOf(selector, from);
    if (at === -1) break;
    const open = css.indexOf('{', at);
    const close = css.indexOf('}', open);
    if (open === -1 || close === -1) break;
    bodies.push(css.slice(open, close));
    from = close;
  }
  return bodies.join('\n');
}
