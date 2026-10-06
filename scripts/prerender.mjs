#!/usr/bin/env node
/**
 * Prerender the public routes into static HTML.
 *
 * Runs after `vite build` and `vite build --ssr` (see the "build" script in
 * package.json). For every route in src/lib/seo/routeMeta.ts it renders the
 * real React page on the server and writes dist/<route>/index.html, so a
 * crawler that does not run JavaScript gets that page's own title,
 * description, canonical URL, h1, body text and links.
 *
 * What this script does NOT do: it does not change what a person sees. The
 * browser still loads the same bundle and hydrates the HTML (src/main.tsx).
 *
 * The empty SPA shell is kept as dist/app-shell.html. vercel.json rewrites
 * every route that has no prerendered file (lawsuits added after the build,
 * /s/:slug, /spot/r/:slug, /admin, /portal) to that shell, exactly as it used to
 * rewrite them to index.html. dist/index.html itself becomes the prerendered
 * home page.
 *
 * The build FAILS if any route comes out without a title, a description, one
 * h1, a canonical link, or real body text. Shipping a page that quietly falls
 * back to the shell is the bug this exists to prevent.
 */

import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SSR = join(ROOT, 'dist-ssr', 'entry-server.js');

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 155;

const { render, ROUTE_META, lawsuitTitle } = await import(pathToFileURL(SSR).href);

const shell = await readFile(join(DIST, 'index.html'), 'utf8');
if (shell.includes('data-prerendered')) {
  throw new Error('dist/index.html is already prerendered; run a fresh `vite build` first.');
}
await copyFile(join(DIST, 'index.html'), join(DIST, 'app-shell.html'));

/** Head tags the shell carries that every prerendered page replaces. */
const SHELL_HEAD_TAGS_TO_DROP = [
  /<title>[\s\S]*?<\/title>\s*/,
  /<meta name="description"[^>]*>\s*/,
  /<meta property="og:(?:title|description|url|type)"[^>]*>\s*/g,
  /<meta name="twitter:(?:title|description)"[^>]*>\s*/g,
];

/**
 * React 19 emits <title>, <meta> and <link> elements first in the output
 * stream. They belong in <head>; React finds and adopts them there when it
 * hydrates. Peel them off the front.
 */
function splitHoisted(html) {
  const lead = /^(?:<link\b[^>]*>|<meta\b[^>]*>|<title>[\s\S]*?<\/title>)/;
  const tags = [];
  let rest = html;
  for (let m = rest.match(lead); m; m = rest.match(lead)) {
    tags.push(m[0]);
    rest = rest.slice(m[0].length);
  }
  return { tags, rest };
}

const decode = (s) =>
  s
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

function textOf(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

const problems = [];
const warnings = [];
const seenTitles = new Map();
const seenDescriptions = new Map();
let written = 0;

// ---------------------------------------------------------------------------
// Lawsuit data. The list and detail pages load their cases in the browser, so
// the build fetches them here and renders the pages with that data (see
// src/app/lib/litigationSeed.ts). Source: the live public API, or a JSON file
// when PRERENDER_LITIGATION_FILE is set (used to test without network).
// If the data cannot be fetched, the lawsuit pages are left to the app-shell
// fallback exactly as before, with a warning. A flaky network should not block
// a deploy of everything else.
// ---------------------------------------------------------------------------

const API_ORIGIN = process.env.PRERENDER_API_ORIGIN || 'https://adalegallink.com';

const LIST_FIELDS = [
  'id', 'kind', 'status', 'barrierCategory', 'intakeStatus', 'caseName', 'slug',
  'legalTheory', 'shortDescription', 'shortDescriptionSimple',
  'shortDescriptionProfessional', 'defendants', 'court', 'docketNumber',
  'affectedStates', 'filingDate',
];

async function getJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
}

async function loadLitigation() {
  try {
    if (process.env.PRERENDER_LITIGATION_FILE) {
      return JSON.parse(await readFile(process.env.PRERENDER_LITIGATION_FILE, 'utf8'));
    }
    const list = await getJson(`${API_ORIGIN}/api/public/litigation?limit=200`);
    const rows = Array.isArray(list.litigation) ? list.litigation : [];
    if (!rows.length) throw new Error('the list came back empty');
    const details = {};
    for (const row of rows) {
      try {
        const d = await getJson(`${API_ORIGIN}/api/public/litigation/${encodeURIComponent(row.slug)}`);
        details[row.slug] = d.litigation;
      } catch (err) {
        warnings.push(`lawsuit ${row.slug}: detail not fetched (${err.message}); left to the shell`);
      }
    }
    return { list: rows, details };
  } catch (err) {
    warnings.push(`lawsuit pages not prerendered: could not load cases from ${API_ORIGIN} (${err.message})`);
    return null;
  }
}

/** Fields the endpoint returns that no public page renders; keep them out of the page. */
const UNRENDERED_FIELDS = ['adaQualifyingQuestions', 'leadAttorneyId', 'leadFirmId', 'relatedListingIds'];

const litigation = await loadLitigation();
if (litigation) {
  for (const detail of Object.values(litigation.details)) {
    for (const k of UNRENDERED_FIELDS) delete detail[k];
  }
}
const listSeed = litigation
  ? litigation.list.map((row) => Object.fromEntries(LIST_FIELDS.map((k) => [k, row[k] ?? null])))
  : null;

/** JSON that is safe inside a <script> element. */
const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
    .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029');

/**
 * Render one page and write dist/<path>/index.html.
 * `expected` is the title and description the page must render (from
 * routeMeta); lawsuit pages pass only a title. `strictBody` makes thin body
 * text a build failure instead of a warning.
 */
async function writePage({ path, expected, seed = null, strictBody = true }) {
  const { html } = await render(path, seed);
  const { tags, rest } = splitHoisted(html);

  const title = tags.find((t) => t.startsWith('<title>'));
  const description = tags.find((t) => /^<meta name="description"/.test(t));
  const canonical = tags.find((t) => /^<link rel="canonical"/.test(t));
  const fail = (msg) => problems.push(`${path}: ${msg}`);

  if (!title) fail('no <title> in the rendered page');
  if (!description) fail('no meta description in the rendered page');
  if (!canonical) fail('no canonical link in the rendered page');

  const titleText = title ? decode(title.replace(/<\/?title>/g, '')) : '';
  const descText = description ? decode(description.match(/content="([^"]*)"/)?.[1] ?? '') : '';
  if (titleText !== expected.title) fail(`rendered title "${titleText}" differs from the expected "${expected.title}"`);
  if (expected.description !== undefined && descText !== expected.description) fail('rendered description differs from routeMeta');
  if (titleText.length > MAX_TITLE) fail(`title is ${titleText.length} characters (max ${MAX_TITLE})`);
  if (descText.length > MAX_DESCRIPTION) fail(`description is ${descText.length} characters (max ${MAX_DESCRIPTION})`);
  if (!descText) fail('empty meta description');
  if (seenTitles.has(titleText)) fail(`title duplicates ${seenTitles.get(titleText)}`);
  if (seenDescriptions.has(descText)) fail(`description duplicates ${seenDescriptions.get(descText)}`);
  seenTitles.set(titleText, path);
  seenDescriptions.set(descText, path);
  if (canonical && !canonical.includes(`href="https://adalegallink.com${path === '/' ? '/' : path}"`)) {
    fail(`canonical is not this page's own URL: ${canonical}`);
  }

  const h1s = rest.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(`expected exactly one <h1>, found ${h1s.length}`);
  if (/Loading (guide|chapter)/.test(rest)) fail('a Suspense fallback ("Loading…") was rendered instead of the page');
  if (seed && /Loading (case|cases)/.test(rest)) fail('the page rendered "Loading…" despite having its data');
  // React drops an SVG <title> that has more than one child on the server
  // (text plus an expression), then fills it in on the client, which is a
  // hydration mismatch. Each SVG <title> must be a single string child.
  if (/<title[^>]*><\/title>/.test(rest)) fail('an SVG <title> rendered empty (use one string child, not several)');
  const body = textOf(rest);
  if (body.length < 300) {
    const msg = `only ${body.length} characters of body text`;
    if (strictBody) fail(msg);
    else warnings.push(`${path}: ${msg}`);
  }
  if (!/<a [^>]*href="\/[^"]*"/.test(rest)) fail('no internal <a href> links in the body');

  let out = shell;
  for (const re of SHELL_HEAD_TAGS_TO_DROP) out = out.replace(re, '');
  // Hoisted tags go where the shell's <title> used to be: right after the
  // color-scheme meta, before the icon/font links.
  out = out.replace('</head>', `${tags.join('')}\n  </head>`);
  const attr = `data-prerendered="${path}"`;
  if (!out.includes('<div id="root"></div>')) throw new Error('shell has no empty #root to fill');
  const seedTag = seed
    ? `<script id="litigation-seed" type="application/json">${safeJson(seed)}</script>`
    : '';
  out = out.replace('<div id="root"></div>', `<div id="root" ${attr}>${rest}</div>${seedTag}`);

  const target = path === '/' ? join(DIST, 'index.html') : join(DIST, path, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, out);
  written += 1;
}

for (const route of ROUTE_META) {
  const seed =
    route.path === '/lawsuits' && listSeed
      ? { path: '/lawsuits', kind: 'list', rows: listSeed }
      : null;
  await writePage({
    path: route.path,
    expected: { title: route.title, description: route.description },
    seed,
  });
}

let lawsuitPages = 0;
if (litigation) {
  for (const row of litigation.list) {
    const detail = litigation.details[row.slug];
    if (!detail) continue;
    const path = `/lawsuits/${encodeURIComponent(row.slug)}`;
    await writePage({
      path,
      expected: { title: lawsuitTitle(detail.caseName) },
      seed: { path, kind: 'detail', row: detail },
      strictBody: false,
    });
    lawsuitPages += 1;
  }
}

if (problems.length) {
  console.error(`\nprerender: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
for (const w of warnings) console.warn(`prerender warning: ${w}`);
console.log(
  `prerender: wrote ${written} pages (${lawsuitPages} lawsuit pages; shell kept as dist/app-shell.html)`,
);
