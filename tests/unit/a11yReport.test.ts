/**
 * Unit test for the AAA audit report formatter (Phase 2, AAA remediation).
 *
 * Pins AC7's report shape without a browser: the formatter is pure
 * (findings[] → markdown), so severity ordering and the blocking count are
 * deterministic and diffable.
 */

import { describe, it, expect } from 'vitest';
import { formatReport, type Finding } from '../a11y/lib/report.js';

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
});
