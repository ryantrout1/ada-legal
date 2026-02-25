import React from 'react';

const steps = [
  {
    num: '1',
    title: 'Apply',
    desc: 'Submit your credentials and practice details. We verify your bar status and ADA experience.'
  },
  {
    num: '2',
    title: 'Subscribe',
    desc: 'Activate your subscription to gain full platform access and start receiving case notifications.'
  },
  {
    num: '3',
    title: 'Receive Cases',
    desc: 'Browse pre-screened cases matched to your state. Accept a case and contact the reporter within 24 hours.'
  }
];

export default function LawyerHowItWorks() {
  return (
    <section style={{
      backgroundColor: 'var(--slate-50)',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 700, textAlign: 'center', color: 'var(--slate-900)',
          marginBottom: '0.75rem', marginTop: 0
        }}>
          How It Works for Attorneys
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--slate-600)', textAlign: 'center',
          maxWidth: '480px', margin: '0 auto clamp(2rem, 5vw, 3.5rem)'
        }}>
          From application to your first case in three steps.
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
      </div>
    </section>
  );
}