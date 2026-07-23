/**
 * vercel.json schema guard.
 *
 * WHY: `npm run build` does not validate vercel.json. An unknown top-level
 * key there fails at Vercel's *config validation* step — before the build
 * runs — so the deployment errors with no build logs at all, and every
 * local gate stays green. That happened on 2026-07-23: a `_comment_*` key
 * added to document the preview gate took production off the latest
 * commit until it was spotted.
 *
 * These assertions catch that class locally. The allowed-key list is
 * deliberately conservative: adding a genuinely new Vercel property means
 * updating this list, which is the moment to check it against the schema.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const raw = readFileSync(resolve(root, 'vercel.json'), 'utf8');

/** Top-level properties Vercel's project-configuration schema accepts. */
const ALLOWED = new Set([
  'buildCommand', 'cleanUrls', 'crons', 'devCommand', 'framework', 'functions',
  'git', 'headers', 'ignoreCommand', 'images', 'installCommand', 'outputDirectory',
  'public', 'redirects', 'regions', 'rewrites', 'trailingSlash',
]);

describe('vercel.json', () => {
  const config = JSON.parse(raw) as Record<string, unknown>;

  it('parses as strict JSON', () => {
    // Vercel does not accept JSONC. A successful parse is the proof — any
    // comment syntax makes this throw. (Regex heuristics for // and /*
    // were tried first and both false-positived, on https:// URLs and on
    // the CSP's https://*.clerk.com wildcards respectively.)
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('declares no property outside the Vercel schema', () => {
    const unknown = Object.keys(config).filter((k) => !ALLOWED.has(k));
    expect(
      unknown,
      'unknown keys fail config validation at deploy time, before the build, with no build logs',
    ).toEqual([]);
  });
});

describe('consumer-route parking', () => {
  const config = JSON.parse(raw) as {
    redirects: Array<{
      source: string;
      destination: string;
      has?: unknown[];
      missing?: Array<{ type: string; key: string }>;
    }>;
  };

  const parked = config.redirects.filter((r) =>
    r.destination.startsWith('https://adalegallink.com'),
  );

  it('parks the consumer routes that M7 will unpark', () => {
    const sources = parked.map((r) => r.source);
    for (const route of [
      '/',
      '/chat',
      '/attorneys',
      '/standards-guide',
      '/standards-guide/:path*',
      // M3: the rebuilt lawsuits surface. Unparked, these would be the
      // only consumer routes reachable on the engine domain pre-cutover.
      '/lawsuits',
      '/lawsuits/:path*',
    ]) {
      expect(sources, `${route} should still be parked pre-cutover`).toContain(route);
    }
  });

  it('leaves every parked route reachable via ?preview', () => {
    // Without this the engine domain has no way to review pre-cutover work,
    // which is exactly the state that hid M1 and M2 for a full session.
    const ungated = parked
      .filter((r) => !r.missing?.some((m) => m.type === 'query' && m.key === 'preview'))
      .map((r) => r.source);
    expect(ungated, 'parked with no preview bypass').toEqual([]);
  });

  it('keeps the portal host redirect ungated', () => {
    // portal.adalegallink.com → /portal is routing, not parking. Gating it
    // would break attorney sign-in.
    const portal = config.redirects.find((r) => r.destination === '/portal');
    expect(portal).toBeDefined();
    expect(portal?.has).toBeDefined();
    expect(portal?.missing).toBeUndefined();
  });
});
