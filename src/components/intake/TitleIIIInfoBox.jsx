import React from 'react';

export default function TitleIIIInfoBox() {
  return (
    <div style={{
      background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '10px',
      padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px',
      marginTop: '32px'
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', background: '#FEF1EC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', flexShrink: 0
      }}>
        <span aria-hidden="true">⚖️</span>
      </div>
      <div>
        <h3 style={{
          fontFamily: 'Fraunces, serif', fontSize: '0.9rem', fontWeight: 600,
          color: '#9A3412', margin: '0 0 6px'
        }}>
          About Your Rights Under Title III
        </h3>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#C2410C',
          lineHeight: 1.6, margin: 0
        }}>
          Your report involves a Title III violation under the Americans with Disabilities Act, which covers private businesses open to the public. Title III allows individuals to file private lawsuits to enforce accessibility standards. Your assigned attorney will explain your options and guide you through the process.
        </p>
      </div>
    </div>
  );
}