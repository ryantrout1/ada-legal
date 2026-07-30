/**
 * The Spot report renders from tokens, never from literals.
 *
 * There are five display modes behind the accessibility panel — light, dark,
 * warm, contrast, and a low-vision mode that is gold on pure black. Every one
 * of them works by re-pointing the same `--color-*` tokens, so a component
 * that writes a hex reads correctly in exactly one mode and is wrong in four.
 * On the report a buyer paid for, the mode most likely to be broken that way
 * is the one a low-vision reader chose deliberately.
 *
 * `policy.md` already names this as a hard constraint. This is the check.
 *
 * Encodes acceptance criterion 4 from /plan phase 2 (Spot report redesign).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readCode } from '../support/sourceText.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VIEW = 'src/app/routes/public/spot/SpotReportView.tsx';
const src = readFileSync(resolve(root, VIEW), 'utf8');
const code = readCode(resolve(root, VIEW));

describe('SpotReportView draws only from the token system', () => {
  it('contains no hex colour', () => {
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('contains no rgb, hsl or oklch literal', () => {
    expect(code).not.toMatch(/\b(rgba?|hsla?|oklch)\s*\(/);
  });

  it('does not reach for Tailwind default palette colours', () => {
    // bg-slate-100 and friends resolve to Tailwind's own scale, which does
    // not shift per display mode — the same failure as a hex, wearing a
    // class name.
    expect(code).not.toMatch(
      /\b(bg|text|border|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|teal|blue|indigo|violet|purple|pink)-\d{2,3}\b/,
    );
  });

  it('uses the project tokens it should', () => {
    for (const token of ['text-ink-900', 'text-ink-700', 'text-ink-500', 'border-surface-200']) {
      expect(src, `expected ${token}`).toContain(token);
    }
  });
});

describe('SpotReportView keeps the structure the redesign is built on', () => {
  it('derives its grouping from reportLayout rather than filtering inline', () => {
    // The grouping is tested in spotReportLayout.test.ts. If the view
    // re-implements it, that test stops covering what renders.
    expect(src).toContain('groupFindings');
    expect(src).toContain('summaryLine');
    expect(code).not.toMatch(/\.filter\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.hedged/);
  });

  it('collapses the repeated rule text behind the class the print rule targets', () => {
    // app.css opens `.spot-report details.spot-rule` when printing. Rename
    // either half and the printed report silently loses the explanations.
    expect(src).toContain('spot-report');
    expect(src).toContain('spot-rule');
  });

  it('gives the disclosure toggle a 44px target', () => {
    expect(src).toMatch(/summary[^>]*min-h-\[44px\]/s);
  });
});
