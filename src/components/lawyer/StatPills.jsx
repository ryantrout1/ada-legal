import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function StatPills({ needsAction, inProgress, completed, onScrollTo }) {
  const pills = [
    { id: 'needs-action', label: 'Needs Action', count: needsAction, bg: '#FEE2E2', color: '#B91C1C', Icon: AlertTriangle, pulse: needsAction > 0 },
    { id: 'in-progress', label: 'In Progress', count: inProgress, bg: '#DCFCE7', color: '#15803D', Icon: Clock, pulse: false },
    { id: 'completed', label: 'Completed', count: completed, bg: 'var(--slate-100)', color: 'var(--slate-600)', Icon: CheckCircle, pulse: false },
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {pills.map(p => (
        <button key={p.id} type="button" onClick={() => onScrollTo(p.id)} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          height: '40px', padding: '0 16px', borderRadius: '10px',
          backgroundColor: p.bg, border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
          color: p.color, transition: 'transform 0.1s, box-shadow 0.1s'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <p.Icon size={15} />
          <span>{p.label}:</span>
          <span style={{
            animation: p.pulse ? (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'statPulse 2s ease-in-out infinite') : 'none',
            fontWeight: 800
          }}>{p.count}</span>
        </button>
      ))}
      <style>{`@keyframes statPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }`}</style>
    </div>
  );
}