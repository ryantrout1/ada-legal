import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import trackEvent from '../components/analytics/trackEvent';
import StandardsStyles from '../components/standards/StandardsStyles';
import StandardsHero from '../components/standards/StandardsHero';
import QuickFilters from '../components/standards/QuickFilters';
import BreadcrumbAndInfo from '../components/standards/BreadcrumbAndInfo';
import StandardsSidebar from '../components/standards/StandardsSidebar';
import ResourceSections from '../components/standards/ResourceSections';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function StandardsGuide() {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const searchTimerRef = useRef(null);

  const handleSearchChange = useCallback((val) => {
    setSearchValue(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (val.trim()) {
      searchTimerRef.current = setTimeout(() => {
        base44.analytics.track({ eventName: 'guide_search', properties: { query: val.trim() } });
        trackEvent('guide_search', { query: val.trim() }, 'StandardsGuide');
      }, 1000);
    }
  }, []);

  const handleToggleFilter = (key) => {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  return (
    <>
      <StandardsStyles />
      <StandardsHero searchValue={searchValue} onSearchChange={handleSearchChange} />
      <QuickFilters activeFilters={activeFilters} onToggle={handleToggleFilter} />
      <BreadcrumbAndInfo />
      <div style={{ background: 'var(--slate-50)' }}>
        <div className="sg-body-grid">
          <StandardsSidebar />
          <ResourceSections />
        </div>
      </div>
      <GuideReportCTA />
    </>
  );
}