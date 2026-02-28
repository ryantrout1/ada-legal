import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const CHAPTERS = [
  { num: 1, name: 'Application & Administration', range: '§101–106', page: 'StandardsCh1' },
  { num: 2, name: 'Scoping Requirements', range: '§201–243', page: 'StandardsCh2' },
  { num: 3, name: 'Building Blocks', range: '§301–309', page: 'StandardsCh3' },
  { num: 4, name: 'Accessible Routes', range: '§401–410', page: 'StandardsCh4' },
  { num: 5, name: 'General Site & Building', range: '§501–505', page: 'StandardsCh5' },
  { num: 6, name: 'Plumbing Elements', range: '§601–612', page: 'StandardsCh6' },
  { num: 7, name: 'Communication Elements', range: '§701–708', page: 'StandardsCh7' },
  { num: 8, name: 'Special Rooms & Spaces', range: '§801–811', page: 'StandardsCh8' },
  { num: 9, name: 'Built-in Elements', range: '§901–904', page: 'StandardsCh9' },
  { num: 10, name: 'Recreation Facilities', range: '§1001–1010', page: 'StandardsCh10' }
];

export default function ChapterNavigator() {
  return (
    <div
      role="region"
      aria-labelledby="ch-nav-heading"
      style={{
        background: 'white', border: '1px solid var(--slate-200)',
        borderRadius: '16px', padding: '28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
        marginBottom: '20px'
      }}
    >
      <h3 id="ch-nav-heading" style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 700,
        color: 'var(--slate-900)', margin: '0 0 6px'
      }}>
        Navigate by Chapter
      </h3>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
        color: 'var(--slate-600)', lineHeight: 1.6, margin: '0 0 20px'
      }}>
        The 2010 Standards are organized into 10 chapters. Each chapter page
        includes plain-language explanations alongside the official requirements.
      </p>

      <ol aria-label="Design Standards chapters" className="sg-chapter-grid" style={{
        listStyle: 'none', margin: 0, padding: 0,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '8px'
      }}>
        {CHAPTERS.map(ch => (
          <li key={ch.num}>
            <Link
              to={createPageUrl(ch.page)}
              className="sg-chapter-link chapter-link"
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: '#FAF7F2', border: '1px solid var(--slate-200)',
                borderRadius: '10px', padding: '14px 18px',
                textDecoration: 'none', minHeight: '44px', boxSizing: 'border-box'
              }}
            >
              <span className="chapter-num" style={{
                width: '34px', height: '34px', background: 'white',
                border: '1px solid var(--slate-200)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fraunces, serif', fontSize: '0.8rem', fontWeight: 700,
                color: '#C2410C', flexShrink: 0
              }}>
                {ch.num}
              </span>
              <span style={{
                flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
                fontWeight: 500, color: 'var(--slate-900)'
              }}>
                {ch.name}
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem',
                color: 'var(--slate-500)', whiteSpace: 'nowrap', flexShrink: 0
              }}>
                {ch.range}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}