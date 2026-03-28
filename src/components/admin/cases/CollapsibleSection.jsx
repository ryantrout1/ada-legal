import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function CollapsibleSection({ id, title, icon, count, alertCount, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionId = `section-${id}`;

  const handleToggle = () => setOpen(prev => !prev);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '10px', overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-controls={sectionId}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
          fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-800)',
          textAlign: 'left', minHeight: '44px',
        }}
      >
        <ChevronRight
          size={16}
          style={{
            color: 'var(--slate-500)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        {icon && <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>}
        <span>{title}</span>
        {count != null && count > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '20px', height: '20px', padding: '0 6px',
            borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700,
            backgroundColor: 'var(--slate-100)', color: 'var(--slate-600)',
          }}>
            {count}
          </span>
        )}
        {alertCount != null && alertCount > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '20px', height: '20px', padding: '0 6px',
            borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700,
            backgroundColor: '#FEE2E2', color: '#B91C1C',
          }}>
            {alertCount}
          </span>
        )}
      </button>
      {open && (
        <div id={sectionId} role="region" style={{ padding: '0 14px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}