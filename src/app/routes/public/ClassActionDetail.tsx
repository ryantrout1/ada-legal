/**
 * ClassActionDetail — public detail for a single litigation row.
 *
 * Reads /api/public/litigation/:slug. Renders:
 *   - Breadcrumb back to /class-actions
 *   - Case name + kind pill + legal theory
 *   - Case description (full_description with reading-level variant)
 *   - Documentation-required block (DocumentationRequiredBlock)
 *   - No-documentation off-ramp (NoDocumentationOfframp)
 *   - Evidence guidance
 *   - What this is NOT
 *   - Eligibility prose
 *   - Key dates + court + docket
 *   - 'Talk to Ada about this' CTA — POSTs to /api/ada/session with
 *     litigation_id (Phase A3a session binding); /chat resumes the
 *     pre-bound session.
 *
 * Reading levels honored: simple / standard / professional. Each
 * variant resolves via pickVariant() with fallback to the canonical
 * 'standard' field.
 *
 * Ref: /plan Phase A3b.
 */

import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useReadingLevel,
  type ReadingLevel,
} from '../../components/standards/ReadingLevelContext.js';
import { ReadingLevelToggle } from '../../components/standards/ReadingLevelToggle.js';
import { CurrentReadingLevel } from '../../components/standards/CurrentReadingLevel.js';
import AutoCiteLinks from '../../components/standards/AutoCiteLinks.js';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';
import { DocumentationRequiredBlock } from './components/DocumentationRequiredBlock.js';
import { NoDocumentationOfframp } from './components/NoDocumentationOfframp.js';

type LitigationKind =
  | 'class'
  | 'enforcement_action'
  | 'consent_decree'
  | 'pattern_of_practice'
  | 'regulatory_challenge';

interface PublicLitigationDetail {
  id: string;
  kind: LitigationKind;
  caseName: string;
  slug: string;
  legalTheory: string | null;
  shortDescription: string | null;
  shortDescriptionSimple: string | null;
  shortDescriptionProfessional: string | null;
  fullDescription: string | null;
  fullDescriptionSimple: string | null;
  fullDescriptionProfessional: string | null;
  eligibility: string | null;
  eligibilitySimple: string | null;
  eligibilityProfessional: string | null;
  documentationRequiredSimple: string | null;
  documentationRequiredProfessional: string | null;
  noDocumentationPathSimple: string | null;
  noDocumentationPathProfessional: string | null;
  evidenceGuidanceSimple: string | null;
  evidenceGuidanceProfessional: string | null;
  whatThisIsNotSimple: string | null;
  whatThisIsNotProfessional: string | null;
  defendants: string[];
  court: string | null;
  docketNumber: string | null;
  affectedStates: string[];
  filingDate: string | null;
  keyDates: Record<string, string>;
  leadAttorneyName: string | null;
}

const KIND_LABEL: Record<LitigationKind, string> = {
  class: 'Class action',
  enforcement_action: 'DOJ enforcement',
  consent_decree: 'Consent decree',
  pattern_of_practice: 'Pattern of practice',
  regulatory_challenge: 'Regulatory challenge',
};

/**
 * Pick the right voice variant for a field. Order:
 *   1. The exact variant the user selected (simple / professional),
 *      if that variant has content for this field.
 *   2. Fall back to the 'standard' (canonical) field. This always has
 *      content if the row's prose was filled.
 *   3. Final fallback: empty string. Never crashes if everything is
 *      null.
 *
 * Single-place fallback keeps the JSX below readable.
 */
function pickVariant(
  level: ReadingLevel,
  variants: {
    simple: string | null;
    standard: string | null;
    professional: string | null;
  },
): string {
  if (level === 'simple' && variants.simple) return variants.simple;
  if (level === 'professional' && variants.professional)
    return variants.professional;
  return variants.standard ?? '';
}

/**
 * Pick a simple/professional pair. Used for the new A1 fields which
 * have NO 'standard' column — they go directly simple → professional.
 * Falls back from one to the other if a variant is missing.
 */
function pickSimplePro(
  level: ReadingLevel,
  variants: { simple: string | null; professional: string | null },
): string | null {
  if (level === 'simple') return variants.simple ?? variants.professional ?? null;
  if (level === 'professional')
    return variants.professional ?? variants.simple ?? null;
  // standard: prefer professional (the more rigorous default), fall back
  // to simple so the field at least renders if only one variant exists.
  return variants.professional ?? variants.simple ?? null;
}

export default function ClassActionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { readingLevel } = useReadingLevel();
  const [row, setRow] = useState<PublicLitigationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/public/litigation/${encodeURIComponent(slug)}`,
      );
      if (resp.status === 404) {
        setNotFound(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { litigation: PublicLitigationDetail };
      setRow(data.litigation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleTalkToAda() {
    if (!row) return;
    setStartingChat(true);
    setError(null);
    try {
      const resp = await fetch('/api/ada/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // Phase A3b: deep-link via litigation_id (not listing_slug).
          // The endpoint binds session.litigation_listing_id via the
          // A3a path and seeds the case-acknowledgment greeting.
          litigation_id: row.id,
          reading_level: readingLevel,
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start chat');
      setStartingChat(false);
    }
  }

  if (notFound) {
    return (
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <Link
          to="/class-actions"
          className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
        >
          ← Class actions
        </Link>
        <h1 className="font-display text-3xl text-ink-900 mt-4 mb-4">
          This case isn&rsquo;t in the directory
        </h1>
        <p className="text-ink-700 mb-6">
          The case you&rsquo;re looking for isn&rsquo;t in our active
          directory right now. It may have closed, or the link may be
          out of date.
        </p>
        <Link
          to="/class-actions"
          className="inline-block px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600"
        >
          See active class actions
        </Link>
      </section>
    );
  }

  if (loading)
    return (
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <p className="text-ink-500 italic">Loading&hellip;</p>
      </section>
    );

  if (error && !row) {
    return (
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div
          role="alert"
          className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      </section>
    );
  }

  if (!row) return null;

  // Reading-level variant resolution for the prose fields. The page
  // renders at the level the user picked (simple / standard /
  // professional), falling back to the canonical 'standard' field
  // when a variant is missing.
  const fullDescription = pickVariant(readingLevel, {
    simple: row.fullDescriptionSimple,
    standard: row.fullDescription,
    professional: row.fullDescriptionProfessional,
  });

  const shortDescription = pickVariant(readingLevel, {
    simple: row.shortDescriptionSimple,
    standard: row.shortDescription,
    professional: row.shortDescriptionProfessional,
  });

  const eligibility = pickVariant(readingLevel, {
    simple: row.eligibilitySimple,
    standard: row.eligibility,
    professional: row.eligibilityProfessional,
  });

  // A1-added fields have no canonical 'standard' column — only the
  // simple/professional pair.
  const documentationRequired = pickSimplePro(readingLevel, {
    simple: row.documentationRequiredSimple,
    professional: row.documentationRequiredProfessional,
  });

  const noDocumentationPath = pickSimplePro(readingLevel, {
    simple: row.noDocumentationPathSimple,
    professional: row.noDocumentationPathProfessional,
  });

  const evidenceGuidance = pickSimplePro(readingLevel, {
    simple: row.evidenceGuidanceSimple,
    professional: row.evidenceGuidanceProfessional,
  });

  const whatThisIsNot = pickSimplePro(readingLevel, {
    simple: row.whatThisIsNotSimple,
    professional: row.whatThisIsNotProfessional,
  });

  // Meta description: prefer short_description, then a fallback.
  // Truncate to 155 chars before Google snips it.
  const rawDescription =
    row.shortDescription ??
    `${KIND_LABEL[row.kind]}: ${row.caseName}. Free intake with Ada.`;
  const metaDescription =
    rawDescription.length > 155
      ? `${rawDescription.slice(0, 152).trim()}…`
      : rawDescription;

  const canonicalUrl = `https://ada.adalegallink.com/class-actions/${encodeURIComponent(
    row.slug,
  )}`;

  // JSON-LD LegalService structured data — closest schema.org fit for
  // 'litigation listing hosted by an organization.'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: row.caseName,
    description: metaDescription,
    url: canonicalUrl,
    areaServed: 'United States',
    serviceType: 'Class action intake',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: canonicalUrl,
      name: 'Free intake via Ada',
    },
  };

  // Key dates: deterministic ordering for display. Filing date first
  // (always rendered separately above), then keyDates entries in the
  // order the admin entered them (Object.entries preserves insertion
  // order in modern JS).
  const keyDateEntries = Object.entries(row.keyDates ?? {}).filter(
    ([, v]) => typeof v === 'string' && v.trim().length > 0,
  );

  return (
    <article>
      <Helmet>
        <title>{`${row.caseName} — ADA Legal Link`}</title>
        <meta name="description" content={metaDescription} />
        <meta
          property="og:title"
          content={`${row.caseName} — ADA Legal Link`}
        />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta
          name="twitter:title"
          content={`${row.caseName} — ADA Legal Link`}
        />
        <meta name="twitter:description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-8 pb-4">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Class actions', to: '/class-actions' },
            { label: row.caseName },
          ]}
        />
      </section>

      {/* Header */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-block px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 font-medium text-xs">
            {KIND_LABEL[row.kind]}
          </span>
          {row.legalTheory && (
            <span className="text-xs text-ink-500">{row.legalTheory}</span>
          )}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mb-3 leading-tight">
          {row.caseName}
        </h1>
        {shortDescription && (
          <p className="text-base text-ink-700 leading-relaxed">
            {shortDescription}
          </p>
        )}
      </section>

      {/* Reading level toggle */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <ReadingLevelToggle />
          <CurrentReadingLevel />
        </div>
      </section>

      {/* Full description */}
      {fullDescription && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <h2 className="font-display text-xl text-ink-900 mb-3">
            About this case
          </h2>
          <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
            <AutoCiteLinks>{fullDescription}</AutoCiteLinks>
          </p>
        </section>
      )}

      {/* Case identity: court, docket, filing date, defendants, states */}
      {(row.court ||
        row.docketNumber ||
        row.filingDate ||
        row.defendants.length > 0 ||
        row.affectedStates.length > 0 ||
        keyDateEntries.length > 0) && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <h2 className="font-display text-xl text-ink-900 mb-3">
            Case identity
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            {row.court && (
              <>
                <dt className="text-ink-500 font-medium">Court</dt>
                <dd className="text-ink-900">{row.court}</dd>
              </>
            )}
            {row.docketNumber && (
              <>
                <dt className="text-ink-500 font-medium">Docket</dt>
                <dd className="text-ink-900 font-mono text-xs">
                  {row.docketNumber}
                </dd>
              </>
            )}
            {row.filingDate && (
              <>
                <dt className="text-ink-500 font-medium">Filed</dt>
                <dd className="text-ink-900">{row.filingDate}</dd>
              </>
            )}
            {row.defendants.length > 0 && (
              <>
                <dt className="text-ink-500 font-medium">Defendants</dt>
                <dd className="text-ink-900">{row.defendants.join(', ')}</dd>
              </>
            )}
            {row.affectedStates.length > 0 && (
              <>
                <dt className="text-ink-500 font-medium">States</dt>
                <dd className="text-ink-900">{row.affectedStates.join(', ')}</dd>
              </>
            )}
            {keyDateEntries.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink-500 font-medium">{label}</dt>
                <dd className="text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Documentation required */}
      {documentationRequired && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <DocumentationRequiredBlock text={documentationRequired} />
        </section>
      )}

      {/* Evidence guidance */}
      {evidenceGuidance && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <h2 className="font-display text-xl text-ink-900 mb-3">
            How to document what happened
          </h2>
          <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
            {evidenceGuidance}
          </p>
        </section>
      )}

      {/* Eligibility prose */}
      {eligibility && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <h2 className="font-display text-xl text-ink-900 mb-3">
            Who may qualify
          </h2>
          <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
            <AutoCiteLinks>{eligibility}</AutoCiteLinks>
          </p>
        </section>
      )}

      {/* What this is NOT */}
      {whatThisIsNot && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <h2 className="font-display text-xl text-ink-900 mb-3">
            What this case doesn&rsquo;t cover
          </h2>
          <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
            {whatThisIsNot}
          </p>
        </section>
      )}

      {/* No-documentation off-ramp */}
      {noDocumentationPath && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-8">
          <NoDocumentationOfframp
            text={noDocumentationPath}
            onStartChat={handleTalkToAda}
            disabled={startingChat}
          />
        </section>
      )}

      {/* Primary CTA */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-16">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
          >
            {error}
          </div>
        )}
        <div className="rounded-md border border-accent-500 bg-accent-50 p-5 sm:p-6">
          <h2 className="font-display text-xl text-ink-900 mb-2">
            If this sounds like what happened to you
          </h2>
          <p className="text-sm text-ink-700 mb-4">
            Ada will ask a few questions about your situation. She&rsquo;ll
            help you think through whether your story fits this case and
            what to do next. There&rsquo;s no fee.
          </p>
          <button
            type="button"
            onClick={handleTalkToAda}
            disabled={startingChat}
            className="inline-block px-5 py-3 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {startingChat ? 'Starting chat…' : 'Talk to Ada about this'}
          </button>
          <p className="text-xs text-ink-500 mt-3">
            ADA Legal Link isn&rsquo;t a law firm. Your conversation with
            Ada is free and confidential.
          </p>
        </div>
      </section>
    </article>
  );
}
