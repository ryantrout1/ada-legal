/**
 * Diagnostic — dynamically imports each layer and reports the exact
 * error message. Lets us find which transitive import is missing
 * without needing full error message logs.
 *
 * Remove when production is green.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const steps = [
  { name: '_shared', loader: () => import('./_shared.js') },
  { name: 'orgResolution', loader: () => import('../src/lib/orgResolution.js') },
  { name: 'anonCookie', loader: () => import('../src/lib/anonCookie.js') },
  { name: 'adaClients', loader: () => import('../src/engine/clients/adaClients.js') },
  { name: 'neonDbClient', loader: () => import('../src/engine/clients/neonDbClient.js') },
  { name: 'anthropicAiClient', loader: () => import('../src/engine/clients/anthropicAiClient.js') },
  { name: 'anthropicPhotoAnalysisClient', loader: () => import('../src/engine/clients/anthropicPhotoAnalysisClient.js') },
  { name: 'processAdaTurn', loader: () => import('../src/engine/processAdaTurn.js') },
  { name: 'sessionRepo', loader: () => import('../src/engine/session/sessionRepo.js') },
  { name: 'db/client', loader: () => import('../src/db/client.js') },
  { name: 'db/schema-core', loader: () => import('../src/db/schema-core.js') },
  { name: '@neondatabase/serverless', loader: () => import('@neondatabase/serverless') },
  { name: 'drizzle-orm/neon-http', loader: () => import('drizzle-orm/neon-http') },
  { name: '@anthropic-ai/sdk', loader: () => import('@anthropic-ai/sdk') },
];

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results: Array<{ name: string; ok: boolean; error?: string }> = [];
  for (const step of steps) {
    try {
      await step.loader();
      results.push({ name: step.name, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name: step.name, ok: false, error: msg });
      // Stop at first failure — that's the one blocking everything.
      break;
    }
  }
  return res.status(200).json({
    cwd: process.cwd(),
    nodeVersion: process.version,
    results,
  });
}
