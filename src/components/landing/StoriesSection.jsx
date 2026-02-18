import React from 'react';

const stories = [
  {
    emoji: '🏥',
    heading: 'The restroom door was too narrow for my wheelchair.',
    body: 'A medical office with a stall that swings inward, missing grab bars, and a sink too high to reach. A basic appointment became a humiliating ordeal.',
    tag: 'Physical Access'
  },
  {
    emoji: '💻',
    heading: "I couldn't order my own groceries online.",
    body: "A grocery chain's website required mouse clicks to add items to cart. Keyboard navigation was impossible. A simple task everyone else takes for granted.",
    tag: 'Digital Access'
  },
  {
    emoji: '🐕‍🦺',
    heading: "They said my service dog wasn't allowed.",
    body: "A dental office refused a patient with a clearly-identified service animal, citing a 'no pets' policy. The appointment was denied. The law was broken.",
    tag: 'Service Animal'
  }
];

export default function StoriesSection() {
  return (
    <section aria-labelledby="stories-heading" style={{
      background: '#FAF7F2',
      padding: '100px 1.5rem',
      borderTop: '1px solid transparent',
      borderImage: 'linear-gradient(to right, transparent, #E7E4DE, transparent) 1'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C2410C',
            margin: '0 0 0.75rem'
          }} aria-hidden="true">
            This Happens Every Day
          </p>
          <h2 id="stories-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 700,
            color: '#1E293B', margin: '0 0 0.75rem', fontStyle: 'normal'
          }}>
            These are real ADA violations
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem',
            color: '#475569', margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto'
          }}>
            Every day, people with disabilities face barriers that violate their civil rights. These stories represent thousands of unreported incidents.
          </p>
        </div>

        <div className="landing-stories-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {stories.map((s, i) => (
            <article key={i} className="landing-story-card" style={{
              background: '#FFFFFF', border: '1px solid #E7E4DE',
              borderRadius: '16px', padding: '32px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div aria-hidden="true" style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: '#FEF1EC', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.25rem'
              }}>
                {s.emoji}
              </div>
              <h3 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600,
                color: '#1E293B', margin: '0 0 0.75rem', lineHeight: 1.3, fontStyle: 'normal'
              }}>
                {s.heading}
              </h3>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                color: '#475569', lineHeight: 1.6, margin: '0 0 1.25rem'
              }}>
                {s.body}
              </p>
              <span style={{
                display: 'inline-block', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.8rem', fontWeight: 700, color: '#C2410C',
                background: '#FEF1EC', padding: '0.3rem 0.75rem',
                borderRadius: '9999px'
              }}>
                {s.tag}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}