#!/usr/bin/env node
/**
 * Ingest the ADA knowledge base corpus into Neon.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... DATABASE_URL=postgres://... \
 *     node scripts/ingest-knowledge.mjs
 *
 * What this does:
 *   1. Reads the seed corpus from src/engine/knowledge/corpus/
 *   2. Prepares each leaf section as a chunk with parent-citation
 *      refs, topic tag, breadcrumb-prefixed embedding input
 *   3. Calls OpenAI text-embedding-3-small for all chunks in batches
 *      of 100 (one API call per batch)
 *   4. Upserts into ada_knowledge_chunks keyed on (source, citation).
 *      Idempotent — safe to run repeatedly. Updates content and
 *      embedding if the source text changed.
 *
 * Cost: the full seed corpus is ~15 chunks x ~500 tokens = ~7500
 * tokens. At \$0.02 per 1M tokens that's \$0.00015 per full re-ingest.
 *
 * This script runs locally, not on Vercel. Ingestion is a one-time
 * (or on-corpus-change) operation that writes to the shared Neon
 * database Vercel reads from.
 */

import { neon } from '@neondatabase/serverless';
import { makeOpenAIEmbeddingClient, EMBEDDING_MODEL_INFO } from '../src/engine/knowledge/embeddings.ts';
import { prepareChunk } from '../src/engine/knowledge/chunking.ts';
import { SEED_CORPUS } from '../src/engine/knowledge/corpus/cfr-36-seed.ts';

function die(msg) {
  console.error(`[ingest] error: ${msg}`);
  process.exit(1);
}

const openaiKey = process.env.OPENAI_API_KEY;
const dbUrl = process.env.DATABASE_URL;
if (!openaiKey) die('OPENAI_API_KEY is required');
if (!dbUrl) die('DATABASE_URL is required');

const sql = neon(dbUrl);
const embed = makeOpenAIEmbeddingClient(openaiKey);

console.log(`[ingest] provider: ${EMBEDDING_MODEL_INFO.provider}`);
console.log(`[ingest] model:    ${EMBEDDING_MODEL_INFO.model}`);
console.log(`[ingest] dim:      ${EMBEDDING_MODEL_INFO.dimension}`);
console.log(`[ingest] corpus:   ${SEED_CORPUS.length} raw sections`);

const chunks = SEED_CORPUS.map(prepareChunk);
console.log(`[ingest] prepared ${chunks.length} chunks`);

console.log(`[ingest] requesting embeddings from OpenAI...`);
const inputs = chunks.map((c) => c.embeddingInput);
const vectors = await embed.embedBatch(inputs);
console.log(`[ingest] got ${vectors.length} vectors back`);

// Upsert. pgvector's text representation for vectors is '[v1,v2,...]'.
let inserted = 0;
let updated = 0;
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  const v = vectors[i];
  const vectorLiteral = `[${v.join(',')}]`;

  // Keyed on (source, title). The title carries the citation so
  // this is effectively (source, citation). Re-running the script
  // with an updated content field replaces embedding + content.
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

// Final stats.
const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM ada_knowledge_chunks`;
console.log(`[ingest] total rows in ada_knowledge_chunks: ${count}`);
