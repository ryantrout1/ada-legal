import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'admin_dash_collapsed';

function getState() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveState(s) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export default function DashboardCollapsible({ id, title, icon: Icon, iconColor, count, children }) {
  const [collapsed, setCollapsed] = useState(() => getState()[id] || false);

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      const all = getState();
      all[id] = next;
      saveState(all);
      return next;
    });
  };

  return (
    <div id={id}>
      <button type="button" onClick={toggle} aria-expanded={!collapsed} style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        marginBottom: collapsed ? 0 : '8px'
      }}>
        {collapsed
          ? <ChevronRight size={15} style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />
          : <ChevronDown size={15} style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />
        }
        {Icon && <Icon size={16} style={{ color: iconColor || 'var(--slate-600)', flexShrink: 0 }} />}
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.0625rem', fontWeight: 600,
          color: 'var(--slate-900)', margin: 0, lineHeight: 1.3
        }}>{title}</h2>
        {count !== undefined && (
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: iconColor || 'var(--body-secondary)', backgroundColor: 'var(--slate-100)',
            borderRadius: '9999px', padding: '1px 8px', marginLeft: '4px'
          }}>{count}</span>
        )}
      </button>
      {!collapsed && children}
    </div>
  );
}