#!/usr/bin/env node
/**
 * Ingest the ADA knowledge base corpus into Neon.
 *
 * The corpus lives at src/engine/knowledge/corpus/cfr-36-seed.json
 * (source of truth). This script reads that JSON, embeds each entry
 * via OpenAI, and upserts into ada_knowledge_chunks in Neon.
 *
 * Usage:
 *   npm install                                  # must have run
 *   export OPENAI_API_KEY=sk-<your real key>
 *   export DATABASE_URL="postgres://..."
 *   node scripts/ingest-knowledge.mjs
 *
 * NOTE: the env vars must be actual values, not placeholders.
 * If you paste sk-... or "..." literally, it will fail.
 *
 * Cost: ~\$0.0002 for a full re-ingest of the seed corpus.
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function die(msg) {
  console.error(`[ingest] error: ${msg}`);
  process.exit(1);
}

const openaiKey = process.env.OPENAI_API_KEY;
const dbUrl = process.env.DATABASE_URL;
if (!openaiKey || openaiKey === 'sk-...' || openaiKey.length < 20) {
  die(
    'OPENAI_API_KEY is missing or is still the placeholder. ' +
      'Set it to your real OpenAI key: export OPENAI_API_KEY=sk-proj-...',
  );
}
if (!dbUrl || dbUrl === '...' || !dbUrl.startsWith('postgres')) {
  die(
    'DATABASE_URL is missing or invalid. Set it to your Neon connection string. ' +
      'Find it in Vercel: Project > Settings > Environment Variables > DATABASE_URL. ' +
      'Example format: postgres://user:password@host/dbname',
  );
}

// ─── Load corpus ────────────────────────────────────────────────────────────
const corpusPath = join(
  __dirname,
  '..',
  'src',
  'engine',
  'knowledge',
  'corpus',
  'cfr-36-seed.json',
);

let corpus;
try {
  corpus = JSON.parse(readFileSync(corpusPath, 'utf-8'));
} catch (err) {
  die(`Could not read ${corpusPath}: ${err.message}`);
}
if (!Array.isArray(corpus) || corpus.length === 0) {
  die(`Corpus is empty or not an array`);
}

// ─── Chunking (inlined from src/engine/knowledge/chunking.ts) ──────────────
function parentRefs(leaf) {
  const out = [];
  let current = leaf;
  while (/\([^)]+\)$/.test(current)) {
    current = current.replace(/\([^)]+\)$/, '');
    if (current) out.push(current);
  }
  const partOnly = current.replace(/\.\d+.*$/, '');
  if (partOnly && partOnly !== current) out.push(partOnly);
  return out;
}

function prepareChunk(section) {
  const title = `§${section.citation} — ${section.title}`;
  const content = section.text.trim();
  const breadcrumbLine = section.breadcrumb.join(' › ');
  const embeddingInput = [breadcrumbLine, title, content]
    .filter(Boolean)
    .join('\n\n');
  return {
    title,
    content,
    embeddingInput,
    standardRefs: [section.citation, ...parentRefs(section.citation)],
    topic: section.topic,
    source: section.source,
  };
}

// ─── Embeddings ────────────────────────────────────────────────────────────
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;
const BATCH_SIZE = 100;
const OPENAI_URL = 'https://api.openai.com/v1/embeddings';

async function embedBatch(inputs) {
  if (inputs.length === 0) return [];
  const out = [];
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const slice = inputs.slice(i, i + BATCH_SIZE);
    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: slice,
        encoding_format: 'float',
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      die(`OpenAI ${resp.status}: ${body.slice(0, 300)}`);
    }
    const data = await resp.json();
    const ordered = new Array(slice.length);
    for (const row of data.data) ordered[row.index] = row.embedding;
    for (const v of ordered) {
      if (!v || v.length !== EMBEDDING_DIM) {
        die(`Unexpected embedding dim: ${v?.length}, expected ${EMBEDDING_DIM}`);
      }
    }
    out.push(...ordered);
  }
  return out;
}

// ─── Run ────────────────────────────────────────────────────────────────────
const sql = neon(dbUrl);

console.log(`[ingest] provider: openai`);
console.log(`[ingest] model:    ${EMBEDDING_MODEL}`);
console.log(`[ingest] dim:      ${EMBEDDING_DIM}`);
console.log(`[ingest] corpus:   ${corpus.length} raw sections`);

const chunks = corpus.map(prepareChunk);
console.log(`[ingest] prepared ${chunks.length} chunks`);

console.log(`[ingest] requesting embeddings from OpenAI...`);
const vectors = await embedBatch(chunks.map((c) => c.embeddingInput));
console.log(`[ingest] got ${vectors.length} vectors back`);

let inserted = 0;
let updated = 0;
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  const v = vectors[i];
  const vectorLiteral = `[${v.join(',')}]`;

  const existing = await sql`
    SELECT id FROM ada_knowledge_chunks
    WHERE source = ${c.source} AND title = ${c.title}
    LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE ada_knowledge_chunks
      SET content = ${c.content},
          topic = ${c.topic},
          standard_refs = ${JSON.stringify(c.standardRefs)}::jsonb,
          embedding = ${vectorLiteral}::vector,
          updated_at = NOW()
      WHERE id = ${existing[0].id}
    `;
    updated++;
  } else {
    await sql`
      INSERT INTO ada_knowledge_chunks
        (topic, title, content, standard_refs, embedding, source)
      VALUES (
        ${c.topic},
        ${c.title},
        ${c.content},
        ${JSON.stringify(c.standardRefs)}::jsonb,
        ${vectorLiteral}::vector,
        ${c.source}
      )
    `;
    inserted++;
  }
}

console.log(`[ingest] done. inserted=${inserted} updated=${updated}`);

const [{ count }] =
  await sql`SELECT COUNT(*)::int AS count FROM ada_knowledge_chunks`;
console.log(`[ingest] total rows in ada_knowledge_chunks: ${count}`);
