#!/usr/bin/env node
/**
 * Smoke test for the photo analyzer (Commit 8).
 *
 * Sends ONE real photo to Anthropic's /v1/messages endpoint using the
 * exact prompt + tool schema the production AnthropicPhotoAnalysisClient
 * uses, then prints the structured output + the call latency. Run this
 * after deploying to verify:
 *
 *   1. Anthropic accepts the standard-only report_findings tool schema.
 *   2. scene, summary, and positive_findings are non-empty (standard).
 *   3. findings[] has at least one entry on a clearly non-compliant
 *      photo, with title + finding + severity + standard + confirmable.
 *   4. overall_risk is in the enum {high, medium, low, none}.
 *   5. Latency / output tokens — the standard-only output should be
 *      well under the 45–90s the three-level schema produced.
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
// Mirror production: the standard-only path lowered the cap to 4096.
const MAX_TOKENS = 4096;

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

const REPORT_FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    scene: {
      type: 'string',
      description:
        'What the photo(s) show — building type, materials, fixtures visible, lighting context. Reference each photo by number when multiple are provided ("Photo 1 shows...; Photo 2 shows..."). Standard (8th-grade) reading level.',
    },
    summary: {
      type: 'string',
      description:
        '2-3 sentence overall assessment of the batch. Mention the headline concerns, anything notably compliant, and whether the angle/framing limited assessment. Standard reading level.',
    },
    overall_risk: {
      type: 'string',
      enum: ['high', 'medium', 'low', 'none'],
      description:
        'high = any confirmable critical/major finding. medium = any major-severity unconfirmable, OR any minor finding. low = only advisory findings. none = zero findings.',
    },
    positive_findings: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Compliant features observed (curb cut present, accessible signage visible, etc.). Empty array allowed. Standard reading level.',
    },
    findings: {
      type: 'array',
      description:
        'Every ADA compliance concern you identified. An empty array is valid if the photos show nothing concerning.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          finding: { type: 'string' },
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
        required: ['title', 'finding', 'severity', 'standard', 'confidence', 'confirmable'],
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
console.log('SCENE (standard):');
console.log(`  ${out.scene}`);
console.log('');
console.log('SUMMARY (standard):');
console.log(`  ${out.summary}`);
console.log('');
console.log(`POSITIVE FINDINGS (${out.positive_findings.length}):`);
for (const p of out.positive_findings) console.log(`  - ${p}`);
console.log('');
console.log(`FINDINGS (${out.findings.length}):`);
for (const [i, f] of out.findings.entries()) {
  console.log(`  ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`);
  console.log(`     ${f.standard} — confidence ${f.confidence}, confirmable: ${f.confirmable}`);
  console.log(`     ${f.finding.slice(0, 200)}${f.finding.length > 200 ? '…' : ''}`);
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

check('scene populated', typeof out.scene === 'string' && out.scene.length > 20);
check('summary populated', typeof out.summary === 'string' && out.summary.length > 20);
check(
  'overall_risk valid',
  ['high', 'medium', 'low', 'none'].includes(out.overall_risk),
  out.overall_risk,
);
check('positive_findings is array', Array.isArray(out.positive_findings));
check('findings[] is array', Array.isArray(out.findings));
if (out.findings.length > 0) {
  const f = out.findings[0];
  check('first finding has standard title', typeof f.title === 'string' && f.title.length > 0);
  check('first finding has standard finding text', typeof f.finding === 'string' && f.finding.length > 0);
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
