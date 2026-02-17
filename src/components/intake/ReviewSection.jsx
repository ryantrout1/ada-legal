import React from 'react';
import { Pencil } from 'lucide-react';

export default function ReviewSection({ title, onEdit, children }) {
  return (
    <div style={{
      marginBottom: 'var(--space-xl)',
      paddingBottom: 'var(--space-xl)',
      borderBottom: '1px solid var(--slate-200)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-md)'
      }}>
        <h3 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--slate-900)',
          margin: 0
        }}>
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--terra-600)',
            backgroundColor: 'transparent',
            border: '1px solid var(--terra-600)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            minHeight: '36px',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--terra-50)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label={`Edit ${title}`}
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>
      <dl style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: 'var(--space-sm) var(--space-md)',
        margin: 0
      }}>
        {children}
      </dl>
    </div>
  );
}

export function ReviewItem({ label, value }) {
  return (
    <>
      <dt style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--slate-600)'
      }}>
        {label}
      </dt>
      <dd style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.9375rem',
        color: 'var(--slate-800)',
        margin: 0,
        wordBreak: 'break-word'
      }}>
        {value || '—'}
      </dd>
    </>
  );
}