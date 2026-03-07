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
          <span aria-label="required" style={{ color: 'var(--banner-error-text)', marginLeft: '4px' }}>*</span>
        )}
      </label>
      {helperText && (
        <p
          id={helperId}
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--body-secondary)',
            margin: '0 0 var(--space-xs) 0',
            lineHeight: 1.5
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
            fontSize: '0.875rem',
            color: 'var(--banner-error-text)',
            margin: 'var(--space-xs) 0 0 0',
            lineHeight: 1.5
          }}
        >
          <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
          {error}
        </p>
      )}
    </div>
  );
}