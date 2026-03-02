import React from 'react';

const selectStyle = {
  minHeight: '40px', padding: '0.375rem 0.625rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
  color: 'var(--heading)', backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  outline: 'none', cursor: 'pointer', minWidth: '120px', width: '100%', maxWidth: '180px'
};

const labelStyle = {
  display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem',
  fontWeight: 700, color: 'var(--body)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: '3px'
};

const BUSINESS_TYPES = [
  'Restaurant', 'Retail Store', 'Hotel', 'Medical Office', 'Government',
  'Bank', 'Grocery Store', 'Gas Station', 'Entertainment', 'Education',
  'Website/App', 'Other'
];

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

export default function MarketplaceFilters({ filters, onChange, lawyerStates }) {
  const update = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', flex: '1 1 auto' }}>
      <div>
        <label htmlFor="filter-state" style={labelStyle}>State</label>
        <select id="filter-state" style={selectStyle} value={filters.state} onChange={e => update('state', e.target.value)}>
          <option value="my_states">My States ({lawyerStates.join(', ')})</option>
          <option value="all">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="filter-violation" style={labelStyle}>Violation</label>
        <select id="filter-violation" style={selectStyle} value={filters.violationType} onChange={e => update('violationType', e.target.value)}>
          <option value="all">All Types</option>
          <option value="physical_space">Physical Space</option>
          <option value="digital_website">Digital / Website</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-business" style={labelStyle}>Business</label>
        <select id="filter-business" style={selectStyle} value={filters.businessType} onChange={e => update('businessType', e.target.value)}>
          <option value="all">All</option>
          {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="filter-posted" style={labelStyle}>Posted</label>
        <select id="filter-posted" style={selectStyle} value={filters.posted || 'any'} onChange={e => update('posted', e.target.value)}>
          <option value="any">Any Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="older">Older than 30 Days</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-doc" style={labelStyle}>Documentation</label>
        <select id="filter-doc" style={selectStyle} value={filters.documentation || 'all'} onChange={e => update('documentation', e.target.value)}>
          <option value="all">All Cases</option>
          <option value="5">Well Documented (5+)</option>
          <option value="3">Moderate+ (3+)</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-sort" style={labelStyle}>Sort</label>
        <select id="filter-sort" style={selectStyle} value={filters.sort} onChange={e => update('sort', e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
}