import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import GuideEngagementStats from './GuideEngagementStats';
import GuideTopSectionsChart from './GuideTopSectionsChart';
import GuideActivityChart from './GuideActivityChart';
import GuideTopSearches from './GuideTopSearches';

export default function GuideEngagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  useEffect(() => {
    async function load() {
      const all = await base44.entities.AnalyticsEvent.list('-created_date', 2000);
      setEvents(all);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (range === 'all') return events;
    const cutoff = new Date(Date.now() - parseInt(range) * 24 * 60 * 60 * 1000);
    return events.filter(e => new Date(e.created_date) >= cutoff);
  }, [events, range]);

  const guideViews = useMemo(() => filtered.filter(e => e.event_name === 'guide_section_viewed'), [filtered]);
  const guideSearches = useMemo(() => filtered.filter(e => e.event_name === 'guide_search'), [filtered]);
  const reportIntent = useMemo(() => filtered.filter(e => e.event_name === 'guide_to_report_conversion'), [filtered]);

  const uniqueSections = useMemo(() => {
    const s = new Set();
    guideViews.forEach(e => { const n = e.properties?.section_name; if (n) s.add(n); });
    return s.size;
  }, [guideViews]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
        <div className="a11y-spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
            How are people using the Standards Guide?
          </h3>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', margin: '2px 0 0' }}>Guide Engagement</p>
        </div>
        <select
          aria-label="Date range for guide engagement"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
            padding: '8px 12px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'white',
            color: 'var(--body)', cursor: 'pointer', minHeight: '38px',
          }}
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <GuideEngagementStats
        totalViews={guideViews.length}
        uniqueSections={uniqueSections}
        totalSearches={guideSearches.length}
        reportIntent={reportIntent.length}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <GuideTopSectionsChart events={guideViews} />
        <GuideActivityChart events={guideViews} days={parseInt(range) || 30} range={range} />
      </div>

      <div style={{ marginTop: '20px' }}>
        <GuideTopSearches events={guideSearches} />
      </div>
    </div>
  );
}