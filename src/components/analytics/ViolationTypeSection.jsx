import React from 'react';

const PHYSICAL_SUBTYPES = ['Parking', 'Entrance/Exit', 'Restroom', 'Path of Travel', 'Service Animal Denial', 'Other'];
const ASSISTIVE_TECHS = ['Screen Reader', 'Voice Control', 'Screen Magnification', 'Keyboard-Only', 'Other'];
const BUSINESS_TYPES = ['Restaurant', 'Retail Store', 'Medical Office', 'Government Building', 'Hotel/Lodging', 'Entertainment Venue', 'Education', 'Transportation', 'Other', 'Website/App'];

const TERRA = '#C2410C';
const TERRA_ACTIVE = '#9A3412';
const INFO = '#1D4ED8';
const INFO_ACTIVE = '#1E3A8A';
const SLATE_BAR_BG = '#F1F5F9';

function matchSubtype(caseSubtype, label) {
  const v = (caseSubtype || 'Other').toLowerCase();
  const l = label.toLowerCase().split('/')[0];
  return v.includes(l);
}

function HorizontalBar({ label, count, total, color, active, faded, onClick }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const barColor = active ? (color === TERRA ? TERRA_ACTIVE : INFO_ACTIVE) : color;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem',
        cursor: onClick ? 'pointer' : 'default',
        opacity: faded ? 0.5 : 1,
        borderLeft: active ? `3px solid var(--terra-600)` : '3px solid transparent',
        paddingLeft: active ? '0.25rem' : '0.25rem',
        borderRadius: '2px',
        transition: 'opacity 0.15s, border-color 0.15s'
      }}
      onMouseEnter={e => { if (onClick && !active) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.opacity = faded ? '0.5' : '1'; }}
    >
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-700)',
        minWidth: '120px', textAlign: 'right', flexShrink: 0
      }}>{label}</span>
      <div style={{ flex: 1, height: '14px', backgroundColor: SLATE_BAR_BG, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.max(pct, 1.5)}%`, backgroundColor: barColor,
          borderRadius: '3px', transition: 'width 0.3s ease'
        }} />
      </div>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--slate-800)', minWidth: '60px', flexShrink: 0
      }}>
        {count} <span style={{ fontWeight: 400, color: 'var(--slate-500)' }}>({Math.round(pct)}%)</span>
      </span>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-md)', padding: '12px'
    }}>
      <h3 style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
        color: 'var(--slate-900)', margin: '0 0 0.15rem 0'
      }}>{title}</h3>
      {subtitle && (
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem',
          color: 'var(--slate-500)', margin: '0 0 0.5rem 0'
        }}>{subtitle}</p>
      )}
      {children}
    </div>
  );
}

export default function ViolationTypeSection({ cases, filters, onFilterChange }) {
  const activeViolationType = filters.violationType;
  const activeSubtype = filters.violationSubtype;
  const activeBusinessType = filters.businessType;

  const physical = cases.filter(c => c.violation_type === 'physical_space');
  const digital = cases.filter(c => c.violation_type === 'digital_website');
  const total = cases.length;

  const subtypeCounts = {};
  PHYSICAL_SUBTYPES.forEach(s => { subtypeCounts[s] = 0; });
  physical.forEach(c => {
    const v = c.violation_subtype || 'Other';
    const match = PHYSICAL_SUBTYPES.find(s => matchSubtype(v, s));
    subtypeCounts[match || 'Other'] = (subtypeCounts[match || 'Other'] || 0) + 1;
  });
  const sortedSubtypes = PHYSICAL_SUBTYPES.slice().sort((a, b) => subtypeCounts[b] - subtypeCounts[a]);

  const techCounts = {};
  ASSISTIVE_TECHS.forEach(t => { techCounts[t] = 0; });
  digital.forEach(c => {
    (c.assistive_tech || []).forEach(t => {
      const match = ASSISTIVE_TECHS.find(at => t.toLowerCase().includes(at.toLowerCase().split('-')[0]));
      techCounts[match || 'Other'] = (techCounts[match || 'Other'] || 0) + 1;
    });
  });
  const sortedTech = ASSISTIVE_TECHS.slice().sort((a, b) => techCounts[b] - techCounts[a]);

  const bizCounts = {};
  BUSINESS_TYPES.forEach(b => { bizCounts[b] = 0; });
  cases.forEach(c => {
    const bt = c.business_type || 'Other';
    const match = BUSINESS_TYPES.find(b => bt.toLowerCase() === b.toLowerCase());
    bizCounts[match || 'Other'] = (bizCounts[match || 'Other'] || 0) + 1;
  });
  const sortedBiz = BUSINESS_TYPES.slice().sort((a, b) => bizCounts[b] - bizCounts[a]).filter(b => bizCounts[b] > 0);

  const pctPhysical = total > 0 ? Math.round((physical.length / total) * 100) : 0;
  const pctDigital = total > 0 ? Math.round((digital.length / total) * 100) : 0;

  const handleViolationTypeClick = (type) => {
    onFilterChange('violationType', type === activeViolationType ? null : type);
  };

  const handleSubtypeClick = (subtype) => {
    onFilterChange('violationSubtype', subtype === activeSubtype ? null : subtype);
  };

  const handleBusinessTypeClick = (biz) => {
    onFilterChange('businessType', biz === activeBusinessType ? null : biz);
  };

  const physicalActive = activeViolationType === 'physical_space';
  const digitalActive = activeViolationType === 'digital_website';
  const hasVTypeFilter = activeViolationType !== null;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionCard title="Overall Split">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              onClick={() => handleViolationTypeClick('physical_space')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.875rem', backgroundColor: '#FEF1EC', borderRadius: '6px', flex: '1 1 180px',
                cursor: 'pointer',
                opacity: hasVTypeFilter && !physicalActive ? 0.5 : 1,
                borderLeft: physicalActive ? '3px solid var(--terra-600)' : '3px solid transparent',
                transition: 'opacity 0.15s'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: TERRA, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)' }}>Physical Space</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: TERRA, marginLeft: 'auto' }}>
                {physical.length}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>({pctPhysical}%)</span>
            </div>
            <div
              onClick={() => handleViolationTypeClick('digital_website')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.875rem', backgroundColor: '#EFF6FF', borderRadius: '6px', flex: '1 1 180px',
                cursor: 'pointer',
                opacity: hasVTypeFilter && !digitalActive ? 0.5 : 1,
                borderLeft: digitalActive ? '3px solid var(--terra-600)' : '3px solid transparent',
                transition: 'opacity 0.15s'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: INFO, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)' }}>Digital / Website</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: INFO, marginLeft: 'auto' }}>
                {digital.length}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>({pctDigital}%)</span>
            </div>
          </div>
        </SectionCard>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <SectionCard title="Physical Space Subcategories" subtitle={`${physical.length} cases`}>
            {sortedSubtypes.map(s => (
              <HorizontalBar
                key={s} label={s} count={subtypeCounts[s]} total={physical.length} color={TERRA}
                active={activeSubtype === s}
                faded={activeSubtype !== null && activeSubtype !== s}
                onClick={() => handleSubtypeClick(s)}
              />
            ))}
          </SectionCard>
          <SectionCard title="Assistive Technologies Affected" subtitle={`${digital.length} cases — may exceed 100%`}>
            {sortedTech.map(t => (
              <HorizontalBar key={t} label={t} count={techCounts[t]} total={digital.length} color={INFO} />
            ))}
          </SectionCard>
        </div>

        <SectionCard title="Business Type Distribution" subtitle={`${total} total cases`}>
          {sortedBiz.map(b => (
            <HorizontalBar
              key={b} label={b} count={bizCounts[b]} total={total} color="var(--slate-700)"
              active={activeBusinessType === b}
              faded={activeBusinessType !== null && activeBusinessType !== b}
              onClick={() => handleBusinessTypeClick(b)}
            />
          ))}
        </SectionCard>
      </div>
    </div>
  );
}