import React from 'react';
import { Accessibility, ShieldCheck, Scale, Heart, Eye, Star } from 'lucide-react';

const values = [
  { icon: Accessibility, title: 'Accessible by Design', desc: 'Built WCAG 2.1 AA compliant from the ground up — because an access platform must be accessible itself.' },
  { icon: ShieldCheck, title: 'Privacy First', desc: 'Your personal information is never shared publicly. Attorneys see only what they need to take your case.' },
  { icon: Scale, title: 'Vetted Attorneys', desc: 'Every lawyer on our platform is licensed, verified, and experienced in ADA litigation.' },
  { icon: Heart, title: 'Always Free', desc: 'There is no cost to submit a report or get matched. The service is free for people with disabilities.' },
  { icon: Eye, title: 'Full Transparency', desc: 'Track your case status in real time. You will always know what is happening and who is handling it.' },
  { icon: Star, title: 'Exclusive Attention', desc: 'Each case is assigned to one attorney only — no bidding wars, no competing interests.' }
];

export default function OurPromise() {
  return (
    <section style={{
      backgroundColor: 'var(--slate-50)',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 700, textAlign: 'center', color: 'var(--slate-900)',
          marginBottom: '0.75rem', marginTop: 0
        }}>
          Our Promise
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--slate-600)', textAlign: 'center',
          maxWidth: '520px', margin: '0 auto clamp(2rem, 5vw, 3rem)'
        }}>
          The principles that guide everything we build.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {values.map(v => {
            const Icon = v.icon;
            return (
              <div key={v.title} style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--slate-200)',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--terra-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Icon size={20} style={{ color: 'var(--terra-600)' }} />
                </div>
                <h3 style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
                  color: 'var(--slate-900)', marginBottom: '0.375rem', marginTop: 0
                }}>
                  {v.title}
                </h3>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  color: 'var(--slate-600)', lineHeight: 1.6, margin: 0
                }}>
                  {v.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}