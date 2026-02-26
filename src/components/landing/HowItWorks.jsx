import React from 'react';

const steps = [
  {
    num: '1',
    title: 'Report What Happened',
    desc: 'Tell us about the ADA violation you experienced through our simple, guided form. It takes about five minutes.'
  },
  {
    num: '2',
    title: 'We Review and Verify',
    desc: 'Our team reviews every submission for quality and completeness before it enters our attorney network.'
  },
  {
    num: '3',
    title: 'An Attorney Reaches Out to You',
    desc: 'A vetted ADA attorney claims your case exclusively and contacts you directly — usually within 24 hours.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{
      maxWidth: '1000px', margin: '0 auto',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
        fontWeight: 700, textAlign: 'center', color: 'var(--slate-900)',
        marginBottom: '0.75rem', marginTop: 0
      }}>
        How It Works
      </h2>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
        color: 'var(--slate-600)', textAlign: 'center',
        maxWidth: '520px', margin: '0 auto clamp(2rem, 5vw, 3.5rem)'
      }}>
        Three simple steps from report to resolution.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '2rem'
      }}>
        {steps.map(s => (
          <div key={s.num} style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'var(--slate-900)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
              margin: '0 auto 1.25rem'
            }}>
              {s.num}
            </div>
            <h3 style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
              color: 'var(--slate-900)', marginBottom: '0.5rem', marginTop: 0
            }}>
              {s.title}
            </h3>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--slate-600)', lineHeight: 1.6, margin: 0
            }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}