/**
 * ChapterPageLayout — the renderer for every StandardsCh<n>.tsx page.
 *
 * Responsibilities:
 *   - Dark hero banner at the top (GuideHeroBanner)
 *   - Prev / next chapter navigation
 *   - Chapter overview prose
 *   - Reading-level toggle (simple / standard / professional) that
 *     persists to localStorage and sets html[data-reading-level="..."]
 *     so GuideStyles CSS rules can adapt diagram panels
 *   - Accordion of section cards with plain / simple / legal variants
 *     and an embedded diagram per section
 *   - Share bar at the bottom
 *   - "Talk to Ada about this chapter" CTA (replaces Base44's
 *     AskADAHelper embedded AI widget — we're consolidating on the
 *     main Ada surface instead of running a second AI)
 *
 * Ported from base44-archive src/components/guide/ChapterPageLayout.jsx.
 * Simplifications relative to the original:
 *   - Reading level is page-local useState + localStorage, not a
 *     React context (we'd use the context if we had a sessions-
 *     chat reading-level integration, but we don't here yet — Commit
 *     6 wires Ada to read/write this same key)
 *   - Removed trackEvent (analytics layer not on main)
 *   - Removed AskADAHelper (one Ada surface, not two)
 *   - Removed GuideReportCTA (replaced with Talk-to-Ada button)
 *   - Hardcoded /standards-guide/chapter/:num routes
 *   - TypeScript types for the section shape
 *
 * No visual changes. Token references resolve via app.css alias layer.
 *
 * Reading-level key in localStorage is 'ada-reading-level-guide'
 * (distinct from the main chat's reading level, which lives in the
 * session). If the user later opens a chat with Ada, she starts at
 * her own default; the guide's preference doesn't leak into chat.
 * Commit 6 may bridge these — not yet.
 */

import { BookOpen, ChevronLeft, ChevronRight, Scale, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AutoCiteLinks from './AutoCiteLinks.js';
import GuideHeroBanner from './GuideHeroBanner.js';
import GuideStyles from './GuideStyles.js';
import { useReadingLevel, type ReadingLevel } from './ReadingLevelContext.js';
import { ReadingLevelToggle } from './ReadingLevelToggle.js';
import { CurrentReadingLevel } from './CurrentReadingLevel.js';
import { startAdaSessionWithContext } from './startAdaSession.js';

/** One section in a chapter (e.g. §405 Ramps inside Ch. 4). */
export interface ChapterSection {
  /** The section number string, e.g. "§405" or "§409–410" */
  number: string;
  /** Human-readable title, e.g. "Ramps" */
  title: string;
  /** The plain-language "standard" explanation (always present) */
  plain: React.ReactNode;
  /** The official legal text extract (always present) */
  legal: React.ReactNode;
  /** The simplified explanation (optional — falls back to "coming soon" box) */
  simple?: React.ReactNode;
  /** The interactive diagram for this section (optional) */
  diagram?: React.ReactNode;
}

interface ChapterMeta {
  num: number;
  name: string;
  range: string;
}

const ALL_CHAPTERS: ChapterMeta[] = [
  { num: 1, name: 'Application & Administration', range: '§101–106' },
  { num: 2, name: 'Scoping Requirements', range: '§201–243' },
  { num: 3, name: 'Building Blocks', range: '§301–309' },
  { num: 4, name: 'Accessible Routes', range: '§401–410' },
  { num: 5, name: 'General Site & Building', range: '§501–505' },
  { num: 6, name: 'Plumbing Elements', range: '§601–612' },
  { num: 7, name: 'Communication Elements', range: '§701–708' },
  { num: 8, name: 'Special Rooms & Spaces', range: '§801–811' },
  { num: 9, name: 'Built-in Elements', range: '§901–904' },
  { num: 10, name: 'Recreation Facilities', range: '§1001–1010' },
];

interface SectionBlockProps {
  index: number;
  section: ChapterSection;
  isOpen: boolean;
  onToggle: () => void;
  readingLevel: ReadingLevel;
}

function SectionBlock({
  index,
  section,
  isOpen,
  onToggle,
  readingLevel,
}: SectionBlockProps) {
  const panelId = `section-panel-${index}`;
  const headerId = `section-header-${index}`;

  const hasLegal = !!section.legal;
  const showSimple = readingLevel === 'simple';
  const showLegal = readingLevel === 'professional' && hasLegal;
  const showStandard =
    readingLevel === 'standard' || (readingLevel === 'professional' && !hasLegal);

  return (
    <div
      style={{
        background: isOpen ? 'var(--page-bg-alt)' : 'var(--page-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        marginBottom: '12px',
        overflow: 'hidden',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 'inherit', fontWeight: 'inherit' }}>
        <button
          id={headerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          style={{
            width: '100%',
            padding: '16px 20px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body), Manrope, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minHeight: '44px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display), Fraunces, serif',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--section-label)',
              background: 'var(--card-bg-warm)',
              padding: '2px 10px',
              borderRadius: '6px',
              flexShrink: 0,
              border: '1px solid var(--border)',
            }}
          >
            {section.number}
          </span>
          <span style={{ flex: 1 }}>{section.title}</span>
          <ChevronRight
            size={16}
            aria-hidden="true"
            style={{
              color: 'var(--body-secondary)',
              flexShrink: 0,
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>
      </h2>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        style={{
          maxHeight: isOpen ? '50000px' : '0px',
          overflow: 'hidden',
        }}
      >
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '24px', background: 'var(--card-bg)' }}>

            {/* ===== SIMPLE MODE ===== */}
            {showSimple && (
              <div>
                {section.simple ? (
                  <div
                    style={{
                      fontFamily: 'var(--font-body), Manrope, sans-serif',
                      fontSize: '1rem',
                      color: 'var(--body)',
                      lineHeight: 1.85,
                    }}
                  >
                    {section.simple}
                  </div>
                ) : (
                  /* Fallback when a simple summary hasn't been written yet */
                  <div
                    style={{
                      background: 'var(--card-bg-warm)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <Sparkles
                        size={16}
                        style={{ color: 'var(--section-label)' }}
                        aria-hidden="true"
                      />
                      <p
                        style={{
                          fontFamily: 'var(--font-body), Manrope, sans-serif',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: 'var(--heading)',
                          margin: 0,
                        }}
                      >
                        Simple summary coming soon
                      </p>
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--font-body), Manrope, sans-serif',
                        fontSize: '0.875rem',
                        color: 'var(--body)',
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      We're writing plain-language summaries for every section.
                      In the meantime, here's the standard explanation:
                    </p>
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--border)',
                        fontFamily: 'var(--font-body), Manrope, sans-serif',
                        fontSize: '0.9375rem',
                        color: 'var(--body)',
                        lineHeight: 1.75,
                      }}
                    >
                      <AutoCiteLinks>{section.plain}</AutoCiteLinks>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== STANDARD MODE (default) ===== */}
            {showStandard && (
              <div className="guide-two-col" style={{ gap: '24px', margin: 0 }}>
                <div style={{ flex: '1 1 55%', minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-body), Manrope, sans-serif',
                      fontSize: '0.9375rem',
                      color: 'var(--body)',
                      lineHeight: 1.75,
                    }}
                  >
                    <AutoCiteLinks>{section.plain}</AutoCiteLinks>
                  </div>
                </div>
                <aside
                  aria-label="Official legal text"
                  style={{ flex: '1 1 40%', minWidth: 0 }}
                >
                  <div
                    style={{
                      background: 'var(--page-bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '16px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-body), Manrope, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--body-secondary)',
                        margin: '0 0 8px',
                      }}
                    >
                      Official Standard
                    </p>
                    <div
                      style={{
                        fontFamily: 'var(--font-body), Manrope, sans-serif',
                        fontSize: '0.875rem',
                        color: 'var(--body)',
                        lineHeight: 1.7,
                      }}
                    >
                      <AutoCiteLinks>{section.legal}</AutoCiteLinks>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* ===== PROFESSIONAL MODE ===== */}
            {showLegal && (
              <div>
                <div
                  style={{
                    background: 'var(--page-bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <Scale
                      size={14}
                      style={{ color: 'var(--body-secondary)' }}
                      aria-hidden="true"
                    />
                    <p
                      style={{
                        fontFamily: 'var(--font-body), Manrope, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--body-secondary)',
                        margin: 0,
                      }}
                    >
                      Official Standard
                    </p>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body), Manrope, sans-serif',
                      fontSize: '0.9375rem',
                      color: 'var(--body)',
                      lineHeight: 1.75,
                    }}
                  >
                    <AutoCiteLinks>{section.legal}</AutoCiteLinks>
                  </div>
                </div>
                <details style={{ marginTop: '8px' }}>
                  <summary
                    style={{
                      fontFamily: 'var(--font-body), Manrope, sans-serif',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--section-label)',
                      cursor: 'pointer',
                      padding: '8px 0',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <BookOpen size={14} aria-hidden="true" /> View plain-language
                    explanation
                  </summary>
                  <div
                    style={{
                      fontFamily: 'var(--font-body), Manrope, sans-serif',
                      fontSize: '0.875rem',
                      color: 'var(--body)',
                      lineHeight: 1.7,
                      padding: '12px 0',
                    }}
                  >
                    <AutoCiteLinks>{section.plain}</AutoCiteLinks>
                  </div>
                </details>
              </div>
            )}

            {section.diagram && (
              <div
                className="ada-diagram-wrap"
                style={{ marginTop: '24px', maxWidth: '100%' }}
              >
                {section.diagram}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ChapterPageLayoutProps {
  chapterNum: number;
  title: string;
  range: string;
  overview: React.ReactNode;
  sections: ChapterSection[];
}

export default function ChapterPageLayout({
  chapterNum,
  title,
  range,
  overview,
  sections,
}: ChapterPageLayoutProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const { readingLevel } = useReadingLevel();
  const navigate = useNavigate();

  async function handleTalkToAda(): Promise<void> {
    if (startingChat) return;
    setStartingChat(true);
    await startAdaSessionWithContext({
      kind: 'chapter',
      ref: String(chapterNum),
      title,
      readingLevel,
    });
    navigate('/chat');
  }

  const currentIdx = ALL_CHAPTERS.findIndex((c) => c.num === chapterNum);
  const prev = currentIdx > 0 ? ALL_CHAPTERS[currentIdx - 1] : null;
  const next = currentIdx < ALL_CHAPTERS.length - 1 ? ALL_CHAPTERS[currentIdx + 1] : null;

  const linkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-body), Manrope, sans-serif',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--section-label)',
    textDecoration: 'none',
    padding: '8px 0',
    minHeight: '44px',
  };

  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title={`Chapter ${chapterNum}: ${title}`}
        typeBadge={range}
        badgeColor="var(--accent-success)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          {/* Top chapter navigation */}
          <nav
            aria-label="Chapter navigation"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              {prev && (
                <Link to={`/standards-guide/chapter/${prev.num}`} style={linkStyle}>
                  <ChevronLeft size={16} aria-hidden="true" /> Ch. {prev.num}:{' '}
                  {prev.name}
                </Link>
              )}
            </div>
            <Link
              to="/standards-guide"
              style={{ ...linkStyle, color: 'var(--body)', fontWeight: 500 }}
            >
              All Chapters
            </Link>
            <div>
              {next && (
                <Link to={`/standards-guide/chapter/${next.num}`} style={linkStyle}>
                  Ch. {next.num}: {next.name}{' '}
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </nav>

          {/* Overview prose */}
          <div
            style={{
              fontFamily: 'var(--font-body), Manrope, sans-serif',
              fontSize: '1rem',
              color: 'var(--body)',
              lineHeight: 1.75,
              marginBottom: '32px',
            }}
          >
            {overview}
          </div>

          {/* Reading level toggle + current-level pill */}
          <div className="flex flex-wrap items-center gap-3">
            <ReadingLevelToggle
              className="reading-level-toggle"
            />
            <CurrentReadingLevel />
          </div>
          <div style={{ marginBottom: '20px' }} aria-hidden />

          {/* Sections */}
          <div role="region" aria-label="Standards sections">
            {sections.map((s, i) => (
              <SectionBlock
                key={i}
                index={i}
                section={s}
                isOpen={openIndex === i}
                onToggle={() => {
                  const willOpen = openIndex !== i;
                  setOpenIndex(willOpen ? i : null);
                  if (willOpen) {
                    // Scroll header into view when opening, only if it's
                    // above the viewport or too far below. Keeps the
                    // click-to-open feel tight on long chapters.
                    requestAnimationFrame(() => {
                      const header = document.getElementById(
                        `section-header-${i}`,
                      );
                      if (header) {
                        const rect = header.getBoundingClientRect();
                        if (rect.top < 0 || rect.top > window.innerHeight * 0.5) {
                          window.scrollTo({
                            top: window.scrollY + rect.top - 20,
                            behavior: 'auto',
                          });
                        }
                      }
                    });
                  }
                }}
                readingLevel={readingLevel}
              />
            ))}
          </div>

          {/* Talk to Ada CTA — deep-links with page_context so Ada greets
              the user with an acknowledgment of the chapter. */}
          <section
            aria-label="Talk to Ada"
            style={{
              marginTop: '40px',
              padding: '24px',
              borderRadius: '12px',
              background: 'var(--card-bg-tinted)',
              border: '1px solid var(--border)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-body), Manrope, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--section-label)',
                margin: '0 0 8px',
              }}
            >
              Need to talk through this?
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body), Manrope, sans-serif',
                fontSize: '0.9375rem',
                color: 'var(--body)',
                lineHeight: 1.6,
                margin: '0 0 16px',
              }}
            >
              If this chapter relates to something you ran into and you want
              to know whether it counts as an ADA violation, describe what
              happened and I'll tell you what I think.
            </p>
            <button
              type="button"
              onClick={() => {
                void handleTalkToAda();
              }}
              disabled={startingChat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                borderRadius: '6px',
                background: 'var(--accent)',
                color: 'var(--btn-text)',
                fontFamily: 'var(--font-body), Manrope, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                border: 'none',
                cursor: startingChat ? 'wait' : 'pointer',
                minHeight: '44px',
                opacity: startingChat ? 0.7 : 1,
              }}
            >
              {startingChat ? 'Opening chat…' : 'Talk to Ada'}
            </button>
          </section>

          {/* Bottom prev/next */}
          <nav
            aria-label="Chapter pagination"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              {prev && (
                <Link to={`/standards-guide/chapter/${prev.num}`} style={linkStyle}>
                  <ChevronLeft size={16} aria-hidden="true" /> Previous Chapter
                </Link>
              )}
            </div>
            <div>
              {next && (
                <Link to={`/standards-guide/chapter/${next.num}`} style={linkStyle}>
                  Next Chapter <ChevronRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
