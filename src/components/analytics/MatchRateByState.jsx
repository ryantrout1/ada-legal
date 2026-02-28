import React from 'react';

const STATE_NAME_TO_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
  'Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY',
  'Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
  'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
  'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
};

function normalizeState(s) {
  if (!s) return '';
  const trimmed = s.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed] || trimmed;
}

export default function MatchRateByState({ cases, filters, onFilterChange }) {
  const activeState = filters.state;
  const matchedStatuses = ['assigned', 'in_progress', 'closed'];

  const stateMap = {};
  cases.forEach(c => {
    const st = normalizeState(c.state);
    if (!st) return;
    if (!stateMap[st]) stateMap[st] = { matched: 0, expired: 0, available: 0 };
    if (matchedStatuses.includes(c.status)) stateMap[st].matched++;
    else if (c.status === 'expired') stateMap[st].expired++;
    else if (c.status === 'available') stateMap[st].available++;
  });

  const data = Object.entries(stateMap)
    .map(([state, counts]) => ({ state, ...counts, total: counts.matched + counts.expired + counts.available }))
    .filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total);

  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map(d => d.total));

  const handleClick = (state) => {
    onFilterChange('state', state === activeState ? null : state);
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-md)', padding: '12px'
    }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
        color: 'var(--slate-800)', marginBottom: '0.5rem', marginTop: 0
      }}>Match Rate by State</p>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Matched', color: '#15803D' },
          { label: 'Expired', color: '#B91C1C' },
          { label: 'Available', color: '#64748B' }
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: l.color }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-600)' }}>{l.label}</span>
          </div>
        ))}
      </div>
      {data.map(d => {
        const isActive = d.state === activeState;
        const faded = activeState && !isActive;
        return (
          <div
            key={d.state}
            onClick={() => handleClick(d.state)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem',
              cursor: 'pointer', opacity: faded ? 0.45 : 1,
              borderLeft: isActive ? '3px solid var(--terra-600)' : '3px solid transparent',
              paddingLeft: '0.25rem', transition: 'opacity 0.15s'
            }}
          >
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-700)',
              minWidth: '30px', textAlign: 'right', flexShrink: 0
            }}>{d.state}</span>
            <div style={{ flex: 1, height: '14px', display: 'flex', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
              {d.matched > 0 && (
                <div style={{ width: `${(d.matched / maxTotal) * 100}%`, backgroundColor: '#15803D', height: '100%' }} />
              )}
              {d.expired > 0 && (
                <div style={{ width: `${(d.expired / maxTotal) * 100}%`, backgroundColor: '#B91C1C', height: '100%' }} />
              )}
              {d.available > 0 && (
                <div style={{ width: `${(d.available / maxTotal) * 100}%`, backgroundColor: '#CBD5E1', height: '100%' }} />
              )}
            </div>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--slate-800)', minWidth: '30px', flexShrink: 0
            }}>{d.total}</span>
          </div>
        );
      })}
    </div>
  );
}