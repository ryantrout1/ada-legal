import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormField({ label, id, required, error, helperText, children }) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--heading)',
          marginBottom: 'var(--space-xs)'
        }}
      >
        {label}
        {required && (
          <span aria-label="required" style={{ color: '#991B1B', marginLeft: '4px' }}>*</span>
        )}
      </label>
      {helperText && (
        <p
          id={helperId}
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.8125rem',
            color: 'var(--body-secondary)',
            margin: '0 0 var(--space-xs) 0',
            lineHeight: 1.4
          }}
        >
          {helperText}
        </p>
      )}
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.8125rem',
            color: '#B91C1C',
            margin: 'var(--space-xs) 0 0 0',
            lineHeight: 1.4
          }}
        >
          <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
          {error}
        </p>
      )}
    </div>
  );
}