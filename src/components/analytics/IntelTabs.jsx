import React from 'react';

export default function IntelTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'operations', label: '📊 Operations', desc: 'Internal platform health' },
    { id: 'impact', label: '🌍 ADA Impact', desc: 'Violation intelligence' },
  ];

  return (
    <div role="tablist" aria-label="Analytics sections" style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={activeTab === t.id}
          id={`tab-${t.id}`}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '10px 16px', minHeight: '44px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? 'var(--slate-900)' : 'var(--slate-500)',
            backgroundColor: activeTab === t.id ? 'white' : 'transparent',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}