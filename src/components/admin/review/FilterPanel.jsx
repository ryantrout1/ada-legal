import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

const AI_CATEGORIES = [
  'physical_entrance','physical_restroom','physical_parking','physical_path',
  'physical_service_animal','digital_screen_reader','digital_keyboard_nav',
  'digital_forms','digital_video_captions','other'
];

function PillGroup({ options, selected, onToggle, name }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }} role="group" aria-label={name}>
      {options.map(o => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            role="checkbox"
            aria-checked={active}
            onClick={() => onToggle(o.value)}
            style={{
              padding: '6px 14px', borderRadius: '100px', minHeight: '36px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              backgroundColor: active ? 'var(--slate-900)' : 'white',
              color: active ? 'white' : 'var(--slate-600)',
              borderColor: active ? 'var(--slate-900)' : 'var(--slate-300)',
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelect({ label, options, selected, onChange, id }) {
  const handleChange = (e) => {
    const vals = Array.from(e.target.selectedOptions, o => o.value);
    onChange(vals);
  };
  return (
    <div>
      <label htmlFor={id} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
        {label}
      </label>
      <select
        id={id}
        multiple
        value={selected}
        onChange={handleChange}
        style={{
          width: '100%', minHeight: '80px', padding: '6px', fontFamily: 'Manrope, sans-serif',
          fontSize: '0.8125rem', border: '1px solid var(--slate-300)', borderRadius: '8px',
          backgroundColor: 'white',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange, id }) {
  return (
    <label htmlFor={id} style={{
      display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-700)',
    }}>
      <input
        type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', accentColor: 'var(--slate-900)' }}
      />
      {label}
    </label>
  );
}

export const EMPTY_FILTERS = {
  status: 'all_pending',
  violationTypes: [],
  severities: [],
  completeness: [],
  states: [],
  categories: [],
  hasCluster: false,
  dateAfter: '',
  dateBefore: '',
  flaggedOnly: false,
};

export function countActiveFilters(f) {
  let n = 0;
  if (f.status !== 'all_pending') n++;
  if (f.violationTypes.length) n++;
  if (f.severities.length) n++;
  if (f.completeness.length) n++;
  if (f.states.length) n++;
  if (f.categories.length) n++;
  if (f.hasCluster) n++;
  if (f.dateAfter) n++;
  if (f.dateBefore) n++;
  if (f.flaggedOnly) n++;
  return n;
}

export default function FilterPanel({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const count = countActiveFilters(filters);

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const toggleInArray = (key, val) => {
    const arr = filters[key];
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', minHeight: '44px', fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            border: '1px solid var(--slate-300)', borderRadius: '10px',
            backgroundColor: open ? 'var(--slate-100)' : 'white',
            color: 'var(--slate-700)', transition: 'background-color 0.15s',
          }}
        >
          <SlidersHorizontal size={16} />
          Filters{count > 0 && ` (${count})`}
        </button>
        {count > 0 && (
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS })}
            style={{
              background: 'none', border: 'none', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.8125rem', color: 'var(--terra-600)', cursor: 'pointer',
              textDecoration: 'underline', padding: '4px 8px', minHeight: '44px',
            }}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {open && (
        <div style={{
          marginTop: '10px', padding: '20px', backgroundColor: 'white',
          border: '1px solid var(--slate-200)', borderRadius: '12px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px',
        }}>
          {/* Status */}
          <div>
            <label htmlFor="filter-status" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Status
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => set('status', e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', minHeight: '44px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                border: '1px solid var(--slate-300)', borderRadius: '8px',
              }}
            >
              <option value="all_pending">All Pending (Submitted + Under Review)</option>
              <option value="submitted">Submitted Only</option>
              <option value="under_review">Under Review Only</option>
            </select>
          </div>

          {/* Violation Type */}
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>Violation Type</p>
            <PillGroup
              name="Violation type filter"
              options={[
                { value: 'physical_space', label: 'Physical Space' },
                { value: 'digital_website', label: 'Digital Website' },
              ]}
              selected={filters.violationTypes}
              onToggle={(v) => toggleInArray('violationTypes', v)}
            />
          </div>

          {/* Severity */}
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>AI Severity</p>
            <PillGroup
              name="Severity filter"
              options={[
                { value: 'high', label: '🔴 High' },
                { value: 'medium', label: '🟡 Medium' },
                { value: 'low', label: '🟢 Low' },
              ]}
              selected={filters.severities}
              onToggle={(v) => toggleInArray('severities', v)}
            />
          </div>

          {/* Completeness */}
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>Completeness</p>
            <PillGroup
              name="Completeness filter"
              options={[
                { value: 'ready', label: 'Ready (80+)' },
                { value: 'partial', label: 'Partial (50–79)' },
                { value: 'incomplete', label: 'Incomplete (<50)' },
              ]}
              selected={filters.completeness}
              onToggle={(v) => toggleInArray('completeness', v)}
            />
          </div>

          {/* State */}
          <MultiSelect
            label="State"
            id="filter-states"
            options={US_STATES.map(s => ({ value: s, label: s }))}
            selected={filters.states}
            onChange={(v) => set('states', v)}
          />

          {/* Category */}
          <MultiSelect
            label="Violation Category"
            id="filter-categories"
            options={AI_CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g, ' ') }))}
            selected={filters.categories}
            onChange={(v) => set('categories', v)}
          />

          {/* Date range */}
          <div>
            <label htmlFor="filter-date-after" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Submitted After
            </label>
            <input
              type="date" id="filter-date-after" value={filters.dateAfter}
              onChange={(e) => set('dateAfter', e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', minHeight: '44px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                border: '1px solid var(--slate-300)', borderRadius: '8px', marginBottom: '8px',
              }}
            />
            <label htmlFor="filter-date-before" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Submitted Before
            </label>
            <input
              type="date" id="filter-date-before" value={filters.dateBefore}
              onChange={(e) => set('dateBefore', e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', minHeight: '44px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                border: '1px solid var(--slate-300)', borderRadius: '8px',
              }}
            />
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
            <Toggle label="Show only clustered cases" checked={filters.hasCluster} onChange={(v) => set('hasCluster', v)} id="filter-cluster" />
            <Toggle label="Show only flagged cases" checked={filters.flaggedOnly} onChange={(v) => set('flaggedOnly', v)} id="filter-flagged" />
          </div>
        </div>
      )}
    </div>
  );
}