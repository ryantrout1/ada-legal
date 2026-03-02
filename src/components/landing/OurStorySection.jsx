import React from 'react';

export default function OurStorySection() {
  return (
    <section
      aria-labelledby="our-story-heading"
      className="warm-keep-dark"
      style={{
        background: '#0F1219',
        padding: '60px 1.5rem 100px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle logo watermark */}
      <div aria-hidden="true" className="section-watermark" style={{
        position: 'absolute', bottom: '5%', right: '-3%',
        width: '320px', height: '320px',
        backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png)',
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        opacity: 0.03, pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
        {/* Section label */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FDBA74',
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
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem', color: '#B0BEC5',
            lineHeight: 1.7, maxWidth: '650px', margin: '0 auto',
          }}>
            ADA Legal Link was co-founded by Gina — a J.D. and ADA rights advocate who has
            navigated ADA barriers for over 20 years as a quadriplegic. She didn't just study the law.
            She lives the problem it was written to solve.
          </p>
        </div>

        {/* Video container / placeholder */}
        <div className="story-video-container" style={{
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
            aria-label="Gina, co-founder of ADA Legal Link, in her wheelchair outdoors. Video coming soon."
            className="story-photo-frame"
            style={{
              aspectRatio: '16 / 9',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gina's photo */}
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/d5cb8191b_image.png"
              alt=""
              aria-hidden="true"
              className="story-photo-img"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 20%',
                display: 'block',
                zIndex: 0,
              }}
            />
            {/* Dark overlay with coming soon */}
            <div className="video-overlay" style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(to top, rgba(15,18,25,0.75) 0%, rgba(15,18,25,0.25) 35%, rgba(15,18,25,0.08) 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              padding: '0 20px 32px',
            }}>
              {/* Play button */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(194, 65, 12, 0.25)',
                border: '2px solid rgba(194, 65, 12, 0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}>
                <svg width="24" height="28" viewBox="0 0 28 32" fill="none" aria-hidden="true">
                  <path d="M4 2L26 16L4 30V2Z" fill="rgba(255,255,255,0.9)" />
                </svg>
              </div>
              <p style={{
                fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
                color: 'white', margin: '0 0 4px', textAlign: 'center',
              }}>
                Video Coming Soon
              </p>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                color: '#CBD5E1', margin: 0, textAlign: 'center',
              }}>
                Hear directly from Gina about why this platform exists.
              </p>
            </div>
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
              color: '#B0BEC5', lineHeight: 1.7, margin: 0,
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
              color: '#B0BEC5', lineHeight: 1.7, margin: 0,
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
            color: '#B0BEC5', margin: 0,
          }}>
            Something not working? Something we missed?{' '}
            <span style={{ color: '#FDBA74', fontWeight: 600 }}>
              We want to hear it.
            </span>{' '}
            Use the Feedback button — every message goes directly to our team.
          </p>
        </div>
      </div>
    </section>
  );
}
