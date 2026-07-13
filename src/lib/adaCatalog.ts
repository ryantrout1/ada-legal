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
 * STATUS: COMPLETE 3-digit-section coverage — every numbered section across
 * all ten chapters of the 2010 Standards has a row, with extra subsection
 * rows where detail matters. Rule text is a working draft (Gina signed off
 * as-is; deeper legal review to follow). The analyzer reads this catalog as
 * a cached system block (Phase 3). The guide_slug column is reconciled to
 * guide pages that actually exist (standardsGuideIndex.ts) — rows with no
 * dedicated page use '' and fall back to the chapter URL, matching the
 * convention in standardsIndex.ts. Phase 5 CI reconciles sections against
 * the authoritative Access Board table of contents.
 *
 * STATIC. No DB lookups. Safe to import from edge handlers and the browser.
 */

/**
 * gating    - approach / entry / reach that determines whether a fixture or
 *             space is usable AT ALL. A barrier here defeats the fixture
 *             regardless of its other features (e.g. a shower curb).
 * component - a deficiency within an otherwise-usable fixture (e.g. a
 *             missing grab bar, a mirror mounted too high).
 * scoping   - an applicability rule (Chapter 2): determines WHETHER an
 *             element or space is required to be accessible at all (e.g.
 *             only designated guest rooms need a roll-in shower). Used to
 *             FRAME findings, not as a finding itself.
 * reference - administrative, definitional, or general-scope provisions
 *             (Chapter 1, the "General"/"Scope" sections) that are not
 *             assessable requirements; carried for completeness/citation.
 */
export type AccessRole = 'gating' | 'component' | 'scoping' | 'reference';

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

const CH1 = 'https://www.access-board.gov/ada/chapter/ch01';
const CH2 = 'https://www.access-board.gov/ada/chapter/ch02';
const CH3 = 'https://www.access-board.gov/ada/chapter/ch03';
const CH4 = 'https://www.access-board.gov/ada/chapter/ch04';
const CH5 = 'https://www.access-board.gov/ada/chapter/ch05';
const CH6 = 'https://www.access-board.gov/ada/chapter/ch06';
const CH7 = 'https://www.access-board.gov/ada/chapter/ch07';
const CH8 = 'https://www.access-board.gov/ada/chapter/ch08';
const CH9 = 'https://www.access-board.gov/ada/chapter/ch09';
const CH10 = 'https://www.access-board.gov/ada/chapter/ch10';

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
    guide_slug: 'sidewalks',
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
    guide_slug: 'turning-handrails',
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
    guide_slug: 'turning-handrails',
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
    guide_slug: 'turning-handrails',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
    source_ref: CH6,
  },
  {
    section: '§604.3',
    chapter: 6,
    title: 'Water Closet - Clearance',
    fixture: 'water_closet',
    rule: 'Clearance around the water closet must be 60 in min measured from the side wall and 56 in min from the rear wall, with no other fixtures inside it (604.3.1). A wall-mounted fold-down changing table counts here when deployed: if it swings down into the required clear floor space, that clearance must remain usable with the changing table open — a changing table that obstructs the maneuvering space when lowered is a barrier.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
    source_ref: CH6,
  },
  {
    section: '§604.7',
    chapter: 6,
    title: 'Water Closet - Dispensers',
    fixture: 'water_closet',
    rule: 'Toilet paper dispensers must be within reach 7 in min to 9 in max in front of the water closet, with the outlet 15 in min to 48 in max above the floor (604.7), and must not control delivery or prevent continuous paper flow. A dispenser mounted too low (below 15 in) or too close to the nosing (under 7 in) is a finding.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
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
    guide_slug: 'restrooms',
    source_ref: CH6,
  },

  // ===================================================================
  // SECOND WAVE — priority photo-assessable gaps from the gap map.
  // Working draft from the 2010 Standards; deeper legal review to follow.
  // ===================================================================

  // --- Chapter 2: Scoping (the "is this required to be accessible" layer) ---
  {
    section: '§206',
    chapter: 2,
    title: 'Accessible Routes (scoping)',
    fixture: 'scoping',
    rule: 'At least one accessible route must connect accessible site arrival points and accessible entrances to all accessible spaces and elements within (206.2). Determines whether an accessible route is required.',
    access_role: 'scoping',
    photo_assessable: false,
    guide_slug: 'sidewalks',
    source_ref: CH2,
  },
  {
    section: '§208',
    chapter: 2,
    title: 'Parking Spaces (scoping)',
    fixture: 'scoping',
    rule: 'Accessible parking spaces must be provided per the 208.2 ratio table (e.g. 1 per 25 up to 100, then a sliding scale), and a share must be van-accessible. Determines required counts.',
    access_role: 'scoping',
    photo_assessable: false,
    guide_slug: 'parking',
    source_ref: CH2,
  },
  {
    section: '§213',
    chapter: 2,
    title: 'Toilet and Bathing Facilities (scoping)',
    fixture: 'scoping',
    rule: 'Where toilet or bathing rooms are provided, they must be accessible, and at least one of each type/cluster must comply (213.2, 213.3). This is the trigger that subjects a bathroom to Chapter 6 — a non-required room need not comply.',
    access_role: 'scoping',
    photo_assessable: false,
    guide_slug: 'restrooms',
    source_ref: CH2,
  },
  {
    section: '§221',
    chapter: 2,
    title: 'Assembly Areas (scoping)',
    fixture: 'scoping',
    rule: 'Assembly areas must provide wheelchair spaces and companion seats per the 221.2 ratio table, dispersed by location and line of sight. Determines required seating counts.',
    access_role: 'scoping',
    photo_assessable: false,
    guide_slug: '',
    source_ref: CH2,
  },
  {
    section: '§224',
    chapter: 2,
    title: 'Transient Lodging Guest Rooms (scoping)',
    fixture: 'scoping',
    rule: 'A facility must provide guest rooms with mobility features (a smaller number with roll-in showers) and guest rooms with communication features, per the 224.2/224.4 tables scaled to total room count. A STANDARD guest room is NOT required to have grab bars or a roll-in shower — only the designated accessible rooms are.',
    access_role: 'scoping',
    photo_assessable: false,
    guide_slug: 'hotels-lodging',
    source_ref: CH2,
  },
  {
    section: '§233',
    chapter: 2,
    title: 'Residential Facilities (scoping)',
    fixture: 'scoping',
    rule: 'Residential dwelling units with mobility features and with communication features must be provided per 233, scaled to total units. Determines which units must comply (with the Chapter 8 technical requirements in 809).',
    access_role: 'scoping',
    photo_assessable: false,
    guide_slug: 'housing',
    source_ref: CH2,
  },

  // --- Chapter 4: Curb Ramps (route gap) ---
  {
    section: '§406',
    chapter: 4,
    title: 'Curb Ramps',
    fixture: 'route',
    rule: 'Curb ramps on accessible routes must have a running slope complying with 405, a width 36 in min (excluding flares), flared sides not steeper than 1:10 where walked across, and detectable warnings at the bottom where required.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'ramps',
    source_ref: CH4,
  },

  // --- Chapter 5: Passenger Loading Zones (site gap) ---
  {
    section: '§503',
    chapter: 5,
    title: 'Passenger Loading Zones',
    fixture: 'site',
    rule: 'A passenger loading zone must provide an access aisle 60 in wide min and 20 ft long min, adjacent and parallel to the vehicle pull-up space, at the same level, with a firm stable surface.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'parking-requirements',
    source_ref: CH5,
  },

  // --- Chapter 6: remaining plumbing fixtures ---
  {
    section: '§602',
    chapter: 6,
    title: 'Drinking Fountains',
    fixture: 'drinking_fountain',
    rule: 'A wheelchair-accessible spout 36 in max above the floor with knee/toe clearance and a forward approach, PLUS a unit for standing persons with the spout 38 to 43 in (the "hi-lo" pair). Spout flow and location per 602.5/602.6.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH6,
  },
  {
    section: '§605',
    chapter: 6,
    title: 'Urinals',
    fixture: 'urinal',
    rule: 'Where urinals are provided, at least one must be a stall-type or wall-hung type with the rim 17 in max above the floor, with a 30 by 48 in clear floor space positioned for a forward approach (605). The 17 in rim limit governs wall-hung and stall (wall-mounted) urinals; a floor-mounted or trough-type urinal has its rim at or near the floor and is not subject to the rim-height limit — do not flag a urinal you can see is floor-mounted or trough-type for rim height. When the mounting type is unclear from the photo, report the rim-height concern as verify-on-site instead of dropping it.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'restrooms',
    source_ref: CH6,
  },
  {
    section: '§606',
    chapter: 6,
    title: 'Lavatories and Sinks',
    fixture: 'lavatory',
    rule: 'Rim 34 in max above the floor; knee and toe clearance (per 306) for a forward approach; faucets operable one-handed without tight grasping, pinching, or twisting (309.4); exposed pipes insulated or configured to protect against contact (606.5). A closed cabinet beneath obstructs the required knee clearance.',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'restrooms',
    source_ref: CH6,
  },
  {
    section: '§607',
    chapter: 6,
    title: 'Bathtubs',
    fixture: 'bathtub',
    rule: 'Bathtubs must provide a clear floor space for transfer, grab bars (per 609), a seat (an in-tub seat or a seat at the head end), and controls and a spray unit operable one-handed within reach (607).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'restrooms',
    source_ref: CH6,
  },
  {
    section: '§609',
    chapter: 6,
    title: 'Grab Bars (construction)',
    fixture: 'grab_bar',
    rule: 'Grab bars must be 1-1/4 to 2 in in cross section (or provide an equivalent graspable shape), mounted 1-1/2 in from the wall, with non-rotating surfaces, and able to support a 250 lbf load (609).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'restrooms',
    source_ref: CH6,
  },
  {
    section: '§611',
    chapter: 6,
    title: 'Washing Machines and Clothes Dryers',
    fixture: 'laundry',
    rule: 'Where provided, at least one of each must be accessible: front-loading, operable parts within the reach ranges (15 to 48 in), and a 30 by 48 in clear floor space (611).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH6,
  },
  {
    section: '§612',
    chapter: 6,
    title: 'Saunas and Steam Rooms',
    fixture: 'sauna',
    rule: 'Saunas and steam rooms must provide a turning space, an accessible bench, and doors that do not swing into the clear floor space (612).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH6,
  },

  // --- Chapter 7: Communication Elements ---
  {
    section: '§702',
    chapter: 7,
    title: 'Fire Alarm Systems',
    fixture: 'fire_alarm',
    rule: 'Where fire alarm systems are provided, they must include visible alarm appliances (strobes) complying with NFPA 72 in addition to audible alarms (702). Presence of strobes is visible; flash rate and coverage need instruments.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'effective-communication',
    source_ref: CH7,
  },
  {
    section: '§704',
    chapter: 7,
    title: 'Telephones',
    fixture: 'telephone',
    rule: 'Where public telephones are provided, accessible units must offer a TTY where required, volume control, operable parts within reach, and a 30 by 48 in clear floor space (704).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'effective-communication',
    source_ref: CH7,
  },
  {
    section: '§706',
    chapter: 7,
    title: 'Assistive Listening Systems',
    fixture: 'assistive_listening',
    rule: 'Assembly areas with audio amplification must provide an assistive listening system, a number of receivers per the 219 scoping, and signage indicating availability (706).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'effective-communication',
    source_ref: CH7,
  },
  {
    section: '§707',
    chapter: 7,
    title: 'ATMs and Fare Machines',
    fixture: 'atm',
    rule: 'ATMs and fare machines must provide speech output, tactile/accessible input controls, privacy, operable parts within reach (15 to 48 in), and a 30 by 48 in clear floor space (707).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH7,
  },
  {
    section: '§708',
    chapter: 7,
    title: 'Two-Way Communication Systems',
    fixture: 'two_way_comm',
    rule: 'Two-way communication systems (e.g. at secured entrances) must provide both audible and visual signals and operable parts within reach (708).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'effective-communication',
    source_ref: CH7,
  },

  // --- Chapter 8: Special Rooms and Spaces ---
  {
    section: '§802',
    chapter: 8,
    title: 'Wheelchair Spaces, Companion Seats, Designated Aisle Seats',
    fixture: 'assembly',
    rule: 'Wheelchair spaces: 36 in wide (single) or 33 in (adjacent), 48 in deep (front/rear entry) or 60 in (side entry), on an accessible route, with companion seats adjacent and lines of sight comparable to other spectators (802).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH8,
  },
  {
    section: '§803',
    chapter: 8,
    title: 'Dressing, Fitting, and Locker Rooms',
    fixture: 'dressing_room',
    rule: 'Accessible dressing/fitting/locker rooms must include a turning space, an accessible bench (24 by 48 in), a mirror, coat hooks within reach, and an accessible route (803).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH8,
  },
  {
    section: '§804',
    chapter: 8,
    title: 'Kitchens and Kitchenettes',
    fixture: 'kitchen',
    rule: 'Accessible kitchens must provide clearance between counters/appliances (40 in min, or 60 in in a U-shaped layout), an accessible work surface, and appliances with accessible controls and clear floor spaces (804).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH8,
  },
  {
    section: '§805',
    chapter: 8,
    title: 'Medical Care and Long-Term Care Facilities',
    fixture: 'medical',
    rule: 'In required accessible units, patient rooms and toilet/bathing rooms must provide accessible routes, turning spaces, clear floor space at beds, and accessible toilet and bathing fixtures (805).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'medical-facilities',
    source_ref: CH8,
  },
  {
    section: '§806',
    chapter: 8,
    title: 'Transient Lodging Guest Rooms',
    fixture: 'guest_room',
    rule: 'A designated accessible guest room must provide mobility features (accessible route, turning space, accessible bathroom per Chapter 6 incl. a roll-in shower where required) OR communication features (visible alarms, notification devices, accessible controls). WHETHER a given room must comply is set by the 224 scoping — a standard room is not required to have these.',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'hotels-lodging',
    source_ref: CH8,
  },
  {
    section: '§809',
    chapter: 8,
    title: 'Residential Dwelling Units',
    fixture: 'dwelling_unit',
    rule: 'Required accessible dwelling units must provide an accessible route throughout, accessible entrances, turning spaces, accessible kitchens (804) and bathrooms (603-610), and reachable controls (809).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'housing',
    source_ref: CH8,
  },
  {
    section: '§810',
    chapter: 8,
    title: 'Transportation Facilities',
    fixture: 'transportation',
    rule: 'Bus stops, rail platforms, and stations must provide accessible boarding, detectable warnings at platform edges, accessible signage, and accessible routes (810).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH8,
  },
  {
    section: '§811',
    chapter: 8,
    title: 'Storage',
    fixture: 'storage',
    rule: 'Where provided, accessible storage (lockers, closets, shelving) must have a clear floor space and operable parts within the reach ranges (811).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH8,
  },

  // --- Chapter 9: Built-In Elements ---
  {
    section: '§902',
    chapter: 9,
    title: 'Dining Surfaces and Work Surfaces',
    fixture: 'dining_surface',
    rule: 'Accessible dining/work surfaces must be 28 to 34 in above the floor with knee and toe clearance (306) and a 30 by 48 in clear floor space positioned for a forward approach (902).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'restaurants-retail',
    source_ref: CH9,
  },
  {
    section: '§903',
    chapter: 9,
    title: 'Benches',
    fixture: 'bench',
    rule: 'Accessible benches must have a seat 42 in long min and 20 to 24 in deep, 17 to 19 in above the floor, with back support or a wall, and a clear floor space at one end (903).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH9,
  },

  // --- Chapter 10: Recreation Facilities ---
  {
    section: '§1004',
    chapter: 10,
    title: 'Exercise Machines and Equipment',
    fixture: 'exercise_equipment',
    rule: 'At least one of each type of exercise machine must have a 30 by 48 in clear floor space positioned for use of that machine and connected by an accessible route (1004).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: '',
    source_ref: CH10,
  },
  {
    section: '§1008',
    chapter: 10,
    title: 'Play Areas',
    fixture: 'play_area',
    rule: 'Play areas must provide accessible routes connecting play components, accessible ground surfaces, and minimum numbers of accessible play components by type per the 240 scoping (1008).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'playgrounds',
    source_ref: CH10,
  },
  {
    section: '§1009',
    chapter: 10,
    title: 'Swimming Pools, Wading Pools, and Spas',
    fixture: 'pool',
    rule: 'Pools must provide accessible means of entry per the 242 scoping — a pool lift, sloped entry, transfer wall, transfer system, or accessible stairs (large pools need two means, at least one a lift or sloped entry). Wading pools need a sloped entry; spas need a lift, transfer wall, or transfer system (1009).',
    access_role: 'gating',
    photo_assessable: true,
    guide_slug: 'swimming-pools',
    source_ref: CH10,
  },

  // ===================================================================
  // THIRD WAVE — completeness backfill. Every remaining 3-digit section
  // across Chapters 1-10. Core building blocks carry full rule text; the
  // long tail (admin, niche scoping, niche recreation) is terse. Draft.
  // ===================================================================

  // --- Chapter 1: Application and Administration (reference only) ---
  { section: '§101', chapter: 1, title: 'Purpose', fixture: 'admin', rule: 'States the purpose and scope of the 2010 Standards.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH1 },
  { section: '§102', chapter: 1, title: 'Dimensions for Adults and Children', fixture: 'admin', rule: 'Dimensions are for adults unless child dimensions are specifically stated.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH1 },
  { section: '§103', chapter: 1, title: 'Equivalent Facilitation', fixture: 'admin', rule: 'Alternative designs are permitted where they provide substantially equivalent or greater accessibility.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH1 },
  { section: '§104', chapter: 1, title: 'Conventions', fixture: 'admin', rule: 'Conventions for dimensions, tolerances, figures, and notes used in the Standards.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH1 },
  { section: '§105', chapter: 1, title: 'Referenced Standards', fixture: 'admin', rule: 'Lists standards incorporated by reference (e.g. NFPA 72, ASME A17.1 elevators).', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH1 },
  { section: '§106', chapter: 1, title: 'Definitions', fixture: 'admin', rule: 'Defines terms used throughout the Standards.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH1 },

  // --- Chapter 2: remaining scoping sections ---
  { section: '§201', chapter: 2, title: 'Application (scoping)', fixture: 'scoping', rule: 'Applies the Standards to all areas of newly designed/constructed and altered buildings and facilities.', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§202', chapter: 2, title: 'Existing Buildings and Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for alterations, additions, and barrier removal in existing facilities, including the path of travel to altered areas.', access_role: 'scoping', photo_assessable: false, guide_slug: 'barrier-removal', source_ref: CH2 },
  { section: '§203', chapter: 2, title: 'General Exceptions (scoping)', fixture: 'scoping', rule: 'Exceptions for construction sites, raised areas, limited-access and machinery spaces, and similar.', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§204', chapter: 2, title: 'Protruding Objects (scoping)', fixture: 'scoping', rule: 'Protruding objects on circulation paths must comply with 307.', access_role: 'scoping', photo_assessable: false, guide_slug: 'sidewalks', source_ref: CH2 },
  { section: '§205', chapter: 2, title: 'Operable Parts (scoping)', fixture: 'scoping', rule: 'Operable parts intended for use by occupants must comply with 309.', access_role: 'scoping', photo_assessable: false, guide_slug: 'reach-ranges', source_ref: CH2 },
  { section: '§207', chapter: 2, title: 'Accessible Means of Egress (scoping)', fixture: 'scoping', rule: 'Accessible means of egress must be provided per the building code scoping.', access_role: 'scoping', photo_assessable: false, guide_slug: 'emergency-management', source_ref: CH2 },
  { section: '§209', chapter: 2, title: 'Passenger Loading Zones and Bus Stops (scoping)', fixture: 'scoping', rule: 'Scoping for passenger loading zones and bus boarding and alighting areas.', access_role: 'scoping', photo_assessable: false, guide_slug: 'parking', source_ref: CH2 },
  { section: '§210', chapter: 2, title: 'Stairways (scoping)', fixture: 'scoping', rule: 'Stairs that are part of a required means of egress must comply with 504.', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§211', chapter: 2, title: 'Drinking Fountains (scoping)', fixture: 'scoping', rule: 'Where provided, fountains for wheelchair users and for standing persons must both be provided (the hi-lo requirement).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§212', chapter: 2, title: 'Kitchens, Kitchenettes, and Sinks (scoping)', fixture: 'scoping', rule: 'Scoping for accessible kitchens, kitchenettes, and sinks.', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§214', chapter: 2, title: 'Washing Machines and Clothes Dryers (scoping)', fixture: 'scoping', rule: 'Where provided, a portion of laundry equipment must be accessible (per 611).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§215', chapter: 2, title: 'Fire Alarm Systems (scoping)', fixture: 'scoping', rule: 'Where fire alarm systems are provided, visible alarms are required per 702.', access_role: 'scoping', photo_assessable: false, guide_slug: 'effective-communication', source_ref: CH2 },
  { section: '§216', chapter: 2, title: 'Signs (scoping)', fixture: 'scoping', rule: 'Scoping for required accessible signage (per 703).', access_role: 'scoping', photo_assessable: false, guide_slug: 'signage', source_ref: CH2 },
  { section: '§217', chapter: 2, title: 'Telephones (scoping)', fixture: 'scoping', rule: 'Where public telephones are provided, a portion must be accessible (per 704).', access_role: 'scoping', photo_assessable: false, guide_slug: 'effective-communication', source_ref: CH2 },
  { section: '§218', chapter: 2, title: 'Transportation Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for transportation facilities (per 810).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§219', chapter: 2, title: 'Assistive Listening Systems (scoping)', fixture: 'scoping', rule: 'Scoping for assistive listening systems in assembly areas (per 706).', access_role: 'scoping', photo_assessable: false, guide_slug: 'effective-communication', source_ref: CH2 },
  { section: '§220', chapter: 2, title: 'ATMs and Fare Machines (scoping)', fixture: 'scoping', rule: 'Where provided, ATMs and fare machines must comply with 707.', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§222', chapter: 2, title: 'Dressing, Fitting, and Locker Rooms (scoping)', fixture: 'scoping', rule: 'Where provided, a portion of dressing/fitting/locker rooms must be accessible (per 803).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§223', chapter: 2, title: 'Medical Care and Long-Term Care Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for accessible patient and resident rooms (per 805).', access_role: 'scoping', photo_assessable: false, guide_slug: 'medical-facilities', source_ref: CH2 },
  { section: '§225', chapter: 2, title: 'Storage (scoping)', fixture: 'scoping', rule: 'Where provided, a portion of self-service storage and shelving must be accessible (per 811).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§226', chapter: 2, title: 'Dining and Work Surfaces (scoping)', fixture: 'scoping', rule: 'Where provided, at least 5 percent of dining and work surfaces must be accessible (per 902).', access_role: 'scoping', photo_assessable: false, guide_slug: 'restaurants-retail', source_ref: CH2 },
  { section: '§227', chapter: 2, title: 'Sales and Service (scoping)', fixture: 'scoping', rule: 'Scoping for accessible check-out aisles, sales/service counters, and queues.', access_role: 'scoping', photo_assessable: false, guide_slug: 'restaurants-retail', source_ref: CH2 },
  { section: '§228', chapter: 2, title: 'Depositories, Vending, Change Machines, Mail Boxes, Fuel Dispensers (scoping)', fixture: 'scoping', rule: 'Where provided, at least one of each type must be accessible.', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§229', chapter: 2, title: 'Windows (scoping)', fixture: 'scoping', rule: 'Scoping for operable windows where provided for occupant use.', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§230', chapter: 2, title: 'Two-Way Communication Systems (scoping)', fixture: 'scoping', rule: 'Where provided (e.g. at restricted entrances), two-way communication systems must comply with 708.', access_role: 'scoping', photo_assessable: false, guide_slug: 'effective-communication', source_ref: CH2 },
  { section: '§231', chapter: 2, title: 'Judicial Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for courtrooms, holding cells, and judicial spaces.', access_role: 'scoping', photo_assessable: false, guide_slug: 'criminal-justice', source_ref: CH2 },
  { section: '§232', chapter: 2, title: 'Detention and Correctional Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for accessible cells and detention/correctional facilities.', access_role: 'scoping', photo_assessable: false, guide_slug: 'criminal-justice', source_ref: CH2 },
  { section: '§234', chapter: 2, title: 'Amusement Rides (scoping)', fixture: 'scoping', rule: 'Scoping for accessible amusement rides (per 1002).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§235', chapter: 2, title: 'Recreational Boating Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for accessible boat slips and boarding piers (per 1003).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§236', chapter: 2, title: 'Exercise Machines and Equipment (scoping)', fixture: 'scoping', rule: 'At least one of each type of exercise machine must be accessible (per 1004).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§237', chapter: 2, title: 'Fishing Piers and Platforms (scoping)', fixture: 'scoping', rule: 'Scoping for accessible fishing piers and platforms (per 1005).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§238', chapter: 2, title: 'Golf Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for accessible golf facilities (per 1006).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§239', chapter: 2, title: 'Miniature Golf Facilities (scoping)', fixture: 'scoping', rule: 'Scoping for accessible miniature golf facilities (per 1007).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§240', chapter: 2, title: 'Play Areas (scoping)', fixture: 'scoping', rule: 'Scoping for accessible play components and routes (per 1008).', access_role: 'scoping', photo_assessable: false, guide_slug: 'playgrounds', source_ref: CH2 },
  { section: '§241', chapter: 2, title: 'Saunas and Steam Rooms (scoping)', fixture: 'scoping', rule: 'Where provided in clusters, a portion must be accessible (per 612).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },
  { section: '§242', chapter: 2, title: 'Swimming Pools, Wading Pools, and Spas (scoping)', fixture: 'scoping', rule: 'Scoping for accessible means of entry to pools, wading pools, and spas (per 1009).', access_role: 'scoping', photo_assessable: false, guide_slug: 'swimming-pools', source_ref: CH2 },
  { section: '§243', chapter: 2, title: 'Shooting Facilities with Firing Positions (scoping)', fixture: 'scoping', rule: 'Scoping for accessible firing positions (per 1010).', access_role: 'scoping', photo_assessable: false, guide_slug: '', source_ref: CH2 },

  // --- Chapter 3: remaining building blocks ---
  { section: '§301', chapter: 3, title: 'General', fixture: 'reference', rule: 'Chapter 3 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH3 },
  { section: '§303', chapter: 3, title: 'Changes in Level', fixture: 'maneuvering', rule: 'Vertical changes 1/4 in max; 1/4 to 1/2 in must be beveled at 1:2 max; changes over 1/2 in must be ramped (per 405 or 406). This is the rule a raised curb fails.', access_role: 'gating', photo_assessable: true, guide_slug: 'ramps', source_ref: CH3 },
  { section: '§307', chapter: 3, title: 'Protruding Objects', fixture: 'route', rule: 'Objects with leading edges between 27 and 80 in above the floor may protrude 4 in max into circulation paths; post-mounted objects 12 in max; provide 80 in min vertical clearance. Wall-mounted elements on a circulation path — drinking fountains, dispensers, fire-extinguisher cabinets — whose leading edge is above 27 in and projects more than 4 in are protruding hazards and need a cane-detectable element below them (307).', access_role: 'gating', photo_assessable: true, guide_slug: 'sidewalks', source_ref: CH3 },
  { section: '§308', chapter: 3, title: 'Reach Ranges', fixture: 'maneuvering', rule: 'Unobstructed forward or side reach 15 in min to 48 in max above the floor, with reduced maximums where reaching over an obstruction (308).', access_role: 'component', photo_assessable: true, guide_slug: 'reach-ranges', source_ref: CH3 },
  { section: '§309', chapter: 3, title: 'Operable Parts', fixture: 'maneuvering', rule: 'Operable parts must have a clear floor space, be within reach (308), and be operable with one hand without tight grasping, pinching, or twisting, 5 lbf max (309).', access_role: 'component', photo_assessable: true, guide_slug: 'reach-ranges', source_ref: CH3 },

  // --- Chapter 4: remaining accessible-route elements ---
  { section: '§401', chapter: 4, title: 'General', fixture: 'reference', rule: 'Chapter 4 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: 'sidewalks', source_ref: CH4 },
  { section: '§402', chapter: 4, title: 'Accessible Routes', fixture: 'route', rule: 'Accessible routes are made of walking surfaces, doorways, ramps, curb ramps, elevators, and platform lifts, each complying with its section; running and cross slopes are limited (402).', access_role: 'gating', photo_assessable: true, guide_slug: 'sidewalks', source_ref: CH4 },
  { section: '§403', chapter: 4, title: 'Walking Surfaces', fixture: 'route', rule: 'Walking surfaces on accessible routes: running slope 1:20 max, cross slope 1:48 max, clear width 36 in min (32 in at a point) — flag a visibly pinched or narrow route — with passing spaces on long narrow routes (403).', access_role: 'gating', photo_assessable: true, guide_slug: 'sidewalks', source_ref: CH4 },
  { section: '§404', chapter: 4, title: 'Doors, Doorways, and Gates', fixture: 'door', rule: 'Clear opening width 32 in min, maneuvering clearances by approach direction, thresholds 1/2 in max, hardware operable one-handed and 34 to 48 in above the floor, with opening-force and closing-speed limits (404).', access_role: 'gating', photo_assessable: true, guide_slug: 'entrances', source_ref: CH4 },
  { section: '§405', chapter: 4, title: 'Ramps', fixture: 'ramp', rule: 'Running slope 1:12 max, cross slope 1:48 max, 36 in min clear width — flag a visibly narrow ramp run — level landings at the top, bottom, and turns large enough to turn and maneuver in (a ramp lacking a level landing fails, and a landing too small to turn on is a barrier), handrails where the rise exceeds 6 in, and edge protection (405).', access_role: 'gating', photo_assessable: true, guide_slug: 'ramps', source_ref: CH4 },
  { section: '§407', chapter: 4, title: 'Elevators', fixture: 'elevator', rule: 'Accessible elevators must meet call-button, hall-signal, car-dimension, leveling, door-timing, control, and signage requirements (407).', access_role: 'gating', photo_assessable: true, guide_slug: '', source_ref: CH4 },
  { section: '§408', chapter: 4, title: 'Limited-Use/Limited-Application Elevators', fixture: 'elevator', rule: 'LULA elevators are permitted in limited circumstances and must comply with 408.', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH4 },
  { section: '§409', chapter: 4, title: 'Private Residence Elevators', fixture: 'elevator', rule: 'Private residence elevators, where part of a required accessible route in a dwelling, must comply with 409.', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH4 },
  { section: '§410', chapter: 4, title: 'Platform Lifts', fixture: 'platform_lift', rule: 'Platform (wheelchair) lifts are permitted as part of an accessible route in limited conditions; must comply with ASME A18.1, with a compliant clear floor space, controls, and entry (410).', access_role: 'gating', photo_assessable: true, guide_slug: '', source_ref: CH4 },

  // --- Chapter 5: remaining site and building elements ---
  { section: '§501', chapter: 5, title: 'General', fixture: 'reference', rule: 'Chapter 5 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH5 },
  { section: '§502', chapter: 5, title: 'Parking Spaces', fixture: 'parking', rule: 'Accessible car spaces 96 in wide with a 60 in access aisle; van spaces 132 in wide (or 96 in with a 96 in aisle) with 98 in vertical clearance on the van route; marked, on the shortest accessible route, with signage (502).', access_role: 'gating', photo_assessable: true, guide_slug: 'parking-requirements', source_ref: CH5 },
  { section: '§504', chapter: 5, title: 'Stairways', fixture: 'stairway', rule: 'Stairs that are part of a means of egress must have uniform riser and tread dimensions, closed risers, compliant nosings, and handrails per 505 (504).', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH5 },
  { section: '§505', chapter: 5, title: 'Handrails', fixture: 'handrail', rule: 'Handrails 34 to 38 in above the surface, continuous along the run, 1-1/4 to 2 in gripping surface, 1-1/2 in wall clearance, with extensions at the top and bottom (505).', access_role: 'component', photo_assessable: true, guide_slug: 'turning-handrails', source_ref: CH5 },

  // --- Chapter 6: general scope ---
  { section: '§601', chapter: 6, title: 'General', fixture: 'reference', rule: 'Chapter 6 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: 'restrooms', source_ref: CH6 },

  // --- Chapter 7: remaining communication elements ---
  { section: '§701', chapter: 7, title: 'General', fixture: 'reference', rule: 'Chapter 7 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: 'effective-communication', source_ref: CH7 },
  { section: '§703', chapter: 7, title: 'Signs', fixture: 'sign', rule: 'Tactile signs (raised characters plus Braille) for permanent rooms/spaces, mounted 48 to 60 in to the baseline beside the latch; visual characters sized and contrasted by viewing distance; pictograms and directional/informational signage as required (703).', access_role: 'component', photo_assessable: true, guide_slug: 'signage', source_ref: CH7 },
  { section: '§705', chapter: 7, title: 'Detectable Warnings', fixture: 'detectable_warning', rule: 'Truncated-dome detectable warnings are required at transit platform boarding edges and at curb ramps and blended transitions in the public right-of-way; they are NOT required at typical interior or private-site ramps and curb cuts. Do not flag a missing or non-compliant detectable-warning surface at a location you can establish does not require one. When you cannot tell from the photo whether the location requires detectable warnings, report the surface\'s condition as a verify-on-site finding rather than omitting it. Where required, check dome size, spacing, and visual contrast (705).', access_role: 'component', photo_assessable: true, guide_slug: 'sidewalks', source_ref: CH7 },

  // --- Chapter 8: remaining special rooms ---
  { section: '§801', chapter: 8, title: 'General', fixture: 'reference', rule: 'Chapter 8 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH8 },
  { section: '§807', chapter: 8, title: 'Holding Cells and Housing Cells', fixture: 'cell', rule: 'Required accessible cells must provide mobility or communication features, with accessible routes, beds, and toilets (807).', access_role: 'component', photo_assessable: true, guide_slug: 'criminal-justice', source_ref: CH8 },
  { section: '§808', chapter: 8, title: 'Courtrooms', fixture: 'courtroom', rule: 'Courtrooms must provide accessible routes to all stations (judge, jury, witness, parties) and accessible seating (808).', access_role: 'component', photo_assessable: true, guide_slug: 'criminal-justice', source_ref: CH8 },

  // --- Chapter 9: remaining built-in elements ---
  { section: '§901', chapter: 9, title: 'General', fixture: 'reference', rule: 'Chapter 9 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH9 },
  { section: '§904', chapter: 9, title: 'Sales and Service Counters', fixture: 'service_counter', rule: 'A portion of a sales/service counter must be 36 in max above the floor for a parallel approach, or provide a 30 by 48 in forward-approach work surface; check-out aisles accessible by type (904).', access_role: 'component', photo_assessable: true, guide_slug: 'restaurants-retail', source_ref: CH9 },

  // --- Chapter 10: remaining recreation facilities ---
  { section: '§1001', chapter: 10, title: 'General', fixture: 'reference', rule: 'Chapter 10 applies where required by Chapter 2 or where referenced.', access_role: 'reference', photo_assessable: false, guide_slug: '', source_ref: CH10 },
  { section: '§1002', chapter: 10, title: 'Amusement Rides', fixture: 'amusement_ride', rule: 'Accessible amusement rides must provide wheelchair spaces, transfer seats, or transfer devices and an accessible route to the load and unload area (1002).', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH10 },
  { section: '§1003', chapter: 10, title: 'Recreational Boating Facilities', fixture: 'boating', rule: 'Accessible boat slips and boarding piers with clear pier space, edge clearances, and gangway requirements (1003).', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH10 },
  { section: '§1005', chapter: 10, title: 'Fishing Piers and Platforms', fixture: 'fishing_pier', rule: 'Accessible fishing piers: railings 34 in max at accessible positions, clear floor spaces, and an accessible route (1005).', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH10 },
  { section: '§1006', chapter: 10, title: 'Golf Facilities', fixture: 'golf', rule: 'Accessible routes or golf-car passages to teeing grounds, putting greens, and weather shelters (1006).', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH10 },
  { section: '§1007', chapter: 10, title: 'Miniature Golf Facilities', fixture: 'miniature_golf', rule: 'A minimum number of holes must be accessible and connected by an accessible route (1007).', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH10 },
  { section: '§1010', chapter: 10, title: 'Shooting Facilities with Firing Positions', fixture: 'shooting', rule: 'At least 5 percent (minimum one) of firing positions must provide a 60 in turning space (1010).', access_role: 'component', photo_assessable: true, guide_slug: '', source_ref: CH10 },
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

/** Scoping rows — applicability rules used to FRAME findings, not flag them. */
export const SCOPING_SECTIONS: AdaStandardRow[] = ADA_CATALOG.filter(
  (row) => row.access_role === 'scoping',
);

/**
 * Render the photo-assessable catalog as a checklist for the analyzer's
 * system prompt: grouped by fixture, with [GATING] rules first and flagged.
 * This is the single source of truth for the standards the analyzer checks
 * — it replaces the hand-written prose catalog that used to live in the
 * prompt. Mirrors renderStandardsIndexForPrompt() used by the chat engine.
 */
export function renderCatalogForPrompt(): string {
  const rows = ADA_CATALOG.filter((row) => row.photo_assessable);
  const byFixture = new Map<string, AdaStandardRow[]>();
  for (const row of rows) {
    const list = byFixture.get(row.fixture) ?? [];
    list.push(row);
    byFixture.set(row.fixture, list);
  }

  const lines: string[] = [
    '# ADA standards checklist (authoritative source of record)',
    '',
    'Apply ONLY the sections relevant to the fixtures and spaces actually visible in the photos — do not flag a fixture that is not present. Within each fixture, the rules marked [GATING] determine whether the fixture can be used at all; check those first, and a gating failure outranks every component-level deficiency.',
    '',
    'Scoping caveat: before flagging missing required features, consider whether the space is even required to be accessible. In transient lodging, only designated accessible guest rooms (\u00a7224, \u00a7806) must have grab bars or a roll-in shower — a standard guest room lacking them is not a violation. When you cannot tell whether a room is a designated accessible unit, say so rather than assuming.',
    '',
  ];

  for (const [fixture, fixtureRows] of byFixture) {
    fixtureRows.sort(
      (a, b) =>
        Number(b.access_role === 'gating') - Number(a.access_role === 'gating'),
    );
    lines.push(`## ${fixture}`);
    for (const row of fixtureRows) {
      const tag = row.access_role === 'gating' ? ' [GATING]' : '';
      lines.push(`- ${row.section} ${row.title}${tag}: ${row.rule}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Resolve a section cite (e.g. "§608.7", "§604") to its catalog row.
 * Tries an exact match, then the 3-digit base (§608.7 -> §608), then any
 * subsection under that base. Returns undefined if the section is not in
 * the catalog at all.
 */
function rowForSection(sectionRef: string): AdaStandardRow | undefined {
  const norm = sectionRef.trim();
  const exact = ADA_CATALOG.find((r) => r.section === norm);
  if (exact) return exact;
  const base = /^(§\d{3,4})/.exec(norm)?.[1];
  if (!base) return undefined;
  const baseRow = ADA_CATALOG.find((r) => r.section === base);
  if (baseRow) return baseRow;
  return ADA_CATALOG.find((r) => r.section.startsWith(base + '.'));
}

/**
 * Authoritative section -> Standards Guide URL. The catalog owns the
 * section -> guide-page mapping; rows with no dedicated page ('') fall
 * back to the chapter URL. Mirrors the URL format of guideUrlForTopic()
 * in standardsIndex.ts so links are consistent across surfaces. Returns
 * undefined only when the section is not in the catalog at all.
 */
export function guideUrlForSection(sectionRef: string): string | undefined {
  const row = rowForSection(sectionRef);
  if (!row) return undefined;
  if (row.guide_slug) return `/standards-guide/guide/${row.guide_slug}`;
  if (row.chapter >= 1 && row.chapter <= 10) {
    return `/standards-guide/chapter/${row.chapter}`;
  }
  return '/standards-guide';
}

/**
 * Plain-language education for a cited section, for the Ada Spot paid report.
 * Returns the section's human-readable title, the paraphrased plain-language
 * rule (NOT verbatim statute), and an absolute Standards-Guide link. Undefined
 * for an unknown section. Subsections resolve to their parent via rowForSection.
 */
export function educationForSection(
  sectionRef: string,
): { ruleTitle: string; ruleExplanation: string; guideUrl: string } | undefined {
  const row = rowForSection(sectionRef);
  if (!row) return undefined;
  const path = row.guide_slug
    ? `/standards-guide/guide/${row.guide_slug}`
    : row.chapter >= 1 && row.chapter <= 10
      ? `/standards-guide/chapter/${row.chapter}`
      : '/standards-guide';
  return {
    ruleTitle: row.title,
    ruleExplanation: row.rule,
    guideUrl: `https://ada.adalegallink.com${path}`,
  };
}
