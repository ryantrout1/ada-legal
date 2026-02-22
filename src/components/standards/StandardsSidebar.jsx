import React from 'react';

const CATEGORIES = [
  { id: 'rights', label: 'Know Your Rights', color: '#D4570A', count: 8 },
  { id: 'business', label: 'Business Compliance', color: '#9A3412', count: 12 },
  { id: 'design-standards', label: 'Design Standards', color: '#2D6A4F', count: 10 },
  { id: 'web-access', label: 'Web & Digital', color: '#5B2C6F', count: 6 },
  { id: 'government', label: 'Government (Title II)', color: '#8B1A1A', count: 7 }
];

export default function StandardsSidebar({ activeId }) {
  return (
    <nav aria-label="Resource categories" className="sg-sidebar">
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--slate-600)', margin: '0 0 16px', paddingLeft: '16px'
      }}>
        Browse by Category
      </p>
      <div style={{ borderLeft: '2px solid #E7E4DE' }}>
        {CATEGORIES.map(cat => {
          const isActive = activeId === cat.id;
          return (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className={`sg-sidebar-link ${isActive ? 'sg-sidebar-active' : ''}`}
              aria-current={isActive ? 'true' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px 10px 16px',
                marginLeft: '-2px',
                borderLeft: isActive ? '2px solid #C2410C' : '2px solid transparent',
                background: isActive ? '#FEF1EC' : 'transparent',
                color: isActive ? '#C2410C' : 'var(--slate-700)',
                textDecoration: 'none',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 500,
                borderRadius: '0 6px 6px 0',
                minHeight: '44px', boxSizing: 'border-box'
              }}
            >
              <span aria-hidden="true" style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: cat.color, flexShrink: 0
              }} />
              <span style={{ flex: 1 }}>{cat.label}</span>
              <span style={{
                background: isActive ? '#FDDCCC' : 'var(--slate-100)',
                padding: '2px 8px', borderRadius: '100px',
                fontSize: '0.7rem', fontWeight: 600,
                color: isActive ? '#9A3412' : 'var(--slate-600)'
              }}>
                {cat.count}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}