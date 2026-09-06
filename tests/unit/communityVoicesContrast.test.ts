/**
 * Community Voices — category colour contrast guard.
 *
 * The widget gives each of its four poll options a categorical hue, as a
 * PAIR: `color` is the darker fill (progress bars, map dots, solid shapes)
 * and `textColor` is the lighter tier that has to read as text against the
 * dark panel. The component's own comment says outright that the two are not
 * interchangeable. One line used the fill tier as text anyway.
 *
 * All four fills land between 2.7:1 and 2.9:1 against the panel — under AA,
 * nowhere near this project's 7:1 AAA floor. The axe pass never caught it
 * because the text in question ("Yours is glowing") only renders after a
 * vote, and the automated pass never votes. So the check has to be computed
 * from the values rather than observed in a rendered page.
 *
 * Two invariants:
 *   1. Every text-tier colour clears 7:1 on the panel.
 *   2. No colour is used in a text position without a text tier behind it.
 *
 * Test-first: red on five values (four fills used as text, plus the orange
 * text tier at 6.46:1) before the fix lands.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const COMPONENT = 'src/app/components/site/CommunityVoices.jsx';
const src = readFileSync(resolve(root, COMPONENT), 'utf8');

/** The panel the widget paints itself on: `background: 'var(--dark-bg)'`. */
const PANEL = '#1E293B';
const AAA_TEXT = 7;

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

/** Read the OPTIONS array straight out of the component. */
function categories(): { id: string; color: string; textColor: string }[] {
  const re =
    /\{\s*id:\s*'([^']+)'[^}]*?color:\s*'(#[0-9A-Fa-f]{6})',\s*textColor:\s*'(#[0-9A-Fa-f]{6})'\s*\}/g;
  return [...src.matchAll(re)].map((m) => ({ id: m[1], color: m[2], textColor: m[3] }));
}

describe('Community Voices — category colour contrast', () => {
  const cats = categories();

  it('finds all four categories (guards against a silent empty pass)', () => {
    expect(cats.map((c) => c.id)).toEqual(['rights', 'happened', 'space', 'believe']);
  });

  it('every text-tier colour clears AAA on the panel', () => {
    const failures = cats
      .map((c) => ({ id: c.id, hex: c.textColor, r: ratio(c.textColor, PANEL) }))
      .filter((c) => c.r < AAA_TEXT)
      .map((c) => `${c.id} ${c.hex} = ${c.r.toFixed(2)}:1`);
    expect(
      failures,
      `text-tier colours below ${AAA_TEXT}:1 on ${PANEL}: ${failures.join('; ')}`,
    ).toEqual([]);
  });

  it('no colour is used in a text position without a text tier behind it', () => {
    // The failing shape is `color: <expr>.color` with no `.textColor` on the
    // same line — the fill tier put straight into a text property.
    const offenders: string[] = [];
    src.split('\n').forEach((line, i) => {
      if (!/(^|[^-\w])color:\s/.test(line)) return;
      if (/backgroundColor|borderColor|outlineColor/.test(line)) return;
      if (/\.color\b/.test(line) && !/\.textColor\b/.test(line)) {
        offenders.push(`${COMPONENT}:${i + 1} — ${line.trim()}`);
      }
    });
    expect(
      offenders,
      'the fill tier is too dark to read as text on the panel (2.7-2.9:1); ' +
        'text positions must use the text tier',
    ).toEqual([]);
  });

  it('the four fill colours stay distinct from each other', () => {
    // The guard against the earlier regression: an old pass mapped all four
    // onto shared theme tokens and collapsed them into one violet, which
    // destroyed the only thing the widget is for.
    const fills = cats.map((c) => c.color.toLowerCase());
    expect(new Set(fills).size, 'two categories share a fill colour').toBe(4);
    const texts = cats.map((c) => c.textColor.toLowerCase());
    expect(new Set(texts).size, 'two categories share a text colour').toBe(4);
  });
});
