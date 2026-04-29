/**
 * PageTOC — accessible "On this page" anchor table of contents.
 *
 * Designed for long single-page reads (Privacy, Terms, Accessibility)
 * where users with attention difficulties, screen-reader users
 * navigating linearly, or anyone looking for a specific section
 * benefit from a jump-to mechanism.
 *
 * Pairs with section headings that have matching `id` attributes.
 * Smooth-scroll on click is handled by html { scroll-behavior: smooth }
 * which already exists in the audit doc — for the actual site, the
 * default browser jump is fine and respects prefers-reduced-motion
 * automatically.
 *
 * Round 3 AAA+COGA Group F, item #50 (F2).
 */

export interface TOCItem {
  /** Visible label shown in the TOC list. */
  label: string;
  /** Target heading id (without the leading #). */
  id: string;
}

export interface PageTOCProps {
  items: TOCItem[];
  /** Optional className applied to the wrapping nav. */
  className?: string;
}

export function PageTOC({ items, className }: PageTOCProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className={
        'rounded-lg border border-surface-200 bg-surface-100 px-5 py-5 sm:px-6 sm:py-6 ' +
        (className ?? '')
      }
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-500 mb-3">
        On this page
      </h2>
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-block px-2 py-1.5 -mx-2 -my-1.5 rounded text-ink-700 hover:text-accent-600 hover:underline underline-offset-2 transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
