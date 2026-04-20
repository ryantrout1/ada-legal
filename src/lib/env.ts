/**
 * Env access helpers for the client bundle.
 *
 * Vite exposes any VITE_-prefixed env var to client code via import.meta.env.
 * These helpers centralize that access so a missing key fails fast with a
 * useful error message, not a cryptic downstream crash.
 */

export function requireClerkPublishableKey(): string {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key || typeof key !== 'string') {
    throw new Error(
      'VITE_CLERK_PUBLISHABLE_KEY is not set. ' +
        'Copy .env.example to .env.local and fill in the Clerk publishable key, ' +
        'or add it to Vercel project env vars for deployed environments.',
    );
  }
  return key;
}
