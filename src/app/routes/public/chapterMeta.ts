/**
 * Chapter metadata — single source of truth for the 10 ADA Standards
 * Guide chapters. Used by:
 *
 *   1. StandardsGuide.tsx (the index page) — renders tile grid
 *   2. StandardsChapter.tsx (the dispatcher) — renders per-chapter SEO
 *   3. src/lib/standardsIndex.ts (Ada's prompt) — resolves topic URLs
 *
 * The title, range, and description are intentionally short because
 * they ride in <title>, <meta name="description">, and tile captions
 * where concision matters. Search snippets on Google are clipped
 * around 155 characters; descriptions here fit comfortably inside
 * that ceiling.
 *
 * Step 29, Commit 8.
 */

export interface ChapterMeta {
  num: number;
  title: string;
  range: string;
  /**
   * Short meta description used for <meta name="description"> tags
   * and OG/Twitter cards on chapter pages. Plain language, no fluff,
   * no trailing period-then-ellipsis. Keep under 160 chars.
   */
  description: string;
}

export const CHAPTER_META: ChapterMeta[] = [
  {
    num: 1,
    title: 'Application & Administration',
    range: '§101–§106',
    description:
      'How the 2010 ADA Standards work, what they apply to, and the scope of compliance. Plain-language overview of Chapter 1.',
  },
  {
    num: 2,
    title: 'Scoping Requirements',
    range: '§201–§244',
    description:
      'Which ADA requirements apply to which spaces. Sets the floor for every accessible route, restroom, parking lot, and public area.',
  },
  {
    num: 3,
    title: 'Building Blocks',
    range: '§301–§309',
    description:
      'Reach ranges, turning spaces, knee and toe clearance, operable parts. The measurements that underpin every other chapter.',
  },
  {
    num: 4,
    title: 'Accessible Routes',
    range: '§401–§410',
    description:
      'Ramps, doors, curb ramps, elevators, walking surfaces, platform lifts. The physical path of travel through a building.',
  },
  {
    num: 5,
    title: 'General Site & Building Elements',
    range: '§501–§505',
    description:
      'Accessible parking, loading zones, stairways, and handrails. Site-level requirements that gate everything else.',
  },
  {
    num: 6,
    title: 'Plumbing Elements & Facilities',
    range: '§601–§612',
    description:
      'Accessible restrooms, toilet stalls, bathtubs, showers, lavatories, drinking fountains, and grab bars.',
  },
  {
    num: 7,
    title: 'Communication Elements & Features',
    range: '§701–§708',
    description:
      'Signage, telephones, assistive listening systems, ATMs. How people who are deaf, hard of hearing, or blind access information.',
  },
  {
    num: 8,
    title: 'Special Rooms, Spaces & Elements',
    range: '§801–§813',
    description:
      'Assembly seating, hotel guest rooms, medical care facilities, residential units, detention cells, and transportation facilities.',
  },
  {
    num: 9,
    title: 'Built-In Elements',
    range: '§901–§904',
    description:
      'Dining surfaces, service counters, benches. Built-in furniture that has to meet accessible-use clearances.',
  },
  {
    num: 10,
    title: 'Recreation Facilities',
    range: '§1001–§1011',
    description:
      'Swimming pools, playgrounds, amusement rides, boating, fishing, and golf facilities. Recreation-specific ADA requirements.',
  },
];

/** Convenience accessor — look up chapter meta by num (string or number). */
export function chapterMeta(num: string | number): ChapterMeta | null {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  return CHAPTER_META.find((c) => c.num === n) ?? null;
}
