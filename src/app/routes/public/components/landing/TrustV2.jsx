import React from 'react';

/**
 * TrustV2 — the former "Our Commitment" principles, demoted from a headline
 * section to trust evidence that sits AFTER the reader understands the product.
 * Swapped the now-inaccurate "track your case in real time / full transparency"
 * promises for "not a law firm" and "honest about scope" — truer to being a
 * connector, and drawn from the Ada page.
 */
const ITEMS = [
  {
    title: 'WCAG 2.2 AAA',
    desc: 'The highest level of web accessibility. Keyboard navigable, screen reader tested, high-contrast and photo-sensitive-safe. You shouldn\u2019t have to fight the site to use it.',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  },
  {
    title: 'Your privacy, protected',
    desc: 'We gather only what\u2019s needed to understand your barrier and connect you. Your details are never shared publicly or sold.',
    icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  },
  {
    title: 'Vetted attorneys only',
    desc: 'Licensed, verified, and experienced in ADA litigation. One case, one attorney — no bidding wars, no competing interests.',
    icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  },
  {
    title: 'Always free',
    desc: 'No paywall, no subscription, no credit card. If a barrier shut you out, you can get help here — free, always. You don\u2019t have to prove anything to anyone.',
    icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  },
  {
    title: 'Not a law firm',
    desc: 'Ada can\u2019t represent you. She helps you understand what happened and connects you with someone who can take the case if it calls for it.',
    icon: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  },
  {
    title: 'Honest about scope',
    desc: 'We tell you straight what we cover today and what\u2019s coming, rather than letting you find out the hard way.',
    icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  },
];

export default function TrustV2() {
  return (
    <section
      aria-labelledby="v2-trust-heading"
      className="v2-section warm-keep-dark"
      style={{ background: 'var(--dark-bg)', padding: '90px 0', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dark-label)', margin: '0 0 0.85rem' }}>
            Why you can trust this
          </p>
          <h2 id="v2-trust-heading" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--dark-heading)', margin: '0 0 0.85rem', fontStyle: 'normal' }}>
            Built for the community it serves
          </h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.02rem', color: 'var(--dark-body-secondary)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>
            These aren't marketing promises. They're the constraints we built under from the first line of code.
          </p>
        </div>

        <div className="v2-trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {ITEMS.map((item) => (
            <div key={item.title} className="v2-tritem" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px' }}>
              <div aria-hidden="true" style={{ color: 'var(--accent-light)', marginBottom: '12px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              </div>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--dark-heading)', margin: '0 0 6px', fontStyle: 'normal' }}>{item.title}</h3>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--dark-body-secondary)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
