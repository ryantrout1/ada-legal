import React from 'react';
import DemandStatCards from './DemandStatCards';
import MatchRateByState from './MatchRateByState';
import MatchRateByViolation from './MatchRateByViolation';
import EngagementFunnel from './EngagementFunnel';
import UnderservedAreas from './UnderservedAreas';

export default function DemandIntelligenceSection({ cases, lawyers, contactLogs, filters, onFilterChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Row 1: Stat cards */}
      <DemandStatCards cases={cases} lawyers={lawyers} />
      {/* Row 2: Match Rate charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <MatchRateByState cases={cases} filters={filters} onFilterChange={onFilterChange} />
        <MatchRateByViolation cases={cases} filters={filters} onFilterChange={onFilterChange} />
      </div>
      {/* Row 3: Funnel + Underserved side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <EngagementFunnel cases={cases} contactLogs={contactLogs} />
        <UnderservedAreas cases={cases} lawyers={lawyers} />
      </div>
    </div>
  );
}