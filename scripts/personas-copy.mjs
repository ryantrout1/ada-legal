#!/usr/bin/env node
/**
 * personas-copy.mjs — bundle a persona's artifacts into one clipboard-
 * ready markdown document.
 *
 * After running personas you end up with three files per persona under
 *   test-results/personas/<run-id>/<persona-slug>/
 *     transcript.md
 *     trace.json
 *     assertions.log
 *
 * The natural next step is pasting all three into a conversation with
 * Claude (or a collaborator) to analyze what happened. This script
 * concatenates them into one markdown blob printed to stdout. Pipe to
 * your clipboard tool:
 *
 *   # WSL / Windows
 *   node scripts/personas-copy.mjs --persona listing-scoped-qualified-standard | clip.exe
 *
 *   # Linux (Wayland)
 *   node scripts/personas-copy.mjs --persona listing-scoped-qualified-standard | wl-copy
 *
 *   # macOS
 *   node scripts/personas-copy.mjs --persona listing-scoped-qualified-standard | pbcopy
 *
 * Arguments:
 *   --persona <slug>   Persona slug (e.g. listing-scoped-qualified-standard).
 *                      Required unless --latest is set.
 *   --run <timestamp>  Specific run directory to read from. If omitted,
 *                      the most recent run is used.
 *   --latest           Bundle the most recent run of any persona. Useful
 *                      right after a single-persona invocation.
 *   --list             Instead of bundling, list available runs +
 *                      personas. Handy when you've forgotten the slug.
 *   --trace            Include trace.json content too. Default is
 *                      transcript + assertions only (trace.json is
 *                      verbose — 100+ lines per run — and usually only
 *                      needed for deep debugging).
 *   --help             Print this message.
 *
 * Ref: Step 28, Commit 3.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

const ARTIFACT_ROOT = path.resolve(
  process.cwd(),
  'test-results',
  'personas',
);

// ─── Argument parsing ───────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {
  persona: /** @type {string | null} */ (null),
  run: /** @type {string | null} */ (null),
  latest: false,
  list: false,
  trace: false,
  help: false,
};

for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  switch (a) {
    case '--persona':
      flags.persona = args[++i] ?? null;
      break;
    case '--run':
      flags.run = args[++i] ?? null;
      break;
    case '--latest':
      flags.latest = true;
      break;
    case '--list':
      flags.list = true;
      break;
    case '--trace':
      flags.trace = true;
      break;
    case '--help':
    case '-h':
      flags.help = true;
      break;
    default:
      process.stderr.write(`Unknown argument: ${a}\n`);
      process.exit(2);
  }
}

if (flags.help) {
  process.stderr.write(
    'Usage: node scripts/personas-copy.mjs --persona <slug> [--run <timestamp>] [--trace]\n' +
      '       node scripts/personas-copy.mjs --latest [--trace]\n' +
      '       node scripts/personas-copy.mjs --list\n',
  );
  process.exit(0);
}

// ─── Directory discovery ────────────────────────────────────────────────────

/**
 * List all run directories under ARTIFACT_ROOT, newest first.
 * @returns {string[]}
 */
function listRuns() {
  if (!fs.existsSync(ARTIFACT_ROOT)) return [];
  return fs
    .readdirSync(ARTIFACT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse();
}

/**
 * List personas inside a run directory.
 * @param {string} runId
 * @returns {{ slug: string, mtime: number }[]}
 */
function listPersonasInRun(runId) {
  const runDir = path.join(ARTIFACT_ROOT, runId);
  if (!fs.existsSync(runDir)) return [];
  return fs
    .readdirSync(runDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      slug: d.name,
      mtime: fs
        .statSync(path.join(runDir, d.name))
        .mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
}

// ─── --list mode ────────────────────────────────────────────────────────────

if (flags.list) {
  const runs = listRuns();
  if (runs.length === 0) {
    process.stderr.write(
      `No persona runs found under ${ARTIFACT_ROOT}\n` +
        'Run personas first: npm run test:personas:prod\n',
    );
    process.exit(1);
  }
  for (const run of runs.slice(0, 10)) {
    process.stdout.write(`${run}\n`);
    for (const p of listPersonasInRun(run)) {
      process.stdout.write(`  ${p.slug}\n`);
    }
  }
  if (runs.length > 10) {
    process.stdout.write(`… (${runs.length - 10} older runs omitted)\n`);
  }
  process.exit(0);
}

// ─── Resolve run + persona ──────────────────────────────────────────────────

const runs = listRuns();
if (runs.length === 0) {
  process.stderr.write(
    `No persona runs found under ${ARTIFACT_ROOT}\n` +
      'Run personas first: npm run test:personas:prod\n',
  );
  process.exit(1);
}

const runId = flags.run ?? runs[0];
const runDir = path.join(ARTIFACT_ROOT, runId);
if (!fs.existsSync(runDir)) {
  process.stderr.write(`Run directory not found: ${runDir}\n`);
  process.stderr.write('Available runs:\n');
  for (const r of runs.slice(0, 5)) process.stderr.write(`  ${r}\n`);
  process.exit(1);
}

const personas = listPersonasInRun(runId);
if (personas.length === 0) {
  process.stderr.write(
    `No persona artifacts under ${runDir}\n`,
  );
  process.exit(1);
}

let personaSlug;
if (flags.latest) {
  personaSlug = personas[0].slug;
} else if (flags.persona) {
  // Exact match first, then prefix match (shortcut-friendly).
  const exact = personas.find((p) => p.slug === flags.persona);
  if (exact) personaSlug = exact.slug;
  else {
    const prefix = personas.filter((p) => p.slug.startsWith(flags.persona));
    if (prefix.length === 1) personaSlug = prefix[0].slug;
    else if (prefix.length > 1) {
      process.stderr.write(
        `Ambiguous --persona prefix '${flags.persona}' matches:\n`,
      );
      for (const p of prefix) process.stderr.write(`  ${p.slug}\n`);
      process.exit(1);
    } else {
      process.stderr.write(
        `No persona matches '${flags.persona}' in run ${runId}\n`,
      );
      process.stderr.write('Available personas in this run:\n');
      for (const p of personas) process.stderr.write(`  ${p.slug}\n`);
      process.exit(1);
    }
  }
} else {
  process.stderr.write(
    'Either --persona <slug> or --latest is required.\n' +
      'Run `--list` to see available personas.\n',
  );
  process.exit(2);
}

const personaDir = path.join(runDir, personaSlug);
const transcriptPath = path.join(personaDir, 'transcript.md');
const tracePath = path.join(personaDir, 'trace.json');
const assertionsPath = path.join(personaDir, 'assertions.log');

// ─── Build the bundled markdown ─────────────────────────────────────────────

const out = [];

out.push(`# Persona run bundle`);
out.push('');
out.push(`- Run: \`${runId}\``);
out.push(`- Persona: \`${personaSlug}\``);
out.push(`- Artifact dir: \`${personaDir}\``);
out.push('');

// A tiny at-a-glance header parsed from trace.json if available.
try {
  if (fs.existsSync(tracePath)) {
    const trace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
    const assertionsSummary = trace.assertions
      ? `${trace.assertions.passed}/${trace.assertions.total} passed (${trace.assertions.failed} failed)`
      : 'n/a';
    out.push('## At a glance');
    out.push('');
    out.push(`- **Verdict:** ${String(trace.verdict ?? 'unknown').toUpperCase()}`);
    out.push(`- **Target:** \`${trace.target ?? '?'}\` (${trace.baseUrl ?? '?'})`);
    out.push(`- **Session:** \`${trace.sessionId ?? '?'}\` (status: ${trace.sessionStatus ?? '?'})`);
    out.push(`- **Turns:** ${trace.turnCount ?? '?'}`);
    out.push(`- **Assertions:** ${assertionsSummary}`);
    if (Array.isArray(trace.toolsCalled) && trace.toolsCalled.length > 0) {
      out.push(`- **Tools called:** ${trace.toolsCalled.join(', ')}`);
    }
    if (Array.isArray(trace.tags) && trace.tags.length > 0) {
      out.push(`- **Tags:** ${trace.tags.join(' ')}`);
    }
    if (trace.gitSha) out.push(`- **Git SHA:** \`${trace.gitSha}\``);
    out.push('');
  }
} catch (err) {
  out.push(`_Could not parse trace.json: ${err instanceof Error ? err.message : String(err)}_`);
  out.push('');
}

// Assertions log — usually the first thing you want to scan.
if (fs.existsSync(assertionsPath)) {
  out.push('## Assertions');
  out.push('');
  out.push('```');
  out.push(fs.readFileSync(assertionsPath, 'utf8').trimEnd());
  out.push('```');
  out.push('');
} else {
  out.push('_No assertions.log found._');
  out.push('');
}

// Transcript — the actual conversation.
if (fs.existsSync(transcriptPath)) {
  out.push('## Transcript');
  out.push('');
  out.push(fs.readFileSync(transcriptPath, 'utf8').trimEnd());
  out.push('');
} else {
  out.push('_No transcript.md found._');
  out.push('');
}

// Harvest (if present) — the AI's commentary on what happened. Not
// every persona is harvested; only present when the user has run
// `npm run personas:harvest` for this slug+run combination.
const harvestPath = path.join(personaDir, 'harvest.md');
if (fs.existsSync(harvestPath)) {
  out.push('## Harvest (AI commentary)');
  out.push('');
  out.push(fs.readFileSync(harvestPath, 'utf8').trimEnd());
  out.push('');
}

// Trace JSON — included only on --trace to keep the default output
// skimmable. Trace files are typically 2-5KB and include per-event
// timestamps, bubble-parsing data, screenshot refs, etc.
if (flags.trace) {
  if (fs.existsSync(tracePath)) {
    out.push('## Full trace');
    out.push('');
    out.push('```json');
    out.push(fs.readFileSync(tracePath, 'utf8').trimEnd());
    out.push('```');
    out.push('');
  } else {
    out.push('_No trace.json found._');
    out.push('');
  }
}

process.stdout.write(out.join('\n'));
