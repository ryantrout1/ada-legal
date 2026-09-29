/**
 * Model upgrade /plan Phase 1b: one module owns every in-scope Claude model ID.
 *
 * Two guarantees:
 *   1. Moving a surface to a new model is a one-line change in
 *      src/lib/claudeModels.ts, so a Claude model ID string must not appear
 *      as a literal anywhere else in src/ or api/ (comments excepted).
 *   2. The values pinned below are what production runs. Each upgrade phase
 *      changes exactly the slot it moves, and this pin changes with it.
 *
 * The scanner checks itself on inline samples first, so a scanner that has
 * quietly stopped matching cannot pass the repo scan by finding nothing.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCAN_DIRS = ['src', 'api'];
const SCAN_EXT = /\.(ts|tsx|js|jsx|mjs)$/;

/**
 * Files allowed to hold model literals: the module itself, and the photo
 * analyzer tool, which is out of scope for the upgrade and being retired.
 */
const ALLOWLIST = new Set([
  'src/lib/claudeModels.ts',
  'src/engine/clients/anthropicPhotoAnalysisClient.ts',
]);

const MODEL_LITERAL = /(['"`])(claude-(?:opus|sonnet|haiku|fable|mythos)-[0-9][a-z0-9.-]*)\1/g;

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

export function findModelLiterals(source: string): string[] {
  return [...stripComments(source).matchAll(MODEL_LITERAL)].map((m) => m[2]);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (SCAN_EXT.test(name)) out.push(full);
  }
  return out;
}

describe('model literal scanner', () => {
  it('finds a model ID in a string literal', () => {
    expect(findModelLiterals(`const m = 'claude-opus-5';`)).toEqual(['claude-opus-5']);
    expect(findModelLiterals('new Set([X, "claude-sonnet-5"])')).toEqual(['claude-sonnet-5']);
  });

  it('ignores model IDs inside comments', () => {
    expect(findModelLiterals(`// default 'claude-opus-4-8'`)).toEqual([]);
    expect(findModelLiterals(`/* was 'claude-sonnet-4-5' */ const x = 1;`)).toEqual([]);
    expect(findModelLiterals('/**\n * Set to `claude-haiku-4-5` for speed.\n */')).toEqual([]);
  });

  it('keeps a literal that shares a line with a URL', () => {
    expect(findModelLiterals(`fetch('https://x.test'); const m = 'claude-opus-5';`)).toEqual(['claude-opus-5']);
  });
});

describe('Claude model IDs live in one module', () => {
  it('no src/ or api/ file outside the module holds a model ID literal', () => {
    const offenders: string[] = [];
    for (const dir of SCAN_DIRS) {
      for (const file of walk(join(ROOT, dir))) {
        const rel = relative(ROOT, file).split('\\').join('/');
        if (ALLOWLIST.has(rel)) continue;
        for (const id of findModelLiterals(readFileSync(file, 'utf8'))) offenders.push(`${rel}: ${id}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('CLAUDE_MODELS', () => {
  it('pins the models production runs today', async () => {
    const { CLAUDE_MODELS } = await import('@/lib/claudeModels');
    expect(CLAUDE_MODELS).toEqual({
      adaChat: 'claude-sonnet-5-5',
      spotPhotoReading: 'claude-opus-5-5',
      spotReport: 'claude-opus-5-5',
      spotPlacement: 'claude-opus-5-5',
      spotPlacementCompare: 'claude-sonnet-5-5',
      guideAssistant: 'claude-sonnet-5-5',
    });
  });

  it('is frozen', async () => {
    const { CLAUDE_MODELS } = await import('@/lib/claudeModels');
    expect(Object.isFrozen(CLAUDE_MODELS)).toBe(true);
  });

  it('feeds every consumer constant', async () => {
    const { CLAUDE_MODELS, SPOT_PLACEMENT_PREVIEW_MODELS } = await import('@/lib/claudeModels');
    const { SPOT_REPORT_MODELS, SPOT_REPORT_DEFAULT_MODEL } = await import('@/lib/spot/parseRegenerateBody');
    const placeMod = await import('@/lib/spot/placeFindingAnthropic');
    const { SPOT_PLACEMENT_MODEL } = placeMod;
    const { GUIDE_ASSISTANT_MODEL } = await import('@/lib/guide/guideAssistant');

    expect(SPOT_REPORT_MODELS).toEqual([CLAUDE_MODELS.spotReport]);
    expect(SPOT_REPORT_DEFAULT_MODEL).toBe(CLAUDE_MODELS.spotReport);
    expect('PLACEMENT_MODEL_DEFAULT' in placeMod, 'the /photo-only default is gone').toBe(false);
    expect(SPOT_PLACEMENT_MODEL).toBe(CLAUDE_MODELS.spotPlacement);
    expect(GUIDE_ASSISTANT_MODEL).toBe(CLAUDE_MODELS.guideAssistant);
    expect(SPOT_PLACEMENT_PREVIEW_MODELS).toEqual([
      CLAUDE_MODELS.spotPlacement,
      CLAUDE_MODELS.spotPlacementCompare,
    ]);
  });
});

describe('Spot photo reader (upgrade Phase 3a)', () => {
  it('is its own analyzer instance built from the spotPhotoReading slot', async () => {
    const { makeAdaClients } = await import('@/engine/clients/adaClients');
    const { CLAUDE_MODELS } = await import('@/lib/claudeModels');
    const clients = makeAdaClients({
      databaseUrl: 'postgres://u:p@localhost/db',
      anthropicApiKey: 'test-key',
      photoAnalysisModel: 'claude-shared-analyzer-override',
    } as never);
    expect(clients.spotPhoto).toBeDefined();
    expect(clients.spotPhoto).not.toBe(clients.photo);
    expect((clients.spotPhoto as unknown as { model: string }).model).toBe(
      CLAUDE_MODELS.spotPhotoReading,
    );
    // The shared analyzer keeps its own setting.
    expect((clients.photo as unknown as { model: string }).model).toBe(
      'claude-shared-analyzer-override',
    );
  });

  it('Spot endpoints read photos only through clients.spotPhoto', () => {
    for (const rel of ['api/spot/analyze.ts', 'src/lib/spot/generateReport.ts']) {
      const code = stripComments(readFileSync(join(ROOT, rel), 'utf8'));
      expect(code, rel).not.toMatch(/clients\.photo\b/);
      expect(code, rel).toMatch(/clients\.spotPhoto\./);
    }
  });
});
