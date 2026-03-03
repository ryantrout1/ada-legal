import React from 'react';
import BrandIcon from './BrandIcons';

const items = [
  { iconName: 'accessible', title: 'Built Accessible, For Accessibility', desc: 'Our ADA Standards Guide is WCAG 2.2 AAA compliant — the highest level of web accessibility — because the community that uses it deserves nothing less. Keyboard navigable, screen reader optimized, high contrast supported.' },
  { iconName: 'privacy', title: 'Your Privacy, Protected', desc: 'Attorneys only see what they need. Your personal details are never shared publicly.' },
  { iconName: 'vetted', title: 'Vetted Attorneys Only', desc: 'Licensed, verified, and experienced in ADA litigation. No exceptions.' },
  { iconName: 'free', title: 'Always Free to Report', desc: 'No cost to submit a report. Free for people with disabilities, always.' },
  { iconName: 'transparent', title: 'Full Transparency', desc: "Track your case in real time. Know what's happening and who's handling it." },
  { iconName: 'exclusive', title: 'Exclusive Attention', desc: 'One case, one attorney. No bidding wars, no competing interests.' }
];

export default function CommitmentSection() {
  return (
    <section aria-labelledby="commitment-heading" className="warm-keep-dark" style={{
      background: 'var(--dark-bg)', padding: '100px 1.5rem 60px', position: 'relative', overflow: 'hidden'
    }}>
      <div aria-hidden="true" className="section-watermark" style={{
        position: 'absolute', top: '10%', right: '-5%',
        width: '280px', height: '280px',
        backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png)',
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        opacity: 0.03, pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dark-label)',
            margin: '0 0 0.75rem'
          }} >
            Our Commitment
          </p>
          <h2 id="commitment-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2.25rem', fontWeight: 700,
            color: 'var(--dark-heading)', margin: '0 0 0.75rem', fontStyle: 'normal'
          }}>
            Built on principles that matter
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
            color: 'var(--dark-body-secondary)', margin: 0, maxWidth: '520px',
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
              <BrandIcon name={item.iconName} size={40} variant="dark-bg" />
              <div>
                <h3 style={{
                  fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
                  color: 'var(--dark-heading)', margin: '0 0 0.375rem', fontStyle: 'normal'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.88rem',
                  color: 'var(--dark-body-secondary)', lineHeight: 1.6, margin: 0
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
