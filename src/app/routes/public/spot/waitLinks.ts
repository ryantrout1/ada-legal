/**
 * Somewhere to go while a Spot report is being prepared.
 *
 * Release is human-gated, so the wait is hours. Rather than leave a buyer on
 * an empty page, the confirmation screen offers the guide chapters the report
 * will be citing — the same ground Spot tells people to photograph: the walk
 * up, the door, the restroom, the parking space.
 *
 * Titles come from the guide index rather than being restated here. Four
 * hardcoded titles would drift the first time someone renames a guide, and the
 * dead links would land on the one screen a person reaches only after paying.
 *
 * This lives under `routes/public/spot/` rather than `src/lib/spot/` because it
 * reads the guide index, which is UI-layer. Nothing in `src/lib` imports from
 * `src/app` anywhere in this repo, and this is not the change that should
 * start.
 *
 * Ref: /plan phase 2 (Spot post-payment waiting screen).
 */

import { titleForSlug } from '../standardsGuideIndex.js';

/**
 * The four, in the order they are shown: the order someone walks a site.
 * Approach, entrance, inside, and the space they parked in.
 */
export const SPOT_WAIT_GUIDE_SLUGS = ['ramps', 'entrances', 'restrooms', 'parking'] as const;

export interface WaitLink {
  slug: string;
  title: string;
  href: string;
}

/**
 * Resolve slugs to links, dropping any the guide index does not know.
 *
 * Dropping rather than rendering-anyway is deliberate: a missing guide should
 * cost a link, not send someone to a page that does not exist. The test suite
 * catches the rename first; this is what happens if it does not.
 */
export function resolveWaitLinks(
  slugs: readonly string[] = SPOT_WAIT_GUIDE_SLUGS,
): WaitLink[] {
  const links: WaitLink[] = [];
  for (const slug of slugs) {
    const title = titleForSlug(slug);
    if (!title) continue;
    links.push({ slug, title, href: `/standards-guide/guide/${slug}` });
  }
  return links;
}
