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

  it('no longer parks the consumer routes', () => {
    // Unparked at M7 so the rebuilt site is browsable on the engine
    // domain without ?preview=1 on every URL. noindex still applies.
    expect(parked).toEqual([]);
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

/**
 * Vercel validates vercel.json against a strict schema at DEPLOY time, and
 * `npm run build` does not — so a config-only mistake passes every local
 * gate and fails in the cloud. A `_comment` key on a headers entry did
 * exactly that (deployment 91X89XE, ERROR: "should NOT have additional
 * property `_comment`"). These pin the key sets the schema allows.
 */
describe('vercel.json schema conformance', () => {
  const config = JSON.parse(raw) as {
    headers?: Record<string, unknown>[];
    redirects?: Record<string, unknown>[];
    rewrites?: Record<string, unknown>[];
  };

  const ALLOWED_HEADER_KEYS = new Set(['source', 'headers', 'has', 'missing']);
  const ALLOWED_ROUTE_KEYS = new Set([
    'source',
    'destination',
    'permanent',
    'statusCode',
    'has',
    'missing',
  ]);

  it('headers entries carry only schema-legal keys', () => {
    for (const h of config.headers ?? []) {
      for (const key of Object.keys(h)) {
        expect(ALLOWED_HEADER_KEYS.has(key), `headers: illegal key "${key}"`).toBe(true);
      }
    }
  });

  it('redirect and rewrite entries carry only schema-legal keys', () => {
    for (const r of [...(config.redirects ?? []), ...(config.rewrites ?? [])]) {
      for (const key of Object.keys(r)) {
        expect(ALLOWED_ROUTE_KEYS.has(key), `route: illegal key "${key}"`).toBe(true);
      }
    }
  });
});

/**
 * Two litigation slugs are `closed` in Neon and therefore excluded by the
 * public API's status filter (active/compliance/investigating/tracking).
 * Base44 applied no such filter, so both were live and indexable on
 * adalegallink.com. Without a redirect they become soft-404s at cutover —
 * the SPA returns 200 with a not-found body, which is worse for search
 * than an honest 301.
 *
 * Pinned because the natural "fix" for a missing lawsuit page is to add a
 * catch-all /lawsuits/:slug rule, and that would shadow these.
 *
 * Ref: B44 decommission, Gate D — litigation reconciliation.
 */
describe('closed litigation slugs redirect rather than soft-404', () => {
  const config = JSON.parse(raw) as {
    redirects?: { source: string; destination: string; permanent?: boolean }[];
  };

  const CLOSED_SLUGS = [
    'coen-v-ga-doc-deaf-prisoners',
    'eeoc-v-union-pacific-one-percent-rule',
  ];

  for (const slug of CLOSED_SLUGS) {
    it(`redirects /lawsuits/${slug} to the index`, () => {
      const hit = (config.redirects ?? []).find(
        (r) => r.source === `/lawsuits/${slug}`,
      );
      expect(hit, `no redirect for ${slug}`).toBeDefined();
      expect(hit!.destination).toBe('/lawsuits');
      expect(hit!.permanent).toBe(true);
    });
  }

  it('is not shadowed by a broader /lawsuits rule earlier in the list', () => {
    const redirects = config.redirects ?? [];
    for (const slug of CLOSED_SLUGS) {
      const mine = redirects.findIndex((r) => r.source === `/lawsuits/${slug}`);
      const broader = redirects.findIndex(
        (r) => r.source.startsWith('/lawsuits/:') || r.source === '/lawsuits/(.*)',
      );
      if (broader !== -1) {
        expect(mine, `a broader rule precedes ${slug}`).toBeLessThan(broader);
      }
    }
  });
});
