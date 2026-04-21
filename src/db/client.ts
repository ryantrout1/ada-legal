/**
 * Postgres client factory.
 *
 * Production: uses @neondatabase/serverless over HTTP (ideal for Vercel
 * serverless functions — no persistent connection, low cold-start cost).
 *
 * Tests: InMemoryDbClient (see src/engine/clients/) rather than touching
 * this module. This file should never be imported from anything inside
 * src/engine/ — see docs/DO_NOT_TOUCH.md rule 1.
 *
 * Ref: docs/ARCHITECTURE.md §2
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

export type Database = ReturnType<typeof makeDb>;

export function makeDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export { schema };
