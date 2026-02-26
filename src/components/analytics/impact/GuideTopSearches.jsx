import React, { useMemo } from 'react';

export default function GuideTopSearches({ events }) {
  const queries = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const q = (e.properties?.query || e.properties?.search_query || '').trim().toLowerCase();
      if (q) map[q] = (map[q] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [events]);

  if (queries.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-400)' }}>No search data yet</p>
      </div>
    );
  }

  const maxCount = queries[0][1];

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
      <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
        Top Search Queries
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {queries.map(([query, count], i) => (
          <div key={query} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-400)', width: '22px', textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </span>
            <div style={{ flex: 1, position: 'relative', height: '28px', backgroundColor: 'white', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${(count / maxCount) * 100}%`,
                backgroundColor: '#FED7AA', borderRadius: '6px 0 0 6px',
              }} />
              <span style={{
                position: 'relative', zIndex: 1, fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: 'var(--slate-700)', padding: '0 10px', lineHeight: '28px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
              }}>
                "{query}"
              </span>
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-600)', minWidth: '32px', textAlign: 'right', flexShrink: 0 }}>
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}