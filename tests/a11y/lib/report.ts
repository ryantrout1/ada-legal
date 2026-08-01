/**
 * report.ts — collects AAA audit findings into one severity-sorted report.
 *
 * Two halves:
 *   1. formatReport() — a PURE function (findings[] → markdown string). Unit
 *      tested (tests/unit/a11yReport.test.ts) so the report shape is pinned
 *      without running a browser.
 *   2. writeFinding() — parallel-safe file I/O: each (route × theme) test
 *      writes its own JSON file into test-results/a11y-findings/, so workers
 *      never contend on a shared file. scripts/a11y-report.mjs merges them
 *      into test-results/a11y-report.md after the run.
 *
 * A finding is one axe violation node (or one "incomplete" contrast result
 * that axe couldn't resolve — gradient/image backgrounds — which we keep as
 * must-review rather than silently pass; that was the hero-background hole).
 */

export type FindingKind = 'violation' | 'incomplete';

export interface Finding {
  route: string;
  routeName: string;
  theme: string; // theme label, e.g. "Dark"
  ruleId: string; // axe rule, e.g. "color-contrast-enhanced"
  kind: FindingKind;
  impact: string | null; // axe impact label (may be null)
  target: string; // CSS selector of the node
  html: string; // truncated element html
  summary: string; // axe failureSummary / help text
  screenshot?: string; // relative path, set for incomplete contrast cases
}

/** A raw finding as written to disk — the contrast sweep writes the full
 *  Finding shape; target-size/focus specs write a leaner shape (selector +
 *  dimensions / selector only, no theme/ruleId/kind). */
export interface RawFinding {
  route?: string;
  routeName?: string;
  theme?: string;
  ruleId?: string;
  kind?: FindingKind;
  impact?: string | null;
  target?: string;
  selector?: string;
  width?: number;
  height?: number;
  html?: string;
  summary?: string;
  screenshot?: string;
}

/**
 * Normalize a raw finding to the full Finding shape so mixed-shape findings
 * (contrast vs target-size vs focus) tabulate and sort together. Mirrors
 * scripts/a11y-report.mjs → normalize(); the parity test keeps them aligned.
 */
export function normalizeFinding(f: RawFinding): Finding {
  const isTargetSize = typeof f.width === 'number' && typeof f.height === 'number';
  const ruleId = f.ruleId ?? (isTargetSize ? 'target-size' : f.selector ? 'focus-visible' : 'unknown');
  const target = f.target ?? f.selector ?? '';
  let summary = f.summary;
  if (!summary && isTargetSize) summary = `Target ${f.width}x${f.height}px is under 44px`;
  if (!summary && ruleId === 'focus-visible') summary = 'No visible focus indicator';
  return {
    route: f.route ?? '',
    routeName: f.routeName ?? f.route ?? '',
    theme: f.theme ?? 'Default',
    ruleId,
    kind: f.kind ?? 'violation',
    impact: f.impact ?? (ruleId === 'target-size' || ruleId === 'focus-visible' ? 'serious' : null),
    target,
    html: f.html ?? '',
    summary: summary ?? '',
    screenshot: f.screenshot,
  };
}

/**
 * Cluster findings by (ruleId + element selector) so the report leads with
 * root patterns, not 1000+ repeated rows. Most defects are the same element
 * failing across many themes; this counts how many route×theme cells each
 * pattern hits, so triage sees "this one element, 40 times" not 40 lines.
 */
export function formatClusters(findings: Finding[], topN = 30): string {
  const groups = new Map<
    string,
    { ruleId: string; target: string; count: number; routes: Set<string>; themes: Set<string> }
  >();
  for (const f of findings) {
    const key = `${f.ruleId}::${f.target}`;
    let g = groups.get(key);
    if (!g) {
      g = { ruleId: f.ruleId, target: f.target, count: 0, routes: new Set(), themes: new Set() };
      groups.set(key, g);
    }
    g.count += 1;
    if (f.route) g.routes.add(f.route);
    if (f.theme) g.themes.add(f.theme);
  }
  const ranked = [...groups.values()].sort((a, b) => b.count - a.count);
  const lines: string[] = [];
  lines.push('## Top clusters (fix these once, clear many rows)');
  lines.push('');
  lines.push(`Distinct patterns: **${groups.size}** across ${findings.length} findings.`);
  lines.push('');
  lines.push('| # | Rule | Element | Hits | Routes | Themes |');
  lines.push('|---|---|---|---|---|---|');
  ranked.slice(0, topN).forEach((g, i) => {
    const el = g.target.replace(/\|/g, '\\|').slice(0, 50);
    lines.push(
      `| ${i + 1} | ${g.ruleId} | \`${el}\` | ${g.count} | ${g.routes.size} | ${g.themes.size} |`,
    );
  });
  return lines.join('\n') + '\n';
}

/** Severity rank: contrast violations first (the AAA 7:1 failures we block
 *  on), then other violations, then incomplete (needs-review) last. */
function rank(f: Finding): number {
  if (f.kind === 'violation' && f.ruleId === 'color-contrast-enhanced') return 0;
  if (f.kind === 'violation' && (f.impact === 'critical' || f.impact === 'serious')) return 1;
  if (f.kind === 'violation') return 2;
  return 3; // incomplete
}

/**
 * Pure: render findings to a single markdown report, severity-sorted,
 * grouped route × theme. Deterministic (stable sort by rank then route
 * then theme) so the output can be diffed and unit-tested.
 */
export function formatReport(findings: Finding[]): string {
  const total = findings.length;
  const blocking = findings.filter(
    (f) => f.kind === 'violation' &&
      (f.ruleId === 'color-contrast-enhanced' || f.impact === 'serious' || f.impact === 'critical'),
  ).length;
  const review = findings.filter((f) => f.kind === 'incomplete').length;

  const lines: string[] = [];
  lines.push('# AAA audit — report v1');
  lines.push('');
  lines.push(`- Findings: **${total}**`);
  lines.push(`- Blocking (AAA contrast or serious/critical): **${blocking}**`);
  lines.push(`- Needs review (axe could not resolve background): **${review}**`);
  lines.push('');

  if (total === 0) {
    lines.push('_No findings. Every audited route × theme passed AAA._');
    return lines.join('\n') + '\n';
  }

  const sorted = [...findings].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    const rt = (a.route || '').localeCompare(b.route || '');
    if (rt !== 0) return rt;
    return (a.theme || '').localeCompare(b.theme || '');
  });

  // Lead with clusters so the report opens with root patterns.
  lines.push(formatClusters(findings));
  lines.push('## All findings');
  lines.push('');

  lines.push('| # | Route | Theme | Rule | Kind | Impact | Element |');
  lines.push('|---|---|---|---|---|---|---|');
  sorted.forEach((f, i) => {
    const el = f.target.replace(/\|/g, '\\|').slice(0, 60);
    lines.push(
      `| ${i + 1} | ${f.route} | ${f.theme} | ${f.ruleId} | ${f.kind} | ${f.impact ?? '—'} | \`${el}\` |`,
    );
  });
  lines.push('');
  lines.push('## Detail');
  sorted.forEach((f, i) => {
    lines.push('');
    lines.push(`### ${i + 1}. ${f.routeName} — ${f.theme} — ${f.ruleId}`);
    lines.push(`- Route: \`${f.route}\``);
    lines.push(`- Kind: ${f.kind}${f.impact ? ` (${f.impact})` : ''}`);
    lines.push(`- Element: \`${f.target.slice(0, 120)}\``);
    if (f.summary) lines.push(`- ${f.summary.replace(/\n/g, ' ').slice(0, 300)}`);
    if (f.screenshot) lines.push(`- Screenshot: \`${f.screenshot}\``);
  });
  return lines.join('\n') + '\n';
}
