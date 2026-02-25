import React, { useState } from 'react';
import { SlidersHorizontal, Calendar } from 'lucide-react';
import StatusSegmentedControl from './filters/StatusSegmentedControl';
import SeverityPills from './filters/SeverityPills';
import CompletenessPills from './filters/CompletenessPills';
import ViolationTypePills from './filters/ViolationTypePills';
import SearchableDropdown from './filters/SearchableDropdown';
import ToggleSwitch from './filters/ToggleSwitch';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'DC',FL:'Florida',GA:'Georgia',HI:'Hawaii',
  ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',
  MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',
  NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',
  NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',
  PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};

const CATEGORY_OPTIONS = [
  { value: 'physical_entrance', label: 'Entrance' },
  { value: 'physical_restroom', label: 'Restroom' },
  { value: 'physical_parking', label: 'Parking' },
  { value: 'physical_path', label: 'Path of Travel' },
  { value: 'physical_service_animal', label: 'Service Animal' },
  { value: 'physical_other', label: 'Physical — Other' },
  { value: 'digital_screen_reader', label: 'Screen Reader' },
  { value: 'digital_keyboard_nav', label: 'Keyboard Nav' },
  { value: 'digital_voice_control', label: 'Voice Control' },
  { value: 'digital_magnification', label: 'Magnification' },
  { value: 'digital_other', label: 'Digital — Other' },
  { value: 'other', label: 'Other' },
];

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

  const stateOptions = US_STATES.map(s => ({ value: s, label: `${s} — ${STATE_NAMES[s] || s}` }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Status Segmented Control — always visible */}
      <StatusSegmentedControl
        value={filters.status}
        onChange={(v) => set('status', v)}
      />

      {/* Toggle button */}
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
          Advanced Filters{count > 0 && ` (${count})`}
        </button>
      </div>

      {/* Filter Panel */}
      {open && (
        <div
          role="region"
          aria-label="Case filters"
          className="filter-panel-container"
          style={{
            padding: '24px',
            backgroundColor: 'var(--slate-50, #FAF7F2)',
            border: '1px solid var(--slate-200)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Row 1 — Primary filters */}
          <div className="filter-row-1" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <SeverityPills
                selected={filters.severities}
                onToggle={(v) => toggleInArray('severities', v)}
              />
            </div>
            <div style={{ flex: '1 1 260px' }}>
              <CompletenessPills
                selected={filters.completeness}
                onToggle={(v) => toggleInArray('completeness', v)}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <ViolationTypePills
                selected={filters.violationTypes}
                onToggle={(v) => toggleInArray('violationTypes', v)}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'var(--slate-200)' }} />

          {/* Row 2 — Secondary filters */}
          <div className="filter-row-2" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* State dropdown */}
            <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
              <SearchableDropdown
                label="State"
                id="filter-states"
                options={stateOptions}
                selected={filters.states}
                onChange={(v) => set('states', v)}
                placeholder="All States"
              />
            </div>

            {/* Category dropdown */}
            <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
              <SearchableDropdown
                label="Violation Category"
                id="filter-categories"
                options={CATEGORY_OPTIONS}
                selected={filters.categories}
                onChange={(v) => set('categories', v)}
                placeholder="All Categories"
              />
            </div>

            {/* Date range */}
            <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
                Date Range
              </p>
              <div className="filter-date-row" style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    id="filter-date-after"
                    aria-label="Start date"
                    value={filters.dateAfter}
                    onChange={(e) => set('dateAfter', e.target.value)}
                    placeholder="Start date"
                    style={{
                      width: '100%', padding: '8px 10px 8px 30px', minHeight: '44px',
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      border: '1px solid var(--slate-300)', borderRadius: '10px',
                      backgroundColor: 'white', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    id="filter-date-before"
                    aria-label="End date"
                    value={filters.dateBefore}
                    onChange={(e) => set('dateBefore', e.target.value)}
                    placeholder="End date"
                    style={{
                      width: '100%', padding: '8px 10px 8px 30px', minHeight: '44px',
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      border: '1px solid var(--slate-300)', borderRadius: '10px',
                      backgroundColor: 'white', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'flex-start' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
                Show Only
              </p>
              <ToggleSwitch
                label="Clustered cases (2+ reports)"
                checked={filters.hasCluster}
                onChange={(v) => set('hasCluster', v)}
                id="filter-cluster"
              />
              <ToggleSwitch
                label="Flagged cases"
                checked={filters.flaggedOnly}
                onChange={(v) => set('flaggedOnly', v)}
                id="filter-flagged"
              />
            </div>
          </div>

          {/* Footer — Clear + count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {count > 0 ? (
              <button
                onClick={() => onChange({ ...EMPTY_FILTERS })}
                style={{
                  background: 'none', border: 'none', fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.875rem', fontWeight: 600, color: 'var(--terra-600)',
                  cursor: 'pointer', textDecoration: 'underline', padding: '8px 4px',
                  minHeight: '44px',
                }}
              >
                Clear All Filters
              </button>
            ) : (
              <span />
            )}
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
              {count > 0 ? `${count} filter${count !== 1 ? 's' : ''} active` : 'No filters active'}
            </span>
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .filter-row-1, .filter-row-2 {
            flex-direction: column !important;
          }
          .filter-date-row {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}