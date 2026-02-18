import React from 'react';

const PHYSICAL_SUBTYPES = ['Parking', 'Entrance/Exit', 'Restroom', 'Path of Travel', 'Service Animal Denial', 'Other'];
const ASSISTIVE_TECHS = ['Screen Reader', 'Voice Control', 'Screen Magnification', 'Keyboard-Only', 'Other'];
const BUSINESS_TYPES = ['Restaurant', 'Retail Store', 'Medical Office', 'Government Building', 'Hotel/Lodging', 'Entertainment Venue', 'Education', 'Transportation', 'Other'];

const TERRA = '#C2410C';
const INFO = '#1D4ED8';
const SLATE_BAR_BG = '#F1F5F9';

function HorizontalBar({ label, count, total, color, note }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
        minWidth: '140px', textAlign: 'right', flexShrink: 0
      }}>{label}</span>
      <div style={{ flex: 1, height: '22px', backgroundColor: SLATE_BAR_BG, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${Math.max(pct, 1.5)}%`, backgroundColor: color,
          borderRadius: '4px', transition: 'width 0.3s ease'
        }} />
      </div>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
        color: 'var(--slate-800)', minWidth: '70px', flexShrink: 0
      }}>
        {count} <span style={{ fontWeight: 400, color: 'var(--slate-500)' }}>({Math.round(pct)}%{note || ''})</span>
      </span>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '12px', padding: '1.25rem 1.5rem'
    }}>
      <h3 style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
        color: 'var(--slate-900)', margin: '0 0 0.25rem 0'
      }}>{title}</h3>
      {subtitle && (
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-500)', margin: '0 0 1rem 0'
        }}>{subtitle}</p>
      )}
      {children}
    </div>
  );
}

export default function ViolationTypeSection({ cases }) {
  const physical = cases.filter(c => c.violation_type === 'physical_space');
  const digital = cases.filter(c => c.violation_type === 'digital_website');
  const total = cases.length;

  // Physical subtypes
  const subtypeCounts = {};
  PHYSICAL_SUBTYPES.forEach(s => { subtypeCounts[s] = 0; });
  physical.forEach(c => {
    const v = c.violation_subtype || 'Other';
    const match = PHYSICAL_SUBTYPES.find(s => v.toLowerCase().includes(s.toLowerCase().split('/')[0]));
    subtypeCounts[match || 'Other'] = (subtypeCounts[match || 'Other'] || 0) + 1;
  });
  const sortedSubtypes = PHYSICAL_SUBTYPES.slice().sort((a, b) => subtypeCounts[b] - subtypeCounts[a]);

  // Assistive tech counts (multi-select)
  const techCounts = {};
  ASSISTIVE_TECHS.forEach(t => { techCounts[t] = 0; });
  digital.forEach(c => {
    (c.assistive_tech || []).forEach(t => {
      const match = ASSISTIVE_TECHS.find(at => t.toLowerCase().includes(at.toLowerCase().split('-')[0]));
      techCounts[match || 'Other'] = (techCounts[match || 'Other'] || 0) + 1;
    });
  });
  const sortedTech = ASSISTIVE_TECHS.slice().sort((a, b) => techCounts[b] - techCounts[a]);

  // Business type distribution
  const bizCounts = {};
  BUSINESS_TYPES.forEach(b => { bizCounts[b] = 0; });
  cases.forEach(c => {
    const bt = c.business_type || 'Other';
    const match = BUSINESS_TYPES.find(b => bt.toLowerCase() === b.toLowerCase());
    bizCounts[match || 'Other'] = (bizCounts[match || 'Other'] || 0) + 1;
  });
  const sortedBiz = BUSINESS_TYPES.slice().sort((a, b) => bizCounts[b] - bizCounts[a]);

  const pctPhysical = total > 0 ? Math.round((physical.length / total) * 100) : 0;
  const pctDigital = total > 0 ? Math.round((digital.length / total) * 100) : 0;

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
        color: 'var(--slate-900)', marginBottom: 'var(--space-md)', marginTop: 0
      }}>Violation Type Breakdown</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

        {/* Row 1 — Overall Split */}
        <SectionCard title="Overall Split">
          <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1.25rem', backgroundColor: '#FEF1EC', borderRadius: '8px', flex: '1 1 200px'
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: TERRA, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)' }}>Physical Space</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: TERRA, marginLeft: 'auto' }}>
                {physical.length}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>({pctPhysical}%)</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1.25rem', backgroundColor: '#EFF6FF', borderRadius: '8px', flex: '1 1 200px'
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: INFO, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)' }}>Digital / Website</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: INFO, marginLeft: 'auto' }}>
                {digital.length}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>({pctDigital}%)</span>
            </div>
          </div>
        </SectionCard>

        {/* Row 2 — Physical Space Subcategories */}
        <SectionCard title="Physical Space — Violation Subcategories" subtitle={`${physical.length} physical space cases`}>
          {sortedSubtypes.map(s => (
            <HorizontalBar key={s} label={s} count={subtypeCounts[s]} total={physical.length} color={TERRA} />
          ))}
        </SectionCard>

        {/* Row 3 — Digital/Website Subcategories */}
        <SectionCard title="Assistive Technologies Affected" subtitle={`${digital.length} digital/website cases — percentages may exceed 100% (multi-select)`}>
          {sortedTech.map(t => (
            <HorizontalBar key={t} label={t} count={techCounts[t]} total={digital.length} color={INFO} />
          ))}
        </SectionCard>

        {/* Row 4 — Business Type Distribution */}
        <SectionCard title="Business Type Distribution" subtitle={`${total} total cases`}>
          {sortedBiz.map(b => (
            <HorizontalBar key={b} label={b} count={bizCounts[b]} total={total} color="var(--slate-700)" />
          ))}
        </SectionCard>
      </div>
    </div>
  );
}