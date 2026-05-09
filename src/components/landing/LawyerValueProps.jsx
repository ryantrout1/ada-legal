import React from 'react';
import { FileText, UserCheck, XCircle } from 'lucide-react';

const props = [
  {
    icon: FileText,
    title: 'What we send you',
    desc: "A documented narrative in the person's own words, with the legal frame we think applies, plus geography and practice-area context. We make the introduction; you decide whether to take the case."
  },
  {
    icon: UserCheck,
    title: "Who we're looking for",
    desc: 'Practicing attorneys with real experience in disability rights or access litigation. Title III is most of what comes through us today, plus adjacent practice areas and the willingness to actually take a case when the fit is right.'
  },
  {
    icon: XCircle,
    title: "What we're not",
    desc: 'Not a referral service, not a lead-gen marketplace, not exclusive. No fees change hands between us and you. You can be on other platforms; we ask only that if a case fits, you give it a real look.'
  }
];

export default function LawyerValueProps() {
  return (
    <section aria-labelledby="lawyer-value-heading" style={{
      maxWidth: '1000px', margin: '0 auto',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <h2 id="lawyer-value-heading" style={{
        fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
        fontWeight: 700, textAlign: 'center', color: 'var(--heading)',
        marginBottom: '0.75rem', marginTop: 0
      }}>
        What you can expect
      </h2>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
        color: 'var(--body)', textAlign: 'center',
        maxWidth: '480px', margin: '0 auto clamp(2rem, 5vw, 3.5rem)'
      }}>
        We're early. Here's how the network works.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem'
      }}>
        {props.map(p => {
          const Icon = p.icon;
          return (
            <div key={p.title} style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: 'var(--heading)', color: 'var(--dark-heading)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <Icon size={22} />
              </div>
              <h3 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
                color: 'var(--heading)', marginBottom: '0.5rem', marginTop: 0
              }}>
                {p.title}
              </h3>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--body)', lineHeight: 1.6, margin: 0
              }}>
                {p.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}