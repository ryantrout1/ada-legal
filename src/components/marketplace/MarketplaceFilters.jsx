import React from 'react';

const selectStyle = {
  minHeight: '40px', padding: '0.5rem 0.75rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
  color: 'var(--slate-800)', backgroundColor: 'var(--surface)',
  border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
  outline: 'none', cursor: 'pointer', minWidth: '140px'
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
    <div style={{
      display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap',
      alignItems: 'flex-end', marginBottom: 0
    }}>
      <div>
        <label htmlFor="filter-state" style={{
          display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
          fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase',
          letterSpacing: '0.05em', marginBottom: '4px'
        }}>State</label>
        <select id="filter-state" style={{ ...selectStyle, minHeight: '44px' }} value={filters.state} onChange={e => update('state', e.target.value)}>
          <option value="my_states">My States ({lawyerStates.join(', ')})</option>
          <option value="all">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="filter-violation" style={{
          display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
          fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase',
          letterSpacing: '0.05em', marginBottom: '4px'
        }}>Violation Type</label>
        <select id="filter-violation" style={{ ...selectStyle, minHeight: '44px' }} value={filters.violationType} onChange={e => update('violationType', e.target.value)}>
          <option value="all">All Types</option>
          <option value="physical_space">Physical Space</option>
          <option value="digital_website">Digital / Website</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-business" style={{
          display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
          fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase',
          letterSpacing: '0.05em', marginBottom: '4px'
        }}>Business Type</label>
        <select id="filter-business" style={{ ...selectStyle, minHeight: '44px' }} value={filters.businessType} onChange={e => update('businessType', e.target.value)}>
          <option value="all">All</option>
          {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="filter-sort" style={{
          display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
          fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase',
          letterSpacing: '0.05em', marginBottom: '4px'
        }}>Sort</label>
        <select id="filter-sort" style={{ ...selectStyle, minHeight: '44px' }} value={filters.sort} onChange={e => update('sort', e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
}