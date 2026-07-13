/**
 * SpotReportView — renders a persisted Ada Spot report (SpotReportContent).
 *
 * Dual-use: the admin preview (Phase 3b) and the hosted delivery readout
 * (Phase 4) both render through here, so the reader-facing artifact is defined
 * once. Screening language + hedge notes come from the persisted content
 * (composeReport already enforced them). AAA: tokens only, semantic headings.
 */

import type { SpotReportContent } from '@/lib/spot/reportSchema';
import { SPOT_REPORT_STARTER_DISCLAIMER } from '@/lib/spot/spotDisclaimers';

export default function SpotReportView({ content }: { content: SpotReportContent }) {
  return (
    <article className="rounded-lg border border-surface-200 bg-surface-100 p-5">
      <p className="mb-4 rounded-md border border-surface-200 bg-surface-50 px-4 py-3 text-xs text-ink-700">
        {SPOT_REPORT_STARTER_DISCLAIMER}
      </p>
      <h2 className="font-display text-2xl text-ink-900">{content.headline}</h2>
      {content.overview ? <p className="mt-2 text-ink-900">{content.overview}</p> : null}

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
