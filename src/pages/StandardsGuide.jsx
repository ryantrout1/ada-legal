import React, { useState } from 'react';
import StandardsStyles from '../components/standards/StandardsStyles';
import StandardsHero from '../components/standards/StandardsHero';
import QuickFilters from '../components/standards/QuickFilters';
import BreadcrumbAndInfo from '../components/standards/BreadcrumbAndInfo';

export default function StandardsGuide() {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);

  const handleToggleFilter = (key) => {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  return (
    <>
      <StandardsStyles />
      <StandardsHero searchValue={searchValue} onSearchChange={setSearchValue} />
      <QuickFilters activeFilters={activeFilters} onToggle={handleToggleFilter} />
      <BreadcrumbAndInfo />
    </>
  );
}