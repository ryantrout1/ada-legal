import React from 'react';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active Pipeline' },
  { key: 'marketplace', label: 'Available Cases' },
  { key: 'with_lawyers', label: 'With Lawyers' },
  { key: 'resolved', label: 'Resolved' },
];

const ACTIVE_STATUSES = ['submitted', 'under_review', 'available', 'assigned', 'in_progress'];
const MARKETPLACE_STATUSES = ['available'];
const LAWYER_STATUSES = ['assigned', 'in_progress'];
const RESOLVED_STATUSES = ['closed', 'rejected'];

export function getTabCounts(cases) {
  const counts = {};
  counts.all = cases.length;
  counts.active = cases.filter(c => ACTIVE_STATUSES.includes(c.status)).length;
  counts.marketplace = cases.filter(c => MARKETPLACE_STATUSES.includes(c.status)).length;
  counts.with_lawyers = cases.filter(c => LAWYER_STATUSES.includes(c.status)).length;
  counts.resolved = cases.filter(c => RESOLVED_STATUSES.includes(c.status)).length;
  return counts;
}

export function filterByTab(cases, tab) {
  if (tab === 'active') return cases.filter(c => ACTIVE_STATUSES.includes(c.status));
  if (tab === 'marketplace') return cases.filter(c => MARKETPLACE_STATUSES.includes(c.status));
  if (tab === 'with_lawyers') return cases.filter(c => LAWYER_STATUSES.includes(c.status));
  if (tab === 'resolved') return cases.filter(c => RESOLVED_STATUSES.includes(c.status));
  return cases;
}

export default function CaseManagerTabs({ activeTab, onChange, counts }) {
  return (
    <div role="tablist" aria-label="Case list tabs" className="cm-tablist" style={{
      display: 'flex', gap: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      borderBottom: '2px solid var(--slate-200)',
    }}>
      {TABS.map(tab => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            style={{
              minHeight: '44px',
              padding: '10px 18px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--terra-700, #9A3412)' : 'var(--slate-500)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: active ? '3px solid var(--terra-600, #C2410C)' : '3px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-2px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label} ({counts[tab.key] ?? 0})
          </button>
        );
      })}
    </div>
  );
}