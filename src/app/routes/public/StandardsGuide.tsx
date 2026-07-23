/**
 * /standards-guide — the Standards Guide landing page.
 *
 * M2 Phase 3 replaces the migration placeholder that stood here (its own
 * header comment described itself as "Commit 1… no hero, no search, no
 * sidebar, no ResourceSections"). This is B44's composition
 * (src/pages/StandardsGuide.jsx @ 6b1e9ac) over the ported landing
 * components: hero → quick filters → breadcrumb/info → sidebar + resource
 * sections → report CTA.
 *
 * Differences from B44, all at the port seam:
 *   - trackEvent('guide_search') is not wired (analytics is M5). The search
 *     debounce it hung off is gone with it; search still filters live.
 *   - Base44 flat page names resolve through b44PageToRoute.
 *   - The section search (ADAAssistant) and the AI helper land in Phase 4.
 */

import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import StandardsStyles from '../../components/standards/landing/StandardsStyles.jsx';
import StandardsHero from '../../components/standards/landing/StandardsHero.jsx';
import QuickFilters from '../../components/standards/landing/QuickFilters.jsx';
import BreadcrumbAndInfo from '../../components/standards/landing/BreadcrumbAndInfo.jsx';
import StandardsSidebar from '../../components/standards/landing/StandardsSidebar.jsx';
import ResourceSections from '../../components/standards/landing/ResourceSections.jsx';
import GuideReportCTA from '../../components/standards/GuideReportCTA.jsx';

/** QuickFilter key → ResourceSections section id (B44 FILTER_TO_SECTION). */
const FILTER_TO_SECTION: Record<string, string> = {
  rights: 'rights',
  business: 'business',
  website: 'web-access',
  design: 'design-standards',
  government: 'government',
};

export default function StandardsGuide() {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSidebarId, setActiveSidebarId] = useState<string | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearchValue(val);
  }, []);

  const handleToggleFilter = (key: string) => {
    // "Filing a Complaint" has no section — QuickFilters navigates instead.
    const sectionId = FILTER_TO_SECTION[key];
    if (!sectionId) return;
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [key]));
    setActiveSidebarId(sectionId);
    const el = document.getElementById(sectionId);
    // Honour reduced-motion: smooth scrolling is vestibular-trigger territory.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <>
      <Helmet>
        <title>ADA Standards Guide — ADA Legal Link</title>
        <meta
          name="description"
          content="The 2010 ADA Standards for Accessible Design, reorganized by topic with plain-language explanations and interactive diagrams. Free and fully accessible."
        />
      </Helmet>

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
