import React, { useMemo } from 'react';

export default function GuideEngagement({ events }) {
  const { topSections, totalSearches, topQueries, conversionRate } = useMemo(() => {
    const sectionMap = {};
    let searches = 0;
    const queryMap = {};
    let sectionViews = 0;
    let conversions = 0;

    events.forEach(e => {
      if (e.event_name === 'guide_section_viewed') {
        sectionViews++;
        const name = e.properties?.section_name || 'Unknown';
        sectionMap[name] = (sectionMap[name] || 0) + 1;
      }
      if (e.event_name === 'guide_search') {
        searches++;
        const q = e.properties?.query || e.properties?.search_query || '';
        if (q.trim()) queryMap[q.trim().toLowerCase()] = (queryMap[q.trim().toLowerCase()] || 0) + 1;
      }
      if (e.event_name === 'guide_to_report_conversion') {
        conversions++;
      }
    });

    const topSections = Object.entries(sectionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topQueries = Object.entries(queryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const conversionRate = sectionViews > 0 ? ((conversions / sectionViews) * 100).toFixed(1) : '0.0';

    return { topSections, totalSearches: searches, topQueries, conversionRate };
  }, [events]);

  const maxSectionCount = topSections.length > 0 ? topSections[0][1] : 1;

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '20px' }}>
      <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 16px' }}>
        Guide Engagement
      </h4>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>{totalSearches}</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>Guide Searches</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--terra-600)' }}>{conversionRate}%</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>Guide → Report Rate</div>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {/* Top sections */}
        <div>
          <h5 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
            Top Viewed Sections
          </h5>
          {topSections.length === 0 && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-400)' }}>No data yet</p>
          )}
          {topSections.map(([name, count], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-400)', width: '18px', textAlign: 'right' }}>{i + 1}</span>
              <div style={{ flex: 1, position: 'relative', height: '24px', backgroundColor: 'var(--slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${(count / maxSectionCount) * 100}%`, backgroundColor: '#DBEAFE', borderRadius: '4px' }} />
                <span style={{ position: 'relative', zIndex: 1, fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-700)', padding: '0 8px', lineHeight: '24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                  {name}
                </span>
              </div>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-600)', minWidth: '28px', textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Top queries */}
        <div>
          <h5 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
            Top Search Queries
          </h5>
          {topQueries.length === 0 && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-400)' }}>No search data yet</p>
          )}
          {topQueries.map(([query, count], i) => (
            <div key={query} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-400)', width: '18px', textAlign: 'right' }}>{i + 1}</span>
              <span style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{query}"
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-600)', minWidth: '28px', textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}