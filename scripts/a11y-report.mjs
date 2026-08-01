/**
 * a11y-report.mjs — merge per-cell audit findings into report v1.
 *
 * The audit spec writes one JSON file per (route × theme) into
 * test-results/a11y-findings/. This reads them all and emits
 * test-results/a11y-report.md via the shared formatter.
 *
 * Run after the sweep:  npm run test:a11y ; node scripts/a11y-report.mjs
 * (Phase 4 will chain these behind `verify:a11y`.)
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('..', import.meta.url);
const DIR = fileURLToPath(new URL('test-results/a11y-findings', ROOT));
const OUT = fileURLToPath(new URL('test-results/a11y-report.md', ROOT));

// Inline the formatter's logic path by importing the compiled TS is not
// available at plain-node runtime; instead re-implement the tiny pure
// shape here would duplicate. So we import via a dynamic tsx-free path:
// the formatter is pure and lives in TS, so we reproduce only the merge +
// delegate formatting through a JSON contract the formatter also accepts.
// To avoid duplication we shell the formatting into the test process is
// overkill; keep merge here and formatting in one place by requiring the
// spec's helper through a compiled artifact when present, else a minimal
// inline formatter identical in shape (kept in sync by a unit test).

/**
 * Normalize a raw finding to the full report shape. The contrast sweep
 * writes {theme, ruleId, kind, impact, target,…}; the target-size and
 * focus specs write a leaner shape ({selector, width/height} / {selector})
 * with no theme/ruleId/kind. Merging them naively crashed the sort on
 * f.theme.localeCompare — this fills the gaps so every finding tabulates.
 */
function normalize(f) {
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

function formatClusters(findings, topN = 30) {
  const groups = new Map();
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
  const lines = [];
  lines.push('## Top clusters (fix these once, clear many rows)');
  lines.push('');
  lines.push(`Distinct patterns: **${groups.size}** across ${findings.length} findings.`);
  lines.push('');
  lines.push('| # | Rule | Element | Hits | Routes | Themes |');
  lines.push('|---|---|---|---|---|---|');
  ranked.slice(0, topN).forEach((g, i) => {
    const el = String(g.target).replace(/\|/g, '\\|').slice(0, 50);
    lines.push(`| ${i + 1} | ${g.ruleId} | \`${el}\` | ${g.count} | ${g.routes.size} | ${g.themes.size} |`);
  });
  return lines.join('\n') + '\n';
}

function rank(f) {
  if (f.kind === 'violation' && f.ruleId === 'color-contrast-enhanced') return 0;
  if (f.kind === 'violation' && (f.impact === 'critical' || f.impact === 'serious')) return 1;
  if (f.kind === 'violation') return 2;
  return 3;
}

function formatReport(findings) {
  const total = findings.length;
  const blocking = findings.filter(
    (f) => f.kind === 'violation' &&
      (f.ruleId === 'color-contrast-enhanced' || f.impact === 'serious' || f.impact === 'critical'),
  ).length;
  const review = findings.filter((f) => f.kind === 'incomplete').length;
  const lines = [];
  lines.push('# AAA audit — report v1', '');
  lines.push(`- Findings: **${total}**`);
  lines.push(`- Blocking (AAA contrast or serious/critical): **${blocking}**`);
  lines.push(`- Needs review (axe could not resolve background): **${review}**`, '');
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
  lines.push(formatClusters(findings));
  lines.push('## All findings');
  lines.push('');
  lines.push('| # | Route | Theme | Rule | Kind | Impact | Element |');
  lines.push('|---|---|---|---|---|---|---|');
  sorted.forEach((f, i) => {
    const el = String(f.target).replace(/\|/g, '\\|').slice(0, 60);
    lines.push(`| ${i + 1} | ${f.route} | ${f.theme} | ${f.ruleId} | ${f.kind} | ${f.impact ?? '—'} | \`${el}\` |`);
  });
  lines.push('');
  lines.push('## Detail');
  sorted.forEach((f, i) => {
    lines.push('');
    lines.push(`### ${i + 1}. ${f.routeName} — ${f.theme} — ${f.ruleId}`);
    lines.push(`- Route: \`${f.route}\``);
    lines.push(`- Kind: ${f.kind}${f.impact ? ` (${f.impact})` : ''}`);
    lines.push(`- Element: \`${String(f.target).slice(0, 120)}\``);
    if (f.summary) lines.push(`- ${String(f.summary).replace(/\n/g, ' ').slice(0, 300)}`);
    if (f.screenshot) lines.push(`- Screenshot: \`${f.screenshot}\``);
  });
  return lines.join('\n') + '\n';
}

function main() {
  if (!existsSync(DIR)) {
    console.error(`[a11y-report] no findings dir at ${DIR} — run \`npm run test:a11y\` first`);
    process.exit(1);
  }
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
  const all = [];
  for (const f of files) {
    try {
      const rows = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
      if (Array.isArray(rows)) all.push(...rows.map(normalize));
    } catch {
      console.warn(`[a11y-report] skipping unreadable ${f}`);
    }
  }
  const outDir = fileURLToPath(new URL('test-results', ROOT));
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(OUT, formatReport(all));
  console.log(`[a11y-report] ${all.length} findings from ${files.length} cells → ${OUT}`);
}

main();
