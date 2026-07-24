/**
 * Semantic alias parity with Base44.
 *
 * WHY THIS EXISTS. tokenParity compares PRIMITIVES — --color-accent-500,
 * --color-ink-700 and friends. Components do not reference primitives.
 * They reference the semantic layer: --accent-light, --btn-text,
 * --page-bg. Nothing compared that mapping, so every primitive could
 * match B44 exactly while a component still rendered the wrong colour.
 *
 * That is not hypothetical. --accent-light aliased --color-accent-500 —
 * the same value as --accent, so "light" was not lighter than anything —
 * and the landing hero rendered deep terracotta where production shows
 * bright orange. Eight aliases were wrong. Every primitive check passed
 * the whole time, and it took a side-by-side screenshot to find.
 *
 * This walks the DEFAULT semantic scope and compares each alias against
 * B44's DisplaySettings.jsx, which is B44's source of truth.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const css = readFileSync(resolve(root, 'src/app.css'), 'utf8');
const b44 = readFileSync(
  resolve(root, '../ada-legal-link-B44/src/components/a11y/DisplaySettings.jsx'),
  'utf8',
);

/** Primitives: FIRST declaration only — later ones are theme overrides. */
function primitives(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of css.split('\n')) {
    const m = /^\s*--(color-[a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8})/.exec(line);
    if (m && !(m[1] in out)) out[m[1]] = m[2].toUpperCase();
  }
  return out;
}

/** The default semantic scope: the :root that opens after .ada-accent. */
function defaultAliasBlock(): string {
  const lines = css.split('\n');
  const ada = lines.findIndex((l) => l.trim().startsWith('.ada-accent'));
  const open = lines.findIndex((l, i) => i > ada && l.trim() === ':root {');
  const close = lines.findIndex((l, i) => i > open && l.trim() === '}');
  return lines.slice(open, close).join('\n');
}

function resolved(): Record<string, string> {
  const prim = primitives();
  const out: Record<string, string> = {};
  const re = /--([a-z][a-z0-9-]*):\s*(?:var\(--(color-[a-z0-9-]+)\)|(#[0-9A-Fa-f]{3,8}))/g;
  for (const m of defaultAliasBlock().matchAll(re)) {
    out[m[1]] = m[2] ? (prim[m[2]] ?? '?') : m[3].toUpperCase();
  }
  return out;
}

function b44Tokens(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of b44.matchAll(/--([a-z][a-z0-9-]*):\s*(#[0-9A-Fa-f]{3,8})/g)) {
    if (!(m[1] in out)) out[m[1]] = m[2].toUpperCase();
  }
  return out;
}

/**
 * Deliberate divergences. Each needs a reason, and the reason has to be
 * stronger than "we preferred ours" — parity is the default.
 */
const EXEMPT: Record<string, string> = {
  'accent-success':
    "B44's #7DCEA0 is a dark-context mint: 1.87:1 on white, unreadable. " +
    'B44 renders it as text on a light tint in ADAAssistant, which is a bug ' +
    'on their side. Ours is 8.49:1. Parity is not worth an unreadable ' +
    'success message.',
};

describe('semantic alias parity with B44', () => {
  it('resolves the alias layer at all', () => {
    // A scope-detection bug here would make every assertion below pass
    // vacuously — which is how the original miss survived.
    const ours = resolved();
    expect(Object.keys(ours).length).toBeGreaterThan(25);
    expect(ours['accent-light'], 'alias block not found').toBeDefined();
  });

  it('matches every alias B44 declares, except the documented exemption', () => {
    const ours = resolved();
    const theirs = b44Tokens();
    const mismatches: string[] = [];
    for (const [name, want] of Object.entries(theirs)) {
      if (name.startsWith('color-') || name.startsWith('dark-')) continue;
      if (name in EXEMPT) continue;
      const got = ours[name];
      if (got && got !== want) mismatches.push(`--${name}: ours ${got}, B44 ${want}`);
    }
    expect(mismatches, `alias drift from B44:\n  ${mismatches.join('\n  ')}`).toEqual([]);
  });

  it('keeps --accent-light genuinely lighter than --accent', () => {
    // The original bug in one line: both pointed at accent-500, so the
    // hero headline was the base terracotta rather than bright orange.
    const ours = resolved();
    expect(ours['accent-light']).not.toBe(ours['accent']);
    expect(ours['accent-light']).toBe('#FB923C');
  });

  it('documents a reason for every exemption', () => {
    for (const [token, reason] of Object.entries(EXEMPT)) {
      expect(reason.length, `${token} exempted without a reason`).toBeGreaterThan(40);
    }
  });
});

/**
 * Landing violet tiers.
 *
 * B44's landing uses THREE violets — a CTA fill, an accent, and a body
 * text tone that has to read on the dark card. A tokenisation pass
 * mapped all three onto --color-ada-500, which is tuned for AAA on
 * LIGHT surfaces and measures 2.07:1 on the dark panel. The card lost
 * its depth and its text lost its contrast in one move.
 *
 * Collapsing a scale onto its middle tier is invisible to a
 * primitive-level check and to a "does this token exist" check. It is
 * only visible if you assert the tiers are distinct.
 */
describe('landing violet tiers stay distinct', () => {
  const styles = readFileSync(
    resolve(root, 'src/app/routes/public/components/landing/LandingV2Styles.jsx'),
    'utf8',
  );

  it('points each --v2-ada token at its own tier', () => {
    expect(styles).toMatch(/--v2-ada:\s*var\(--color-ada-400\)/);
    expect(styles).toMatch(/--v2-ada-light:\s*var\(--color-ada-300\)/);
    expect(styles).toMatch(/--v2-ada-text:\s*var\(--color-ada-200\)/);
  });

  it('resolves those tiers to B44 values', () => {
    const prim = primitives();
    expect(prim['color-ada-400']).toBe('#7C5CFC');
    expect(prim['color-ada-300']).toBe('#A78BFA');
    expect(prim['color-ada-200']).toBe('#B9A6FC');
  });

  it('keeps the landing body violet readable on the dark card', () => {
    const prim = primitives();
    const lum = (h: string) => {
      const v = [0, 2, 4].map((i) => {
        const c = parseInt(h.slice(1 + i, 3 + i), 16) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    // ada-500 here measured 2.07:1 — the regression this guards.
    expect(ratio(prim['color-ada-200'], '#1A1F2B')).toBeGreaterThanOrEqual(7);
  });
});
