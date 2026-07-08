/**
 * isUuid — canonical UUID string check.
 *
 * Used to reject malformed identifiers at API boundaries BEFORE they
 * reach a Postgres `uuid` column, where an invalid value throws
 * "invalid input syntax for type uuid" and surfaces as a 500. Legacy
 * Base44 ids (24 hex chars, no hyphens) are the concrete case: they
 * must produce a clean 400, not a server error.
 *
 * Matches the standard hyphenated 8-4-4-4-12 hex form, case-insensitive.
 * (Neon generates canonical hyphenated UUIDs, which is what every real
 * caller sends.)
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}
