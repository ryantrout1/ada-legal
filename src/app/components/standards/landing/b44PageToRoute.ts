/**
 * b44PageToRoute — translate a Base44 flat page name into this app's route.
 *
 * Base44 used flat routing: every page was `/PageName`, resolved through a
 * `createPageUrl()` helper. This app uses nested, kebab-case, SEO-stable
 * paths. The ported landing components carry ~45 `createPageUrl('GuideX')`
 * references between them, and hand-editing each one is how you end up with
 * a page of links that 404 in production.
 *
 * So the mapping lives here, in one pure function, covered by a test that
 * walks every href the landing renders. If a link is going to break, it
 * breaks in CI.
 *
 * Slug derivation matches standardsGuideIndex: PascalCase with the `Guide`
 * prefix removed, kebab-cased. Those slugs are SEO-stable — changing one
 * invalidates backlinks — so this function must never "fix" a slug.
 */

import { ALL_GUIDES, GUIDE_LOADERS } from '../../../routes/public/standardsGuideIndex.js';

/** PascalCase → kebab-case ("AdaCoordinators" → "ada-coordinators"). */
function kebab(pascal: string): string {
  return pascal
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

const KNOWN_SLUGS = new Set([
  ...ALL_GUIDES.map((g) => g.slug),
  ...Object.keys(GUIDE_LOADERS),
]);

/**
 * Pages that are NOT guides and NOT chapters. Base44 had surfaces this app
 * either routes elsewhere or never built:
 *   HomeV2  — Base44's landing; ours is `/`
 *   Home    — same
 *   Intake  — Base44's form-based intake. This app has no forms: Ada is the
 *             front door (policy: Ada-as-front-door), so it routes to /chat.
 *   RightsPathway — never built on main; Ada covers the same job.
 */
const EXPLICIT: Record<string, string> = {
  HomeV2: '/',
  Home: '/',
  Intake: '/chat',
  RightsPathway: '/chat',
  Ada: '/chat',
  StandardsGuide: '/standards-guide',
  Attorneys: '/attorneys',
  Lawsuits: '/class-actions',
};

/**
 * Resolve a Base44 page name to a route in this app.
 *
 * Returns `null` when the name resolves to nothing real — callers must
 * treat that as "don't render a link", never as "render a dead one".
 * A silent fallback to `/` would turn a broken link into a wrong link,
 * which is harder to notice and worse for the reader.
 */
export function b44PageToRoute(pageName: string): string | null {
  if (!pageName) return null;

  const name = pageName.startsWith('/') ? pageName.slice(1) : pageName;

  if (name in EXPLICIT) return EXPLICIT[name];

  const chapter = name.match(/^StandardsCh(\d{1,2})$/);
  if (chapter) {
    const n = Number(chapter[1]);
    return n >= 1 && n <= 10 ? `/standards-guide/chapter/${n}` : null;
  }

  if (name.startsWith('Guide')) {
    const slug = kebab(name.slice('Guide'.length));
    return KNOWN_SLUGS.has(slug) ? `/standards-guide/guide/${slug}` : null;
  }

  return null;
}

/** True when the href is an in-app Base44 page reference rather than an external URL. */
export function isB44PageRef(href: string): boolean {
  return !!href && href.startsWith('/') && !href.startsWith('//') && !href.includes('.');
}
