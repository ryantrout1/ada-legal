/**
 * ADA Standards catalog — the structured, source-enumerated requirements
 * catalog described in the Photo Analyzer Remediation Plan (Phase 0
 * decisions 3 + 4). One row per ADA section/subsection, each carrying the
 * rule, an access-criticality tag, and a photo-assessability flag.
 *
 * Intended to become the SINGLE SOURCE OF TRUTH read by three surfaces:
 *   1. the photo analyzer (scene -> relevant catalog slice; gating rows first),
 *   2. the Standards Guide site,
 *   3. Ada's citations (searchAdaStandards).
 * (Surfaces wired in Phases 3-4. Today this module is additive and unused.)
 *
 * Source of record: U.S. Access Board, 2010 ADA Standards for Accessible
 * Design (chapter pages under access-board.gov/ada/chapter/). Rule text is
 * PARAPHRASED for plain-language use, not reproduced verbatim.
 *
 * STATUS: first wave. Seeded with the maneuvering-clearance fundamentals
 * (Chapter 3) and the full bathroom/plumbing slice (Chapter 6: toilet,
 * shower, seat, room-level) — the domain validated by the field-test curb
 * photo. Remaining sections from the coverage gap map are added in
 * subsequent waves. PENDING Gina's citation-accuracy sign-off (Phase 0,
 * item 5) before this drives production.
 *
 * STATIC. No DB lookups. Safe to import from edge handlers and the browser.
 */

/**
 * gating    - approach / entry / reach that determines whether a fixture or
 *             space is usable AT ALL. A barrier here defeats the fixture
 *             regardless of its other features (e.g. a shower curb).
 * component - a deficiency within an otherwise-usable fixture (e.g. a
 *             missing grab bar, a mirror mounted too high).
 */
export type AccessRole = 'gating' | 'component';

export interface AdaStandardRow {
  /** ADA section or subsection, e.g. "§608.7". */
  section: string;
  /** Chapter number, 1-10. */
  chapter: number;
  /** Section title as it appears in the 2010 Standards. */
  title: string;
  /** Fixture or space this row governs (e.g. "shower", "water_closet", "maneuvering"). */
  fixture: string;
  /** Plain-language rule plus key threshold(s). Paraphrased, not verbatim statute. */
  rule: string;
  /** See AccessRole. Surfaced ABOVE component findings by the analyzer. */
  access_role: AccessRole;
  /** Can a photo establish this concern, even when an exact dimension still needs a tape measure? */
  photo_assessable: boolean;
  /** Slug for the deep-dive page in the Standards Guide. */
  guide_slug: string;
  /** Pointer to the authoritative source text. */
  source_ref: string;
}

const CH3 = 'https://www.access-board.gov/ada/chapter/ch03';
const CH6 = 'https://www.access-board.gov/ada/chapter/ch06';

export const ADA_CATALOG: AdaStandardRow[] = [
  // --- Chapter 3: Building Blocks (maneuvering-clearance fundamentals) ---
  {
    section: '§302',
    chapter: 3,
    title: 'Floor or Ground Surfaces',
    fixture: 'maneuvering',
    rule: 'Floor and ground surfaces must be stable, firm, and slip resistant. Carpet pile 1/2 in max over a firm backing (302.2). Openings must not pass a 1/2 in sphere; elongated openings run perpendicular to the direction of travel (302.3).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'floor-surfaces',
    source_ref: CH3,
  },
  {
    section: '§304',
    chapter: 3,
    title: 'Turning Space',
    fixture: 'maneuvering',
    rule: 'A turning space must be a 60 in diameter circle (304.3.1) OR a T-shaped space within a 60 in square with 36 in wide arms and base (304.3.2). No changes in level; slope 1:48 max. Doors may swing into it.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'turning-space',
    source_ref: CH3,
  },
  {
    section: '§305',
    chapter: 3,
    title: 'Clear Floor or Ground Space',
    fixture: 'maneuvering',
    rule: 'Clear floor or ground space at an element is 30 in by 48 in minimum, positioned for a forward or parallel approach (305.3, 305.5). No changes in level; slope 1:48 max.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'clear-floor-space',
    source_ref: CH3,
  },
  {
    section: '§306',
    chapter: 3,
    title: 'Knee and Toe Clearance',
    fixture: 'maneuvering',
    rule: 'Where a forward approach requires going under an element, provide toe clearance (9 in high min) and knee clearance (27 in high min, 30 in wide) per 306. A closed cabinet under a lavatory obstructs this and blocks forward approach.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'knee-toe-clearance',
    source_ref: CH3,
  },

  // --- Chapter 6: Toilet and Bathing Rooms, room level (§603) ---
  {
    section: '§603.2.1',
    chapter: 6,
    title: 'Toilet/Bathing Room - Turning Space',
    fixture: 'toilet_room',
    rule: 'A toilet or bathing room must provide a turning space complying with 304 within the room.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'toilet-rooms',
    source_ref: CH6,
  },
  {
    section: '§603.2.3',
    chapter: 6,
    title: 'Toilet/Bathing Room - Door Swing',
    fixture: 'toilet_room',
    rule: 'Doors must not swing into the clear floor space or clearance required at any fixture; they may swing into the turning space. Limited exceptions for single-occupant rooms with space beyond the door arc.',
    access_role: 'gating',
    photo_assessable: false,
    guide_slug: 'toilet-rooms',
    source_ref: CH6,
  },
  {
    section: '§603.3',
    chapter: 6,
    title: 'Mirrors',
    fixture: 'toilet_room',
    rule: 'A mirror above a lavatory or countertop must have the bottom edge of the reflecting surface 40 in max above the floor. A mirror not above a lavatory: 35 in max.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'mirrors',
    source_ref: CH6,
  },
  {
    section: '§603.4',
    chapter: 6,
    title: 'Coat Hooks and Shelves',
    fixture: 'toilet_room',
    rule: 'Coat hooks must fall within the 308 reach ranges. Shelves must be 40 in min to 48 in max above the floor.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'toilet-rooms',
    source_ref: CH6,
  },

  // --- Chapter 6: Water Closets (§604) ---
  {
    section: '§604.2',
    chapter: 6,
    title: 'Water Closet - Location',
    fixture: 'water_closet',
    rule: 'Water closet centerline 16 in min to 18 in max from the side wall or partition (17 to 19 in in an ambulatory compartment). Arranged for a left- or right-hand approach.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'water-closets',
    source_ref: CH6,
  },
  {
    section: '§604.3',
    chapter: 6,
    title: 'Water Closet - Clearance',
    fixture: 'water_closet',
    rule: 'Clearance around the water closet must be 60 in min measured from the side wall and 56 in min from the rear wall, with no other fixtures inside it (604.3.1).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'water-closets',
    source_ref: CH6,
  },
  {
    section: '§604.5',
    chapter: 6,
    title: 'Water Closet - Grab Bars',
    fixture: 'water_closet',
    rule: 'Water closet grab bars: rear wall 36 in min, side wall 42 in min, mounted 33 to 36 in above the floor (604.5), complying with 609.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'grab-bars',
    source_ref: CH6,
  },

  // --- Chapter 6: Shower Compartments (§608) + Seats (§610) ---
  {
    section: '§608.2',
    chapter: 6,
    title: 'Shower - Size and Clearances',
    fixture: 'shower',
    rule: 'Transfer type: 36 by 36 in with a 36 in clearance at the control wall. Standard roll-in: 30 in wide by 60 in deep min. Alternate roll-in: 36 by 60 in (608.2).',
    access_role: 'gating',
    photo_assessable: false,
    guide_slug: 'showers',
    source_ref: CH6,
  },
  {
    section: '§608.3',
    chapter: 6,
    title: 'Shower - Grab Bars',
    fixture: 'shower',
    rule: 'Grab bars per 609, provided according to shower type (608.3); on the walls, not above the seat, mounted 33 to 36 in above the floor.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'grab-bars',
    source_ref: CH6,
  },
  {
    section: '§608.5',
    chapter: 6,
    title: 'Shower - Controls',
    fixture: 'shower',
    rule: 'Controls, faucets, and the spray unit must be operable with one hand per 309.4, located by shower type within reach of the seat or entry and no higher than 48 in above the shower floor (608.5).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'showers',
    source_ref: CH6,
  },
  {
    section: '§608.7',
    chapter: 6,
    title: 'Shower - Thresholds',
    fixture: 'shower',
    rule: 'Roll-in showers must be curbless (threshold 1/2 in max, per 303). Transfer shower thresholds 1/2 in max and beveled. A 2 in max threshold is allowed ONLY in existing facilities where a 1/2 in threshold would disturb the structural floor slab. A raised curb defeats wheelchair entry.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'showers',
    source_ref: CH6,
  },
  {
    section: '§608.8',
    chapter: 6,
    title: 'Shower - Enclosures',
    fixture: 'shower',
    rule: 'The shower enclosure must not obstruct the controls, faucets, or spray unit, or obstruct transfer from a wheelchair onto the shower seat (608.8).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'showers',
    source_ref: CH6,
  },
  {
    section: '§610.3',
    chapter: 6,
    title: 'Shower Compartment Seats',
    fixture: 'seat',
    rule: 'Where a seat is provided in a standard roll-in shower it must be a FOLDING type on the side wall adjacent to the controls; seat height 17 to 19 in above the floor (610). A fixed masonry bench can fail the folding requirement in a standard roll-in.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'shower-seats',
    source_ref: CH6,
  },
];

/** All catalog rows governing a given fixture or space. */
export function catalogForFixture(fixture: string): AdaStandardRow[] {
  return ADA_CATALOG.filter((row) => row.fixture === fixture);
}

/** Gating rows only — the access barriers the analyzer surfaces first. */
export const GATING_SECTIONS: AdaStandardRow[] = ADA_CATALOG.filter(
  (row) => row.access_role === 'gating',
);

/** Photo-assessable rows only — what the analyzer should actually check. */
export const PHOTO_ASSESSABLE: AdaStandardRow[] = ADA_CATALOG.filter(
  (row) => row.photo_assessable,
);
