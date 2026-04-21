/**
 * Prompt assembler.
 *
 * Pure function. Given a session context, returns the system prompt text
 * the AI will see for this turn. No I/O, no randomness, no DB lookups —
 * the caller supplies everything. Tests call it with hand-built contexts
 * and assert on the returned string.
 *
 * Six sections in fixed order (per brief §8):
 *   1. Identity     — who Ada is, her goals, Title I/II/III routing rules
 *   2. Org context  — display name + any org-specific instructions
 *   3. Listing      — Ch1 per-listing overlay (null in Ch0)
 *   4. Reading      — detailed style guide for simple / standard / professional
 *   5. Tools        — auto-generated catalog from CH0_TOOLS registry
 *   6. Session ctx  — classification, extracted fields, status
 *
 * Design principles:
 *   - Deterministic: same inputs → same output. No timestamps, no
 *     randomness, no "current date" string.
 *   - Ordered: the six sections always appear in the same order, even
 *     when one is empty. Predictable layout lets us diff prompt output
 *     in tests without noise.
 *   - Human-authored content lives in /content-migration/prompts/*.md.
 *     This file is the scaffolding; the words live there.
 *
 * Ref: docs/ARCHITECTURE.md §8
 */

import type { AdaSessionState } from '../types.js';
import type { ReadingLevel } from '../../types/db.js';
import type { AnyAdaTool } from '../tools/types.js';
import { CH0_TOOLS } from '../tools/registry.js';

import adaIdentity from '../../../content-migration/prompts/ada-identity.js';
import readingLevelsDoc from '../../../content-migration/prompts/reading-levels.js';

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface AssemblePromptContext {
  state: AdaSessionState;
  /** Org display name for the greeting. */
  orgDisplayName: string;
  /** Org-specific instructions appended after the base identity. Null ⇒ none. */
  orgAdaIntroPrompt: string | null;
  /** Ch1: per-listing overlay. Null for public Ch0 sessions. */
  listingAdaPromptOverride?: string | null;
  /** Tool registry to render into the prompt. Defaults to CH0_TOOLS. */
  tools?: ReadonlyArray<AnyAdaTool>;
}

// ─── Assembler ────────────────────────────────────────────────────────────────

export function assemblePrompt(ctx: AssemblePromptContext): string {
  const sections = [
    section('IDENTITY', buildIdentitySection(ctx)),
    section('ORG CONTEXT', buildOrgSection(ctx)),
    section('LISTING CONTEXT', buildListingSection(ctx)),
    section('READING LEVEL', buildReadingLevelSection(ctx.state.readingLevel)),
    section('TOOLS', buildToolsSection(ctx.tools ?? CH0_TOOLS)),
    section('CURRENT SESSION', buildSessionContextSection(ctx.state)),
  ];
  return sections.filter((s) => s.trim().length > 0).join('\n\n');
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildIdentitySection(_ctx: AssemblePromptContext): string {
  return adaIdentity.trim();
}

function buildOrgSection(ctx: AssemblePromptContext): string {
  const parts: string[] = [];
  parts.push(`This session belongs to the **${ctx.orgDisplayName}** organization.`);
  if (ctx.orgAdaIntroPrompt && ctx.orgAdaIntroPrompt.trim().length > 0) {
    parts.push(ctx.orgAdaIntroPrompt.trim());
  }
  return parts.join('\n\n');
}

function buildListingSection(ctx: AssemblePromptContext): string {
  const override = ctx.listingAdaPromptOverride;
  if (!override || override.trim().length === 0) return '';
  return override.trim();
}

function buildReadingLevelSection(level: ReadingLevel): string {
  // Extract the matching section from the reading-levels doc. The doc uses
  // '## simple (…)', '## standard (…)', '## professional (…)' headers.
  const labelMap: Record<ReadingLevel, string> = {
    simple: 'simple',
    standard: 'standard',
    professional: 'professional',
  };
  const wanted = labelMap[level];
  const sections = readingLevelsDoc.split(/^## /m).slice(1);
  for (const s of sections) {
    if (s.toLowerCase().startsWith(wanted)) {
      return `## Reading level: ${wanted}\n\n${s.replace(/^[^\n]*\n\n/, '').trim()}`;
    }
  }
  // Fallback: return all of it so something still shows up if the doc changes shape.
  return readingLevelsDoc.trim();
}

function buildToolsSection(tools: ReadonlyArray<AnyAdaTool>): string {
  if (tools.length === 0) return 'No tools available this turn.';
  const lines: string[] = [
    'The following tools are available. Use them whenever they apply — do not ask the user before using a tool.',
  ];
  for (const tool of tools) {
    lines.push('');
    lines.push(`### ${tool.name}`);
    lines.push(tool.description);
    lines.push('Input schema:');
    lines.push('```json');
    lines.push(JSON.stringify(tool.inputSchema, null, 2));
    lines.push('```');
  }
  return lines.join('\n');
}

function buildSessionContextSection(state: AdaSessionState): string {
  const parts: string[] = [];
  parts.push(`Session status: **${state.status}**.`);

  if (state.classification) {
    const c = state.classification;
    parts.push(
      `You have already classified this session as **Title ${c.title}** with tier **${c.tier}** (reasoning: ${c.reasoning}; cited ${c.standard}). Do not call \`set_classification\` again unless your assessment has materially changed.`,
    );
  } else {
    parts.push('No classification set yet. Call `set_classification` as soon as you have medium or high confidence.');
  }

  const fieldKeys = Object.keys(state.extractedFields);
  if (fieldKeys.length > 0) {
    const fieldsLine = fieldKeys
      .map((k) => {
        const entry = state.extractedFields[k];
        const valueStr = entry.value === null ? 'null' : JSON.stringify(entry.value);
        return `${k}=${valueStr}`;
      })
      .join(', ');
    parts.push(`Fields already extracted: ${fieldsLine}. Don't re-ask questions you have answers for.`);
  } else {
    parts.push('No fields extracted yet.');
  }

  return parts.join('\n\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function section(title: string, body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) return '';
  return `---\n# ${title}\n\n${trimmed}`;
}
