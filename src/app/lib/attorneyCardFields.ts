/**
 * Attorney card field resolution — pure.
 *
 * Every "should this section render?" decision lives here rather than
 * inline in the JSX, because the live roster is sparse enough that
 * those decisions are the substance of the card, not a detail of it:
 * one of four attorneys has a bio, none has specialty tags, and none
 * has bar-licensure states recorded. A section that renders its
 * heading over nothing reads as a broken site rather than an
 * unfinished profile.
 *
 * Ported behaviour from Base44's AttorneyCard (@ 6b1e9ac):
 * `getInitials` and `normalizeUrl` are B44's, unchanged in substance.
 */

import type { PublicAttorneyRow } from './attorneyTypes.js';

/** First + last initial. Never blank — a blank avatar looks like a bug. */
export function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Admins enter websites with and without a scheme. A bare domain in an
 * href resolves relative to the current origin, which would silently
 * produce a dead in-app link rather than an outbound one.
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function nonEmpty(values: readonly string[] | null | undefined): string[] {
  if (!values) return [];
  return values.filter((v) => typeof v === 'string' && v.trim().length > 0);
}

export interface AttorneyCardFields {
  initials: string;
  /** "City, ST" — empty string when neither part exists. */
  location: string;
  /** Practice areas and specialty tags, merged into one chip list. */
  chips: string[];
  /** Bar licensure states, distinct from the chip list. */
  states: string[];
  website: string | null;
  email: string | null;
  phoneLabel: string | null;
  /** Punctuation-stripped tel: href; null when there is no phone. */
  telHref: string | null;
  bio: string | null;
  showLocation: boolean;
  showChips: boolean;
  showStates: boolean;
  showBio: boolean;
  showContact: boolean;
}

export function toCardFields(row: PublicAttorneyRow): AttorneyCardFields {
  const location = [row.location_city, row.location_state]
    .filter((p) => p && p.trim())
    .join(', ');

  // B44 renders practice areas and specialty tags in one list under a
  // single "Practice areas" heading; merging them here keeps that.
  const chips = [...nonEmpty(row.practice_areas), ...nonEmpty(row.specialty_tags)];
  const states = nonEmpty(row.states_of_practice);
  const website = normalizeUrl(row.website_url);
  const email = row.email && row.email.trim() ? row.email : null;
  const phoneLabel = row.phone && row.phone.trim() ? row.phone : null;
  const bio = row.bio && row.bio.trim() ? row.bio : null;

  return {
    initials: getInitials(row.name),
    location,
    chips,
    states,
    website,
    email,
    phoneLabel,
    telHref: phoneLabel ? `tel:${phoneLabel.replace(/[^\d+]/g, '')}` : null,
    bio,
    showLocation: location.length > 0,
    showChips: chips.length > 0,
    showStates: states.length > 0,
    showBio: bio !== null,
    showContact: Boolean(website || email || phoneLabel),
  };
}
