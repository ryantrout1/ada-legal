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

// Maps QuickFilter keys to ResourceSections section IDs
const FILTER_TO_SECTION = {
  rights: 'rights',
  business: 'business',
  website: 'web-access',
  design: 'design-standards',
  government: 'government'
};

export default function StandardsGuide() {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeSidebarId, setActiveSidebarId] = useState(null);
  const searchTimerRef = useRef(null);

  const handleSearchChange = useCallback((val) => {
    setSearchValue(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (val.trim()) {
      searchTimerRef.current = setTimeout(() => {
        trackEvent('guide_search', { query: val.trim() }, 'StandardsGuide');
      }, 1000);
    }
  }, []);

  const handleToggleFilter = (key) => {
    // "Filing a Complaint" has no section — handled inside QuickFilters via navigation
    const sectionId = FILTER_TO_SECTION[key];
    if (sectionId) {
      setActiveFilters(prev =>
        prev.includes(key) ? prev.filter(f => f !== key) : [key]
      );
      setActiveSidebarId(sectionId);
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <StandardsStyles />
      <StandardsHero searchValue={searchValue} onSearchChange={handleSearchChange} />
      <QuickFilters activeFilters={activeFilters} onToggle={handleToggleFilter} />
      <BreadcrumbAndInfo />
      <div style={{ background: 'var(--page-bg-subtle)' }}>
        <div className="sg-body-grid">
          <StandardsSidebar activeId={activeSidebarId} />
          <ResourceSections activeFilters={activeFilters} />
        </div>
      </div>
      <GuideReportCTA />
    </>
  );
}