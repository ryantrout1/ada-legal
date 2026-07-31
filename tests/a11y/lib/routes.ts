/**
 * routes.ts — the concrete route set the AAA audit sweeps.
 *
 * The set is GENERATED (scripts/gen-a11y-routes.mjs) and committed to
 * tests/a11y/routes.generated.json, then loaded here. Generation, not a
 * hardcoded list, is the point: a new public route in App.tsx shows up in
 * the audit automatically (the third hole that let the screenshot defects
 * ship was a stale hardcoded 10-route list — it even referenced a lawsuit
 * slug that no longer exists).
 *
 * Dynamic routes (:slug / :num / :id) are resolved to ONE concrete fixture
 * each at generation time (real slugs pulled from Neon / the standards
 * index), so the Playwright run needs no DB access — it reads paths only.
 *
 * tests/unit/a11yRoutes.test.ts pins AC5 (router coverage) and AC6
 * (dynamic routes resolved) against this exported set.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface AuditRoute {
  /** Concrete path to visit, e.g. "/lawsuits/niles-v-hilton-bed-heights". */
  path: string;
  /** Human label for report + test titles. */
  name: string;
}

const GENERATED = fileURLToPath(
  new URL('../routes.generated.json', import.meta.url),
);

export const AUDIT_ROUTES: readonly AuditRoute[] = JSON.parse(
  readFileSync(GENERATED, 'utf8'),
) as AuditRoute[];
