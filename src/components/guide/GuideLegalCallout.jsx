import React from 'react';
import AutoCiteLinks from './AutoCiteLinks';

export default function GuideLegalCallout({ citation, children }) {
  return (
    <aside aria-label="Legal citation" style={{
      background: 'white', border: '1px solid var(--slate-200)',
      borderLeft: '3px solid #C2410C',
      borderRadius: '0 10px 10px 0', padding: '16px 20px',
      margin: '20px 0'
    }}>
      {citation && (
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--slate-500)', margin: '0 0 8px'
        }}>
          {citation}
        </p>
      )}
      <div style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
        color: 'var(--slate-600)', lineHeight: 1.7
      }}>
        <AutoCiteLinks>{children}</AutoCiteLinks>
      </div>
    </aside>
  );
}