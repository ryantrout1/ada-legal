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

/**
 * Phase 4b — default-mode palette parity with B44, and the contrast floor.
 *
 * Values are READ FROM app.css and the ratios computed here, so this cannot
 * drift from what ships: change a token without changing its parity row and
 * the test fails. That is deliberate — every previous contrast claim in this
 * codebase lived in a comment, and three of them turned out to be wrong
 * (.lawyer-workspace's font claim, Ada's "8.2:1", Phase 2's diagram accent
 * rationale). Comments are not checked; this is.
 */
describe('default palette parity with B44', () => {
  const theme = (() => {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const at = clean.indexOf('@theme');
    return clean.slice(at, clean.indexOf('}', at));
  })();

  function token(name: string): string {
    const m = theme.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
    if (!m) throw new Error(`${name} not declared in @theme`);
    return m[1].toUpperCase();
  }

  function luminance(hex: string): number {
    const h = hex.replace('#', '');
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  /**
   * The parity table. `b44` is what adalegallink.com uses; `reason` is null
   * when we match it exactly and a string when we deliberately don't. A
   * divergence with reason: null is a bug — either the value drifted or
   * someone changed it without recording why.
   */
  const PARITY: Array<{ token: string; b44: string; reason: string | null }> = [
    { token: '--color-surface-0',      b44: '#FFFFFF', reason: null },
    { token: '--color-surface-50',     b44: '#F8FAFC', reason: null },
    { token: '--color-surface-100',    b44: '#F1F5F9', reason: null },
    { token: '--color-surface-200',    b44: '#E2E8F0', reason: null },
    { token: '--color-ink-900',        b44: '#1E293B', reason: null },
    { token: '--color-ink-700',        b44: '#3D4A5C', reason: null },
    // Both realigned to B44 exactly (2026-07-24). The goal for this phase
    // is visual parity with production so the rebuilt site can actually be
    // compared against it; the AAA darkening made every terracotta fill,
    // link and section label visibly browner than the live site, which made
    // judging anything else impossible. See ACCESSIBILITY_DEBT below.
    { token: '--color-ink-500',        b44: '#4B5563', reason: null },
    { token: '--color-accent-500',     b44: '#C2410C', reason: null },
    { token: '--color-ada-500',        b44: '#6D28D9',
      reason: 'B44 value is 6.79:1 on our page tier; darkened to clear 7:1' },
    { token: '--color-control-border', b44: '#E2E8F0',
      reason: 'B44 has no >=3:1 interactive border tone (its #E2E8F0 is 1.23:1, failing 1.4.11)' },
  ];

  it.each(PARITY)('$token matches B44 or records why not', ({ token: name, b44, reason }) => {
    const ours = token(name);
    if (reason === null) {
      expect(ours, `${name} drifted from B44 with no recorded reason`).toBe(b44);
    } else {
      expect(ours, `${name} claims a divergence but matches B44`).not.toBe(b44);
    }
  });

  const TEXT = ['--color-ink-900', '--color-ink-700', '--color-ink-500',
                '--color-accent-500', '--color-ada-500', '--color-ada-600',
                '--color-success-500', '--color-warning-500', '--color-danger-500'];
  const SURFACES = ['--color-surface-0', '--color-surface-50', '--color-surface-100'];

  /**
   * ACCESSIBILITY DEBT — deliberate, dated, and reversible.
   *
   * `--color-accent-500` is B44's #C2410C, which measures 5.18:1 on white.
   * That clears AA (4.5:1) and fails the AAA floor (7:1) this project
   * otherwise holds. It was set back to B44's value on 2026-07-24 so the
   * rebuilt site could be compared like-for-like against production —
   * the darkened value made parity impossible to judge.
   *
   * This is NOT a silent regression. The exact measured ratio is asserted
   * below, so if the token moves again this test tells you where it landed.
   * To restore AAA: set --color-accent-500 to #8E2F09 and --color-accent-600
   * to #6E2308, then flip these back to the 7:1 assertions.
   */
  // ink-500 is B44's #4B5563 — 6.90:1 on surface-100, a hair under the
  // floor. Same trade as accent-500 and recorded the same way.
  const AAA_EXEMPT = new Set(['--color-accent-500', '--color-ink-500']);

  it('records the exact contrast of ink-500 on its worst surface', () => {
    const ratio = contrast(token('--color-ink-500'), token('--color-surface-100'));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(Number(ratio.toFixed(2))).toBe(6.9);
  });

  it('records the exact contrast of the AAA-exempt accent', () => {
    const ratio = contrast(token('--color-accent-500'), '#FFFFFF');
    expect(ratio).toBeGreaterThanOrEqual(4.5); // still clears AA
    expect(ratio).toBeLessThan(7);             // and still owes AAA
    expect(Number(ratio.toFixed(2))).toBe(5.18);
  });

  it.each(TEXT.filter((t) => !AAA_EXEMPT.has(t)))('%s clears 7:1 on every surface tier', (name) => {
    const fg = token(name);
    const failing = SURFACES
      .map((s) => ({ s, r: contrast(fg, token(s)) }))
      .filter(({ r }) => r < 7)
      .map(({ s, r }) => `${s} ${r.toFixed(2)}:1`);
    expect(failing, `${name} below the AAA floor`).toEqual([]);
  });

  it('control-border clears 3:1 on page and card (WCAG 1.4.11)', () => {
    const cb = token('--color-control-border');
    for (const s of ['--color-surface-0', '--color-surface-50']) {
      expect(contrast(cb, token(s)), `control-border on ${s}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('button text clears AA on the accent fill (AAA exempt — see debt note)', () => {
    expect(contrast('#FFFFFF', token('--color-accent-500'))).toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * Phase 4c — non-default display modes.
 *
 * Resolves each token the way the cascade does: a mode's own block if it
 * declares the token, otherwise the @theme default. Then checks every text
 * token against every surface tier in that mode.
 *
 * This covers the semantic and Ada tokens, not just the four primary ones.
 * The plan's hand-written table only listed the primaries, and this sweep
 * caught three sub-7:1 values it had missed (dark warning 6.61, dark danger
 * 6.54, warm ada 6.84) — which is the argument for computing rather than
 * tabulating by hand.
 *
 * low-vision is deliberately absent. Its canvas is white with black text,
 * the polar opposite of B44's black-and-gold, and reconciling them is a
 * product decision about the users most dependent on that mode — not a token
 * swap. Tracked as an open decision.
 */
describe('non-default display mode contrast', () => {
  const MODES = ['dark', 'warm', 'contrast', 'low-vision'] as const;

  const themeBlock = (() => {
    const masked = css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
    const start = masked.indexOf('@theme');
    let depth = 0;
    const open = masked.indexOf('{', start);
    for (let j = open; j < masked.length; j++) {
      if (masked[j] === '{') depth++;
      else if (masked[j] === '}' && --depth === 0) return css.slice(start, j);
    }
    return '';
  })();

  function resolve(name: string, mode: string): string {
    const scoped = blockFor(`:root[data-display="${mode}"]`);
    const re = new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`);
    const m = scoped.match(re) ?? themeBlock.match(re);
    if (!m) throw new Error(`${name} unresolvable in ${mode}`);
    return m[1].toUpperCase();
  }

  function luminance(hex: string): number {
    const h = hex.replace('#', '');
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  const TEXT = ['--color-ink-900', '--color-ink-700', '--color-ink-500',
                '--color-accent-500', '--color-accent-600',
                '--color-ada-500', '--color-ada-600',
                '--color-success-500', '--color-warning-500', '--color-danger-500'];
  const SURFACES = ['--color-surface-0', '--color-surface-50', '--color-surface-100'];

  it.each(MODES)('every text token clears 7:1 on every surface in %s mode', (mode) => {
    const failing: string[] = [];
    for (const t of TEXT) {
      for (const s of SURFACES) {
        const r = contrast(resolve(t, mode), resolve(s, mode));
        if (r < 7) failing.push(`${t} on ${s} = ${r.toFixed(2)}:1`);
      }
    }
    expect(failing, `${mode} mode below the AAA floor`).toEqual([]);
  });

  it.each(MODES)('control-border clears 3:1 in %s mode (WCAG 1.4.11)', (mode) => {
    const cb = resolve('--color-control-border', mode);
    for (const s of ['--color-surface-0', '--color-surface-50']) {
      expect(contrast(cb, resolve(s, mode)), `${mode}: control-border on ${s}`)
        .toBeGreaterThanOrEqual(3);
    }
  });

  it.each(MODES)('%s declares its own card tier distinct from the page', (mode) => {
    // Elevation must survive per mode: a card that equals the page reads flat.
    // Contrast mode gets a near-black card rather than a literally equal one,
    // so the tier stays addressable even though its white borders do the
    // visual work.
    expect(resolve('--color-surface-0', mode), `${mode}: card equals page, elevation lost`)
      .not.toBe(resolve('--color-surface-50', mode));
  });
});

/**
 * Phase 4d — site chrome re-tints per display mode.
 *
 * adalegallink.com's header reads var(--dark-bg) and its footer
 * var(--dark-bg-footer); both shift per display mode, and the two are
 * deliberately different tones in default (#1E293B header, #141820 footer).
 * This app pinned a single navy for both, so in contrast mode a slate-blue bar
 * sat on a pure-black page looking like the header hadn't been told.
 */
describe('site chrome per display mode', () => {
  const MODES = ['dark', 'warm', 'contrast', 'low-vision'] as const;
  const CHROME = ['--color-brand-navy', '--color-brand-footer', '--color-brand-navy-hover'];

  const themeBlock = (() => {
    const masked = css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
    const start = masked.indexOf('@theme');
    let depth = 0;
    const open = masked.indexOf('{', start);
    for (let j = open; j < masked.length; j++) {
      if (masked[j] === '{') depth++;
      else if (masked[j] === '}' && --depth === 0) return css.slice(start, j);
    }
    return '';
  })();

  function chrome(name: string, mode?: string): string {
    const re = new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`);
    const scoped = mode ? blockFor(`:root[data-display="${mode}"]`) : '';
    const m = scoped.match(re) ?? themeBlock.match(re);
    if (!m) throw new Error(`${name} unresolvable${mode ? ` in ${mode}` : ''}`);
    return m[1].toUpperCase();
  }

  function luminance(hex: string): number {
    const h = hex.replace('#', '');
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  it.each(CHROME)('%s is declared in every display mode', (name) => {
    expect(() => chrome(name)).not.toThrow();
    for (const mode of MODES) {
      const scoped = blockFor(`:root[data-display="${mode}"]`);
      expect(scoped, `${name} not re-tinted for ${mode} — the bar would stay navy`)
        .toMatch(new RegExp(name + ':'));
    }
  });

  it('header and footer are distinct tones in default, matching B44', () => {
    expect(chrome('--color-brand-navy')).not.toBe(chrome('--color-brand-footer'));
  });

  it.each([undefined, ...MODES])('chrome text clears 7:1 in %s mode', (mode) => {
    // White nav text, the gold wordmark/active state, and the footer's muted
    // link tone all sit ON the bar, so each needs the AAA floor against it.
    const failing: string[] = [];
    for (const bar of ['--color-brand-navy', '--color-brand-footer']) {
      const bg = chrome(bar, mode);
      for (const [label, fg] of [['white', '#FFFFFF'], ['gold', chrome('--color-brand-gold', mode)], ['footer-link', '#B0BEC5']] as const) {
        if (label === 'footer-link' && bar === '--color-brand-navy') continue;
        const r = contrast(fg, bg);
        if (r < 7) failing.push(`${label} on ${bar} = ${r.toFixed(2)}:1`);
      }
    }
    expect(failing, `${mode ?? 'default'} chrome below the AAA floor`).toEqual([]);
  });
});

/**
 * Accessibility panel — selected-state signal.
 *
 * The panel had one selected treatment for all six groups: a 1px accent border
 * plus an accent-50 tint. That tint is 1.10:1 against the panel, so the entire
 * "which option is active" cue rested on the border. This is the surface users
 * with low vision open to find these controls; a near-invisible selected state
 * there is the defect, not a style preference.
 *
 * adalegallink.com uses two tiers — tinted tiles for Display/Font, solid fill
 * for the segmented controls — and this pins ours to the same shape, at our
 * contrast rather than B44's (white on its #C2410C is 5.18:1).
 */
describe('accessibility panel selected state', () => {
  const panel = readFileSync(
    resolve(__dirname, '../../src/app/components/AccessibilityPanel.tsx'),
    'utf8',
  );

  function themeToken(name: string): string {
    const masked = css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
    const start = masked.indexOf('@theme');
    let depth = 0;
    const open = masked.indexOf('{', start);
    let theme = '';
    for (let j = open; j < masked.length; j++) {
      if (masked[j] === '{') depth++;
      else if (masked[j] === '}' && --depth === 0) { theme = css.slice(start, j); break; }
    }
    const m = theme.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
    if (!m) throw new Error(`${name} not in @theme`);
    return m[1].toUpperCase();
  }
  function luminance(hex: string): number {
    const h = hex.replace('#', '');
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  it('offers a solid-fill variant, not tint-only for every group', () => {
    expect(panel).toMatch(/variant\?:\s*'tile'\s*\|\s*'segmented'/);
    expect(panel).toMatch(/bg-accent-500\s+text-white/);
  });

  it('applies the solid variant to all four segmented controls', () => {
    // Size, Spacing, Reading Level, Undo. Display and Font stay tiles.
    expect((panel.match(/variant="segmented"/g) ?? []).length).toBe(4);
  });

  it('white text on the solid fill clears AA (AAA exempt — see debt note)', () => {
    expect(contrast('#FFFFFF', themeToken('--color-accent-500'))).toBeGreaterThanOrEqual(4.5);
  });

  it('the solid fill is distinguishable from the panel surface (1.4.11)', () => {
    // The failure being guarded against: a selected fill so close to the panel
    // that only the border says anything. Needs 3:1 as a state indicator.
    expect(contrast(themeToken('--color-accent-500'), themeToken('--color-surface-0')))
      .toBeGreaterThanOrEqual(3);
  });

  it('draws selected borders at 2px so the tile tier reads too', () => {
    expect(panel).toMatch(/rounded border-2 /);
  });
});
