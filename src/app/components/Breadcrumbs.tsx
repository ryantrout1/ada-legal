/**
 * Breadcrumbs — accessible breadcrumb trail for content pages.
 *
 * Satisfies WCAG 2.2 SC 2.4.8 (Location, AAA): "Information about the
 * user's location within a set of Web pages is available." Renders an
 * ordered list of crumbs separated by visual chevrons (aria-hidden).
 * The last crumb is the current page — rendered as plain text, marked
 * with aria-current="page", not a link.
 *
 * Tailwind-based, designed for the light-content context of regular
 * public routes. The Standards Guide chapter pages use a separate
 * dark-context breadcrumb baked into GuideHeroBanner. This component
 * is for everything else: AboutAda, Accessibility, Privacy, Terms,
 * Attorneys list, ClassActions list/detail, Standards Guide index.
 *
 * Tap-target sizing follows Round 2 Group 8 #26 (the breadcrumb back-
 * link on ClassActionDetail): px-2 py-1.5 -mx-2 -my-1.5 rounded so the
 * hit area is comfortable on mobile without disturbing the visual line
 * height of the breadcrumb row.
 *
 * Round 3 AAA+COGA Group C, item #42 (C1).
 */

import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  /** Visible label for the crumb. Last item is the current page. */
  label: string;
  /**
   * Optional destination. Omit on the last crumb (current page).
   * Earlier crumbs without `to` render as plain text labels too —
   * useful for showing context above the immediate parent without
   * making it navigable.
   */
  to?: string;
}

export interface BreadcrumbsProps {
  /**
   * The crumb trail. The first crumb is typically Home; the last is
   * the current page. Minimum 2 items — one-deep pages don't get
   * breadcrumbs (the global header already shows where you are).
   */
  items: BreadcrumbItem[];
  /** Optional className applied to the wrapping nav for spacing tweaks. */
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  // Defensive: a single-item trail is just the current page; not a
  // breadcrumb, render nothing rather than a stranded label.
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 m-0 p-0 list-none text-sm">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${idx}-${item.label}`} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="inline-block px-2 py-1.5 -mx-2 -my-1.5 rounded text-ink-500 hover:text-accent-600 hover:underline underline-offset-2 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="px-2 py-1.5 -mx-2 -my-1.5 text-ink-700 font-medium"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-ink-300 select-none">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
