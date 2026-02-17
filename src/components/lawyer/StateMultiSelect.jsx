import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};

export default function StateMultiSelect({ selected, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = STATES.filter(s =>
    s.toLowerCase().includes(search.toLowerCase()) ||
    STATE_NAMES[s].toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (state) => {
    onChange(selected.includes(state)
      ? selected.filter(s => s !== state)
      : [...selected, state]
    );
  };

  const remove = (state, e) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== state));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select states of practice"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
        style={{
          width: '100%', minHeight: '44px', padding: '0.375rem 0.75rem',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          color: 'var(--slate-800)', backgroundColor: 'var(--surface)',
          border: `2px solid ${error ? 'var(--error-600)' : 'var(--slate-200)'}`,
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px',
          boxSizing: 'border-box'
        }}
      >
        {selected.length === 0 && (
          <span style={{ color: 'var(--slate-400)' }}>Select state(s)…</span>
        )}
        {selected.map(s => (
          <span key={s} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', backgroundColor: 'var(--terra-100)',
            color: 'var(--terra-800)', borderRadius: '4px',
            fontSize: '0.8125rem', fontWeight: 600
          }}>
            {s}
            <button
              type="button"
              onClick={(e) => remove(s, e)}
              aria-label={`Remove ${STATE_NAMES[s]}`}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px', display: 'flex', color: 'var(--terra-600)',
                minWidth: '24px', minHeight: '24px', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <ChevronDown size={16} style={{
          marginLeft: 'auto', color: 'var(--slate-400)', flexShrink: 0
        }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          marginTop: '4px', maxHeight: '260px', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '0.5rem' }}>
            <input
              type="text"
              placeholder="Search states…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', padding: '0.5rem 0.625rem',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(s => {
              const isSelected = selected.includes(s);
              return (
                <div
                  key={s}
                  onClick={() => toggle(s)}
                  style={{
                    padding: '0.5rem 0.75rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    backgroundColor: isSelected ? 'var(--terra-50)' : 'transparent',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                    color: 'var(--slate-800)'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ accentColor: '#C2410C', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600 }}>{s}</span>
                  <span style={{ color: 'var(--slate-500)' }}>— {STATE_NAMES[s]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}