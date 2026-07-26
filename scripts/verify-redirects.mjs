#!/usr/bin/env node
/**
 * verify-redirects — check vercel.json's redirect map against a live host.
 *
 * Nothing has ever confirmed that what the map PROMISES is what the edge
 * SERVES. The unit tests assert the config's shape; only a request tells
 * you the rule fires. That gap is why /lawsuits/<slug> looked verified
 * when it was really the fetch tool following a redirect and showing a
 * 200 from the SPA shell — every route on this site returns the same
 * index.html, so a followed redirect and a missing one are identical
 * unless you look at the status code.
 *
 * Run before DNS cutover against the current host, and again after
 * against the apex:
 *
 *   node scripts/verify-redirects.mjs
 *   node scripts/verify-redirects.mjs --base https://adalegallink.com
 *   node scripts/verify-redirects.mjs --only Lawsuit
 *   node scripts/verify-redirects.mjs --json > redirect-report.json
 *
 * Exits non-zero when any check fails, so it can gate a cutover.
 *
 * Ref: B44 decommission, Gate E.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { planAll, locationMatches } from './redirectPlan.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { base: 'https://ada.adalegallink.com', only: null, json: false, concurrency: 8 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--base') args.base = argv[++i];
    else if (a === '--only') args.only = argv[++i];
    else if (a === '--json') args.json = true;
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]) || 8;
  }
  args.base = args.base.replace(/\/$/, '');
  return args;
}

async function checkOne(base, check) {
  if (check.skipped) return { ...check, status: 'skip', detail: check.skipped };
  // A host-conditioned rule only fires for its own hostname, so the request
  // goes there rather than to the default base.
  const origin = check.host ? `https://${check.host}` : base;
  try {
    const res = await fetch(`${origin}${check.path}`, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'user-agent': 'adall-redirect-verifier' },
    });
    const location = res.headers.get('location');
    const statusOk = check.expectedStatuses.includes(res.status);
    const locOk = locationMatches(location, check.expectedLocation);

    if (statusOk && locOk) return { ...check, status: 'pass', got: res.status };
    if (!statusOk && res.status === 200) {
      return {
        ...check,
        status: 'fail',
        detail: `served 200 — the rule did not fire (soft 404 risk)`,
        got: res.status,
      };
    }
    return {
      ...check,
      status: 'fail',
      detail: `expected ${check.expectedStatuses.join('/')} -> ${check.expectedLocation}; got ${res.status} -> ${location ?? 'no Location'}`,
      got: res.status,
    };
  } catch (err) {
    return { ...check, status: 'error', detail: err instanceof Error ? err.message : String(err) };
  }
}

async function pool(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
  let checks = planAll(config.redirects ?? []);
  if (args.only) checks = checks.filter((c) => c.source.includes(args.only));

  if (checks.length === 0) {
    console.error('No redirects matched.');
    process.exit(2);
  }

  if (!args.json) {
    console.log(`Checking ${checks.length} redirects against ${args.base}\n`);
  }

  const results = await pool(checks, args.concurrency, (c) => checkOne(args.base, c));

  const failed = results.filter((r) => r.status === 'fail' || r.status === 'error');
  const skipped = results.filter((r) => r.status === 'skip');
  const passed = results.filter((r) => r.status === 'pass');

  if (args.json) {
    console.log(JSON.stringify({ base: args.base, passed: passed.length, failed, skipped }, null, 2));
  } else {
    for (const r of failed) {
      const where = r.host ? ` [host: ${r.host}]` : '';
      console.log(`FAIL  ${r.path}${where}\n      ${r.detail}`);
    }
    if (skipped.length > 0) {
      console.log(`\nSkipped (not modellable as one concrete request):`);
      for (const r of skipped) console.log(`  ${r.source} — ${r.detail}`);
    }
    console.log(
      `\n${passed.length} passed · ${failed.length} failed · ${skipped.length} skipped`,
    );
    // Skips are reported, never hidden — an unverifiable rule is not a
    // verified one, and pretending otherwise is how the map rots.
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
