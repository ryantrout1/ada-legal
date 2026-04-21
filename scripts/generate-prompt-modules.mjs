#!/usr/bin/env node
/**
 * Regenerate TypeScript prompt modules from the markdown source files.
 *
 * Run after editing any content-migration/prompts/*.md:
 *   node scripts/generate-prompt-modules.mjs
 *
 * Why this exists:
 * The engine imports these prompts at module scope. We USED to use Vite's
 * `?raw` suffix (`import md from '@content/prompts/foo.md?raw'`) which
 * worked great in Vite + vitest but broke on Vercel Node lambdas because
 *   (a) `@content/` is a Vite path alias, not a real Node package, and
 *   (b) `?raw` is a Vite query-string loader, not a Node feature.
 *
 * This script pre-bakes each .md into a .ts file that just exports the
 * content as a string constant. The engine imports the .ts. Runtime-
 * agnostic, no bundler magic required, no fs IO at runtime.
 *
 * Ref: docs/DO_NOT_TOUCH.md rule 13
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'content-migration/prompts';

const mdFiles = readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));

for (const name of mdFiles) {
  const md = readFileSync(join(DIR, name + '.md'), 'utf8');
  const escaped = md
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  const tsSource = `/**
 * Auto-generated from content-migration/prompts/${name}.md.
 * Do not edit by hand — edit the .md source instead and run:
 *   node scripts/generate-prompt-modules.mjs
 *
 * Inlined as a string constant so the engine is portable across Node
 * (Vercel lambdas) and Vite (dev/test) without needing ?raw or fs IO.
 */

const prompt = \`${escaped}\`;
export default prompt;
`;

  writeFileSync(join(DIR, name + '.ts'), tsSource);
  console.log('wrote', join(DIR, name + '.ts'));
}
