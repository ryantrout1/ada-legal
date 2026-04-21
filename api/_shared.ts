/**
 * Shared helpers for Ada API routes.
 *
 * - makeClientsFromEnv(): boot a real AdaClients from process.env.
 *   Throws early if required env vars are missing so a misconfigured
 *   deploy fails at startup, not mid-turn.
 *
 * - resolveRequestContext(req): normalize an incoming Vercel request
 *   into { orgCode, anonToken | null, host, path }. Wraps the pure
 *   host-+-path org-resolution logic from Step 5 and the anon-cookie
 *   parser from the same step.
 *
 * Ref: docs/ARCHITECTURE.md §5, §6, §9
 */

import type { VercelRequest } from '@vercel/node';
import { makeAdaClients } from '../src/engine/clients/adaClients.js';
import type { AdaClients } from '../src/engine/clients/types.js';
import { resolveOrg } from '../src/lib/orgResolution.js';
import { parseAnonCookie } from '../src/lib/anonCookie.js';

export function makeClientsFromEnv(): AdaClients {
  const databaseUrl = process.env.DATABASE_URL;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in environment');
  }
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment');
  }
  return makeAdaClients({ databaseUrl, anthropicApiKey });
}

export interface RequestContext {
  orgCode: string | null;
  notFound: boolean;
  anonToken: string | null;
  host: string;
  path: string;
}

export function resolveRequestContext(req: VercelRequest): RequestContext {
  const host = (req.headers['host'] as string) ?? 'adalegallink.com';
  const path = req.url ?? '/';
  const { orgCode, notFound } = resolveOrg(host, path);

  const cookieHeader = req.headers['cookie'];
  const anonToken = cookieHeader ? parseAnonCookie(cookieHeader) : null;

  return { orgCode, notFound, anonToken, host, path };
}

/**
 * Read and parse a JSON body off a VercelRequest. Vercel's Node runtime
 * auto-parses JSON when Content-Type is application/json, so usually
 * req.body is already an object. Fall back to manual parse for safety.
 */
export function readJsonBody<T = unknown>(req: VercelRequest): T {
  if (req.body && typeof req.body === 'object') return req.body as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      throw new Error('Request body is not valid JSON');
    }
  }
  return {} as T;
}
