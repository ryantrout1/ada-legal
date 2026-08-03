/**
 * SpotReportView — renders a persisted Ada Spot report (SpotReportContent).
 *
 * Three surfaces render this: the buyer's hosted readout at /spot/r/:slug, the
 * admin release queue, and the test preview on /spot. They must stay identical
 * — a reviewer approving a report has to be looking at what the buyer will see.
 *
 * THE SHAPE. The old version drew every finding as the same card, which made a
 * report of four findings read as a list of four equivalent assertions. It is
 * not. `hedged` records whether the photograph settled the question, and that
 * is the difference between "move these bins" and "go measure the threshold".
 * Findings are grouped on it, under headings that say which is which. The
 * grouping and the derived summary line live in reportLayout.ts, where a test
 * can reach them — this file is markup.
 *
 * REPEATED RULE TEXT. `ruleExplanation` is the same paragraph under every
 * finding citing the same section — identical under three of four in the
 * sample report. It is collapsed rather than dropped: it is genuinely useful
 * the first time, and useless the third. The print stylesheet opens it, since
 * a printed document has no way to expand anything.
 *
 * Photos sit ABOVE the findings deliberately. The findings describe a place
 * the reader cannot see; the photograph is what lets them check the claim.
 * They are passed in rather than read from `content` because spot_photo runs
 * on a 90-day sweep while the report is permanent.
 *
 * COLOUR. Tokens only, no literals — pinned by spotReportTokens.test.ts. That
 * is what carries this through all five display modes, including the
 * low-vision mode that is gold on pure black.
 *
 * Ref: /plan Spot report redesign, phase 2.
 */

import type { SpotReportContent, SpotReportItem } from '@/lib/spot/reportSchema';
import { groupFindings, stripEntries, summaryLine } from '@/lib/spot/reportLayout';
import { SPOT_REPORT_STARTER_DISCLAIMER } from '@/lib/spot/spotDisclaimers';
import { buildPinNumbering } from '@/lib/spot/pinNumbering';
import { PinnedPhoto } from './PinnedPhoto';

/** Severity drives emphasis, not colour meaning. A red would read as a
 *  verdict, and this product never returns one. */
function chipClass(severity: SpotReportItem['severity']): string {
  if (severity === 'critical' || severity === 'major') {
    return 'border border-accent-600 bg-accent-50 text-accent-600';
  }
  if (severity === 'minor') return 'border border-surface-200 bg-surface-100 text-ink-700';
  return 'border border-surface-200 text-ink-500';
}

function Finding({ item, number }: { item: SpotReportItem; number?: number | null }) {
  // The grid is only declared when there is a second column to put in it.
  // Declaring it unconditionally leaves 11rem of dead space on the right of
  // every finding without a target — which is every finding on every report
  // generated before the field existed.
  const topClass = item.target ? 'sm:grid sm:grid-cols-[1fr_11rem] print:block' : '';

  return (
    <section className="overflow-hidden rounded-lg border border-surface-200 bg-white">
      <div className={topClass}>
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            {number != null ? (
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-600 text-xs font-semibold leading-none text-[color:var(--page-bg)]">
                {number}
              </span>
            ) : null}
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide ${chipClass(item.severity)}`}
            >
              {item.severityLabel}
            </span>
          </div>
          <h4 className="font-display text-lg font-bold text-ink-900">{item.title}</h4>
          <p className="mt-3 text-ink-700">{item.concern}</p>
        </div>

        {item.target ? (
          <div className="flex flex-col justify-center border-t border-surface-200 bg-accent-50 p-5 text-center sm:border-l sm:border-t-0 print:border-l-0 print:border-t">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-600">
              Target
            </span>
            <span className="mt-2 text-3xl font-extrabold leading-none tracking-tight text-ink-900 tabular-nums">
              {item.target.value}
            </span>
            <span className="mt-2 text-xs text-ink-500">{item.target.label}</span>
          </div>
        ) : null}
      </div>

      <div className="border-t border-surface-200 bg-surface-100 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-accent-600">
          How to address it
        </p>
        <p className="mt-2 text-ink-900">{item.remediation}</p>
        {item.hedged && item.hedgeNote ? (
          <p className="mt-3 text-sm text-ink-500">{item.hedgeNote}</p>
        ) : null}
      </div>

      {item.ruleExplanation || item.citedSection ? (
        <div className="border-t border-surface-200 px-5 py-3">
          {item.ruleExplanation ? (
            <details className="spot-rule">
              <summary className="flex min-h-[44px] cursor-pointer items-center text-xs font-medium uppercase tracking-wider text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50">
                What this rule means{item.ruleTitle ? ` — ${item.ruleTitle}` : ''}
              </summary>
              <p className="pb-2 text-sm text-ink-700">{item.ruleExplanation}</p>
            </details>
          ) : null}
          {item.citedSection ? (
            <p className="text-xs text-ink-500">
              Related standard:{' '}
              {item.citedUrl ? (
                <a
                  href={item.citedUrl}
                  className="text-accent-600 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                >
                  {item.citedSection}
                </a>
              ) : (
                item.citedSection
              )}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Group({
  heading,
  items,
  numberForItem,
}: {
  heading: string;
  items: SpotReportItem[];
  numberForItem?: (item: SpotReportItem) => number | null;
}) {
  // An empty group renders nothing at all — not a heading over blank space.
  if (items.length === 0) return null;
  return (
    <>
      <h3 className="mt-10 border-b border-surface-200 pb-2 text-xs font-bold uppercase tracking-widest text-ink-500">
        {heading}
      </h3>
      <div className="mt-4 space-y-4">
        {items.map((item, i) => (
          <Finding key={`${item.title}-${i}`} item={item} number={numberForItem?.(item) ?? null} />
        ))}
      </div>
    </>
  );
}

export default function SpotReportView({
  content,
  photos = [],
  photosPurged = false,
  annotationsEnabled = false,
}: {
  content: SpotReportContent;
  /** Live photo URLs for the session. Empty once the 90-day sweep has run. */
  photos?: string[];
  /** True when this session HAD photos and none survive retention. */
  photosPurged?: boolean;
  /**
   * Render photo location pins. The public report passes the live
   * spot_show_annotations flag (kill-switch); the admin review passes true so
   * pins can be reviewed before public enable. Default off.
   */
  annotationsEnabled?: boolean;
}) {
  const groups = groupFindings(content.items);
  const summary = summaryLine(groups);
  const targets = stripEntries(content.items);
  const numbering = annotationsEnabled
    ? buildPinNumbering(groups.confirmed, content.photoAnnotations)
    : null;

  return (
    <article className="spot-report">
      <p className="mb-5 rounded-md border border-surface-200 bg-surface-100 px-4 py-3 text-xs text-ink-700">
        {SPOT_REPORT_STARTER_DISCLAIMER}
      </p>

      <p className="text-xs font-bold uppercase tracking-widest text-ink-500">
        Accessibility screening
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-ink-900">
        {content.headline}
      </h2>
      {summary ? <p className="mt-2 text-lg text-ink-500">{summary}</p> : null}

      {targets.length > 0 ? (
        <ul className="mt-6 grid list-none grid-cols-2 gap-px overflow-hidden rounded-lg border border-surface-200 bg-surface-200 p-0 sm:grid-cols-4">
          {targets.map((t, i) => (
            <li key={`${t.value}-${i}`} className="bg-white p-4 text-center">
              <span className="block text-xl font-extrabold leading-none tracking-tight text-accent-600 tabular-nums">
                {t.value}
              </span>
              <span className="mt-2 block text-xs text-ink-500">{t.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {photos.length > 0 ? (
        <ul className="mt-6 list-none space-y-3 p-0">
          {photos.map((url, i) => (
            <li key={url}>
              <PinnedPhoto
                url={url}
                index={i}
                total={photos.length}
                pins={numbering ? numbering.pinsForPhoto(url) : []}
              />
            </li>
          ))}
          <li className="text-xs text-ink-500">
            The photographs this screening read. Photos are deleted after 90 days; the report
            stays.
          </li>
        </ul>
      ) : null}

      {/* Only when photos existed and were swept. A report that never had
          photos says nothing, because there is nothing to explain. */}
      {photos.length === 0 && photosPurged ? (
        <p className="mt-6 rounded-md border border-surface-200 bg-surface-100 px-4 py-3 text-sm text-ink-700">
          The photos for this screening have been deleted. Uploaded photos are removed after 90
          days; the report stays available.
        </p>
      ) : null}

      {content.overview ? <p className="mt-6 text-lg text-ink-900">{content.overview}</p> : null}

      <Group
        heading="Visible in the photo"
        items={groups.confirmed}
        numberForItem={numbering?.numberForItem}
      />
      <Group heading="A photo can’t settle these — go measure" items={groups.unconfirmed} />

      <p className="mt-10 border-t border-surface-200 pt-4 text-xs text-ink-500">
        {content.disclaimer}
      </p>
    </article>
  );
}
