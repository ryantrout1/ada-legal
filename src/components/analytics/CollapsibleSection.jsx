import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'analytics_collapsed_sections';

function getCollapsedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setCollapsedState(state) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function CollapsibleSection({ id, title, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    return getCollapsedState()[id] || false;
  });

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      const all = getCollapsedState();
      all[id] = next;
      setCollapsedState(all);
      return next;
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          marginBottom: collapsed ? 0 : '8px'
        }}
      >
        {collapsed
          ? <ChevronRight size={16} style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />
        }
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.0625rem', fontWeight: 600,
          color: 'var(--heading)', margin: 0, lineHeight: 1.3
        }}>{title}</h2>
      </button>
      {!collapsed && children}
    </div>
  );
}