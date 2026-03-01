import React from 'react';
import { pct } from './IntelShared';

export default function IntelKPIStrip({ data }) {
  const kpis = [
    { v: data.total, l: 'Reports', sub: '', bg: '#FFF', fg: 'var(--slate-900, #1A1A2E)', subFg: '#94A3B8' },
    { v: data.high, l: 'High Sev', sub: `${pct(data.high, data.total)}%`, bg: data.high > data.total * 0.4 ? '#FEE2E2' : '#FFF', fg: data.high > data.total * 0.4 ? '#B91C1C' : 'var(--slate-900, #1A1A2E)', subFg: '#DC2626' },
    { v: data.unclaimed, l: 'Unclaimed', sub: `${pct(data.unclaimed, data.total)}%`, bg: data.unclaimed > data.total * 0.5 ? '#FEE2E2' : '#FFF', fg: data.unclaimed > data.total * 0.5 ? '#B91C1C' : 'var(--slate-900, #1A1A2E)', subFg: '#DC2626' },
    { v: data.stale, l: 'Stale 72h+', sub: 'no interest', bg: data.stale > 3 ? '#FEE2E2' : data.stale > 0 ? '#FEF3C7' : '#FFF', fg: data.stale > 3 ? '#B91C1C' : data.stale > 0 ? '#92400E' : 'var(--slate-900, #1A1A2E)', subFg: data.stale > 0 ? '#B45309' : '#94A3B8' },
    { v: data.activeLawyers, l: 'Attorneys', sub: `${data.pendingLawyers} pending`, bg: data.activeLawyers < 5 ? '#FFF7ED' : '#FFF', fg: data.activeLawyers < 5 ? '#9A3412' : 'var(--slate-900, #1A1A2E)', subFg: data.activeLawyers < 5 ? '#C2410C' : '#94A3B8' },
    { v: `${pct(data.assigned, data.total)}%`, l: 'Match Rate', sub: `${data.assigned}/${data.total}`, bg: pct(data.assigned, data.total) < 20 ? '#FEE2E2' : '#FFF', fg: pct(data.assigned, data.total) < 20 ? '#B91C1C' : 'var(--slate-900, #1A1A2E)', subFg: '#DC2626' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: k.bg, border: `1px solid ${k.bg === '#FFF' ? '#E8E8EC' : k.bg}` }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', fontWeight: 800, color: k.fg, lineHeight: 1 }}>{k.v}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.l}</div>
          {k.sub && <div style={{ fontSize: '0.58rem', color: k.subFg, marginTop: 1, fontWeight: 600 }}>{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}
