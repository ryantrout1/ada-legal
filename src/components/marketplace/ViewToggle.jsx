import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function ViewToggle({ view, onChange }) {
  const btn = (mode, Icon, label) => {
    const active = view === mode;
    return (
      <button
        type="button"
        onClick={() => onChange(mode)}
        aria-pressed={active}
        title={label}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
          color: active ? 'white' : 'var(--slate-600)',
          backgroundColor: active ? 'var(--terra-600)' : 'transparent',
          border: active ? '1px solid var(--terra-600)' : '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', transition: 'all 0.1s', minHeight: '36px'
        }}
      >
        <Icon size={14} />
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
      {btn('grid', LayoutGrid, 'Grid view')}
      {btn('list', List, 'List view')}
    </div>
  );
}