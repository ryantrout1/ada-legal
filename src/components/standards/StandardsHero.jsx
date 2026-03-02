import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import ADAAssistant from '../guide/ADAAssistant';

const QUOTES = [
  {
    text: "I kept being told 'that's just how the building is.' Turns out there are clear standards they're supposed to follow.",
    attribution: "The reason we built this"
  },
  {
    text: "I couldn't order groceries online because the website didn't work with my screen reader. I had no idea that was an ADA violation.",
    attribution: "The reason we built this"
  },
  {
    text: "I tried reading the ADA standards on ADA.gov and gave up after 10 minutes. This explained my rights in plain English.",
    attribution: "The reason we built this"
  },
  {
    text: "I didn't know a restaurant without a ramp was actually breaking the law. I found the exact standard in 30 seconds.",
    attribution: "The reason we built this"
  }
];

function QuoteCarousel() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const liveRef = useRef(null);
  const total = QUOTES.length;

  const go = useCallback((dir) => {
    setIndex(prev => {
      const next = (prev + dir + total) % total;
      setTimeout(() => {
        if (liveRef.current) {
          liveRef.current.textContent = `Quote ${next + 1} of ${total}: ${QUOTES[next].text} — ${QUOTES[next].attribution}`;
        }
      }, 50);
      return next;
    });
  }, [total]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
  }, [go]);

  const q = QUOTES[index];

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Testimonials from users"
      onKeyDown={onKeyDown}
      style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '24px', borderLeft: '3px solid var(--accent)',
        paddingLeft: '20px', position: 'relative'
      }}
    >
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      <div role="group" aria-roledescription="slide" aria-label={`Quote ${index + 1} of ${total}`}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--dark-body)', lineHeight: 1.6, margin: '0 0 0.75rem', fontStyle: 'italic'
        }}>
          "{q.text}"
        </p>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
          color: 'var(--dark-muted)', margin: 0
        }}>
          — {q.attribution}
        </p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: '16px', paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', gap: '6px' }} role="tablist" aria-label="Quote navigation">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Quote ${i + 1} of ${total}`}
              className="sg-carousel-dot"
              onClick={() => {
                setIndex(i);
                if (liveRef.current) {
                  liveRef.current.textContent = `Quote ${i + 1} of ${total}: ${QUOTES[i].text} — ${QUOTES[i].attribution}`;
                }
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}
            >
              <span aria-hidden="true" style={{
                width: i === index ? '20px' : '8px', height: '8px',
                borderRadius: '4px',
                background: i === index ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                display: 'block'
              }} />
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => go(-1)}
            aria-label="Previous quote"
            className="sg-carousel-btn"
            style={{
              width: '44px', height: '44px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--dark-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', padding: 0,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next quote"
            className="sg-carousel-btn"
            style={{
              width: '44px', height: '44px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--dark-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', padding: 0,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StandardsHero({ searchValue, onSearchChange }) {
  return (
    <section
      aria-labelledby="sg-heading"
      className="warm-keep-dark"
      style={{
        background: 'var(--dark-bg)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glows */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '-15%', left: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="sg-hero-grid">
        {/* Left column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div aria-hidden="true" style={{ width: '32px', height: '2px', background: 'var(--accent)' }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dark-label)'
            }}>
              ADA Standards Guide
            </span>
          </div>

          <h1 id="sg-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
            fontWeight: 700, lineHeight: 1.1, color: 'var(--dark-heading)', margin: '0 0 1.5rem'
          }}>
            Know the law.<br />
            <span style={{ color: 'var(--dark-label)' }}>Know your rights.</span>
          </h1>

          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem',
            color: 'var(--dark-body-secondary)', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: '520px'
          }}>
            The complete ADA Accessibility Standards — reorganized for clarity,
            searchable by topic, and built to be fully accessible to everyone.
            Plain language alongside the official legal text.
          </p>

          {/* AI Assistant */}
          <ADAAssistant />
        </div>

        {/* Right column */}
        <div>
          {/* Impact card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '28px 32px', marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Shield size={16} style={{ color: 'var(--dark-label)' }} aria-hidden="true" />
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dark-label)'
              }}>
                Official Source
              </span>
            </div>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 800,
              color: 'var(--dark-label)', margin: '0 0 0.5rem'
            }}>
              243
            </p>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
              color: 'var(--dark-heading)', margin: '0 0 0.75rem', lineHeight: 1.3
            }}>
              Sections of the 2010 ADA Design Standards
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
              color: 'var(--dark-body-secondary)', lineHeight: 1.6, margin: 0
            }}>
              Reorganized into searchable topics with plain-language explanations.
              All citations reference the official DOJ standards on ADA.gov.
            </p>
          </div>

          {/* Quote carousel */}
          <QuoteCarousel />
        </div>
      </div>

      {/* Watermark logo */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: '20px', right: '40px',
          width: '240px', height: '240px', objectFit: 'contain',
          opacity: 0.08, pointerEvents: 'none'
        }}
      />

      <div aria-live="polite" aria-atomic="true" className="sr-only" id="sg-search-results-announce" />
    </section>
  );
}
