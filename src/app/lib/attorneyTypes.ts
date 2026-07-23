/**
 * The public attorney row as `/api/attorneys` returns it.
 *
 * WHAT IS DELIBERATELY ABSENT: `bar_number`, `status`,
 * `account_status`, `subscription_status`, every Stripe field,
 * `marketplace_rules_accepted`, `flagged`, `flag_reason`,
 * `admin_notes`, and `admin_rating`. Base44's card carries a header
 * comment listing these as never-render fields; a comment is not a
 * mechanism. Leaving them off this type makes rendering one a compile
 * error instead of a code-review catch.
 *
 * The endpoint does not return them today either, so this is defence in
 * depth rather than a filter — but the endpoint is shared with Ada's
 * search_attorneys tool and could widen later.
 *
 * `serves_nationwide` is also absent: B44's own page mapper hardcodes
 * it to false, so the badge it drives is dead on both sides. Modelling
 * it here would imply a signal that does not exist.
 */

export interface PublicAttorneyRow {
  id: string;
  name: string;
  firm_name: string | null;
  location_city: string | null;
  location_state: string | null;
  /** Resolved from the firm server-side when the attorney row is empty. */
  practice_areas: string[];
  specialty_tags: string[];
  /** Bar licensure — NOT service area. Empty on every live row today. */
  states_of_practice: string[];
  bio: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
}

export interface PublicAttorneysResponse {
  attorneys: PublicAttorneyRow[];
  /** Unfiltered approved count — drives the thin-roster gate. */
  total_approved?: number;
}
