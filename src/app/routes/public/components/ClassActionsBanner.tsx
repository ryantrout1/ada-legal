/**
 * ClassActionsBanner — standing documentation banner on /class-actions.
 *
 * Sits above the page heading. Explains in one paragraph what the
 * directory is for and what kinds of cases are listed (active class
 * actions, DOJ enforcement, settled-cases-still-collecting, ongoing
 * DOJ investigations, and pattern-of-practice intake). Frames Ada as
 * the next step for anyone whose situation might match.
 *
 * Design notes:
 *  - Tonally similar to a research-library shelf marker, not a
 *    marketing banner. No "join now" verbs.
 *  - Uses design tokens only — no hardcoded colors.
 *  - Keep reading-level neutral: this is structural copy, not the
 *    case-by-case prose that toggles voice.
 *
 * Ref: /plan Phase A3b.
 */

export function ClassActionsBanner() {
  return (
    <aside
      aria-label="About this directory"
      className="rounded-md border border-surface-200 bg-surface-100 px-5 py-4 sm:px-6 sm:py-5"
    >
      <h2 className="font-display text-lg text-ink-900 mb-2">
        About this directory
      </h2>
      <p className="text-sm sm:text-base text-ink-700 leading-relaxed">
        These are active legal actions and ongoing patterns of harm
        related to disability access — class actions in court, DOJ
        enforcement and consent decrees, open investigations, and areas
        where we&rsquo;re collecting reports even without a named case
        yet. If anything below matches what happened to you, you can
        tell Ada the story; she&rsquo;ll help you figure out whether
        your situation fits and what comes next.
      </p>
    </aside>
  );
}
