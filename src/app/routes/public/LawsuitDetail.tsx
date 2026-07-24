/**
 * LawsuitDetail — public detail page for a single litigation row.
 *
 * Ported from Base44 (src/pages/LawsuitDetail.jsx @ 6b1e9ac). B44 is the
 * design authority for the anatomy: back link, status + kind header,
 * flag-gated Ada CTA, reading-level bar, prose cards, named defendants,
 * a case-facts definition list, and key dates — in that order, with
 * B44's headings verbatim.
 *
 * WHAT THIS PAGE KEEPS THAT B44 DOES NOT HAVE (resolved decision, M3):
 *   - the four Neon-only guidance blocks — documentation required, how
 *     to document, the no-documentation off-ramp, and what the case
 *     does NOT cover. M0 preserved these fields deliberately; they are
 *     the most practically useful prose on the page for a
 *     self-represented reader.
 *   - JSON-LD + canonical + OG tags (SEO; B44 has none here)
 *   - the resolved lead attorney name
 *   - the inlined related-cases card
 *
 * A verbatim port would have deleted all of the above. The M2 lesson
 * applies: the drift ledger flags difference, not deficit. These are
 * pinned by tests/unit/lawsuitDetailParity.test.ts so a future "sync
 * from B44" fails loudly instead of silently removing them.
 *
 * ADA CTA GATING: every Ada affordance on this page — the primary CTA
 * and the button inside the off-ramp — is gated on
 * lawsuits_ada_cta_enabled. While false (today) nothing renders in
 * their place. The off-ramp PROSE still renders when gated: it carries
 * the DOJ-complaint and demand-letter paths, which stand on their own
 * without Ada.
 *
 * Ref: /plan M3 Phase 3.
 */

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import GuideReadingLevelBar from '../../components/standards/GuideReadingLevelBar.jsx';
import { useReadingLevel } from '../../components/standards/ReadingLevelContext.js';
import { StatusBadge, KindLabel } from '../../components/litigation/LitigationChips.js';
import { useLawsuitsAdaCta } from '../../hooks/useLawsuitsAdaCta.js';
import { kindLabel, statesLabel } from '../../lib/litigationLabels.js';
import { pickReadingLevelText, pickSimpleProText } from '../../lib/readingLevelText.js';
import type {
  PublicLawsuitDetailRow,
  PublicLitigationDetailResponse,
} from '../../lib/lawsuitTypes.js';

const sectionStyle: CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: 12,
  padding: '1.25rem 1.5rem',
  marginBottom: '1rem',
};

const sectionHeader: CSSProperties = {
  margin: '0 0 0.65rem',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--heading)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const proseStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'Manrope, sans-serif',
  color: 'var(--body)',
  fontSize: '1.0625rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  maxWidth: '70ch',
};

const dlStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  rowGap: '0.5rem',
  columnGap: '1rem',
  margin: 0,
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.9375rem',
};

const dtStyle: CSSProperties = { color: 'var(--body-secondary)', fontWeight: 600 };
const ddStyle: CSSProperties = { margin: 0, color: 'var(--body)' };

function nz(v: string | null | undefined): string | null {
  if (v == null) return null;
  return v.trim() ? v : null;
}

function ProseCard({
  id,
  heading,
  body,
  children,
}: {
  id: string;
  heading: string;
  body?: string | null;
  children?: ReactNode;
}) {
  if (!nz(body ?? null) && !children) return null;
  return (
    <section style={sectionStyle} aria-labelledby={id}>
      <h2 id={id} style={sectionHeader}>
        {heading}
      </h2>
      {body && <p style={proseStyle}>{body}</p>}
      {children}
    </section>
  );
}

export default function LawsuitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { readingLevel } = useReadingLevel();
  const adaCtaEnabled = useLawsuitsAdaCta();

  const [row, setRow] = useState<PublicLawsuitDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Two separate error states on purpose. A failed page load and a
  // failed chat start need different copy and appear in different
  // places; sharing one state rendered "Couldn't load this case: Could
  // not start chat" at the top of a page that had loaded fine.
  const [error, setError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const load = useCallback(async () => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const resp = await fetch(
        `/api/public/litigation/${encodeURIComponent(slug)}`,
      );
      if (resp.status === 404) {
        setNotFound(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const body = (await resp.json()) as PublicLitigationDetailResponse;
      setRow(body.litigation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
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
    setChatError(null);
    try {
      const resp = await fetch('/api/ada/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          litigation_id: row.id,
          reading_level: readingLevel,
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      navigate('/ada');
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Could not start chat');
      setStartingChat(false);
    }
  }

  const backLink = (
    <Link
      className="lawsuit-back-link"
      to="/lawsuits"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 44,
        color: 'var(--link)',
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 600,
        fontSize: '0.875rem',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        borderRadius: 8,
        padding: '0 0.25rem',
      }}
    >
      ← Back to Active Cases
    </Link>
  );

  const fullDescription = row
    ? pickReadingLevelText(row as unknown as Record<string, unknown>, 'fullDescription', readingLevel)
    : '';
  const eligibility = row
    ? pickReadingLevelText(row as unknown as Record<string, unknown>, 'eligibility', readingLevel)
    : '';
  const documentationRequired = pickSimpleProText(
    row as unknown as Record<string, unknown>,
    'documentationRequired',
    readingLevel,
  );
  const evidenceGuidance = pickSimpleProText(
    row as unknown as Record<string, unknown>,
    'evidenceGuidance',
    readingLevel,
  );
  const noDocumentationPath = pickSimpleProText(
    row as unknown as Record<string, unknown>,
    'noDocumentationPath',
    readingLevel,
  );
  const whatThisIsNot = pickSimpleProText(
    row as unknown as Record<string, unknown>,
    'whatThisIsNot',
    readingLevel,
  );

  const defendants = Array.isArray(row?.defendants)
    ? row!.defendants.filter(Boolean)
    : [];
  const keyDateEntries = Object.entries(row?.keyDates ?? {}).filter(
    ([k, v]) => nz(k) && typeof v === 'string' && nz(v),
  );
  const relatedCases = row?.relatedCases ?? [];

  const canonicalUrl = row
    ? `https://ada.adalegallink.com/lawsuits/${encodeURIComponent(row.slug)}`
    : '';
  const rawDescription =
    row?.shortDescription ??
    (row ? `${kindLabel(row.kind)}: ${row.caseName}.` : '');
  const metaDescription =
    rawDescription.length > 155
      ? `${rawDescription.slice(0, 152).trim()}…`
      : rawDescription;

  return (
    <main
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '2rem 1.25rem 4rem',
        background: 'var(--page-bg-subtle)',
        minHeight: 'calc(100vh - 72px)',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>{backLink}</div>

      {loading && (
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            color: 'var(--body-secondary)',
            fontStyle: 'italic',
          }}
        >
          Loading case…
        </p>
      )}

      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-50)',
            border: '1px solid var(--color-danger-500)',
            color: 'var(--color-danger-500)',
            padding: '0.85rem 1rem',
            borderRadius: 8,
            fontSize: '0.9375rem',
            marginBottom: '1rem',
          }}
        >
          Couldn&rsquo;t load this case: {error}
        </div>
      )}

      {notFound && (
        <div style={sectionStyle}>
          <h1
            style={{
              margin: '0 0 0.75rem',
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--heading)',
            }}
          >
            This case isn&rsquo;t available
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: 'Manrope, sans-serif',
              color: 'var(--body)',
              fontSize: '1rem',
              lineHeight: 1.5,
            }}
          >
            The case may have been settled, archived, or the link is incorrect.
            Head back to the list to see what&rsquo;s currently active.
          </p>
        </div>
      )}

      {row && (
        <article>
          <Helmet>
            <title>{`${row.caseName} — ADA Legal Link`}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:title" content={`${row.caseName} — ADA Legal Link`} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content="article" />
            <script type="application/ld+json">
              {JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LegalService',
                name: row.caseName,
                description: metaDescription,
                url: canonicalUrl,
                areaServed: 'United States',
                serviceType: 'ADA accessibility litigation',
              })}
            </script>
          </Helmet>

          <header style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                flexWrap: 'wrap',
                marginBottom: '0.75rem',
              }}
            >
              <StatusBadge status={row.status} />
              <KindLabel kind={row.kind} />
            </div>
            <h1
              style={{
                margin: '0 0 0.5rem',
                fontFamily: 'Manrope, sans-serif',
                fontSize: 'clamp(1.625rem, 4vw, 1.875rem)',
                fontWeight: 500,
                color: 'var(--heading)',
                lineHeight: 1.25,
              }}
            >
              {row.caseName}
            </h1>
            {nz(row.shortDescription) && (
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '1.0625rem',
                  color: 'var(--body)',
                  lineHeight: 1.5,
                  maxWidth: '70ch',
                }}
              >
                {row.shortDescription}
              </p>
            )}
          </header>

          {/* Ada CTA — gated. Renders nothing at all while the flag is off. */}
          {adaCtaEnabled && (
            <div style={sectionStyle}>
              <h2 style={sectionHeader}>Think this applies to you?</h2>
              <p
                style={{
                  margin: '0 0 0.85rem',
                  fontFamily: 'Manrope, sans-serif',
                  color: 'var(--body)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                }}
              >
                Ada will walk you through whether your situation matches what
                this case covers. She already knows the case details, so you
                don&rsquo;t need to start from scratch.
              </p>
              <button
                type="button"
                onClick={handleTalkToAda}
                disabled={startingChat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.5rem',
                  background: 'var(--accent)',
                  color: 'var(--btn-text)',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '1rem',
                  fontFamily: 'Manrope, sans-serif',
                  cursor: startingChat ? 'not-allowed' : 'pointer',
                  minHeight: 48,
                  opacity: startingChat ? 0.6 : 1,
                }}
              >
                {startingChat ? 'Starting chat…' : 'Talk to Ada about this case →'}
              </button>
              {chatError && (
                <p
                  role="alert"
                  style={{
                    margin: '0.75rem 0 0',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.875rem',
                    color: 'var(--color-danger-500)',
                  }}
                >
                  Couldn&rsquo;t start the chat: {chatError}
                </p>
              )}
            </div>
          )}

          <GuideReadingLevelBar />

          <ProseCard
            id="about-heading"
            heading="What this case is about"
            body={fullDescription}
          />

          <ProseCard
            id="eligibility-heading"
            heading="Who may qualify"
            body={eligibility}
          />

          {/* ── Neon-only guidance blocks (no B44 counterpart) ───────────── */}

          <ProseCard
            id="documentation-heading"
            heading="What helps your case"
            body={documentationRequired}
          />

          <ProseCard
            id="evidence-heading"
            heading="How to document what happened"
            body={evidenceGuidance}
          />

          {noDocumentationPath && (
            <section style={sectionStyle} aria-labelledby="no-documentation-heading">
              <h2 id="no-documentation-heading" style={sectionHeader}>
                What if you don&rsquo;t have documentation?
              </h2>
              <p style={proseStyle}>{noDocumentationPath}</p>
              {/* The prose above stands on its own — it carries the DOJ
                  complaint and demand-letter paths. Only the Ada button
                  is gated. */}
              {adaCtaEnabled && (
                <button
                  type="button"
                  onClick={handleTalkToAda}
                  disabled={startingChat}
                  style={{
                    marginTop: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 44,
                    padding: '0.5rem 1rem',
                    background: 'var(--card-bg)',
                    color: 'var(--link)',
                    border: '1px solid var(--color-control-border)',
                    borderRadius: 8,
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    cursor: startingChat ? 'not-allowed' : 'pointer',
                  }}
                >
                  Talk to Ada about next steps
                </button>
              )}
            </section>
          )}

          <ProseCard
            id="not-covered-heading"
            heading="What this case doesn&rsquo;t cover"
            body={whatThisIsNot}
          />

          {/* ── Back to B44's anatomy ────────────────────────────────────── */}

          <ProseCard
            id="legal-theory-heading"
            heading="Legal theory"
            body={nz(row.legalTheory)}
          />

          {defendants.length > 0 && (
            <section style={sectionStyle} aria-labelledby="defendants-heading">
              <h2 id="defendants-heading" style={sectionHeader}>
                Named defendants
              </h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontFamily: 'Manrope, sans-serif',
                  color: 'var(--body)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                }}
              >
                {defendants.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
          )}

          <section style={sectionStyle} aria-labelledby="facts-heading">
            <h2 id="facts-heading" style={sectionHeader}>
              Case facts
            </h2>
            <dl style={dlStyle}>
              <dt style={dtStyle}>Type</dt>
              <dd style={ddStyle}>{kindLabel(row.kind)}</dd>

              <dt style={dtStyle}>Affected states</dt>
              <dd style={ddStyle}>{statesLabel(row.affectedStates)}</dd>

              {nz(row.court) && (
                <>
                  <dt style={dtStyle}>Court</dt>
                  <dd style={ddStyle}>{row.court}</dd>
                </>
              )}

              {nz(row.docketNumber) && (
                <>
                  <dt style={dtStyle}>Docket</dt>
                  <dd style={{ ...ddStyle, fontFamily: 'ui-monospace, monospace' }}>
                    {row.docketNumber}
                  </dd>
                </>
              )}

              {nz(row.filingDate) && (
                <>
                  <dt style={dtStyle}>Filed</dt>
                  <dd style={ddStyle}>{row.filingDate}</dd>
                </>
              )}

              {nz(row.leadAttorneyName) && (
                <>
                  <dt style={dtStyle}>Lead counsel</dt>
                  <dd style={ddStyle}>{row.leadAttorneyName}</dd>
                </>
              )}
            </dl>
          </section>

          {keyDateEntries.length > 0 && (
            <section style={sectionStyle} aria-labelledby="key-dates-heading">
              <h2 id="key-dates-heading" style={sectionHeader}>
                Key dates
              </h2>
              <dl style={dlStyle}>
                {keyDateEntries.map(([label, value]) => (
                  <span key={label} style={{ display: 'contents' }}>
                    <dt style={dtStyle}>{label}</dt>
                    <dd style={ddStyle}>{String(value)}</dd>
                  </span>
                ))}
              </dl>
            </section>
          )}

          {relatedCases.length > 0 && (
            <section style={sectionStyle} aria-labelledby="related-heading">
              <h2 id="related-heading" style={sectionHeader}>
                Related cases
              </h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {relatedCases.map((rc) => (
                  <li key={rc.id} style={{ marginBottom: '0.5rem' }}>
                    <Link
                      className="lawsuit-back-link"
                      to={`/lawsuits/${encodeURIComponent(rc.slug)}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        minHeight: 44,
                        color: 'var(--link)',
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                        padding: '0 0.25rem',
                        borderRadius: 8,
                      }}
                    >
                      {rc.caseName}
                    </Link>
                    <span
                      style={{
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '0.8125rem',
                        color: 'var(--body-secondary)',
                        marginLeft: '0.5rem',
                      }}
                    >
                      {kindLabel(rc.kind)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div style={{ marginTop: '1.5rem' }}>{backLink}</div>
        </article>
      )}
    </main>
  );
}
