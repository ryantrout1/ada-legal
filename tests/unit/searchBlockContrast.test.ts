/**
 * Standards guide search block — band-half icon contrast.
 *
 * ADAAssistant renders two zones from one file. The top zone (search input,
 * clear button, suggestion chips) sits on the dark band and must paint
 * through the `--dark-*` family. The bottom zone (the results dropdown) is a
 * floating light card and correctly uses the ordinary page tokens. The two
 * sets have near-identical names, 200 lines apart.
 *
 * The input has two icons. The magnifying glass uses
 * `var(--dark-body-secondary)` — correct. The clear "x" uses
 * `var(--body-secondary)` — the page-half twin, four characters different.
 * Against the band that resolves to 1.76:1 in Default and 1.70:1 in Warm,
 * where WCAG 1.4.11 wants 3:1 for a meaningful icon. Warm is worse because
 * its greys are browner and the band behind them is still navy.
 *
 * This test reads the token name straight out of the component and resolves
 * it per mode, so it follows the code rather than pinning a literal: change
 * the token and the test re-measures whatever the new one resolves to.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const css = readFileSync(resolve(root, 'src/app.css'), 'utf8');
const component = readFileSync(
  resolve(root, 'src/app/components/standards/landing/ADAAssistant.jsx'),
  'utf8',
);

/** WCAG 1.4.11 — non-text contrast for a meaningful icon. */
const NON_TEXT_FLOOR = 3;

/** Every display mode, including Default (which sets no attribute). */
const MODES = ['default', 'dark', 'warm', 'contrast', 'low-vision'] as const;

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const parts = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = parts.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Bodies of every base-scope block, in order: Tailwind's `@theme` (where the
 * colour scale lives) and every `:root { … }` with no attribute selector.
 */
function baseBlocks(): string {
  const theme = [...css.matchAll(/@theme\s*\{([\s\S]*?)\n\}/g)].map((m) => m[1]);
  const roots = [...css.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)].map((m) => m[2]);
  return [...theme, ...roots].join('\n');
}

/** Bodies of every `:root[data-display="mode"] { … }` block, in order. */
function modeBlocks(mode: string): string {
  return [...css.matchAll(new RegExp(`:root\\[data-display="${mode}"\\]\\s*\\{([^}]*)\\}`, 'g'))]
    .map((m) => m[1])
    .join('\n');
}

/**
 * Resolve a custom property to a hex value in a given mode. Later
 * declarations win, and mode declarations win over base ones — the cascade,
 * near enough for a stylesheet with no specificity tricks in these blocks.
 * Follows one-level `var()` aliases (e.g. --body-secondary → --color-ink-500).
 */
function resolveToken(name: string, mode: string, depth = 0): string {
  if (depth > 5) throw new Error(`${name}: alias loop`);
  const scope = mode === 'default' ? baseBlocks() : baseBlocks() + '\n' + modeBlocks(mode);
  const decls = [...scope.matchAll(new RegExp(`${name}\\s*:\\s*([^;}]+)`, 'g'))];
  if (!decls.length) throw new Error(`${name} is not declared (mode: ${mode})`);
  const value = decls[decls.length - 1][1].trim();
  const alias = value.match(/^var\(\s*(--[a-zA-Z0-9-]+)/);
  if (alias) return resolveToken(alias[1], mode, depth + 1);
  const hex = value.match(/^#[0-9A-Fa-f]{3,6}\b/);
  if (!hex) throw new Error(`${name} resolves to a non-hex value in ${mode}: ${value}`);
  return hex[0];
}

/** The token the clear button's icon is painted with, read from the source. */
function clearIconToken(): string {
  const line = component.split('\n').find((l) => /<X\b/.test(l));
  if (!line) throw new Error('clear button icon not found in ADAAssistant');
  const token = line.match(/var\(\s*(--[a-zA-Z0-9-]+)/);
  if (!token) throw new Error(`clear icon uses no token: ${line.trim()}`);
  return token[1];
}

describe('search block — band-half icon contrast', () => {
  it('finds the clear button icon and the token it uses', () => {
    expect(clearIconToken()).toMatch(/^--/);
  });

  it('the clear button icon clears the non-text floor in every mode', () => {
    const token = clearIconToken();
    const failures = MODES.map((mode) => {
      const fg = resolveToken(token, mode);
      const bg = resolveToken('--dark-bg', mode);
      return { mode, fg, bg, r: ratio(fg, bg) };
    })
      .filter((m) => m.r < NON_TEXT_FLOOR)
      .map((m) => `${m.mode}: ${m.fg} on ${m.bg} = ${m.r.toFixed(2)}:1`);
    expect(
      failures,
      `the clear icon sits on the dark band; ${token} is below ${NON_TEXT_FLOOR}:1 there — ` +
        failures.join('; '),
    ).toEqual([]);
  });

  it('the magnifying glass — the icon that was already correct — still passes', () => {
    // Pins the working half of the pair, so a fix to one can't quietly
    // regress the other.
    for (const mode of MODES) {
      const r = ratio(resolveToken('--dark-body-secondary', mode), resolveToken('--dark-bg', mode));
      expect(r, `search icon in ${mode} = ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        NON_TEXT_FLOOR,
      );
    }
  });
});

/**
 * The band half of the component, delimited in the source by explicit
 * markers. The zone boundary is the whole reason the clear button broke: two
 * sets of near-identically named tokens, correct in one half and wrong in the
 * other, with nothing in the file saying where one ends. Marking it makes the
 * boundary readable and lets these checks run against the right half.
 */
const ZONE_START = 'band-zone:start';
const ZONE_END = 'band-zone:end';

function bandZone(): string {
  const from = component.indexOf(ZONE_START);
  const to = component.indexOf(ZONE_END);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(
      `band zone markers not found — the band half must be delimited by ` +
        `${ZONE_START} and ${ZONE_END} comments`,
    );
  }
  return component.slice(from, to);
}

/** Tokens that belong to the light results dropdown, never to the band. */
const PAGE_HALF_TOKENS = [
  '--body-secondary',
  '--body',
  '--heading',
  '--border',
  '--border-lighter',
  '--card-bg',
  '--card-bg-tinted',
  '--page-bg-subtle',
];

describe('search block — band zone hygiene', () => {
  it('the band zone is delimited in the source', () => {
    expect(bandZone().length).toBeGreaterThan(100);
  });

  it('the band zone carries no written-in colour values', () => {
    const zone = bandZone();
    const found = [
      ...(zone.match(/rgba?\([^)]*\)/g) ?? []),
      ...(zone.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []),
    ];
    expect(
      [...new Set(found)],
      'a written-in colour ignores the display-mode override — on the black ' +
        'canvases a translucent white edge measures about 1.1:1 against a 3:1 floor',
    ).toEqual([]);
  });

  it('the band zone uses no page-half token names', () => {
    const zone = bandZone();
    const offenders: string[] = [];
    for (const token of PAGE_HALF_TOKENS) {
      // Word-boundary the name so --body does not match --body-secondary or
      // --dark-body.
      if (new RegExp(`var\\(\\s*${token}\\s*\\)`).test(zone)) offenders.push(token);
    }
    expect(
      offenders,
      'these belong to the light results dropdown; on the band they resolve ' +
        'to light-surface ink and fail contrast',
    ).toEqual([]);
  });

  it('a chip returns to its starting colour after hover', () => {
    // Today the mouse-leave handler resets to a dimmer tier than the one the
    // chip was authored with, so chips get permanently dimmer once brushed —
    // in every mode, not just the dark ones.
    const zone = bandZone();
    const authored = zone.match(/color:\s*'var\(\s*(--[a-zA-Z0-9-]+)\s*\)',\s*cursor:\s*'pointer'/);
    const reset = zone.match(/onMouseLeave=\{e =>[^}]*?style\.color\s*=\s*'([^']+)'/);
    expect(authored, 'could not find the chip authored colour').not.toBeNull();
    expect(reset, 'could not find the chip mouse-leave colour').not.toBeNull();
    expect(reset![1], 'chip hover reset does not restore the authored colour').toBe(
      `var(${authored![1]})`,
    );
  });
});
