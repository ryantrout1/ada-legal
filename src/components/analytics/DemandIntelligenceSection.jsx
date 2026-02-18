import React from 'react';
import DemandStatCards from './DemandStatCards';
import MatchRateByState from './MatchRateByState';
import MatchRateByViolation from './MatchRateByViolation';
import EngagementFunnel from './EngagementFunnel';
import UnderservedAreas from './UnderservedAreas';

export default function DemandIntelligenceSection({ cases, lawyers, contactLogs, filters, onFilterChange }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
        color: 'var(--slate-900)', marginBottom: '0.5rem', marginTop: 0
      }}>Demand Intelligence</h2>
      <DemandStatCards cases={cases} lawyers={lawyers} />
      <MatchRateByState cases={cases} filters={filters} onFilterChange={onFilterChange} />
      <MatchRateByViolation cases={cases} filters={filters} onFilterChange={onFilterChange} />
      <EngagementFunnel cases={cases} contactLogs={contactLogs} />
      <UnderservedAreas cases={cases} lawyers={lawyers} />
    </div>
  );
}