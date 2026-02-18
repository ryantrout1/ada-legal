import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import PipelineMarketplaceSection from '../components/analytics/PipelineMarketplaceSection';
import GeographicSection from '../components/analytics/GeographicSection';
import LawyerActivitySection from '../components/analytics/LawyerActivitySection';
import ViolationTypeSection from '../components/analytics/ViolationTypeSection';
import ActiveFiltersBar from '../components/analytics/ActiveFiltersBar';
import CaseOutcomesSection from '../components/analytics/CaseOutcomesSection';
import DemandIntelligenceSection from '../components/analytics/DemandIntelligenceSection';
import ExportAnalytics from '../components/analytics/ExportAnalytics';
import CollapsibleSection from '../components/analytics/CollapsibleSection';

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

const PHYSICAL_SUBTYPES_MAP = {
  'Parking': 'parking',
  'Entrance/Exit': 'entrance',
  'Restroom': 'restroom',
  'Path of Travel': 'path',
  'Service Animal Denial': 'service animal',
  'Other': 'other'
};

function matchSubtype(caseSubtype, filterLabel) {
  const v = (caseSubtype || 'other').toLowerCase();
  const keyword = PHYSICAL_SUBTYPES_MAP[filterLabel] || filterLabel.toLowerCase();
  return v.includes(keyword);
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);
  const [filters, setFilters] = useState({
    state: null, city: null, violationType: null,
    violationSubtype: null, businessType: null,
    resolutionType: null, caseValue: null
  });

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        if (user?.role === 'lawyer') {
          window.location.href = createPageUrl('LawyerDashboard');
        } else {
          window.location.href = createPageUrl('Home');
        }
        return;
      }
      const [allCases, allLawyers, allLogs] = await Promise.all([
        base44.entities.Case.list('-created_date', 1000),
        base44.entities.LawyerProfile.list('-created_date', 500),
        base44.entities.ContactLog.list('-created_date', 1000)
      ]);
      setCases(allCases);
      setLawyers(allLawyers);
      setContactLogs(allLogs);
      setLoading(false);
    }
    init();
  }, []);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleRemoveFilter = (key) => setFilters(prev => ({ ...prev, [key]: null }));
  const handleClearAll = () => setFilters({ state: null, city: null, violationType: null, violationSubtype: null, businessType: null, resolutionType: null, caseValue: null });

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (filters.state && normalizeState(c.state) !== filters.state) return false;
      if (filters.city && (c.city || '').trim() !== filters.city) return false;
      if (filters.violationType && c.violation_type !== filters.violationType) return false;
      if (filters.violationSubtype && !matchSubtype(c.violation_subtype, filters.violationSubtype)) return false;
      if (filters.businessType) {
        const bt = (c.business_type || 'Other').toLowerCase();
        if (bt !== filters.businessType.toLowerCase()) return false;
      }
      if (filters.resolutionType && c.resolution_type !== filters.resolutionType) return false;
      if (filters.caseValue && c.estimated_case_value !== filters.caseValue) return false;
      return true;
    });
  }, [cases, filters]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading analytics" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
        <h1 className="sr-only">Analytics</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading analytics…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: '1.25rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>Analytics</h1>
          <ExportAnalytics cases={filteredCases} lawyers={lawyers} contactLogs={contactLogs} filters={filters} />
        </div>

        <ActiveFiltersBar filters={filters} onRemove={handleRemoveFilter} onClearAll={handleClearAll} />

        <CollapsibleSection id="pipeline" title="Pipeline & Marketplace">
          <PipelineMarketplaceSection cases={filteredCases} contactLogs={contactLogs} />
        </CollapsibleSection>

        <CollapsibleSection id="outcomes" title="Case Outcomes">
          <CaseOutcomesSection cases={filteredCases} filters={filters} onFilterChange={handleFilterChange} />
        </CollapsibleSection>

        <CollapsibleSection id="demand" title="Demand Intelligence">
          <DemandIntelligenceSection cases={filteredCases} lawyers={lawyers} contactLogs={contactLogs} filters={filters} onFilterChange={handleFilterChange} />
        </CollapsibleSection>

        <CollapsibleSection id="geographic" title="Geographic Distribution">
          <GeographicSection cases={filteredCases} filters={filters} onFilterChange={handleFilterChange} />
        </CollapsibleSection>

        <CollapsibleSection id="violation" title="Violation Type Breakdown">
          <ViolationTypeSection cases={filteredCases} filters={filters} onFilterChange={handleFilterChange} />
        </CollapsibleSection>

        <CollapsibleSection id="lawyer" title="Lawyer Activity">
          <LawyerActivitySection lawyers={lawyers} cases={filteredCases} contactLogs={contactLogs} />
        </CollapsibleSection>
      </div>
    </div>
  );
}