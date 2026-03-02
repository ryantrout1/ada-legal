import React from 'react';
import AutoCiteLinks from './AutoCiteLinks';

export default function GuideLegalCallout({ citation, children }) {
  return (
    <div role="note" aria-label="Legal citation" style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent)',
      borderRadius: '0 10px 10px 0', padding: '16px 20px',
      margin: '20px 0'
    }}>
      {citation && (
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--body-secondary)', margin: '0 0 8px'
        }}>
          <AutoCiteLinks>{citation}</AutoCiteLinks>
        </p>
      )}
      <div style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
        color: 'var(--body)', lineHeight: 1.7
      }}>
        <AutoCiteLinks>{children}</AutoCiteLinks>
      </div>
    </div>
  );
}