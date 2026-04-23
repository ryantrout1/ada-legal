/**
 * PersonaRecorder — captures trace / transcript / assertions artifacts
 * for Step 28 persona runs.
 *
 * Usage in a spec:
 *
 *   import { personaTest, PersonaRecorder } from './harness/personaHarness.js';
 *
 *   personaTest('listing-scoped-qualified', {
 *     tags: ['@harness-a', '@qualified'],
 *   }, async ({ page, recorder }) => {
 *     await page.goto('/class-actions/hotel-accessible-room-fraud');
 *     await recorder.step('landed-on-detail');
 *     ...
 *   });
 *
 * On teardown the recorder writes three files under
 *   test-results/personas/<run-id>/<persona-slug>/
 *     transcript.md   — human-readable user/Ada turns
 *     trace.json      — structured trace data
 *     assertions.log  — one line per assertion, pass/fail
 *
 * Design principles:
 *   - No AI calls at record time. Harvester is a separate opt-in pass.
 *   - Filesystem writes only. No DB, no UI. Copy-all = cat three files.
 *   - Idempotent. Running the same persona twice is safe; each run gets
 *     its own timestamped directory.
 *   - Soft on failure. An assertion failure logs but doesn't stop the
 *     recorder — we want the full transcript even when something broke,
 *     since that's precisely when it's useful.
 *
 * Ref: Step 28, Commit 1.
 */

import { test as baseTest, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Directory root where persona artifacts are written.
 *
 * PERSONA_RUN_ID env var lets an external runner (CI, a local wrapper
 * script) group multiple personas under a single timestamp. If unset,
 * each invocation gets its own timestamp.
 */
export const RUN_ID = process.env.PERSONA_RUN_ID ?? isoStamp();
export const ARTIFACT_ROOT = path.resolve(
  process.cwd(),
  'test-results',
  'personas',
  RUN_ID,
);

function isoStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export interface TranscriptTurn {
  turn: number;
  role: 'user' | 'assistant';
  content: string;
  tools?: string[];
  timestamp: string;
}

export interface AssertionRecord {
  name: string;
  passed: boolean;
  detail?: string;
  timestamp: string;
}

export interface TraceEvent {
  kind: 'step' | 'navigate' | 'state' | 'error';
  name: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface TraceSummary {
  persona: string;
  slug: string;
  tags: string[];
  runId: string;
  target: string;
  baseUrl: string;
  gitSha: string | null;
  startedAt: string;
  endedAt: string | null;
  sessionId: string | null;
  sessionStatus: string | null;
  turnCount: number;
  toolsCalled: string[];
  assertions: {
    total: number;
    passed: number;
    failed: number;
  };
  events: TraceEvent[];
  turns: TranscriptTurn[];
  assertionRecords: AssertionRecord[];
  verdict: 'pass' | 'fail' | 'error';
}

/**
 * The recorder object injected into each persona test. Tests should use
 * this surface (not direct fs calls) so the output format stays
 * consistent across all personas.
 */
export class PersonaRecorder {
  private readonly summary: TraceSummary;
  private readonly artifactDir: string;

  constructor(
    persona: string,
    tags: string[],
    baseUrl: string,
  ) {
    const slug = persona.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.artifactDir = path.join(ARTIFACT_ROOT, slug);
    fs.mkdirSync(this.artifactDir, { recursive: true });

    this.summary = {
      persona,
      slug,
      tags,
      runId: RUN_ID,
      target: process.env.PLAYWRIGHT_TARGET ?? 'local',
      baseUrl,
      gitSha: process.env.GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      sessionId: null,
      sessionStatus: null,
      turnCount: 0,
      toolsCalled: [],
      assertions: { total: 0, passed: 0, failed: 0 },
      events: [],
      turns: [],
      assertionRecords: [],
      verdict: 'pass',
    };
  }

  /** Readonly view of the trace in progress. Personas read this to make
   *  decisions (e.g., break out of the turn loop when session completes). */
  get trace(): Readonly<TraceSummary> {
    return this.summary;
  }

  /** Log a freeform step event in the trace. Useful for debugging. */
  step(name: string, data?: Record<string, unknown>): void {
    this.summary.events.push({
      kind: 'step',
      name,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /** Log a navigation event. */
  navigate(url: string): void {
    this.summary.events.push({
      kind: 'navigate',
      name: url,
      timestamp: new Date().toISOString(),
    });
  }

  /** Record a user turn. */
  userTurn(content: string): void {
    this.summary.turnCount += 1;
    this.summary.turns.push({
      turn: this.summary.turnCount,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    });
  }

  /** Record an assistant turn, with any tools that fired. */
  assistantTurn(content: string, tools?: string[]): void {
    this.summary.turnCount += 1;
    this.summary.turns.push({
      turn: this.summary.turnCount,
      role: 'assistant',
      content,
      tools,
      timestamp: new Date().toISOString(),
    });
    if (tools) {
      for (const t of tools) {
        if (!this.summary.toolsCalled.includes(t)) {
          this.summary.toolsCalled.push(t);
        }
      }
    }
  }

  /** Record an assertion outcome. Does not throw on failure — the caller
   *  decides whether to stop, via Playwright's expect chain. */
  assertion(name: string, passed: boolean, detail?: string): void {
    this.summary.assertions.total += 1;
    if (passed) this.summary.assertions.passed += 1;
    else this.summary.assertions.failed += 1;
    this.summary.assertionRecords.push({
      name,
      passed,
      detail,
      timestamp: new Date().toISOString(),
    });
    if (!passed && this.summary.verdict === 'pass') {
      this.summary.verdict = 'fail';
    }
  }

  /** Capture the current session_id + status from the chat container. */
  async captureSessionState(page: Page): Promise<void> {
    try {
      const container = page.locator('[aria-label="Conversation with Ada"]');
      if (await container.count()) {
        this.summary.sessionId =
          (await container.getAttribute('data-session-id')) || null;
        this.summary.sessionStatus =
          (await container.getAttribute('data-session-status')) || null;
      }
    } catch (err) {
      this.summary.events.push({
        kind: 'error',
        name: 'captureSessionState failed',
        data: { error: err instanceof Error ? err.message : String(err) },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** Called from the Playwright fixture teardown. Writes all artifacts. */
  finalize(verdict: 'pass' | 'fail' | 'error'): void {
    if (this.summary.verdict === 'pass') this.summary.verdict = verdict;
    this.summary.endedAt = new Date().toISOString();

    fs.writeFileSync(
      path.join(this.artifactDir, 'trace.json'),
      JSON.stringify(this.summary, null, 2),
    );
    fs.writeFileSync(
      path.join(this.artifactDir, 'transcript.md'),
      renderTranscript(this.summary),
    );
    fs.writeFileSync(
      path.join(this.artifactDir, 'assertions.log'),
      renderAssertions(this.summary),
    );
  }
}

function renderTranscript(s: TraceSummary): string {
  const lines: string[] = [];
  lines.push(`# Persona transcript — ${s.persona}`);
  lines.push('');
  lines.push(`- Run: \`${s.runId}\``);
  lines.push(`- Target: \`${s.target}\` (${s.baseUrl})`);
  lines.push(`- Started: ${s.startedAt}`);
  lines.push(`- Ended: ${s.endedAt ?? '(in progress)'}`);
  lines.push(`- Session: \`${s.sessionId ?? '(unknown)'}\` (${s.sessionStatus ?? '(unknown)'})`);
  lines.push(`- Verdict: **${s.verdict.toUpperCase()}**`);
  lines.push(`- Turns: ${s.turnCount}`);
  if (s.toolsCalled.length > 0) {
    lines.push(`- Tools called: ${s.toolsCalled.join(', ')}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  for (const t of s.turns) {
    const who = t.role === 'user' ? '**You**' : '**Ada**';
    lines.push(`### Turn ${t.turn} — ${who}`);
    lines.push('');
    lines.push(t.content || '*(empty)*');
    if (t.tools && t.tools.length > 0) {
      lines.push('');
      lines.push(`*tools: ${t.tools.join(', ')}*`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function renderAssertions(s: TraceSummary): string {
  const lines: string[] = [];
  lines.push(`# Assertions for ${s.persona}`);
  lines.push('');
  lines.push(
    `PASS: ${s.assertions.passed}  FAIL: ${s.assertions.failed}  ` +
      `TOTAL: ${s.assertions.total}`,
  );
  lines.push('');
  for (const a of s.assertionRecords) {
    const mark = a.passed ? '✓' : '✗';
    const detail = a.detail ? ` — ${a.detail}` : '';
    lines.push(`  ${mark} ${a.name}${detail}`);
  }
  return lines.join('\n');
}

// ─── Playwright fixture ──────────────────────────────────────────────────────

interface PersonaFixtures {
  recorder: PersonaRecorder;
}

/**
 * Extended test with a `recorder` fixture. Each test declares a persona
 * name and tags via the fixture's constructor by calling
 * test.describe('persona-name', () => { ... }) and tagging the block
 * with test.describe.configure.
 *
 * Simpler pattern for now: each persona file calls `personaTest`
 * (wrapper below) which handles recorder lifecycle.
 */
export const test = baseTest.extend<PersonaFixtures>({
  recorder: async ({ baseURL }, use, testInfo) => {
    const persona = testInfo.title;
    const tags = testInfo.tags;
    const recorder = new PersonaRecorder(persona, tags, baseURL ?? 'unknown');
    recorder.step('test-started');
    try {
      await use(recorder);
    } finally {
      // At teardown time testInfo.status may still be 'running' — safer
      // to check errors. Any Playwright expect() that threw, or any
      // uncaught error in the test body, shows up here.
      const failed = testInfo.errors.length > 0;
      recorder.finalize(failed ? 'fail' : 'pass');
    }
  },
});

export { expect } from '@playwright/test';

// ─── Shared conversation helpers ─────────────────────────────────────────────
//
// Every persona that drives the public chat UI follows the same pattern:
// send a user message, wait for Ada's response, parse out the tools row,
// record it. These helpers centralize that pattern so if the rendering
// shape changes (tools are hidden, or moved, or displayed differently) we
// fix it once instead of in every persona.

import { type Locator } from '@playwright/test';

/** Default timeout for one Ada turn. Real LLM calls are 8-20s; we budget
 *  90s to stay green on a slow network or a cold function. */
export const DEFAULT_TURN_TIMEOUT_MS = 90_000;

/**
 * Extract the list of tool names Ada called on this turn from a
 * rendered assistant bubble. The MessageBubble component renders
 * "tools: match_listing, extract_field" as a small mono-font line at
 * the end when message.tools is set. Returns an empty array if no
 * tools line is present (which is common — most turns call no tools).
 */
export function parseToolsFromBubbleText(text: string): string[] {
  const m = text.match(/tools:\s*([^\n]+)\s*$/);
  if (!m) return [];
  return m[1]!.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Strip the "You"/"Ada" leading label and the trailing tools line from
 *  a raw bubble textContent() so only the actual message body remains. */
export function cleanBubbleContent(text: string): string {
  return text
    .replace(/^(You|Ada)\s*/, '')
    .replace(/\n?tools:\s*[^\n]+\s*$/, '')
    .trim();
}

/**
 * Wait for Ada's busy state (the data-busy attribute on the
 * conversation container) to drop to 'false', signaling the server-
 * side turn completed and the bubble is fully rendered.
 */
export async function waitForTurnComplete(
  conversation: Locator,
  timeoutMs: number = DEFAULT_TURN_TIMEOUT_MS,
): Promise<void> {
  const { expect } = await import('@playwright/test');
  await expect
    .poll(
      async () => (await conversation.getAttribute('data-busy')) ?? 'true',
      { timeout: timeoutMs, intervals: [500, 1000, 2000] },
    )
    .toBe('false');
}

/**
 * Wait for the chat hook to have adopted a session (session_id goes
 * from empty to a uuid). Used at the start of every persona that
 * drives the public chat UI.
 */
export async function waitForSessionAdopted(
  conversation: Locator,
  timeoutMs: number = 15_000,
): Promise<void> {
  const { expect } = await import('@playwright/test');
  await expect
    .poll(
      async () => (await conversation.getAttribute('data-session-id')) || '',
      { timeout: timeoutMs, intervals: [500, 1000, 2000] },
    )
    .not.toBe('');
}

/**
 * Throw a descriptive Error if the recorder has any failed assertions.
 * Every persona's happy-path end should call this so Playwright marks
 * the test failed when assertions recorded soft failures.
 */
export function throwIfAssertionsFailed(recorder: PersonaRecorder): void {
  if (recorder.trace.assertions.failed > 0) {
    throw new Error(
      `${recorder.trace.assertions.failed} persona assertion(s) failed. ` +
        `See test-results/personas/<run>/${recorder.trace.slug}/assertions.log`,
    );
  }
}
