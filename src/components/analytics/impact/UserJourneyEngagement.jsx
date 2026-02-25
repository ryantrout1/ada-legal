import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import EngagementDateFilter from './EngagementDateFilter';
import ReporterFunnel from './ReporterFunnel';
import GuideEngagement from './GuideEngagement';
import CaseLifecycle from './CaseLifecycle';

export default function UserJourneyEngagement() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    async function load() {
      const events = await base44.entities.AnalyticsEvent.list('-timestamp', 5000);
      setAllEvents(events);
      setLoading(false);
    }
    load();
  }, []);

  const filteredEvents = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return allEvents;
    return allEvents.filter(e => {
      const ts = e.timestamp || e.created_date;
      if (!ts) return true;
      if (dateRange.from && ts < dateRange.from) return false;
      if (dateRange.to && ts > dateRange.to + 'T23:59:59') return false;
      return true;
    });
  }, [allEvents, dateRange]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <div className="a11y-spinner" aria-hidden="true" style={{ margin: '0 auto 8px' }} />
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-500)' }}>Loading engagement data…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Section header */}
      <div style={{
        backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px',
        padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: 0 }}>
            User Journey & Engagement
          </h3>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '2px 0 0' }}>
            {filteredEvents.length.toLocaleString()} events tracked
          </p>
        </div>
        <EngagementDateFilter dateRange={dateRange} onChange={setDateRange} />
      </div>

      <ReporterFunnel events={filteredEvents} />

      <GuideEngagement events={filteredEvents} />

      <CaseLifecycle events={filteredEvents} />
    </div>
  );
}