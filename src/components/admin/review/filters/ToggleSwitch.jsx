import React from 'react';

export default function ToggleSwitch({ label, checked, onChange, id }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.8125rem',
        fontWeight: 500,
        color: 'var(--slate-700)',
        minHeight: '44px',
      }}
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '28px',
          borderRadius: '14px',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: checked ? 'var(--slate-800)' : 'var(--slate-200)',
          position: 'relative',
          flexShrink: 0,
          transition: 'background-color 0.2s',
          padding: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '19px' : '3px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}