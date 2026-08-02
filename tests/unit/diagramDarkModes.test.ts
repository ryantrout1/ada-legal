/**
 * Diagram palette — token completeness guard.
 *
 * The 43 Standards Guide diagrams now paint EVERY color through the themed
 * `--dx-*` palette (defined in app.css), which auto-flips per display mode
 * (dark/contrast/low-vision). This replaced the earlier hardcoded-hex +
 * per-color CSS remap approach: a token that resolves to an AAA-tuned value
 * in each theme is simpler and can't drift the way a hand-maintained remap
 * list did.
 *
 * The invariant this guards is now stronger than the old one: NO diagram may
 * carry a hardcoded hex color at all — every color must go through a `--dx-*`
 * token so it follows the user's display mode. A new diagram that hardcodes a
 * hex (or a conversion that misses one) fails this test, which is the point.
 * Runtime per-theme contrast of the tokens themselves is covered by the
 * rendered-contrast a11y harness, not here.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const APP_CSS = resolve(__dirname, '../../src/app.css');
const DIAGRAM_DIR = resolve(__dirname, '../../src/app/components/standards/diagrams');
const css = readFileSync(APP_CSS, 'utf8');

function diagramFiles(): string[] {
  return readdirSync(DIAGRAM_DIR).filter((f) => /\.(jsx?|tsx?)$/.test(f));
}

describe('diagram palette (token completeness)', () => {
  const files = diagramFiles();

  it('has diagrams to check (guards against a silent empty pass)', () => {
    // If the glob ever stops matching, the checks below would vacuously pass.
    expect(files.length).toBeGreaterThan(5);
  });

  it('no diagram carries a hardcoded hex color — all color goes through --dx-* tokens', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(join(DIAGRAM_DIR, file), 'utf8');
      const hexes = src.match(/#[0-9A-Fa-f]{6}/g);
      if (hexes) offenders.push(`${file}: ${[...new Set(hexes)].join(', ')}`);
    }
    expect(
      offenders,
      'diagrams must use the themed --dx-* palette, not hardcoded hex (hardcoded ' +
        'colors ignore the display-mode override and go invisible in dark modes)',
    ).toEqual([]);
  });

  it('diagrams actually reference the --dx-* palette (not just hex-free by accident)', () => {
    const usesPalette = files.some((file) =>
      /var\(--dx-/.test(readFileSync(join(DIAGRAM_DIR, file), 'utf8')),
    );
    expect(usesPalette, 'no diagram references any --dx-* token').toBe(true);
  });

  it('app.css defines the full --dx-* palette', () => {
    for (const token of [
      '--dx-orange',
      '--dx-green',
      '--dx-violet',
      '--dx-amber',
      '--dx-blue',
      '--dx-label',
      '--dx-line',
    ]) {
      expect(css, `app.css is missing ${token}`).toMatch(token);
    }
  });

  it('--dx-blue is themed (bespoke per-mode values, not a single static hue)', () => {
    // --dx-blue is the one token without an existing AAA family to alias, so it
    // carries explicit per-theme values. Guard that the dark/contrast overrides
    // still exist (a regression here would leave blue failing on dark canvases).
    expect(css).toMatch(/\[data-display="dark"\][^}]*--dx-blue/);
    expect(css).toMatch(/\[data-display="contrast"\][^}]*--dx-blue/);
  });
});
