/**
 * Source-reading helpers for tests that assert on file contents.
 *
 * WHY THIS EXISTS: several guard tests assert that a file does NOT contain
 * something — a Base44 import, a removed API, an old label. Those files
 * routinely *document* the thing they diverge from, in a header comment
 * explaining the port decision. Asserting against raw source therefore
 * fires on the explanation rather than the code. That false positive was
 * hit three separate times before this helper existed (M2 Phase 1, Phase 2,
 * and the ADAAssistant fix), each time costing a debug cycle.
 *
 * Rule of thumb: presence assertions may use readSource; absence
 * assertions should use readCode.
 */

import { readFileSync } from 'node:fs';

/** File contents verbatim. */
export function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

/**
 * File contents with block and line comments stripped.
 *
 * Deliberately naive — it does not parse, so a `//` inside a string
 * literal on its own line would be stripped. That is acceptable here: the
 * output is only ever fed to `not.toMatch`, where over-stripping can cause
 * a false PASS on a string literal but never a false failure. Anything
 * load-bearing enough to hide in a string literal deserves a real
 * assertion against parsed output instead.
 */
export function readCode(path: string): string {
  return readSource(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}
