import React from 'react';

const steps = [
  {
    num: '1',
    title: 'Apply',
    desc: 'Send us your name, firm, bar number, the states you practice in, and a quick line on the work you actually do. The application is free and takes a few minutes.'
  },
  {
    num: '2',
    title: 'We review',
    desc: "Gina reads each application herself. We're building the network slowly and we want to know what kind of cases you take and where. Replies come in batches as we review."
  },
  {
    num: '3',
    title: 'Hear from us',
    desc: "When a case Ada has worked through fits your geography and practice, we make the introduction. You read the intake and decide whether to take it. We don't pressure either side."
  }
];

export default function LawyerHowItWorks() {
  return (
    <section aria-labelledby="lawyer-how-heading" style={{
      backgroundColor: 'var(--page-bg-subtle)',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 id="lawyer-how-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 700, textAlign: 'center', color: 'var(--heading)',
          marginBottom: '0.75rem', marginTop: 0
        }}>
          How It Works for Attorneys
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--body)', textAlign: 'center',
          maxWidth: '480px', margin: '0 auto clamp(2rem, 5vw, 3.5rem)'
        }}>
          Three steps from application to introduction.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem'
        }}>
          {steps.map(s => (
            <div key={s.num} style={{ textAlign: 'center' }}>
              <div className="step-number-circle" style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: 'var(--heading)', color: 'var(--dark-heading)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
                margin: '0 auto 1.25rem'
              }}>
                {s.num}
              </div>
              <h3 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
                color: 'var(--heading)', marginBottom: '0.5rem', marginTop: 0
              }}>
                {s.title}
              </h3>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--body)', lineHeight: 1.6, margin: 0
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