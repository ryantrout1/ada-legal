import React from 'react';

const items = [
  { icon: '♿', title: 'WCAG 2.1 AA Compliant', desc: 'Keyboard navigable, screen reader optimized, tested with real assistive technology users.' },
  { icon: '🔒', title: 'Your Privacy, Protected', desc: 'Attorneys only see what they need. Your personal details are never shared publicly.' },
  { icon: '✓', title: 'Vetted Attorneys Only', desc: 'Licensed, verified, and experienced in ADA litigation. No exceptions.' },
  { icon: '$0', title: 'Always Free for Claimants', desc: 'No cost to report or get matched. Free for people with disabilities, always.' },
  { icon: '📊', title: 'Full Transparency', desc: "Track your case in real time. Know what's happening and who's handling it." },
  { icon: '1:1', title: 'Exclusive Attention', desc: 'One case, one attorney. No bidding wars, no competing interests.' }
];

export default function CommitmentSection() {
  return (
    <section aria-labelledby="commitment-heading" style={{
      background: '#1E293B', padding: '100px 1.5rem', position: 'relative', overflow: 'hidden'
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,65,12,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#EA580C',
            margin: '0 0 0.75rem'
          }} aria-hidden="true">
            Our Commitment
          </p>
          <h2 id="commitment-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2.25rem', fontWeight: 700,
            color: 'white', margin: '0 0 0.75rem', fontStyle: 'normal'
          }}>
            Built on principles that matter
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
            color: '#CBD5E1', margin: 0, maxWidth: '520px',
            marginLeft: 'auto', marginRight: 'auto'
          }}>
            Every decision we make is guided by these commitments to the people we serve.
          </p>
        </div>

        <div className="landing-commitment-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px'
        }}>
          {items.map((item, i) => (
            <div key={i} className="landing-commitment-card" style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px', padding: '24px',
              transition: 'background 0.15s'
            }}>
              <div aria-hidden="true" style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: 'rgba(194,65,12,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EA580C', fontFamily: 'Manrope, sans-serif',
                fontSize: item.icon.length > 2 ? '0.75rem' : '1.1rem',
                fontWeight: 700, flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <h3 style={{
                  fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
                  color: 'white', margin: '0 0 0.375rem', fontStyle: 'normal'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem',
                  color: '#CBD5E1', lineHeight: 1.6, margin: 0
                }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}