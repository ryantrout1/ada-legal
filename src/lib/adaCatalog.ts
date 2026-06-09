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
 * STATUS: covers the priority photo-assessable gaps from the coverage gap
 * map — the maneuvering-clearance fundamentals (Ch 3), the full plumbing/
 * bathroom domain (Ch 6), the scoping spine (Ch 2), and the major building
 * types and elements (Ch 4/5/7/8/9/10). Rule text is a working draft from
 * the 2010 Standards: Gina signed off on the citations as-is for now, with
 * deeper legal review to follow. The long tail of rarely-photographed and
 * non-photo-assessable sections is still to be added (then a CI assertion,
 * Phase 5, guards completeness).
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
 */
export type AccessRole = 'gating' | 'component' | 'scoping';

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
    guide_slug: 'accessible-routes',
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
    guide_slug: 'toilet-rooms',
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
    guide_slug: 'assembly',
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
    guide_slug: 'transient-lodging',
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
    guide_slug: 'residential',
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
    guide_slug: 'curb-ramps',
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
    guide_slug: 'loading-zones',
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
    guide_slug: 'drinking-fountains',
    source_ref: CH6,
  },
  {
    section: '§605',
    chapter: 6,
    title: 'Urinals',
    fixture: 'urinal',
    rule: 'Where urinals are provided, at least one must be a stall-type or wall-hung type with the rim 17 in max above the floor, with a 30 by 48 in clear floor space positioned for a forward approach (605).',
    access_role: 'component',
    photo_assessable: true,
    guide_slug: 'urinals',
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
    guide_slug: 'lavatories',
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
    guide_slug: 'bathtubs',
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
    guide_slug: 'grab-bars',
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
    guide_slug: 'laundry',
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
    guide_slug: 'saunas-steam',
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
    guide_slug: 'fire-alarms',
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
    guide_slug: 'telephones',
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
    guide_slug: 'assistive-listening',
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
    guide_slug: 'atms',
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
    guide_slug: 'two-way-communication',
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
    guide_slug: 'assembly',
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
    guide_slug: 'dressing-rooms',
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
    guide_slug: 'kitchens',
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
    guide_slug: 'medical-care',
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
    guide_slug: 'transient-lodging',
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
    guide_slug: 'residential',
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
    guide_slug: 'transportation',
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
    guide_slug: 'storage',
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
    guide_slug: 'dining-surfaces',
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
    guide_slug: 'benches',
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
    guide_slug: 'exercise-equipment',
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
    guide_slug: 'play-areas',
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
    guide_slug: 'pools-spas',
    source_ref: CH10,
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

/** Scoping rows — applicability rules used to FRAME findings, not flag them. */
export const SCOPING_SECTIONS: AdaStandardRow[] = ADA_CATALOG.filter(
  (row) => row.access_role === 'scoping',
);
