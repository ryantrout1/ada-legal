import React from 'react';
import { Lock, Clock, ShieldCheck } from 'lucide-react';

const props = [
  {
    icon: Lock,
    title: 'Exclusive Assignment',
    desc: 'Every case is assigned to one attorney only. No bidding, no competition — just a direct connection between you and the reporter.'
  },
  {
    icon: Clock,
    title: '24-Hour Contact Model',
    desc: 'You commit to contacting the reporter within 24 hours of assignment. Swift action leads to better outcomes for everyone.'
  },
  {
    icon: ShieldCheck,
    title: 'Vetted & Reviewed Cases',
    desc: 'Every submission is reviewed by our team before it becomes available to qualified attorneys. You only see quality, actionable cases.'
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
        fontWeight: 700, textAlign: 'center', color: 'var(--slate-900)',
        marginBottom: '0.75rem', marginTop: 0
      }}>
        Why Attorneys Choose Us
      </h2>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
        color: 'var(--slate-600)', textAlign: 'center',
        maxWidth: '480px', margin: '0 auto clamp(2rem, 5vw, 3.5rem)'
      }}>
        A platform built for the way you actually practice.
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
              border: '1px solid var(--slate-200)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: 'var(--slate-900)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <Icon size={22} />
              </div>
              <h3 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
                color: 'var(--slate-900)', marginBottom: '0.5rem', marginTop: 0
              }}>
                {p.title}
              </h3>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--slate-600)', lineHeight: 1.6, margin: 0
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