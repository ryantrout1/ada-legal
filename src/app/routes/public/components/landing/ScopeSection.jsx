import React from 'react';

/**
 * ScopeSection — "honest about what Ada handles right now." Sets expectations
 * upfront (physical + digital barriers now; employment and cognitive/
 * communication/attitudinal barriers not yet) so people don't bounce off Ada
 * disappointed. Mirrors the candor of the Ada page's scope section.
 */
const CAN = [
  { title: 'Physical barriers', desc: 'A building, a doorway, a bathroom, a parking lot, a vehicle, a hotel room that wasn\u2019t what was promised.' },
  { title: 'Digital barriers', desc: 'A website, an app, an online form, or a digital service that shut you out or didn\u2019t work with the tools you use.' },
];
const NOT = [
  { title: 'Workplace & employment', desc: 'ADA Title I — accommodations, hiring, firing. Different in shape, routes through the EEOC. Coming.' },
  { title: 'Cognitive, communication & attitudinal barriers', desc: 'Real, often the worst, often the hardest to document. We\u2019re working on the right way to handle these — and Ada may still point you to the right resource.' },
];

export default function ScopeSection() {
  return (
    <section
      aria-labelledby="v2-scope-heading"
      className="v2-section"
      style={{ background: 'var(--page-bg-alt)', padding: '90px 0', borderTop: '1px solid var(--border-lighter)' }}
    >
      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 2.5rem' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--section-label)', margin: '0 0 0.85rem' }}>
            What we handle right now
          </p>
          <h2 id="v2-scope-heading" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.9rem', fontWeight: 800, color: 'var(--heading)', margin: '0 0 0.85rem', fontStyle: 'normal' }}>
            We'd rather tell you straight.
          </h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
            Better to be upfront about what Ada is built for than have you spend a hard day finding out
            she can't help. Right now she handles two kinds of barriers — and we're honest about the
            ones she doesn't, yet.
          </p>
        </div>

        <div className="v2-scope-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', maxWidth: '880px', margin: '0 auto' }}>
          {/* Can help */}
          <div style={{ background: 'var(--page-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#15803D', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              We can help with
            </h3>
            {CAN.map((item) => (
              <div key={item.title} style={{ marginBottom: '16px' }}>
                <b style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: 'var(--heading)', fontWeight: 700, marginBottom: '3px' }}>{item.title}</b>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.86rem', color: 'var(--body)', lineHeight: 1.55 }}>{item.desc}</span>
              </div>
            ))}
          </div>

          {/* Not yet */}
          <div style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 18px' }}>
              Not yet
            </h3>
            {NOT.map((item) => (
              <div key={item.title} style={{ marginBottom: '16px' }}>
                <b style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: 'var(--heading)', fontWeight: 700, marginBottom: '3px' }}>{item.title}</b>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.86rem', color: 'var(--body)', lineHeight: 1.55 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
