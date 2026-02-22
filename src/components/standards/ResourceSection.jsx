import React from 'react';
import ResourceCard from './ResourceCard';

export default function ResourceSection({ id, icon: Icon, iconBg, title, count, cards }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} style={{ scrollMarginTop: '96px' }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '16px', borderBottom: '2px solid var(--slate-200)',
        marginBottom: '20px', flexWrap: 'wrap', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={22} style={{ color: 'white' }} aria-hidden="true" />
          </div>
          <h2 id={`${id}-heading`} style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
            color: 'var(--slate-900)', margin: 0
          }}>
            {title}
          </h2>
        </div>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-500)'
        }}>
          {count} resource{count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Card grid */}
      <div className="sg-card-grid">
        {cards.map((card, i) => (
          <ResourceCard key={i} card={card} />
        ))}
      </div>
    </section>
  );
}