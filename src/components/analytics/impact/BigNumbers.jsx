import React, { useMemo } from 'react';

export default function BigNumbers({ cases }) {
  const stats = useMemo(() => {
    const total = cases.length;

    // Unique businesses by cluster_id
    const clusterIds = new Set();
    cases.forEach(c => { if (c.ai_duplicate_cluster_id) clusterIds.add(c.ai_duplicate_cluster_id); });
    // Also count cases without cluster as individual businesses
    const noClusters = cases.filter(c => !c.ai_duplicate_cluster_id).length;
    const businesses = clusterIds.size + noClusters;

    // Distinct city+state combos
    const communities = new Set();
    const statesSet = new Set();
    cases.forEach(c => {
      const city = (c.city || '').trim().toLowerCase();
      const state = (c.state || '').trim().toUpperCase();
      if (city || state) communities.add(`${city}|${state}`);
      if (state) statesSet.add(state);
    });

    // Cases connected to attorneys
    const connected = cases.filter(c => ['assigned', 'in_progress', 'closed'].includes(c.status)).length;
    const approved = cases.filter(c => ['available', 'expired', 'assigned', 'in_progress', 'closed'].includes(c.status)).length;
    const matchPct = approved > 0 ? Math.round((connected / approved) * 100) : 0;

    // Launch date (earliest case)
    let launchDate = 'launch';
    if (cases.length > 0) {
      const earliest = cases.reduce((min, c) => {
        const d = new Date(c.submitted_at || c.created_date);
        return d < min ? d : min;
      }, new Date());
      launchDate = earliest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    return { total, businesses, communities: communities.size, statesCount: statesSet.size, connected, matchPct, launchDate };
  }, [cases]);

  const cards = [
    { number: stats.total.toLocaleString(), label: 'Total Violations Reported', sub: `Since ${stats.launchDate}` },
    { number: stats.businesses.toLocaleString(), label: 'Businesses Identified', sub: 'Unique businesses with reported violations' },
    { number: stats.communities.toLocaleString(), label: 'Communities Represented', sub: `Cities and towns across ${stats.statesCount} states` },
    { number: stats.connected.toLocaleString(), label: 'Cases Connected to Attorneys', sub: `${stats.matchPct}% of approved cases matched` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      {cards.map(c => (
        <div key={c.label} style={{
          backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '24px 20px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: 'var(--heading)', lineHeight: 1.1 }}>
            {c.number}
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--section-label)', marginTop: '8px' }}>
            {c.label}
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', marginTop: '4px' }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}