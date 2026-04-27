/**
 * SessionPackagePage — /s/[slug]
 *
 * This is the artifact the user takes away from an Ada conversation.
 * It is NOT a legal document. It is NOT a filing. It is a clear,
 * accessible record of what the user told Ada and what people in
 * their situation typically do next.
 *
 * Design principles (repeated here because they matter):
 *
 *   1. THE USER'S OWN WORDS COME FIRST.
 *      The userNarrative renders at the top, before anything Ada
 *      generated. Not summarized. Not translated. The user was
 *      heard, and the page begins with that fact.
 *
 *   2. INFORMATIONAL, NEVER DIRECTIVE.
 *      Routing is surfaced as "what people usually do next,"
 *      not "we recommend." Ada informs; she does not direct.
 *
 *   3. ACCESSIBILITY IS THE PRODUCT, NOT A FEATURE.
 *      Semantic HTML, clear heading hierarchy, ARIA landmarks,
 *      working with every assistive tech. All primary action
 *      destinations have a visible phone + TTY alongside the URL.
 *      No information depends on color alone. No content hides
 *      behind hover states.
 *
 *   4. PRINTABLE BY DEFAULT.
 *      No custom PDF library needed. The page uses @media print
 *      styles so the browser's "Save as PDF" produces a clean,
 *      accessible document. This yields a properly-tagged PDF
 *      by default in every modern browser.
 *
 * Ref: Step 18, Commit 4.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { SessionPackage } from '../../../engine/package/types.js';
import type { ActionDestination } from '../../../engine/routing/destinations.js';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; pkg: SessionPackage };

export default function SessionPackagePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/packages/${encodeURIComponent(slug)}`);
        if (res.status === 404) {
          if (!cancelled) setState({ kind: 'notFound' });
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setState({
              kind: 'error',
              message: body.error ?? "I couldn't load this summary.",
            });
          }
          return;
        }
        const body = (await res.json()) as { package: SessionPackage };
        if (!cancelled) setState({ kind: 'ready', pkg: body.package });
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message:
              err instanceof Error
                ? err.message
                : "I couldn't load this summary.",
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.kind === 'loading') {
    return (
      <main
        className="max-w-3xl mx-auto px-5 sm:px-8 py-10"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-ink-700">Loading your summary…</p>
      </main>
    );
  }

  if (state.kind === 'notFound') {
    return (
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="font-display text-3xl text-ink-900 mb-3">
          I can't find this summary
        </h1>
        <p className="text-ink-700 leading-relaxed mb-4">
          The link may have expired, or there might be an extra letter in
          the URL. If someone shared this with you, ask them to send a
          fresh copy.
        </p>
        <p className="text-ink-700 leading-relaxed">
          If you were in the middle of talking to me, you can{' '}
          <a
            href="/chat"
            className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
          >
            start a new conversation
          </a>
          .
        </p>
      </main>
    );
  }

  if (state.kind === 'error') {
    return (
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="font-display text-3xl text-ink-900 mb-3">
          Something didn't load right
        </h1>
        <p className="text-ink-700 leading-relaxed">{state.message}</p>
      </main>
    );
  }

  const pkg = state.pkg;
  return <PackageView pkg={pkg} />;
}

// ─── Main view ────────────────────────────────────────────────────────────────

function PackageView({ pkg }: { pkg: SessionPackage }) {
  const label = pkg.classificationLabel;
  const generatedDate = formatHumanDate(pkg.generatedAt);

  function handlePrint() {
    // Browser print dialog — user picks "Save as PDF" to download.
    window.print();
  }

  return (
    <article
      className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12 text-ink-900"
      // Give the whole article a useful landmark name so screen reader
      // users can skip directly to it.
      aria-labelledby="pkg-title"
    >
      {/* Header */}
      <header className="mb-8 pb-6 border-b border-surface-200">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-3">
          Your summary
        </p>
        <h1
          id="pkg-title"
          className="font-display text-3xl sm:text-4xl leading-tight mb-3"
        >
          {label.shortLabel}
        </h1>
        <p className="text-sm text-ink-500">
          Prepared by Ada on {generatedDate}
        </p>

        {/* No-print action row */}
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded border border-surface-300 text-ink-700 hover:border-accent-500 hover:text-accent-600 transition-colors"
            aria-label="Print or save this summary as PDF"
          >
            Print / Save as PDF
          </button>
          <ShareLinkButton slug={pkg.slug} />
        </div>
      </header>

      {/* SECTION 1: the user's own words — FIRST */}
      {pkg.userNarrative && (
        <section className="mb-10" aria-labelledby="pkg-narrative-heading">
          <h2
            id="pkg-narrative-heading"
            className="font-display text-xl sm:text-2xl mb-3"
          >
            What you told Ada
          </h2>
          <blockquote className="border-l-4 border-accent-500 pl-4 py-1 text-ink-700 leading-relaxed whitespace-pre-line">
            {pkg.userNarrative}
          </blockquote>
        </section>
      )}

      {/* SECTION 2: plain-language summary */}
      <section className="mb-10" aria-labelledby="pkg-summary-heading">
        <h2
          id="pkg-summary-heading"
          className="font-display text-xl sm:text-2xl mb-3"
        >
          Summary
        </h2>
        <p className="text-ink-700 leading-relaxed">{pkg.summary}</p>
      </section>

      {/* SECTION 3: classification + what it means */}
      <section className="mb-10" aria-labelledby="pkg-classification-heading">
        <h2
          id="pkg-classification-heading"
          className="font-display text-xl sm:text-2xl mb-3"
        >
          What part of the law applies
        </h2>
        <p className="text-ink-700 leading-relaxed mb-3">
          <strong className="text-ink-900">{label.shortLabel}</strong>
          {label.technicalLabel && (
            <>
              {' '}
              <span className="text-ink-500">({label.technicalLabel})</span>
            </>
          )}
        </p>
        <p className="text-ink-700 leading-relaxed">{label.plainDescription}</p>

        {pkg.classification.reasoning && (
          <details className="mt-4">
            <summary className="cursor-pointer text-accent-500 hover:text-accent-600 underline underline-offset-2">
              Why Ada classified it this way
            </summary>
            <p className="mt-2 text-ink-700 leading-relaxed">
              {pkg.classification.reasoning}
            </p>
          </details>
        )}
      </section>

      {/* Matched class-action listing (real match — Ada bound the
          session to a live case via match_listing). This replaces the
          generic "matching is coming" copy below when present. */}
      {pkg.matchedListing && (
        <section
          className="mb-10 bg-accent-50 border-2 border-accent-500 rounded-md p-5 sm:p-6"
          aria-labelledby="pkg-matched-listing"
        >
          <p className="text-xs uppercase tracking-wider font-mono text-accent-600 mb-2">
            You may be part of an active class action
          </p>
          <h2
            id="pkg-matched-listing"
            className="font-display text-xl sm:text-2xl text-ink-900 mb-3 leading-tight"
          >
            {pkg.matchedListing.listingTitle}
          </h2>
          <p className="text-ink-700 mb-4">
            What you described matches the pattern of an active class action
            currently being pursued by{' '}
            <span className="font-medium text-ink-900">
              {pkg.matchedListing.firmName}
            </span>
            {pkg.matchedListing.firmPrimaryContact && (
              <>
                {' '}
                ({pkg.matchedListing.firmPrimaryContact})
              </>
            )}
            . They are reviewing intakes from people with situations like yours.
          </p>

          {/* Firm contact lines. Shown as a stacked list rather than
              a horizontal row so screen readers announce each
              contact path clearly. */}
          <dl className="mb-5 space-y-2 text-sm">
            {pkg.matchedListing.firmEmail && (
              <div className="flex flex-wrap gap-x-3">
                <dt className="text-ink-500 font-medium min-w-[60px]">
                  Email:
                </dt>
                <dd>
                  <a
                    href={`mailto:${pkg.matchedListing.firmEmail}`}
                    className="text-accent-600 underline underline-offset-2 hover:text-accent-700"
                    aria-label={`Email ${pkg.matchedListing.firmName}`}
                  >
                    {pkg.matchedListing.firmEmail}
                  </a>
                </dd>
              </div>
            )}
            {pkg.matchedListing.firmPhone && (
              <div className="flex flex-wrap gap-x-3">
                <dt className="text-ink-500 font-medium min-w-[60px]">
                  Phone:
                </dt>
                <dd>
                  <a
                    href={`tel:${pkg.matchedListing.firmPhone.replace(/[^\d+]/g, '')}`}
                    className="text-accent-600 underline underline-offset-2 hover:text-accent-700"
                    aria-label={`Call ${pkg.matchedListing.firmName}`}
                  >
                    {pkg.matchedListing.firmPhone}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap gap-3">
            {pkg.matchedListing.firmEmail && (
              <a
                href={`mailto:${pkg.matchedListing.firmEmail}?subject=${encodeURIComponent(
                  `Class action intake — ${pkg.matchedListing.listingTitle}`,
                )}`}
                className="inline-block px-5 py-3 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600"
              >
                Contact this firm
              </a>
            )}
            <a
              href={`/class-actions/${encodeURIComponent(pkg.matchedListing.listingSlug)}`}
              className="inline-block px-5 py-3 rounded-md border border-accent-500 text-accent-600 font-medium hover:bg-accent-50"
            >
              See the full case
            </a>
          </div>

          <p className="mt-4 text-xs text-ink-500 leading-relaxed">
            ADA Legal Link is not a law firm and is not representing you.
            Contacting the firm above does not create an attorney-client
            relationship until the firm agrees to take your case.
          </p>
        </section>
      )}

      {/* Generic class-action placeholder — only when classification
          was class_action AND no specific listing was bound. */}
      {pkg.classActionPlaceholder && !pkg.matchedListing && (
        <section
          className="mb-10 bg-accent-50 border border-accent-200 rounded px-4 py-3"
          aria-labelledby="pkg-class-action-note"
        >
          <h2
            id="pkg-class-action-note"
            className="font-display text-lg mb-2"
          >
            Class-action matching is on the way
          </h2>
          <p className="text-ink-700 leading-relaxed">
            What you described looks like it could match a pattern in an
            active class-action lawsuit — which might mean your situation
            is already being worked on. I'm building that matching
            system now. I'll flag it here when it's live.
          </p>
        </section>
      )}

      {/* SECTION 4: what people usually do next — the routing.
          When a class-action match is present above, this section is
          reframed as supplementary "other ways to take action" rather
          than the primary path forward. */}
      <section className="mb-10" aria-labelledby="pkg-next-heading">
        <h2
          id="pkg-next-heading"
          className="font-display text-xl sm:text-2xl mb-4"
        >
          {pkg.matchedListing
            ? 'Other ways you can also take action'
            : 'What people usually do next'}
        </h2>

        {pkg.matchedListing && (
          <p className="text-ink-700 mb-5 text-sm">
            Joining a class action does not stop you from also filing a
            complaint or sending a demand letter. Some people do both.
            The firm above can advise on what makes sense for your
            situation.
          </p>
        )}

        <DestinationCard destination={pkg.primaryAction} isPrimary />

        {pkg.alternateActions.length > 0 && (
          <>
            <p className="mt-6 mb-3 text-ink-700">Other options:</p>
            <div className="space-y-4">
              {pkg.alternateActions.map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* SECTION 5: demand letter (only when generated) */}
      {pkg.demandLetter && (
        <section className="mb-10" aria-labelledby="pkg-letter-heading">
          <h2
            id="pkg-letter-heading"
            className="font-display text-xl sm:text-2xl mb-3"
          >
            A letter you can send
          </h2>
          <p className="text-ink-700 leading-relaxed mb-4">
            Here's a draft you can send to the business. Fill in the
            bracketed parts with your own information, read it through
            to make sure it reflects what happened, and send it from
            your own email or by mail. You are the sender — I'm only
            providing the draft.
          </p>
          <pre className="bg-surface-50 border border-surface-200 rounded p-4 overflow-x-auto text-sm whitespace-pre-wrap text-ink-900 font-mono">
            {pkg.demandLetter}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(pkg.demandLetter ?? '')}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded border border-surface-300 text-ink-700 hover:border-accent-500 hover:text-accent-600 transition-colors print:hidden"
            aria-label="Copy the draft letter to your clipboard"
          >
            Copy letter to clipboard
          </button>
        </section>
      )}

      {/* SECTION 6: supporting info — photos, facts, citations */}
      {(pkg.photos.length > 0 ||
        Object.keys(pkg.facts).length > 0 ||
        pkg.citedRegulations.length > 0) && (
        <section className="mb-10" aria-labelledby="pkg-evidence-heading">
          <h2
            id="pkg-evidence-heading"
            className="font-display text-xl sm:text-2xl mb-4"
          >
            What Ada recorded
          </h2>

          {/* Facts */}
          {Object.keys(pkg.facts).length > 0 && (
            <div className="mb-6">
              <h3 className="font-display text-lg mb-2">Facts</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                {Object.entries(pkg.facts).map(([key, field]) => (
                  <div
                    key={key}
                    className="contents"
                  >
                    <dt className="text-ink-500">{humanizeFieldName(key)}</dt>
                    <dd className="text-ink-900">{stringifyValue(field.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Photos */}
          {pkg.photos.length > 0 && (
            <div className="mb-6">
              <h3 className="font-display text-lg mb-2">Photos you shared</h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 list-none p-0">
                {pkg.photos.map((photo, idx) => (
                  <li key={photo.url}>
                    <a
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-surface-200 rounded overflow-hidden hover:border-accent-500 transition-colors"
                      aria-label={`Photo ${idx + 1} of ${pkg.photos.length} — opens in a new tab`}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${idx + 1} the user attached`}
                        className="w-full h-32 object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulations */}
          {pkg.citedRegulations.length > 0 && (
            <div>
              <h3 className="font-display text-lg mb-2">Regulations Ada referenced</h3>
              <ul className="space-y-3 list-none p-0">
                {pkg.citedRegulations.map((r) => (
                  <li key={r.citation}>
                    <p className="font-mono text-sm text-accent-600 mb-1">
                      {r.citation}
                    </p>
                    <p className="text-ink-700 text-sm leading-relaxed">
                      {r.excerpt}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* SECTION 7: disclaimer — prominent, always last */}
      <section
        className="mt-12 pt-6 border-t border-surface-200"
        aria-labelledby="pkg-disclaimer-heading"
      >
        <h2
          id="pkg-disclaimer-heading"
          className="font-display text-lg mb-2 text-ink-700"
        >
          About this summary
        </h2>
        <p className="text-ink-500 text-sm leading-relaxed">{pkg.disclaimer}</p>
      </section>
    </article>
  );
}

// ─── Destination card ─────────────────────────────────────────────────────────

function DestinationCard({
  destination,
  isPrimary,
}: {
  destination: ActionDestination;
  isPrimary?: boolean;
}) {
  return (
    <div
      className={
        'border rounded p-5 ' +
        (isPrimary
          ? 'border-accent-500 bg-accent-50'
          : 'border-surface-200 bg-white')
      }
    >
      <h3 className="font-display text-lg mb-2">{destination.label}</h3>
      <p className="text-ink-700 leading-relaxed mb-3">{destination.userDescription}</p>

      {/* Web link */}
      {destination.url && (
        <p className="mb-2">
          <a
            href={destination.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-500 hover:text-accent-600 underline underline-offset-2 break-all"
            aria-label={`${destination.label} — opens in a new tab`}
          >
            {destination.url}
          </a>
        </p>
      )}

      {/* Phone */}
      {destination.phone && (
        <div className="mb-2 text-sm">
          {destination.phone.voice && (
            <p className="text-ink-700">
              <span className="text-ink-500">Phone: </span>
              <a
                href={`tel:${destination.phone.voice.replace(/[^0-9+]/g, '')}`}
                className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
              >
                {destination.phone.voice}
              </a>
            </p>
          )}
          {destination.phone.tty && (
            <p className="text-ink-700">
              <span className="text-ink-500">TTY: </span>
              <a
                href={`tel:${destination.phone.tty.replace(/[^0-9+]/g, '')}`}
                className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
              >
                {destination.phone.tty}
              </a>
            </p>
          )}
          {destination.phone.tollFreeNote && (
            <p className="text-ink-500 text-xs mt-1">
              {destination.phone.tollFreeNote}
            </p>
          )}
        </div>
      )}

      {/* Mailing address */}
      {destination.mailingAddress && (
        <div className="mb-2 text-sm">
          <p className="text-ink-500">Mail to:</p>
          <address className="not-italic text-ink-700 whitespace-pre-line">
            {destination.mailingAddress}
          </address>
        </div>
      )}

      {/* Prep checklist */}
      {destination.prepChecklist && destination.prepChecklist.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-ink-700 hover:text-accent-600">
            What to have ready
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-ink-700 list-disc pl-5">
            {destination.prepChecklist.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </details>
      )}

      {/* Deadline */}
      {destination.deadlineNote && (
        <p className="mt-3 text-xs text-ink-500">
          Deadline: {destination.deadlineNote}
        </p>
      )}
    </div>
  );
}

// ─── Share-link button ────────────────────────────────────────────────────────

function ShareLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/s/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: 'My ADA Legal Link summary' });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled or clipboard unavailable — noop
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded border border-surface-300 text-ink-700 hover:border-accent-500 hover:text-accent-600 transition-colors"
      aria-label="Share this summary by copying the link"
    >
      {copied ? 'Link copied' : 'Share link'}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHumanDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function humanizeFieldName(snake: string): string {
  return snake
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function stringifyValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
