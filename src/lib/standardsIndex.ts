/**
 * Standards index — maps ADA topics and §-section numbers to the
 * Standards Guide URLs that cover them. Used in two places:
 *
 *   1. Ada's system prompt (via engine/prompt/assemble.ts). When a
 *      session has metadata.page_context set, the prompt includes a
 *      compact cheat-sheet of {section → guide URL} so Ada can cite
 *      back into the guide when she quotes a standard.
 *
 *   2. Photo analyzer (Commit 7). When a violation type is classified
 *      we look up the matching guide URL and attach it to Ada's
 *      response.
 *
 * The goal is to make Ada and the Standards Guide mutually
 * reinforcing rather than two disconnected surfaces. If Ada says
 * "ramps must have a slope no steeper than 1:12 (§405.2)" she can
 * trail that with "you can see that in our guide:
 * https://ada.adalegallink.com/standards-guide/guide/ramps".
 *
 * All data is STATIC. No DB lookups. Safe to import from both edge
 * handlers and the browser bundle.
 *
 * Step 29, Commit 6.
 */

/**
 * A topic entry with the ADA sections it covers, the chapter it
 * lives in, and the deep-dive guide slug for it.
 *
 * sections:   § numbers (e.g. "§405", "§405.2"). Matches are prefix-
 *             style: a reply mentioning "§405.2" matches both "§405"
 *             and "§405.2".
 * keywords:   free-text topic words. Lowercase. Match whole-word
 *             (lowercase) inside Ada's draft reply. "ramp" matches
 *             "ramps", "ramped", etc. only if the root is present.
 * chapterNum: 1-10. Which guide chapter this falls under.
 * guideSlug:  the slug on /standards-guide/guide/<slug>. Empty string
 *             means "no deep-dive exists yet — only the chapter".
 * title:      human-readable display name, used in link text.
 */
export interface StandardsTopic {
  sections: string[];
  keywords: string[];
  chapterNum: number;
  guideSlug: string;
  title: string;
}

/**
 * Every topic the Standards Guide covers that Ada might need to cite
 * back. Kept intentionally short — each entry has to justify itself by
 * either being a common violation pattern OR having a dedicated deep-
 * dive page.
 *
 * When a guide page doesn't exist yet, guideSlug is '' and consumers
 * should fall back to the chapter URL.
 */
export const STANDARDS_TOPICS: StandardsTopic[] = [
  // ─── Chapter 3: Building Blocks ────────────────────────────────
  {
    sections: ['§302', '§302.1', '§302.2', '§302.3'],
    keywords: ['walking surface', 'floor surface', 'ground surface', 'slip-resistant', 'tripping hazard'],
    chapterNum: 3,
    guideSlug: '',
    title: 'Walking & Ground Surfaces',
  },
  {
    sections: ['§304'],
    keywords: ['turning space', 'turning radius', 'wheelchair turn'],
    chapterNum: 3,
    guideSlug: 'turning-handrails',
    title: 'Turning Spaces',
  },
  {
    sections: ['§305'],
    keywords: ['clear floor space', 'clear floor', 'maneuvering clearance'],
    chapterNum: 3,
    guideSlug: '',
    title: 'Clear Floor & Ground Space',
  },
  {
    sections: ['§306'],
    keywords: ['knee clearance', 'toe clearance', 'knee and toe'],
    chapterNum: 3,
    guideSlug: '',
    title: 'Knee & Toe Clearance',
  },
  {
    sections: ['§307'],
    keywords: ['protruding object', 'protrusion', 'head clearance'],
    chapterNum: 3,
    guideSlug: '',
    title: 'Protruding Objects',
  },
  {
    sections: ['§308'],
    keywords: ['reach range', 'reach height', 'high forward reach', 'side reach'],
    chapterNum: 3,
    guideSlug: 'reach-ranges',
    title: 'Reach Ranges',
  },
  {
    sections: ['§309'],
    keywords: ['operable part', 'lever hardware', 'operable with one hand', 'tight grasping', 'twisting of the wrist'],
    chapterNum: 3,
    guideSlug: 'reach-ranges',
    title: 'Operable Parts',
  },

  // ─── Chapter 4: Accessible Routes ──────────────────────────────
  {
    sections: ['§402', '§403'],
    keywords: ['accessible route', 'path of travel'],
    chapterNum: 4,
    guideSlug: '',
    title: 'Accessible Routes',
  },
  {
    sections: ['§404'],
    keywords: ['door', 'doorway', 'door hardware', 'door closer', 'threshold', 'clear width'],
    chapterNum: 4,
    guideSlug: 'entrances',
    title: 'Doors, Doorways & Gates',
  },
  {
    sections: ['§405', '§405.2', '§405.5', '§405.6', '§405.7', '§405.8', '§405.9'],
    keywords: ['ramp', 'slope', '1:12', 'ramp landing', 'ramp handrail'],
    chapterNum: 4,
    guideSlug: 'ramps',
    title: 'Ramps & Slope',
  },
  {
    sections: ['§406'],
    keywords: ['curb ramp', 'curb cut', 'detectable warning'],
    chapterNum: 4,
    guideSlug: '',
    title: 'Curb Ramps',
  },
  {
    sections: ['§407'],
    keywords: ['elevator', 'elevator car', 'call button'],
    chapterNum: 4,
    guideSlug: '',
    title: 'Elevators',
  },
  {
    sections: ['§408', '§409'],
    keywords: ['LULA', 'private residence elevator', 'limited-use elevator'],
    chapterNum: 4,
    guideSlug: '',
    title: 'Limited-Use & Private Residence Elevators',
  },
  {
    sections: ['§410'],
    keywords: ['platform lift', 'wheelchair lift', 'vertical lift'],
    chapterNum: 4,
    guideSlug: '',
    title: 'Platform Lifts',
  },

  // ─── Chapter 5: Site & Building Elements ───────────────────────
  {
    sections: ['§502', '§503'],
    keywords: ['parking', 'accessible parking', 'van accessible', 'parking space', 'parking sign', 'access aisle'],
    chapterNum: 5,
    guideSlug: 'parking-requirements',
    title: 'Accessible Parking',
  },
  {
    sections: ['§504'],
    keywords: ['stair', 'stairway', 'tread', 'riser', 'nosing'],
    chapterNum: 5,
    guideSlug: '',
    title: 'Stairways',
  },
  {
    sections: ['§505'],
    keywords: ['handrail', 'handrail extension', 'graspable handrail'],
    chapterNum: 5,
    guideSlug: 'turning-handrails',
    title: 'Handrails',
  },

  // ─── Chapter 6: Plumbing ───────────────────────────────────────
  {
    sections: ['§603', '§604', '§604.8'],
    keywords: ['restroom', 'bathroom', 'toilet', 'toilet stall', 'water closet', 'ambulatory stall', 'wheelchair stall'],
    chapterNum: 6,
    guideSlug: 'restrooms',
    title: 'Accessible Restrooms',
  },
  {
    sections: ['§605'],
    keywords: ['urinal'],
    chapterNum: 6,
    guideSlug: 'restrooms',
    title: 'Urinals',
  },
  {
    sections: ['§606'],
    keywords: ['lavatory', 'sink', 'faucet'],
    chapterNum: 6,
    guideSlug: 'restrooms',
    title: 'Lavatories & Sinks',
  },
  {
    sections: ['§607'],
    keywords: ['bathtub', 'tub', 'bathing'],
    chapterNum: 6,
    guideSlug: '',
    title: 'Bathtubs',
  },
  {
    sections: ['§608'],
    keywords: ['shower', 'roll-in shower', 'transfer shower', 'shower seat'],
    chapterNum: 6,
    guideSlug: '',
    title: 'Shower Compartments',
  },
  {
    sections: ['§609'],
    keywords: ['grab bar'],
    chapterNum: 6,
    guideSlug: 'restrooms',
    title: 'Grab Bars',
  },
  {
    sections: ['§602'],
    keywords: ['drinking fountain', 'water fountain'],
    chapterNum: 6,
    guideSlug: '',
    title: 'Drinking Fountains',
  },

  // ─── Chapter 7: Communication ──────────────────────────────────
  {
    sections: ['§703'],
    keywords: ['signage', 'sign', 'tactile sign', 'braille', 'pictogram', 'raised character'],
    chapterNum: 7,
    guideSlug: 'signage',
    title: 'Signage',
  },
  {
    sections: ['§704'],
    keywords: ['telephone', 'TTY', 'public telephone', 'payphone'],
    chapterNum: 7,
    guideSlug: '',
    title: 'Telephones',
  },
  {
    sections: ['§706'],
    keywords: ['assistive listening', 'hearing loop', 'FM system', 'induction loop'],
    chapterNum: 7,
    guideSlug: 'effective-communication',
    title: 'Assistive Listening Systems',
  },
  {
    sections: ['§707'],
    keywords: ['ATM', 'fare machine', 'point-of-sale', 'self-service'],
    chapterNum: 7,
    guideSlug: '',
    title: 'ATMs & Fare Machines',
  },

  // ─── Chapter 8: Special Rooms ──────────────────────────────────
  {
    sections: ['§802'],
    keywords: ['assembly', 'assembly seating', 'wheelchair space', 'sightline', 'companion seat'],
    chapterNum: 8,
    guideSlug: '',
    title: 'Assembly Areas',
  },
  {
    sections: ['§806'],
    keywords: ['hotel', 'guest room', 'lodging', 'transient lodging', 'communication feature'],
    chapterNum: 8,
    guideSlug: 'hotels-lodging',
    title: 'Hotels & Guest Rooms',
  },
  {
    sections: ['§807'],
    keywords: ['holding cell', 'detention cell'],
    chapterNum: 8,
    guideSlug: 'criminal-justice',
    title: 'Holding & Detention Cells',
  },
  {
    sections: ['§809'],
    keywords: ['residential unit', 'apartment', 'dwelling'],
    chapterNum: 8,
    guideSlug: 'housing',
    title: 'Residential Dwelling Units',
  },
  {
    sections: ['§810'],
    keywords: ['bus stop', 'transit', 'boarding platform', 'rail station'],
    chapterNum: 8,
    guideSlug: '',
    title: 'Transportation Facilities',
  },

  // ─── Chapter 9: Built-in Elements ──────────────────────────────
  {
    sections: ['§904'],
    keywords: ['sales counter', 'service counter', 'checkout'],
    chapterNum: 9,
    guideSlug: 'restaurants-retail',
    title: 'Sales & Service Counters',
  },
  {
    sections: ['§902'],
    keywords: ['dining surface', 'work surface', 'dining table'],
    chapterNum: 9,
    guideSlug: 'restaurants-retail',
    title: 'Dining & Work Surfaces',
  },

  // ─── Chapter 10: Recreation ────────────────────────────────────
  {
    sections: ['§1002'],
    keywords: ['amusement ride', 'theme park'],
    chapterNum: 10,
    guideSlug: '',
    title: 'Amusement Rides',
  },
  {
    sections: ['§1003'],
    keywords: ['boating', 'boat slip', 'fishing pier'],
    chapterNum: 10,
    guideSlug: '',
    title: 'Boating & Fishing',
  },
  {
    sections: ['§1005'],
    keywords: ['golf', 'golf course'],
    chapterNum: 10,
    guideSlug: '',
    title: 'Golf Facilities',
  },
  {
    sections: ['§1007'],
    keywords: ['playground', 'play area', 'play component'],
    chapterNum: 10,
    guideSlug: 'playgrounds',
    title: 'Play Areas',
  },
  {
    sections: ['§1009'],
    keywords: ['pool', 'swimming pool', 'pool lift', 'pool access'],
    chapterNum: 10,
    guideSlug: 'swimming-pools',
    title: 'Swimming Pools',
  },

  // ─── Title-level topics (not chapter-bound) ────────────────────
  {
    sections: [],
    keywords: ['service animal', 'service dog', 'miniature horse'],
    chapterNum: 0,
    guideSlug: 'service-animals',
    title: 'Service Animals',
  },
  {
    sections: [],
    keywords: ['wheelchair', 'power wheelchair', 'mobility device', 'scooter', 'power-driven mobility'],
    chapterNum: 0,
    guideSlug: 'mobility-devices',
    title: 'Mobility Devices',
  },
  {
    sections: [],
    keywords: ['employment', 'hiring', 'reasonable accommodation', 'title i', 'eeoc'],
    chapterNum: 0,
    guideSlug: 'title-i',
    title: 'Title I — Employment',
  },
  {
    sections: [],
    keywords: ['state government', 'local government', 'title ii', 'public entity'],
    chapterNum: 0,
    guideSlug: 'title-ii',
    title: 'Title II — State & Local Government',
  },
  {
    sections: [],
    keywords: ['public accommodation', 'place of public accommodation', 'title iii'],
    chapterNum: 0,
    guideSlug: 'title-iii',
    title: 'Title III — Public Accommodations',
  },
  {
    sections: [],
    keywords: ['WCAG', 'web accessibility', 'screen reader', 'alt text', 'keyboard navigation'],
    chapterNum: 0,
    guideSlug: 'wcag-explained',
    title: 'Web Accessibility (WCAG)',
  },
  {
    sections: [],
    keywords: ['filing a complaint', 'DOJ complaint', 'file complaint'],
    chapterNum: 0,
    guideSlug: 'filing-complaint',
    title: 'Filing an ADA Complaint',
  },
];

/** Build the guide URL for a topic. Empty slug falls back to the chapter. */
export function guideUrlForTopic(topic: StandardsTopic): string {
  if (topic.guideSlug) {
    return `/standards-guide/guide/${topic.guideSlug}`;
  }
  if (topic.chapterNum >= 1 && topic.chapterNum <= 10) {
    return `/standards-guide/chapter/${topic.chapterNum}`;
  }
  return '/standards-guide';
}

/**
 * Find topics that match a given section number. A query of '§405.2'
 * matches any topic whose sections include '§405' or '§405.2'.
 */
export function topicsForSection(sectionRef: string): StandardsTopic[] {
  const norm = sectionRef.trim();
  return STANDARDS_TOPICS.filter((t) =>
    t.sections.some((s) => norm === s || norm.startsWith(s + '.')),
  );
}

/**
 * Find topics whose keywords appear in a free-text snippet (e.g. the
 * user's message or Ada's draft reply). Case-insensitive substring
 * match. Used by the photo analyzer integration in Commit 7.
 */
export function topicsForText(text: string): StandardsTopic[] {
  const lower = text.toLowerCase();
  return STANDARDS_TOPICS.filter((t) =>
    t.keywords.some((k) => lower.includes(k.toLowerCase())),
  );
}

/**
 * Render the whole standards index as a compact markdown table for
 * embedding in Ada's system prompt. Each row is:
 *   §405 / ramp, slope / /standards-guide/guide/ramps
 * Only topics with a guideSlug (deep-dive exists) are included here;
 * chapter-only topics fall out as too-thin to be worth a prompt slot.
 */
export function renderStandardsIndexForPrompt(): string {
  const rows: string[] = [];
  rows.push('| Section(s) | Topic | Guide URL |');
  rows.push('| --- | --- | --- |');
  for (const t of STANDARDS_TOPICS) {
    if (!t.guideSlug) continue;
    const secs = t.sections.length > 0 ? t.sections.join(', ') : '(no section)';
    rows.push(`| ${secs} | ${t.title} | ${guideUrlForTopic(t)} |`);
  }
  return rows.join('\n');
}
