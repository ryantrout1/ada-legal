/**
 * Unit test for the AAA audit report formatter (Phase 2, AAA remediation).
 *
 * Pins AC7's report shape without a browser: the formatter is pure
 * (findings[] → markdown), so severity ordering and the blocking count are
 * deterministic and diffable.
 */

import { describe, it, expect } from 'vitest';
import { formatReport, normalizeFinding, type Finding } from '../a11y/lib/report.js';

function finding(over: Partial<Finding>): Finding {
  return {
    route: '/',
    routeName: 'homepage',
    theme: 'Dark',
    ruleId: 'color-contrast-enhanced',
    kind: 'violation',
    impact: 'serious',
    target: 'main > p',
    html: '<p>x</p>',
    summary: 'Element has insufficient color contrast',
    ...over,
  };
}

describe('a11y report formatter', () => {
  it('reports zero findings as a pass', () => {
    const md = formatReport([]);
    expect(md).toContain('Findings: **0**');
    expect(md).toContain('passed AAA');
  });

  it('counts contrast + serious/critical as blocking, incomplete as review', () => {
    const md = formatReport([
      finding({ ruleId: 'color-contrast-enhanced', kind: 'violation', impact: 'moderate' }),
      finding({ ruleId: 'other-rule', kind: 'violation', impact: 'critical' }),
      finding({ ruleId: 'color-contrast-enhanced', kind: 'incomplete', impact: null }),
    ]);
    // contrast-enhanced blocks regardless of impact (moderate here) + the critical one = 2
    expect(md).toContain('Blocking (AAA contrast or serious/critical): **2**');
    expect(md).toContain('Needs review (axe could not resolve background): **1**');
  });

  it('sorts contrast violations ahead of incomplete', () => {
    const md = formatReport([
      finding({ route: '/z', kind: 'incomplete', impact: null, theme: 'Warm' }),
      finding({ route: '/a', ruleId: 'color-contrast-enhanced', kind: 'violation' }),
    ]);
    const idxContrast = md.indexOf('/a');
    const idxIncomplete = md.indexOf('/z');
    expect(idxContrast).toBeGreaterThan(-1);
    expect(idxContrast).toBeLessThan(idxIncomplete);
  });

  it('escapes pipes in selectors so the table stays valid', () => {
    const md = formatReport([finding({ target: 'a[href|="x"]' })]);
    expect(md).toContain('a[href\\|="x"]');
  });

  // Regression: report v1 crashed on `a.theme.localeCompare` because the
  // target-size and focus specs write findings with NO theme/ruleId/kind.
  // normalizeFinding fills those so mixed shapes tabulate and sort.
  it('normalizes a target-size finding (no theme/ruleId) without crashing', () => {
    const raw = { route: '/', routeName: 'homepage', selector: 'button.x', width: 30, height: 20 };
    const n = normalizeFinding(raw);
    expect(n.theme).toBe('Default');
    expect(n.ruleId).toBe('target-size');
    expect(n.impact).toBe('serious');
    expect(n.target).toBe('button.x');
    expect(n.summary).toContain('under 44px');
    // and the full report renders with it mixed alongside a contrast finding
    const md = formatReport([finding({}), n]);
    expect(md).toContain('target-size');
  });

  it('normalizes a focus finding (selector only) without crashing', () => {
    const raw = { route: '/ada', routeName: 'chat', selector: 'a.nav' };
    const n = normalizeFinding(raw);
    expect(n.ruleId).toBe('focus-visible');
    expect(n.theme).toBe('Default');
    expect(() => formatReport([n])).not.toThrow();
  });

  it('sorts a themeless finding without throwing (the exact crash)', () => {
    // Two findings, one missing theme entirely — this is what blew up.
    const themeless = { route: '/x', selector: 'button', width: 10, height: 10 };
    const withTheme = finding({ route: '/a' });
    expect(() => formatReport([normalizeFinding(themeless), withTheme])).not.toThrow();
  });
});
