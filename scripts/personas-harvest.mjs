#!/usr/bin/env node
/**
 * personas-harvest.mjs — opt-in AI analysis pass over a persona's
 * transcript + trace. Writes harvest.md with structured commentary.
 *
 * The trace and transcript produced by the persona runner are
 * DETERMINISTIC — they capture what happened. This tool asks
 * 'what does what happened MEAN?' via an LLM pass.
 *
 * Every harvest costs tokens. It's opt-in and manual. Run it on
 * personas that failed, on personas whose output feels weird, or
 * when you want a read on conversation quality for a persona that
 * passed its assertions but you're unsure about.
 *
 *   # Harvest the most recent persona run
 *   node scripts/personas-harvest.mjs --latest
 *
 *   # Harvest a specific persona
 *   node scripts/personas-harvest.mjs --persona listing-scoped-qualified-standard
 *
 *   # Harvest a specific persona from a specific run
 *   node scripts/personas-harvest.mjs \\
 *     --persona listing-scoped-qualified-standard \\
 *     --run 2026-04-22-080000
 *
 *   # List runs + personas (same --list as the copy tool)
 *   node scripts/personas-harvest.mjs --list
 *
 *   # Write to stdout instead of harvest.md (for piping)
 *   node scripts/personas-harvest.mjs --persona <slug> --stdout
 *
 *   # Use a different model (default: claude-sonnet-4-5-20250929)
 *   node scripts/personas-harvest.mjs --persona <slug> --model claude-opus-4-5
 *
 * Requires ANTHROPIC_API_KEY in the environment. Reads from
 * .env.local automatically if present.
 *
 * Ref: Step 28, Commit 4.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

const ARTIFACT_ROOT = path.resolve(
  process.cwd(),
  'test-results',
  'personas',
);

const DEFAULT_MODEL = 'claude-sonnet-4-6';

// ─── Argument parsing ───────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {
  persona: /** @type {string | null} */ (null),
  run: /** @type {string | null} */ (null),
  latest: false,
  list: false,
  stdout: false,
  model: DEFAULT_MODEL,
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
    case '--stdout':
      flags.stdout = true;
      break;
    case '--model':
      flags.model = args[++i] ?? DEFAULT_MODEL;
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
    'Usage: node scripts/personas-harvest.mjs --persona <slug> [--run <ts>]\n' +
      '       node scripts/personas-harvest.mjs --latest\n' +
      '       node scripts/personas-harvest.mjs --list\n' +
      '\n' +
      'Flags:\n' +
      '  --stdout        print harvest to stdout instead of writing harvest.md\n' +
      '  --model <name>  Anthropic model id (default: ' + DEFAULT_MODEL + ')\n',
  );
  process.exit(0);
}

// ─── .env.local loader (ANTHROPIC_API_KEY) ──────────────────────────────────

function loadDotEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadDotEnvLocal();

// ─── Directory discovery (mirrors personas-copy.mjs) ────────────────────────

function listRuns() {
  if (!fs.existsSync(ARTIFACT_ROOT)) return [];
  return fs
    .readdirSync(ARTIFACT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse();
}

function listPersonasInRun(runId) {
  const runDir = path.join(ARTIFACT_ROOT, runId);
  if (!fs.existsSync(runDir)) return [];
  return fs
    .readdirSync(runDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({
      slug: d.name,
      mtime: fs.statSync(path.join(runDir, d.name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
}

// ─── --list ─────────────────────────────────────────────────────────────────

if (flags.list) {
  const runs = listRuns();
  if (runs.length === 0) {
    process.stderr.write(
      `No persona runs found under ${ARTIFACT_ROOT}\n`,
    );
    process.exit(1);
  }
  for (const run of runs.slice(0, 10)) {
    process.stdout.write(`${run}\n`);
    for (const p of listPersonasInRun(run)) {
      const harvestPath = path.join(
        ARTIFACT_ROOT,
        run,
        p.slug,
        'harvest.md',
      );
      const harvested = fs.existsSync(harvestPath) ? ' [harvested]' : '';
      process.stdout.write(`  ${p.slug}${harvested}\n`);
    }
  }
  process.exit(0);
}

// ─── Resolve run + persona ──────────────────────────────────────────────────

const runs = listRuns();
if (runs.length === 0) {
  process.stderr.write(
    `No persona runs found under ${ARTIFACT_ROOT}\n`,
  );
  process.exit(1);
}

const runId = flags.run ?? runs[0];
const runDir = path.join(ARTIFACT_ROOT, runId);
if (!fs.existsSync(runDir)) {
  process.stderr.write(`Run directory not found: ${runDir}\n`);
  process.exit(1);
}

const personas = listPersonasInRun(runId);
if (personas.length === 0) {
  process.stderr.write(`No persona artifacts under ${runDir}\n`);
  process.exit(1);
}

let personaSlug;
if (flags.latest) {
  personaSlug = personas[0].slug;
} else if (flags.persona) {
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
      process.exit(1);
    }
  }
} else {
  process.stderr.write(
    'Either --persona <slug> or --latest is required.\n' +
      'Run --list to see available personas.\n',
  );
  process.exit(2);
}

const personaDir = path.join(runDir, personaSlug);
const transcriptPath = path.join(personaDir, 'transcript.md');
const tracePath = path.join(personaDir, 'trace.json');
const harvestPath = path.join(personaDir, 'harvest.md');

if (!fs.existsSync(transcriptPath)) {
  process.stderr.write(`Missing transcript.md at ${transcriptPath}\n`);
  process.exit(1);
}
if (!fs.existsSync(tracePath)) {
  process.stderr.write(`Missing trace.json at ${tracePath}\n`);
  process.exit(1);
}

const transcript = fs.readFileSync(transcriptPath, 'utf8');
const trace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));

// ─── Build the prompt ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are reviewing a test run of an AI assistant ("Ada") that helps people with disabilities navigate their rights under the ADA. Each test is a scripted persona where a Playwright test drives a simulated conversation with Ada and captures structured observations.

Your job is to read the persona's transcript and trace, then produce a structured review in markdown. You are NOT grading Ada's final verdict — the persona's assertions already did that. You're looking for behavioral quality signals that the deterministic assertions can't see.

Focus on three specific categories:

**Conversation quality**
- Did Ada ask redundant questions (the same info extracted twice)?
- Did Ada ignore or fail to acknowledge key facts the user stated?
- Was Ada's tone consistent with the reading level assigned?
- Did Ada's response shape feel human (pacing, clarifying, empathy) or robotic (field-demanding, abrupt)?

**Tool usage**
- Did extract_field fire when it should have (user stated a name, email, date, etc. but no extract happened)?
- Did Ada call tools in sensible order? Specifically:
    - In discovery flow: match_listing must fire before extract_field goes into intake-only mode
    - finalize_intake should never fire before required fields are extracted on a qualified path
    - match_listing fires at most once per session
- Any tool call that looks anomalous — wrong argument, suspicious repetition?

**Outcome legitimacy**
- If qualified, was qualification actually supported by what the user said?
- If disqualified, was the disqualifying_reason clear and neutral?
- If the session ended active or abandoned, is that consistent with the conversation?

Output format (strict):

\`\`\`markdown
# Harvest — <persona slug>

## Verdict at a glance

One short paragraph describing whether Ada handled this conversation well or poorly, and why.

## Strengths

Bulleted list of what Ada did well. 1-3 items typically. Brief — one line each. Omit if nothing stood out.

## Concerns

Bulleted list of behavioral issues. Each item:
- Single-line description of the concern
- Pointer to the turn(s) or tool call(s) that motivated it (e.g., "turn 4", "extract_field on turn 3")
- Why it matters in one clause

Omit if clean.

## Would debug

If I were Ryan, here's what I'd investigate next. Specific, actionable. Omit if everything looks fine.
\`\`\`

Be terse. No preamble, no reflection, no meta-commentary about your task. Go straight to the verdict.`;

const userContent = `## Persona slug
${trace.persona ?? personaSlug}

## Tags
${(trace.tags ?? []).join(' ')}

## Final state
- Verdict: ${trace.verdict ?? 'unknown'}
- Session status: ${trace.sessionStatus ?? 'unknown'}
- Session id: ${trace.sessionId ?? 'unknown'}
- Turn count: ${trace.turnCount ?? '?'}
- Tools called: ${(trace.toolsCalled ?? []).join(', ') || '(none)'}
- Assertions: ${trace.assertions?.passed ?? 0}/${trace.assertions?.total ?? 0} passed

## Assertion records
${(trace.assertionRecords ?? [])
  .map(
    (a) =>
      `- ${a.passed ? 'PASS' : 'FAIL'} ${a.name}${a.detail ? ` — ${a.detail}` : ''}`,
  )
  .join('\n') || '(none)'}

## Transcript

${transcript}

## Trace events (chronological)

${(trace.events ?? [])
  .map((e) => `- [${e.kind}] ${e.name}${e.data ? ` ${JSON.stringify(e.data)}` : ''}`)
  .join('\n') || '(none)'}
`;

// ─── Call Anthropic API ─────────────────────────────────────────────────────

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  process.stderr.write(
    'ANTHROPIC_API_KEY not set. Add it to .env.local or export it in your shell.\n',
  );
  process.exit(1);
}

process.stderr.write(`Harvesting ${runId}/${personaSlug} with ${flags.model}…\n`);

const startedAt = Date.now();
let response;
try {
  response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: flags.model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
} catch (err) {
  process.stderr.write(
    `Anthropic API request failed: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
}

if (!response.ok) {
  const body = await response.text();
  process.stderr.write(
    `Anthropic API returned ${response.status}: ${body.slice(0, 500)}\n`,
  );
  process.exit(1);
}

const data = await response.json();
const elapsedMs = Date.now() - startedAt;

const textBlocks = (data.content ?? []).filter(
  (b) => b?.type === 'text',
);
const harvestText = textBlocks.map((b) => b.text).join('\n').trim();

if (!harvestText) {
  process.stderr.write('Empty response from Anthropic API.\n');
  process.exit(1);
}

const usage = data.usage ?? {};
const header =
  `<!-- Harvested: ${new Date().toISOString()}\n` +
  `     Model: ${flags.model}\n` +
  `     Input tokens: ${usage.input_tokens ?? '?'}\n` +
  `     Output tokens: ${usage.output_tokens ?? '?'}\n` +
  `     Elapsed: ${elapsedMs}ms\n` +
  `-->\n\n`;

const finalOutput = header + harvestText + '\n';

if (flags.stdout) {
  process.stdout.write(finalOutput);
} else {
  fs.writeFileSync(harvestPath, finalOutput);
  process.stderr.write(`Wrote ${harvestPath}\n`);
  process.stderr.write(
    `Tokens: ${usage.input_tokens ?? '?'} in, ${usage.output_tokens ?? '?'} out · ${elapsedMs}ms\n`,
  );
}
