import React from 'react';

export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}
      role="status"
      aria-label={label}
    >
      <div className="a11y-spinner" aria-hidden="true" />
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
        color: 'var(--slate-500)', margin: 0
      }}>
        {label}…
      </p>
    </div>
  );
}