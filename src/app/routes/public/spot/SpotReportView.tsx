/**
 * SpotReportView — renders a persisted Ada Spot report (SpotReportContent).
 *
 * Dual-use: the admin preview (Phase 3b) and the hosted delivery readout
 * (Phase 4) both render through here, so the reader-facing artifact is defined
 * once. Screening language + hedge notes come from the persisted content
 * (composeReport already enforced them). AAA: tokens only, semantic headings.
 *
 * Photos are passed in rather than read from `content`, because they are not
 * part of the artifact: spot_photo runs on a 90-day sweep while the report is
 * permanent. Joined at read time, they can simply be absent later without
 * leaving dead links in stored JSON.
 *
 * They sit ABOVE the findings deliberately. The findings name a yellow-painted
 * edge and a raised landing; the photo is what lets a reader check the claim
 * against what they actually photographed. Without it the report is a list of
 * assertions about a place you cannot see.
 */

import type { SpotReportContent } from '@/lib/spot/reportSchema';
import { SPOT_REPORT_STARTER_DISCLAIMER } from '@/lib/spot/spotDisclaimers';

export default function SpotReportView({
  content,
  photos = [],
  photosPurged = false,
}: {
  content: SpotReportContent;
  /** Live photo URLs for the session. Empty once the 90-day sweep has run. */
  photos?: string[];
  /** True when this session HAD photos and none survive retention. */
  photosPurged?: boolean;
}) {
  return (
    <article className="rounded-lg border border-surface-200 bg-surface-100 p-5">
      <p className="mb-4 rounded-md border border-surface-200 bg-surface-50 px-4 py-3 text-xs text-ink-700">
        {SPOT_REPORT_STARTER_DISCLAIMER}
      </p>
      <h2 className="font-display text-2xl text-ink-900">{content.headline}</h2>
      {content.overview ? <p className="mt-2 text-ink-900">{content.overview}</p> : null}

      {photos.length > 0 ? (
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 list-none p-0">
          {photos.map((url, i) => (
            <li key={url} className="rounded-md border border-surface-200 bg-surface-50 p-2">
              <img
                src={url}
                alt={`Photo ${i + 1} of ${photos.length} screened in this report`}
                className="block w-full rounded-sm"
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {/* Only when photos existed and were swept. A report that never had
          photos says nothing, because there is nothing to explain. */}
      {photos.length === 0 && photosPurged ? (
        <p className="mt-5 rounded-md border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-ink-700">
          The photos for this screening have been deleted. Uploaded photos are removed after 90
          days; the report stays available.
        </p>
      ) : null}

      {content.items.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {content.items.map((item, i) => (
            <li key={i} className="rounded-md border border-surface-200 bg-surface-50 p-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                  {item.severityLabel}
                </span>
                <span className="font-display text-base text-ink-900">{item.title}</span>
              </div>
              <p className="mt-2 text-sm text-ink-700">{item.concern}</p>
              <p className="mt-2 text-sm text-ink-900">
                <span className="font-medium">How to address it:</span> {item.remediation}
              </p>
              {item.hedged && item.hedgeNote ? (
                <p className="mt-2 text-sm text-ink-500">{item.hedgeNote}</p>
              ) : null}
              {item.ruleExplanation ? (
                <div className="mt-2 rounded-md bg-surface-100 px-3 py-2">
                  <p className="text-xs font-medium text-ink-700">
                    What this rule means{item.ruleTitle ? ` — ${item.ruleTitle}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-ink-700">{item.ruleExplanation}</p>
                </div>
              ) : null}
              {item.citedSection ? (
                <p className="mt-2 text-xs text-ink-500">
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
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-6 border-t border-surface-200 pt-4 text-xs text-ink-500">{content.disclaimer}</p>
    </article>
  );
}
