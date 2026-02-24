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
    title: 'We Review & Match',
    desc: 'Our team reviews every submission. Your case enters the attorney marketplace, visible only to qualified ADA lawyers in your area.',
    time: 'Within 24 hours'
  },
  {
    num: '4',
    title: 'An Attorney Reaches Out',
    desc: 'A licensed ADA attorney claims your case exclusively and contacts you directly — at no cost to you.',
    time: 'Usually within 48 hours'
  }
];

export default function HowItWorksNew() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" style={{
      background: '#FFFFFF', padding: '100px 1.5rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C2410C',
            margin: '0 0 0.75rem'
          }} aria-hidden="true">
            How It Works
          </p>
          <h2 id="how-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 700,
            color: '#1E293B', margin: '0 0 0.75rem', fontStyle: 'normal'
          }}>
            From understanding to action
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
            color: '#475569', margin: 0, maxWidth: '520px',
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
            background: 'linear-gradient(to right, var(--slate-200), #C2410C, var(--slate-200))',
            zIndex: 0
          }} />

          <div role="list" className="landing-steps-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem', position: 'relative', zIndex: 1
          }}>
            {steps.map((s, i) => (
              <div key={i} role="listitem" style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: '#1E293B', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 800,
                  margin: '0 auto 1.5rem', fontStyle: 'normal',
                  position: 'relative'
                }}>
                  {s.num}
                </div>
                <h3 style={{
                  fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
                  color: '#1E293B', margin: '0 0 0.75rem', fontStyle: 'normal'
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                  color: '#475569', lineHeight: 1.6, margin: '0 0 0.75rem',
                  maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto'
                }}>
                  {s.desc}
                </p>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                  fontWeight: 700, color: '#C2410C'
                }}>
                  {s.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}