import React from 'react';
import { Building2, Globe } from 'lucide-react';

const CARDS = [
  {
    value: 'physical_space',
    icon: Building2,
    title: 'Physical Space Violation',
    subtitle: 'Ramps, parking, entrances, restrooms, and other physical barriers'
  },
  {
    value: 'digital_website',
    icon: Globe,
    title: 'Digital / Website Violation',
    subtitle: 'Websites, apps, and digital services that are inaccessible'
  }
];

export default function ViolationTypeStep({ value, onChange }) {
  return (
    <div>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--slate-600)',
        marginBottom: 'var(--space-xl)',
        lineHeight: 1.6
      }}>
        What type of ADA violation did you experience? Select one to continue.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-lg)'
      }}>
        {CARDS.map(card => {
          const isSelected = value === card.value;
          const Icon = card.icon;

          return (
            <div
              key={card.value}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onChange(card.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(card.value);
                }
              }}
              style={{
                backgroundColor: isSelected ? '#FFF8F5' : 'var(--surface)',
                border: isSelected ? '2px solid #C2410C' : '1px solid #E7E4DE',
                borderRadius: '16px',
                padding: 'var(--space-xl)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: isSelected
                  ? '0 0 0 3px var(--terra-100)'
                  : '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--space-md)',
                minHeight: '160px',
                justifyContent: 'center'
              }}
              onMouseEnter={e => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--slate-400)';
              }}
              onMouseLeave={e => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--slate-200)';
              }}
              onFocus={e => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--terra-400)';
              }}
              onBlur={e => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--slate-200)';
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: isSelected ? 'var(--terra-100)' : 'var(--slate-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}>
                <Icon
                  size={30}
                  style={{
                    color: isSelected ? 'var(--terra-600)' : 'var(--slate-500)',
                    transition: 'color 0.2s'
                  }}
                />
              </div>

              <h3 style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--slate-900)',
                margin: 0
              }}>
                {card.title}
              </h3>

              <p style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.9375rem',
                color: 'var(--slate-600)',
                margin: 0,
                lineHeight: 1.5
              }}>
                {card.subtitle}
              </p>

              {isSelected && (
                <span style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--terra-600)',
                  marginTop: 'var(--space-xs)'
                }}>
                  ✓ Selected
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}