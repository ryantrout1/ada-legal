import React from 'react';

export default function OurStorySection() {
  return (
    <section
      aria-labelledby="our-story-heading"
      style={{
        background: '#0F1219',
        padding: '100px 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle accent glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '10%', left: '-5%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
        {/* Section label */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FB923C',
            margin: '0 0 0.75rem',
          }}>
            Our Story
          </p>
          <h2 id="our-story-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 700, color: 'white', margin: '0 0 1rem', lineHeight: 1.2,
          }}>
            Built by someone who lives it.
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem', color: '#94A3B8',
            lineHeight: 1.7, maxWidth: '650px', margin: '0 auto',
          }}>
            ADA Legal Link was co-founded by Gina — a quadriplegic attorney who has
            navigated ADA barriers for over 20 years. She didn't just study the law.
            She lives the problem it was written to solve.
          </p>
        </div>

        {/* Video container / placeholder */}
        <div style={{
          maxWidth: '720px', margin: '0 auto 2.5rem',
          borderRadius: '16px', overflow: 'hidden',
          border: '1px solid #2A3344',
          background: '#1A1F2B',
        }}>
          {/* 
            PLACEHOLDER — replace with <video> or embed once footage is ready.
            Aspect ratio: 16:9
          */}
          <div
            role="img"
            aria-label="Video coming soon — Gina, co-founder and ADA attorney, shares why she built ADA Legal Link"
            style={{
              aspectRatio: '16 / 9',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #1A1F2B 0%, #0F1219 100%)',
              position: 'relative',
            }}
          >
            {/* Play button circle */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(194, 65, 12, 0.15)',
              border: '2px solid #C2410C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true">
                <path d="M4 2L26 16L4 30V2Z" fill="#C2410C" />
              </svg>
            </div>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600,
              color: 'white', margin: '0 0 6px', textAlign: 'center',
            }}>
              Coming Soon
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
              color: '#64748B', margin: 0, textAlign: 'center',
              padding: '0 20px',
            }}>
              Hear directly from our co-founder about why this platform exists.
            </p>
          </div>
        </div>

        {/* Supporting text */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          maxWidth: '720px',
          margin: '0 auto',
        }}>
          <div style={{
            background: '#1A1F2B', border: '1px solid #2A3344',
            borderRadius: '12px', padding: '24px',
          }}>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
              color: 'white', margin: '0 0 8px',
            }}>
              Lived experience, not theory.
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: '#94A3B8', lineHeight: 1.7, margin: 0,
            }}>
              Every feature on this platform was shaped by someone who uses a
              wheelchair, fights ADA cases, and knows firsthand when a ramp is
              too steep or a website won't work with assistive technology.
            </p>
          </div>

          <div style={{
            background: '#1A1F2B', border: '1px solid #2A3344',
            borderRadius: '12px', padding: '24px',
          }}>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
              color: 'white', margin: '0 0 8px',
            }}>
              Built with you, not for you.
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: '#94A3B8', lineHeight: 1.7, margin: 0,
            }}>
              This platform will grow based on your feedback. We got the
              foundations right — accessible, private, free — but the community
              decides where it goes from here.
            </p>
          </div>
        </div>

        {/* Feedback callout */}
        <div style={{
          textAlign: 'center', marginTop: '2.5rem',
          padding: '20px', borderTop: '1px solid #2A3344',
        }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: '#64748B', margin: 0,
          }}>
            Something not working? Something we missed?{' '}
            <span style={{ color: '#FB923C', fontWeight: 600 }}>
              We want to hear it.
            </span>{' '}
            Use the Feedback button — every message goes directly to our team.
          </p>
        </div>
      </div>
    </section>
  );
}
