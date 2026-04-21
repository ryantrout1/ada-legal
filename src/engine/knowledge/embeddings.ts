/**
 * OpenAI embeddings client.
 *
 * Step 10.5 — knowledge base / RAG for Ada. We use OpenAI's
 * text-embedding-3-small (1536 dimensions, matches the existing
 * ada_knowledge_chunks.embedding column dimension).
 *
 * Why OpenAI and not Voyage:
 *   - Operational simplicity: Ryan uses OpenAI on ClearQuest for
 *     other tasks, so having one embeddings vendor across products
 *     is cheaper (one API key, one SDK shape, one set of quirks) than
 *     adding Voyage.
 *   - Quality delta vs Voyage's legal-tuned model is real but small.
 *     For a bounded, authoritative corpus (ADA regulations) where
 *     citation by section number is the deterministic fallback, the
 *     semantic retrieval just needs to be "good enough" — not
 *     state of the art.
 *
 * Why text-embedding-3-small and not text-embedding-3-large:
 *   - 5x cheaper (\$0.02 vs \$0.13 per 1M tokens)
 *   - Already matches our 1536-dim column (large is 3072)
 *   - Quality difference is negligible for this corpus size
 *
 * Batching: OpenAI accepts up to 2048 inputs per request. We batch
 * at 100 to keep individual failures small.
 *
 * Ref: docs/ARCHITECTURE.md §10.5 knowledge base
 */

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;
const BATCH_SIZE = 100;
const OPENAI_URL = 'https://api.openai.com/v1/embeddings';

export interface EmbeddingClient {
  /** Embed a single query. Returns a 1536-dim vector. */
  embedQuery(text: string): Promise<number[]>;
  /** Embed many texts. Batched internally. Preserves order. */
  embedBatch(texts: string[]): Promise<number[][]>;
}

interface OpenAIEmbeddingResponse {
  object: 'list';
  data: Array<{ embedding: number[]; index: number; object: 'embedding' }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export function makeOpenAIEmbeddingClient(apiKey: string): EmbeddingClient {
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is required for the embedding client. ' +
        'Add it to .env.local (local dev) or Vercel environment variables (production).',
    );
  }

  async function callOpenAI(inputs: string[]): Promise<number[][]> {
    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: inputs,
        encoding_format: 'float',
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(
        `OpenAI embeddings API ${resp.status}: ${text.slice(0, 300)}`,
      );
    }
    const data = (await resp.json()) as OpenAIEmbeddingResponse;
    // API does not guarantee ordered responses, but index field does.
    const ordered = new Array<number[]>(inputs.length);
    for (const row of data.data) {
      ordered[row.index] = row.embedding;
    }
    // Sanity-check dimension. We pin the model to text-embedding-3-small
    // so this should always be 1536.
    for (const vec of ordered) {
      if (!vec || vec.length !== EMBEDDING_DIM) {
        throw new Error(
          `Unexpected embedding dimension: got ${vec?.length}, expected ${EMBEDDING_DIM}`,
        );
      }
    }
    return ordered;
  }

  return {
    async embedQuery(text: string): Promise<number[]> {
      const [v] = await callOpenAI([text]);
      return v;
    },

    async embedBatch(texts: string[]): Promise<number[][]> {
      if (texts.length === 0) return [];
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const slice = texts.slice(i, i + BATCH_SIZE);
        const vectors = await callOpenAI(slice);
        out.push(...vectors);
      }
      return out;
    },
  };
}

/** Exposed so ingestion code can log / verify what it's talking to. */
export const EMBEDDING_MODEL_INFO = {
  model: EMBEDDING_MODEL,
  dimension: EMBEDDING_DIM,
  provider: 'openai' as const,
};
