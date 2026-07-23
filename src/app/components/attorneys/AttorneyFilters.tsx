/**
 * AttorneyFilters — search + practice area + state.
 *
 * Ported from Base44 (src/components/attorneys/AttorneyFilters.jsx
 * @ 6b1e9ac). Design authority is B44; changes are confined to the
 * port seams:
 *   - options are derived from the roster via deriveFacets rather than
 *     passed in as four separate props
 *   - control borders use the control-border token (≥3:1 in every
 *     display mode per WCAG 1.4.11); B44's --card-border is well under
 *     that on interactive controls
 *   - shares the .directory-filter-control focus rule with the lawsuit
 *     filters instead of emitting its own <style> block
 *
 * Rendered only at or above the thin-roster threshold — see
 * shouldShowFilters. Not a <form>: this is a directory filter, and Ada
 * remains the only intake front door.
 */

import type { CSSProperties } from 'react';
import type {
  AttorneyFilterState,
  AttorneyFacets,
} from '../../lib/attorneyFilters.js';

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--body)',
  marginBottom: 4,
};

const controlStyle: CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-control-border)',
  borderRadius: 6,
  fontSize: '0.9375rem',
  color: 'var(--body)',
  background: 'var(--card-bg)',
  fontFamily: 'Manrope, sans-serif',
  minHeight: 44,
};

interface Props {
  filters: AttorneyFilterState;
  facets: AttorneyFacets;
  onChange: (next: AttorneyFilterState) => void;
}

export default function AttorneyFilters({ filters, facets, onChange }: Props) {
  function update(next: Partial<AttorneyFilterState>) {
    onChange({ ...filters, ...next });
  }

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="attorney-search" style={labelStyle}>
          Search
        </label>
        <input
          id="attorney-search"
          className="directory-filter-control"
          type="search"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Attorney or firm name…"
          style={controlStyle}
        />
      </div>

      <div>
        <label htmlFor="attorney-practice-area" style={labelStyle}>
          Practice area
        </label>
        <select
          id="attorney-practice-area"
          className="directory-filter-control"
          value={filters.practiceArea}
          onChange={(e) => update({ practiceArea: e.target.value })}
          style={controlStyle}
        >
          <option value="all">All practice areas</option>
          {facets.practiceAreas.map((pa) => (
            <option key={pa} value={pa}>
              {pa}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="attorney-state" style={labelStyle}>
          State
        </label>
        <select
          id="attorney-state"
          className="directory-filter-control"
          value={filters.state}
          onChange={(e) => update({ state: e.target.value })}
          style={controlStyle}
        >
          <option value="all">All states</option>
          {facets.states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
