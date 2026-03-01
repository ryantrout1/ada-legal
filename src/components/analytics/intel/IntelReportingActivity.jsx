import React from 'react';
import { S, Panel, PanelHead } from './IntelShared';

export default function IntelReportingActivity({ data }) {
  const { trend } = data;
  const max14 = Math.max(...trend.days14.map(x => x.n), 1);

  return (
    <Panel>
      <PanelHead title="Reporting Activity" right={trend.weekDelta !== 0 ? `${trend.weekDelta > 0 ? '+' : ''}${trend.weekDelta}% vs prior 7d` : ''} />

      {/* Pulse strip */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { l: 'Today', v: trend.todayN, accent: trend.todayN > 0 },
          { l: 'Last 7 days', v: trend.week7, accent: trend.week7 > 5 },
          { l: 'Last 30 days', v: trend.month30, accent: false },
        ].map(p => (
          <div key={p.l} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: p.accent ? '#FFF7ED' : '#F8F8FA', border: '1px solid ' + (p.accent ? '#FED7AA' : '#E8E8EC'), textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 800, color: p.accent ? '#C2410C' : 'var(--slate-900, #1A1A2E)', lineHeight: 1 }}>{p.v}</div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: p.accent ? '#C2410C' : '#94A3B8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.l}</div>
          </div>
        ))}
      </div>

      {/* 14-day bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 72 }}>
        {trend.days14.map((d, i) => {
          const h = Math.max(d.n / max14 * 100, 0);
          const isToday = i === trend.days14.length - 1;
          const isWeekStart = d.dow === 'Mon';
          const hasReports = d.n > 0;
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, borderLeft: isWeekStart && i > 0 ? '1px dashed #E2E8F0' : 'none', paddingLeft: isWeekStart && i > 0 ? 1 : 0 }}>
              {hasReports && <span style={{ fontSize: '0.5rem', fontWeight: 700, color: isToday ? '#C2410C' : '#64748B' }}>{d.n}</span>}
              <div style={{ width: '100%', maxWidth: 28, height: h > 0 ? `${h}%` : '2px', background: isToday ? '#C2410C' : hasReports ? '#D4A574' : '#F1F1F5', borderRadius: '3px 3px 0 0', minHeight: hasReports ? 4 : 2, position: 'relative' }}>
                {d.dig > 0 && d.phys > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${d.dig / d.n * 100}%`, background: isToday ? '#2563EB' : '#7CA5D4', minHeight: 2 }} />
                )}
                {d.dig > 0 && d.phys === 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: isToday ? '#2563EB' : '#7CA5D4', borderRadius: '3px 3px 0 0' }} />
                )}
              </div>
              <span style={{ fontSize: '0.42rem', color: isToday ? '#C2410C' : d.dow === 'Sat' || d.dow === 'Sun' ? '#CBD5E1' : '#94A3B8', fontWeight: isToday ? 700 : 400 }}>{isToday ? 'Today' : d.day}</span>
            </div>
          );
        })}
      </div>

      {/* Velocity + Streak */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, borderTop: '1px solid #F1F1F5', paddingTop: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--slate-900, #1A1A2E)' }}>{trend.velocity}</span>
          <span style={{ color: '#94A3B8' }}>reports/day avg</span>
        </div>
        {trend.streak > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem' }}>
            <span style={{ fontWeight: 800, color: '#C2410C' }}>{trend.streak}</span>
            <span style={{ color: '#94A3B8' }}>day streak</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem' }}>
          <span style={{ fontWeight: 800, color: trend.weekDelta > 0 ? '#15803D' : trend.weekDelta < 0 ? '#DC2626' : '#94A3B8' }}>{trend.week7}</span>
          <span style={{ color: '#94A3B8' }}>this week vs</span>
          <span style={{ fontWeight: 600, color: '#94A3B8' }}>{trend.prior7}</span>
          <span style={{ color: '#94A3B8' }}>prior</span>
          {trend.weekDelta !== 0 && (
            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: trend.weekDelta > 0 ? '#15803D' : '#DC2626', background: trend.weekDelta > 0 ? '#DCFCE7' : '#FEE2E2', padding: '0 4px', borderRadius: 3 }}>
              {trend.weekDelta > 0 ? '+' : ''}{trend.weekDelta}%
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', fontSize: '0.55rem', color: '#94A3B8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#D4A574', flexShrink: 0 }} /> Physical</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 1, background: '#7CA5D4', flexShrink: 0 }} /> Digital</span>
        </div>
      </div>
    </Panel>
  );
}
