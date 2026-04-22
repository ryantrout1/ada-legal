/**
 * Routing destinations registry.
 *
 * Step 18 maps an ADA classification + context to one or more concrete
 * destinations (file a complaint here, call this line, talk to this
 * attorney). Ada never fabricates destination URLs — she reads them
 * from this registry.
 *
 * Every URL and contact in this file has been verified against an
 * authoritative source (ada.gov, eeoc.gov, justice.gov) as of the
 * date in SOURCES_LAST_VERIFIED below. When a URL changes upstream,
 * edit this file and update the date.
 *
 * Design principles:
 *
 *   1. ACCESSIBLE BY DEFAULT. Phone numbers include TTY alternatives
 *      where available. Descriptions are written for screen readers
 *      first: one idea per sentence, no embedded links in the middle
 *      of prose, the URL is its own item after the description.
 *
 *   2. PLAIN LANGUAGE. The `userDescription` fields are what end
 *      users see on their package page. They must be readable by
 *      someone with a cognitive disability, someone reading in a
 *      second language, someone who is overwhelmed and tired. No
 *      jargon. No legalese.
 *
 *   3. SAFE DEFAULTS. If we don't have a state-specific match, we
 *      fall back to the federal path rather than leaving the user
 *      stuck. Unknown is never a valid response — the registry
 *      always returns something actionable.
 *
 *   4. NEVER PROMISE OUTCOMES. Descriptions explain what the
 *      destination does; they never claim the user will win, recover
 *      money, or see the business punished. Ada's disclaimer carries
 *      the rest of the weight.
 *
 *   5. COMMUNITY FIRST. Where a peer support option exists (a
 *      disability rights organization, a community resource line),
 *      we surface it as a coequal option to filing a formal
 *      complaint. Not everyone wants to file. Some just need to talk
 *      to someone like them. That's a valid outcome.
 *
 * Extending the registry:
 *   - Add a new ActionDestination record to an existing array.
 *   - If adding a new state-specific destination, update the
 *     STATE_CIVIL_RIGHTS_OFFICES map keyed by 2-letter state code.
 *   - If adding a new classification, add a branch in routeFor().
 *
 * NOT in this registry:
 *   - Attorneys (those come from search_attorneys tool)
 *   - Class-action-specific destinations (that registry ships in
 *     Phase D, Step 26)
 *   - Anything that requires a paid subscription
 *
 * Ref: Step 18 plan, Commit 2.
 */

import type { AdaTitle } from '../../types/db.js';

// ─── Timestamp ────────────────────────────────────────────────────────────────

/**
 * Last time all URLs and phone numbers in this file were verified
 * against authoritative sources. Bump this every time destinations
 * are edited.
 */
export const SOURCES_LAST_VERIFIED = '2026-04-22';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A place Ada can send a user. Generic enough to represent:
 *   - Federal agencies (EEOC, DOJ)
 *   - State civil rights offices
 *   - Information lines (phone / TTY)
 *   - Self-help paths (demand letter template, documentation guidance)
 *   - Attorney handoff (only kind Ada can personally complete)
 */
export type ActionDestinationKind =
  | 'federal_complaint' // EEOC, DOJ, FTA, etc.
  | 'state_complaint' // State civil-rights or AG office
  | 'info_line' // Phone / TTY line, not a complaint destination
  | 'self_help' // Demand letter, documentation guidance
  | 'attorney_handoff' // Warm intro via attorney directory
  | 'community_resource'; // Peer support, disability rights org

export interface ActionDestination {
  /**
   * Stable slug. Used as the registry key, in analytics, in tests.
   * snake_case, no spaces.
   */
  id: string;
  kind: ActionDestinationKind;
  /**
   * Short label for buttons / UI cards. Max ~40 chars.
   * Example: "File with the EEOC"
   */
  label: string;
  /**
   * Plain-language description for the user-facing package page.
   * 1-3 sentences. What the destination does, not what it will
   * achieve for them.
   */
  userDescription: string;
  /**
   * Canonical web URL, or null if this is a phone-only destination.
   */
  url: string | null;
  /**
   * Phone contacts. Prefer `voice` for primary; `tty` when available.
   */
  phone?: {
    voice?: string;
    tty?: string;
    tollFreeNote?: string;
  };
  /**
   * Mailing address, when a destination accepts paper complaints.
   * Formatted as a single string ready to render.
   */
  mailingAddress?: string;
  /**
   * Short list of items the user should gather before filing. Each
   * entry is one line, written as a present-tense imperative.
   * Example: "The business's name and address"
   */
  prepChecklist?: string[];
  /**
   * Optional deadline note. Example: "Usually within 180 days of
   * the incident."
   */
  deadlineNote?: string;
}

// ─── Federal destinations ─────────────────────────────────────────────────────

/**
 * Title I — employment / workplace. Federal EEOC path.
 * Verified: eeoc.gov/filing-charge-discrimination
 */
export const EEOC_TITLE_I: ActionDestination = {
  id: 'eeoc_title_i',
  kind: 'federal_complaint',
  label: 'File a charge with the EEOC',
  userDescription:
    'The Equal Employment Opportunity Commission handles disability ' +
    'discrimination at work. You can start a charge online, by phone, ' +
    'or in person at a field office. Filing a charge is free.',
  url: 'https://www.eeoc.gov/filing-charge-discrimination',
  phone: {
    voice: '1-800-669-4000',
    tty: '1-800-669-6820',
    tollFreeNote: 'Free to call. Open Monday through Friday during business hours.',
  },
  prepChecklist: [
    "Your employer's name and address",
    'Dates when the discrimination happened',
    'Names of anyone who witnessed what happened',
    'Copies of any documents or messages related to what happened',
    'How the discrimination affected your work',
  ],
  deadlineNote: 'Usually within 180 days of the most recent incident, or 300 days in some states.',
};

/**
 * Title II — state or local government. Federal DOJ path.
 * Verified: ada.gov/filing-a-complaint
 */
export const DOJ_TITLE_II: ActionDestination = {
  id: 'doj_title_ii',
  kind: 'federal_complaint',
  label: 'File an ADA complaint with the DOJ',
  userDescription:
    'The Department of Justice handles complaints about state and ' +
    'local government services — public schools, transit, courthouses, ' +
    'city offices. You can file online, by mail, or by fax. Filing is free.',
  url: 'https://www.ada.gov/filing-a-complaint/',
  phone: {
    voice: '1-800-514-0301',
    tty: '1-833-610-1264',
    tollFreeNote: 'The ADA Information Line. Free. Can help if you need an accommodation to file.',
  },
  mailingAddress:
    'U.S. Department of Justice\n' +
    'Civil Rights Division\n' +
    '950 Pennsylvania Avenue NW\n' +
    'Disability Rights Section\n' +
    'Washington, DC 20530',
  prepChecklist: [
    'The name and address of the government office',
    "The date the discrimination happened",
    "A description of what happened in your own words",
    'Names of any witnesses',
    'Copies of related documents (keep the originals)',
  ],
  deadlineNote: 'Usually within 180 days of the incident.',
};

/**
 * Title III — public accommodation (private business). Federal DOJ path.
 * DOJ takes Title III complaints at the same intake as Title II.
 * For Title III, the attorney-handoff path is usually preferable
 * (the DOJ pursues only pattern cases and a fraction of complaints).
 * Verified: ada.gov/filing-a-complaint
 */
export const DOJ_TITLE_III: ActionDestination = {
  id: 'doj_title_iii',
  kind: 'federal_complaint',
  label: 'File an ADA complaint with the DOJ',
  userDescription:
    'The Department of Justice handles complaints about private ' +
    'businesses — restaurants, stores, hotels, medical offices. The ' +
    'DOJ pursues only some complaints, so this works best alongside ' +
    'other action, not instead of it. Filing is free.',
  url: 'https://www.ada.gov/filing-a-complaint/',
  phone: {
    voice: '1-800-514-0301',
    tty: '1-833-610-1264',
    tollFreeNote: 'The ADA Information Line. Free. Can help if you need an accommodation to file.',
  },
  mailingAddress:
    'U.S. Department of Justice\n' +
    'Civil Rights Division\n' +
    '950 Pennsylvania Avenue NW\n' +
    'Disability Rights Section\n' +
    'Washington, DC 20530',
  prepChecklist: [
    "The business's name and address",
    'The date the discrimination happened',
    'A description of what happened in your own words',
    'Names of any witnesses',
    'Photos or documents showing the barrier',
  ],
  deadlineNote: 'No strict deadline, but sooner is better. Most people file within 180 days.',
};

/**
 * Self-help: the pre-lawsuit demand letter. Title III only.
 * This is a template the user sends themselves, under their own
 * signature, from their own email. Ada does not send it. Ada does
 * not advise on whether to send it.
 *
 * Rationale: most Title III cases settle before litigation when the
 * business receives a serious letter with the specific regulation
 * cited. This is genuine leverage for people who can't afford a
 * lawyer for a small-dollar case.
 */
export const TITLE_III_DEMAND_LETTER: ActionDestination = {
  id: 'title_iii_demand_letter',
  kind: 'self_help',
  label: 'Send a demand letter to the business',
  userDescription:
    'A demand letter is a formal letter you send to the business asking ' +
    'them to fix the problem, and sometimes to pay you back for what it ' +
    'cost you. Most businesses take a demand letter seriously — many ' +
    'issues are resolved this way without a lawsuit.',
  url: null, // The letter itself is generated in the package (Commit 3).
  prepChecklist: [
    "The business's mailing address or general contact email",
    'What you want them to do (refund, accommodation, policy change)',
    'Your contact information so they can respond',
  ],
};

/**
 * Attorney handoff for Title III — the only destination Ada can
 * personally complete (via the existing attorney directory).
 */
export const TITLE_III_ATTORNEY: ActionDestination = {
  id: 'title_iii_attorney',
  kind: 'attorney_handoff',
  label: 'Talk to an attorney',
  userDescription:
    "An attorney can tell you if your case is strong enough to pursue, " +
    "handle communications with the business, and file a lawsuit if " +
    "needed. Many attorneys offer a free consultation. The attorneys " +
    "in our directory work on ADA accessibility cases.",
  url: null, // Handled via the attorney directory handoff, not a URL.
  prepChecklist: [
    'A summary of what happened (the package has this)',
    'Any photos or documents (the package has these)',
    'Dates and names of people involved',
    "Your availability for an initial call",
  ],
};

// ─── Information / support destinations ───────────────────────────────────────

/**
 * ADA Information Line — a federal resource that can answer
 * technical ADA questions and help with accommodations. Not a
 * complaint destination, but useful when the user needs human
 * guidance before or while filing.
 */
export const ADA_INFO_LINE: ActionDestination = {
  id: 'ada_info_line',
  kind: 'info_line',
  label: 'ADA Information Line',
  userDescription:
    'If you need help understanding the ADA or want someone to ' +
    'explain your options, this federal information line is free. ' +
    'They can also help you request accommodations to file a complaint.',
  url: 'https://www.ada.gov/infoline/',
  phone: {
    voice: '1-800-514-0301',
    tty: '1-833-610-1264',
    tollFreeNote: 'Free. Monday through Friday, except Thursday afternoons.',
  },
};

/**
 * Regional ADA Centers — 10 federally funded regional centers that
 * provide ADA technical assistance. These are peer/community-style
 * resources; some offer in-person help.
 */
export const REGIONAL_ADA_CENTERS: ActionDestination = {
  id: 'regional_ada_centers',
  kind: 'community_resource',
  label: 'Regional ADA Center',
  userDescription:
    'The ADA National Network is 10 regional centers that answer ' +
    'ADA questions and connect people with local resources. They ' +
    'offer free, confidential help.',
  url: 'https://adata.org/find-your-region',
  phone: {
    voice: '1-800-949-4232',
    tollFreeNote: 'Free. Connects you to the center for your region.',
  },
};

// ─── State civil rights fallback ──────────────────────────────────────────────

/**
 * Many states have their own civil rights office that handles
 * disability-discrimination complaints under state law, sometimes
 * with faster timelines or better remedies than the federal route.
 *
 * Keyed by 2-letter state code. Seeded for the states Ryan has
 * indicated interest (AZ primary; TX, CA, NY as high-population
 * defaults). Expand over time.
 *
 * Missing entries fall back to the federal destination + a generic
 * "check your state civil rights office" pointer in the package.
 */
export const STATE_CIVIL_RIGHTS_OFFICES: Record<string, ActionDestination> = {
  AZ: {
    id: 'az_civil_rights',
    kind: 'state_complaint',
    label: 'File with the Arizona Civil Rights Division',
    userDescription:
      'The Arizona Attorney General\u2019s Civil Rights Division handles ' +
      'disability discrimination under Arizona state law. You can file ' +
      'alongside a federal complaint. Filing is free.',
    url: 'https://www.azag.gov/civil-rights/file-complaint',
    phone: {
      voice: '1-877-491-5742',
      tollFreeNote: 'Free. Arizona residents.',
    },
    deadlineNote: 'Usually within 180 days under Arizona state law.',
  },
};

// ─── Dispatch ─────────────────────────────────────────────────────────────────

/**
 * Input context that shapes routing. Anything that can change which
 * destinations apply. Keep minimal — add fields only when a real
 * routing decision needs them.
 */
export interface RoutingContext {
  /** Classification Ada assigned. */
  title: AdaTitle;
  /**
   * 2-letter US state code if known (from extract_field
   * location_state). Lowercase or uppercase accepted. Null when
   * unknown; fed-only destinations still resolve.
   */
  state?: string | null;
  /**
   * True if we found at least one attorney match via the
   * search_attorneys tool earlier in the session. Drives whether
   * TITLE_III_ATTORNEY is included in Title III routes.
   */
  attorneyMatched?: boolean;
}

/**
 * Route shape returned by routeFor().
 *
 * `primary` is what the user should do first. `alternates` are
 * coequal or fallback options. `info` is support (phone lines,
 * regional centers) that don't replace action but help the user
 * take action.
 *
 * Note on language: this module uses "primary" internally, but the
 * package-rendering layer (Commit 4) surfaces it to users with
 * softer language like "what people usually do next" — never
 * "recommended action." Ada informs; she does not direct.
 */
export interface Route {
  primary: ActionDestination;
  alternates: ActionDestination[];
  info: ActionDestination[];
}

/**
 * Map a classification + context to destinations.
 *
 * Decision rules:
 *
 *   Title I  → EEOC primary; state civil rights if available;
 *              info line.
 *
 *   Title II → DOJ primary; state civil rights if available;
 *              info line + regional centers.
 *
 *   Title III → If attorney matched: attorney primary + demand
 *               letter alternate + DOJ alternate.
 *               If no attorney: demand letter primary + DOJ
 *               alternate + regional centers.
 *               Rationale: demand letters resolve a large share
 *               of Title III cases without cost or delay. When
 *               no attorney is matched, giving the user the
 *               leverage of a formal letter is better than only
 *               pointing them to the DOJ (which pursues few cases).
 *
 *   class_action → Placeholder. Phase D Step 26 populates this
 *                  branch properly. For Step 18, route the user
 *                  to the appropriate underlying title (typically
 *                  Title III) and note in the package that class-
 *                  action matching is coming.
 *
 *   out_of_scope → Regional ADA Center primary (they can help
 *                  route to the right regime); info line;
 *                  state civil rights if available. The package
 *                  still documents the experience.
 *
 *   none → Regional ADA Center primary; info line. Equivalent
 *          to out_of_scope in behavior but retained for backward
 *          compatibility with old sessions.
 */
export function routeFor(ctx: RoutingContext): Route {
  const state = normalizeState(ctx.state);
  const stateDest = state ? STATE_CIVIL_RIGHTS_OFFICES[state] ?? null : null;

  switch (ctx.title) {
    case 'I':
      return {
        primary: EEOC_TITLE_I,
        alternates: stateDest ? [stateDest] : [],
        info: [ADA_INFO_LINE, REGIONAL_ADA_CENTERS],
      };

    case 'II':
      return {
        primary: DOJ_TITLE_II,
        alternates: stateDest ? [stateDest] : [],
        info: [ADA_INFO_LINE, REGIONAL_ADA_CENTERS],
      };

    case 'III':
      if (ctx.attorneyMatched) {
        return {
          primary: TITLE_III_ATTORNEY,
          alternates: [
            TITLE_III_DEMAND_LETTER,
            DOJ_TITLE_III,
            ...(stateDest ? [stateDest] : []),
          ],
          info: [ADA_INFO_LINE, REGIONAL_ADA_CENTERS],
        };
      }
      return {
        primary: TITLE_III_DEMAND_LETTER,
        alternates: [
          DOJ_TITLE_III,
          ...(stateDest ? [stateDest] : []),
        ],
        info: [ADA_INFO_LINE, REGIONAL_ADA_CENTERS],
      };

    case 'class_action':
      // Phase D Step 26 replaces this branch. For now, treat as
      // Title III with no attorney match; the package-rendering
      // layer is responsible for surfacing the "class action
      // matching is coming soon" message.
      return {
        primary: TITLE_III_DEMAND_LETTER,
        alternates: [DOJ_TITLE_III, ...(stateDest ? [stateDest] : [])],
        info: [ADA_INFO_LINE, REGIONAL_ADA_CENTERS],
      };

    case 'out_of_scope':
    case 'none':
      return {
        primary: REGIONAL_ADA_CENTERS,
        alternates: stateDest ? [stateDest] : [],
        info: [ADA_INFO_LINE],
      };

    default: {
      // Exhaustiveness guard — TypeScript will flag a new AdaTitle
      // value without a branch here.
      const exhaustive: never = ctx.title;
      void exhaustive;
      return {
        primary: REGIONAL_ADA_CENTERS,
        alternates: [],
        info: [ADA_INFO_LINE],
      };
    }
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function normalizeState(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toUpperCase();
  // Accept either 2-letter codes ("AZ") or any state-shaped input;
  // the map lookup will just miss for unsupported entries.
  return trimmed.length === 2 ? trimmed : null;
}
