import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GuideStyles from './GuideStyles';
import GuideHeroBanner from './GuideHeroBanner';
import GuideReportCTA from './GuideReportCTA';

const ALL_CHAPTERS = [
  { num: 1, name: 'Application & Administration', range: '§101–106', page: 'StandardsCh1' },
  { num: 2, name: 'Scoping Requirements', range: '§201–243', page: 'StandardsCh2' },
  { num: 3, name: 'Building Blocks', range: '§301–309', page: 'StandardsCh3' },
  { num: 4, name: 'Accessible Routes', range: '§401–410', page: 'StandardsCh4' },
  { num: 5, name: 'General Site & Building', range: '§501–505', page: 'StandardsCh5' },
  { num: 6, name: 'Plumbing Elements', range: '§601–612', page: 'StandardsCh6' },
  { num: 7, name: 'Communication Elements', range: '§701–708', page: 'StandardsCh7' },
  { num: 8, name: 'Special Rooms & Spaces', range: '§801–811', page: 'StandardsCh8' },
  { num: 9, name: 'Built-in Elements', range: '§901–904', page: 'StandardsCh9' },
  { num: 10, name: 'Recreation Facilities', range: '§1001–1010', page: 'StandardsCh10' },
];

function SectionBlock({ number, title, plain, legal }) {
  return (
    <details style={{
      background: 'white', border: '1px solid var(--slate-200)',
      borderRadius: '12px', marginBottom: '12px', overflow: 'hidden'
    }}>
      <summary style={{
        padding: '16px 20px', cursor: 'pointer',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 600,
        color: 'var(--slate-900)', listStyle: 'none', display: 'flex',
        alignItems: 'center', gap: '12px', minHeight: '44px'
      }}>
        <span style={{
          fontFamily: 'Fraunces, serif', fontSize: '0.8rem', fontWeight: 700,
          color: '#C2410C', background: '#FFF7ED', padding: '2px 10px',
          borderRadius: '6px', flexShrink: 0, border: '1px solid #FFEDD5'
        }}>{number}</span>
        <span style={{ flex: 1 }}>{title}</span>
        <ChevronRight size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} aria-hidden="true" />
      </summary>
      <div style={{ borderTop: '1px solid var(--slate-200)' }}>
        <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
          <div style={{ flex: '1 1 55%', minWidth: 0 }}>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--slate-700)', lineHeight: 1.75
            }}>{plain}</div>
          </div>
          <aside aria-label="Official legal text" style={{ flex: '1 1 40%', minWidth: 0 }}>
            <div style={{
              background: '#F8FAFC', border: '1px solid var(--slate-200)',
              borderRadius: '10px', padding: '16px'
            }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--slate-500)', margin: '0 0 8px'
              }}>Official Standard</p>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                color: 'var(--slate-600)', lineHeight: 1.7
              }}>{legal}</div>
            </div>
          </aside>
        </div>
      </div>
    </details>
  );
}

export default function ChapterPageLayout({ chapterNum, title, range, overview, sections }) {
  const currentIdx = ALL_CHAPTERS.findIndex(c => c.num === chapterNum);
  const prev = currentIdx > 0 ? ALL_CHAPTERS[currentIdx - 1] : null;
  const next = currentIdx < ALL_CHAPTERS.length - 1 ? ALL_CHAPTERS[currentIdx + 1] : null;

  const linkStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
    color: '#C2410C', textDecoration: 'none', padding: '8px 0', minHeight: '44px'
  };

  return (
    <>
      <GuideStyles />
      <style>{`
        details summary::-webkit-details-marker { display: none; }
        details summary::marker { display: none; content: ''; }
        details[open] summary svg { transform: rotate(90deg); }
        details summary:focus-visible { outline: 2px solid #C2410C; outline-offset: 2px; border-radius: 10px; }
      `}</style>
      <GuideHeroBanner
        title={`Chapter ${chapterNum}: ${title}`}
        typeBadge={range}
        badgeColor="#2D6A4F"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          {/* Chapter navigation */}
          <nav aria-label="Chapter navigation" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '8px', marginBottom: '24px', paddingBottom: '20px',
            borderBottom: '1px solid var(--slate-200)'
          }}>
            <div>
              {prev && (
                <Link to={createPageUrl(prev.page)} style={linkStyle}>
                  <ChevronLeft size={16} aria-hidden="true" /> Ch. {prev.num}: {prev.name}
                </Link>
              )}
            </div>
            <Link to={createPageUrl('StandardsGuide') + '#design-standards'} style={{
              ...linkStyle, color: 'var(--slate-600)', fontWeight: 500
            }}>All Chapters</Link>
            <div>
              {next && (
                <Link to={createPageUrl(next.page)} style={linkStyle}>
                  Ch. {next.num}: {next.name} <ChevronRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </nav>

          {/* Overview */}
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: 'var(--slate-700)', lineHeight: 1.75, marginBottom: '32px'
          }}>{overview}</div>

          {/* Sections */}
          <div role="region" aria-label="Standards sections">
            {sections.map((s, i) => (
              <SectionBlock key={i} number={s.number} title={s.title} plain={s.plain} legal={s.legal} />
            ))}
          </div>

          {/* Bottom nav */}
          <nav aria-label="Chapter navigation" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '8px', marginTop: '32px', paddingTop: '20px',
            borderTop: '1px solid var(--slate-200)'
          }}>
            <div>{prev && <Link to={createPageUrl(prev.page)} style={linkStyle}><ChevronLeft size={16} aria-hidden="true" /> Previous Chapter</Link>}</div>
            <div>{next && <Link to={createPageUrl(next.page)} style={linkStyle}>Next Chapter <ChevronRight size={16} aria-hidden="true" /></Link>}</div>
          </nav>
        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}