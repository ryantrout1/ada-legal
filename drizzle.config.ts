import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit is used for:
 *   - generating SQL from schema.ts (drizzle-kit generate)
 *   - introspecting an existing DB (drizzle-kit introspect)
 *
 * It is NOT used to run migrations in this project. Migrations live in
 * src/db/migrations/ as hand-maintained .sql files and are executed via
 * the Neon MCP connector (or neonctl in local dev). This keeps the SQL
 * auditable in PRs and out of dev-only tooling.
 *
 * DATABASE_URL is read from env when drizzle-kit needs it (e.g. for
 * introspect). Not required for `generate`.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://unused',
  },
  verbose: true,
  strict: true,
});
