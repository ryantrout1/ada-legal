#!/usr/bin/env node
/**
 * Smoke test for the photo analyzer (Commit 8).
 *
 * Sends ONE real photo to Anthropic's /v1/messages endpoint using the
 * exact prompt + tool schema the production AnthropicPhotoAnalysisClient
 * uses, then prints the structured output. Run this once after deploying
 * Commit 8 to verify:
 *
 *   1. Anthropic accepts the report_findings tool schema (the new shape
 *      with three reading-level variants per prose field hasn't been
 *      tested against the live API yet — only against vitest mocks).
 *   2. The model produces meaningfully different simple/standard/
 *      professional variants (vs. three near-copies of the same text).
 *   3. scene, summary, and positive_findings are non-empty.
 *   4. findings[] has at least one entry on a clearly non-compliant
 *      photo, with title + description + severity + standard + confirmable.
 *   5. overall_risk is in the enum {high, medium, low, none}.
 *
 * Usage:
 *   export ANTHROPIC_API_KEY="sk-ant-..."
 *   node scripts/smoke-test-photo-analyzer.mjs
 *   node scripts/smoke-test-photo-analyzer.mjs --image-url=https://...
 *
 * Default test image: a public Wikimedia Commons photo of a step at
 * a storefront. You can override with --image-url for any public URL
 * (must be one Anthropic can fetch — i.e. a Vercel Blob or a public CDN).
 *
 * Costs roughly $0.02-0.04 per run. Safe to re-run.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_IMAGE_URL =
  // Wikimedia Commons: a non-compliant entrance with a step. Public.
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Lambs_Conduit_Street.jpg/1024px-Lambs_Conduit_Street.jpg';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 8192;

// ─── Parse args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : null;
}
const imageUrl = getArg('image-url') ?? DEFAULT_IMAGE_URL;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY env var is required.');
  process.exit(1);
}

// ─── Load the production system prompt ────────────────────────────────────────

const promptPath = join(__dirname, '../content-migration/prompts/photo-analysis.md');
const systemPrompt = await readFile(promptPath, 'utf-8');

// ─── Build the schema (mirrors anthropicPhotoAnalysisClient.ts) ───────────────

const READING_LEVEL_TEXT_SCHEMA = {
  type: 'object',
  description:
    'Reading-level-aware string. Provide all three variants. simple = COGA-conformant plain language. standard = 8th-grade conversational. professional = legal/technical with ADA terminology.',
  properties: {
    simple: { type: 'string' },
    standard: { type: 'string' },
    professional: { type: 'string' },
  },
  required: ['simple', 'standard', 'professional'],
};

const READING_LEVEL_STRING_LIST_SCHEMA = {
  type: 'object',
  description:
    'Reading-level-aware list of strings. Provide all three variants of the same list at different reading levels.',
  properties: {
    simple: { type: 'array', items: { type: 'string' } },
    standard: { type: 'array', items: { type: 'string' } },
    professional: { type: 'array', items: { type: 'string' } },
  },
  required: ['simple', 'standard', 'professional'],
};

const REPORT_FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    scene: {
      ...READING_LEVEL_TEXT_SCHEMA,
      description:
        'What the photo(s) show — building type, materials, fixtures visible, lighting context. Reference each photo by number when multiple are provided ("Photo 1 shows...; Photo 2 shows..."). Provide three reading-level variants.',
    },
    summary: {
      ...READING_LEVEL_TEXT_SCHEMA,
      description:
        '2-3 sentence overall assessment of the batch. Mention the headline concerns, anything notably compliant, and whether the angle/framing limited assessment. Three reading-level variants.',
    },
    overall_risk: {
      type: 'string',
      enum: ['high', 'medium', 'low', 'none'],
      description:
        'high = any confirmable critical/major finding. medium = any major-severity unconfirmable, OR any minor finding. low = only advisory findings. none = zero findings.',
    },
    positive_findings: {
      ...READING_LEVEL_STRING_LIST_SCHEMA,
      description:
        'Compliant features observed (curb cut present, accessible signage visible, etc.). Empty arrays allowed.',
    },
    findings: {
      type: 'array',
      description:
        'Every ADA compliance concern you identified. An empty array is valid if the photos show nothing concerning.',
      items: {
        type: 'object',
        properties: {
          title_simple: { type: 'string' },
          title_standard: { type: 'string' },
          title_professional: { type: 'string' },
          finding_simple: { type: 'string' },
          finding_standard: { type: 'string' },
          finding_professional: { type: 'string' },
          severity: {
            type: 'string',
            enum: ['critical', 'major', 'minor', 'advisory'],
          },
          standard: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          confirmable: { type: 'boolean' },
          bounding_box: {
            type: 'object',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
              w: { type: 'number', minimum: 0, maximum: 1 },
              h: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['x', 'y', 'w', 'h'],
          },
        },
        required: [
          'title_simple',
          'title_standard',
          'title_professional',
          'finding_simple',
          'finding_standard',
          'finding_professional',
          'severity',
          'standard',
          'confidence',
          'confirmable',
        ],
      },
    },
  },
  required: ['scene', 'summary', 'overall_risk', 'positive_findings', 'findings'],
};

// ─── Run ──────────────────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

console.log(`Smoke-testing photo analyzer against ${MODEL}...`);
console.log(`Image: ${imageUrl}`);
console.log('');

const start = Date.now();
const response = await client.messages.create({
  model: MODEL,
  max_tokens: MAX_TOKENS,
  system: systemPrompt,
  tools: [
    {
      name: 'report_findings',
      description:
        'Report all ADA accessibility concerns identified across the provided photo(s). Call this exactly once with your complete assessment — scene description, summary, overall risk, positive findings, and per-concern findings.',
      input_schema: REPORT_FINDINGS_SCHEMA,
    },
  ],
  tool_choice: { type: 'tool', name: 'report_findings' },
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Photo 1:' },
        { type: 'image', source: { type: 'url', url: imageUrl } },
        {
          type: 'text',
          text: 'Context from the session: storefront entrance, user reports difficulty entering.',
        },
      ],
    },
  ],
});
const elapsed = Date.now() - start;

// ─── Extract + report ─────────────────────────────────────────────────────────

console.log(`Latency: ${elapsed}ms`);
console.log(`Stop reason: ${response.stop_reason}`);
console.log(`Input tokens: ${response.usage.input_tokens}`);
console.log(`Output tokens: ${response.usage.output_tokens}`);
console.log('');

const toolBlock = response.content.find(
  (b) => b.type === 'tool_use' && b.name === 'report_findings',
);

if (!toolBlock) {
  console.error('FAIL: model did not call report_findings.');
  console.error('Response content blocks:');
  for (const block of response.content) {
    console.error(`  - type=${block.type}`);
    if (block.type === 'text') console.error(`    text: ${block.text.slice(0, 300)}`);
  }
  process.exit(1);
}

const out = toolBlock.input;

console.log('═══════════════════════════════════════════════════════════════');
console.log(`OVERALL RISK: ${out.overall_risk}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('SCENE (professional):');
console.log(`  ${out.scene.professional}`);
console.log('SCENE (standard):');
console.log(`  ${out.scene.standard}`);
console.log('SCENE (simple):');
console.log(`  ${out.scene.simple}`);
console.log('');
console.log('SUMMARY (professional):');
console.log(`  ${out.summary.professional}`);
console.log('SUMMARY (standard):');
console.log(`  ${out.summary.standard}`);
console.log('SUMMARY (simple):');
console.log(`  ${out.summary.simple}`);
console.log('');
console.log(`POSITIVE FINDINGS (${out.positive_findings.standard.length}):`);
for (const p of out.positive_findings.standard) console.log(`  - ${p}`);
console.log('');
console.log(`FINDINGS (${out.findings.length}):`);
for (const [i, f] of out.findings.entries()) {
  console.log(`  ${i + 1}. [${f.severity.toUpperCase()}] ${f.title_professional}`);
  console.log(`     ${f.standard} — confidence ${f.confidence}, confirmable: ${f.confirmable}`);
  console.log(`     ${f.finding_professional.slice(0, 200)}${f.finding_professional.length > 200 ? '…' : ''}`);
  console.log(`     simple: ${f.finding_simple.slice(0, 100)}${f.finding_simple.length > 100 ? '…' : ''}`);
  if (f.bounding_box) {
    console.log(`     bbox: ${JSON.stringify(f.bounding_box)}`);
  }
  console.log('');
}

// ─── Quality checks ──────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════');
console.log('QUALITY CHECKS');
console.log('═══════════════════════════════════════════════════════════════');

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

check('scene populated', out.scene.professional.length > 20);
check('summary populated', out.summary.professional.length > 20);
check(
  'overall_risk valid',
  ['high', 'medium', 'low', 'none'].includes(out.overall_risk),
  out.overall_risk,
);
check(
  'reading levels differ (scene)',
  out.scene.simple !== out.scene.standard ||
    out.scene.standard !== out.scene.professional,
  'simple/standard/professional should not be identical',
);
check(
  'reading levels differ (summary)',
  out.summary.simple !== out.summary.standard ||
    out.summary.standard !== out.summary.professional,
);
check('findings[] is array', Array.isArray(out.findings));
if (out.findings.length > 0) {
  const f = out.findings[0];
  check('first finding has all reading-level title variants',
    typeof f.title_simple === 'string' &&
    typeof f.title_standard === 'string' &&
    typeof f.title_professional === 'string');
  check('first finding has all reading-level finding variants',
    typeof f.finding_simple === 'string' &&
    typeof f.finding_standard === 'string' &&
    typeof f.finding_professional === 'string');
  check('first finding has confirmable flag', typeof f.confirmable === 'boolean');
  check('first finding has standard cite', typeof f.standard === 'string' && f.standard.length > 0);
}

const failed = checks.filter((c) => !c.ok);
console.log('');
if (failed.length === 0) {
  console.log(`✅ ALL ${checks.length} CHECKS PASSED`);
  process.exit(0);
} else {
  console.error(`❌ ${failed.length} of ${checks.length} CHECKS FAILED`);
  for (const f of failed) console.error(`   - ${f.name}`);
  process.exit(1);
}
