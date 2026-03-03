import React from 'react';

const steps = [
  {
    num: '1',
    title: 'Learn Your Rights',
    desc: 'Browse the ADA Standards Guide — 30 interactive diagrams and 47 guides in plain language. Search any topic instantly.',
    time: 'At your own pace'
  },
  {
    num: '2',
    title: 'Report What Happened',
    desc: 'Fill out a simple guided form describing the ADA violation you experienced. No legal knowledge needed.',
    time: 'About 5 minutes'
  },
  {
    num: '3',
    title: 'We Review Your Report',
    desc: 'Our team reviews every submission for completeness. Qualifying cases enter our attorney network, visible only to licensed ADA lawyers in your area.',
    time: 'Thorough review'
  },
  {
    num: '4',
    title: 'An Attorney Reaches Out',
    desc: 'When an attorney accepts your case, they contact you directly and exclusively — at no cost to you.',
    time: 'At no cost to you'
  }
];

export default function HowItWorksNew() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" style={{
      background: 'var(--page-bg)', padding: '100px 1.5rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--section-label)',
            margin: '0 0 0.75rem'
          }}>
            How It Works
          </p>
          <h2 id="how-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 700,
            color: 'var(--heading)', margin: '0 0 0.75rem', fontStyle: 'normal'
          }}>
            From understanding to action
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
            color: 'var(--body)', margin: 0, maxWidth: '520px',
            marginLeft: 'auto', marginRight: 'auto'
          }}>
            Start by learning your rights. When you're ready, we guide you through everything — no legal knowledge required, no upfront costs.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Connecting line */}
          <div aria-hidden="true" className="landing-steps-line" style={{
            position: 'absolute', top: '40px', left: '15%', right: '15%',
            height: '2px', opacity: 0.4,
            background: 'linear-gradient(to right, var(--border), var(--accent), var(--border))',
            zIndex: 0
          }} />

          <div role="list" className="landing-steps-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem', position: 'relative', zIndex: 1
          }}>
            {steps.map((s, i) => (
              <div key={i} role="listitem" style={{ textAlign: 'center' }}>
                <div className="step-number-circle" style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'var(--heading)', color: 'var(--page-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 800,
                  margin: '0 auto 1.5rem', fontStyle: 'normal',
                  position: 'relative'
                }}>
                  <span aria-hidden="true">{s.num}</span>
                  <span className="sr-only">Step {s.num}.</span>
                </div>
                <h3 style={{
                  fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
                  color: 'var(--heading)', margin: '0 0 0.75rem', fontStyle: 'normal'
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                  color: 'var(--body)', lineHeight: 1.6, margin: '0 0 0.75rem',
                  maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto'
                }}>
                  {s.desc}
                </p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                  fontWeight: 700, color: 'var(--section-label)', margin: 0
                }}>
                  <span className="sr-only">Estimated time: </span>
                  {s.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}