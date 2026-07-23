/**
 * LawsuitFilters — search + type + status + state controls.
 *
 * Ported from Base44 (src/components/public/LawsuitFilters.jsx
 * @ 6b1e9ac). Design authority is B44; changes are confined to the port
 * seams:
 *   - `STATUS_ORDER` → `PUBLIC_STATUS_ORDER`, dropping the "Closed"
 *     option the public endpoint can never satisfy (resolved decision)
 *   - control borders use the dedicated control-border token, which
 *     clears 3:1 in every display mode (WCAG 1.4.11); B44's
 *     `--card-border` measures well under that on interactive controls
 *   - hardcoded hex focus-ring fallback dropped
 *
 * Accessibility: every control has a visible label bound by htmlFor, a
 * 44px minimum target, and a 3px focus ring. Filtering is live — each
 * change fires onChange and the parent re-filters in memory — so there
 * is no submit button and no form element (this is a directory filter,
 * not intake; Ada remains the only front door).
 */

import {
  KIND_ORDER,
  PUBLIC_STATUS_ORDER,
  kindLabel,
  statusLabel,
} from '../../lib/litigationLabels.js';
import type { LawsuitFilterState } from '../../lib/lawsuitFilters.js';
import type { CSSProperties } from 'react';

const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

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
  filters: LawsuitFilterState;
  onChange: (next: LawsuitFilterState) => void;
}

export default function LawsuitFilters({ filters, onChange }: Props) {
  function update(next: Partial<LawsuitFilterState>) {
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
        <label htmlFor="lawsuit-search" style={labelStyle}>
          Search
        </label>
        <input
          id="lawsuit-search"
          className="lawsuit-filter-control"
          type="search"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Case name or description…"
          style={controlStyle}
        />
      </div>

      <div>
        <label htmlFor="lawsuit-kind" style={labelStyle}>
          Type
        </label>
        <select
          id="lawsuit-kind"
          className="lawsuit-filter-control"
          value={filters.kind}
          onChange={(e) => update({ kind: e.target.value })}
          style={controlStyle}
        >
          <option value="all">All types</option>
          {KIND_ORDER.map((k) => (
            <option key={k} value={k}>
              {kindLabel(k)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lawsuit-status" style={labelStyle}>
          Status
        </label>
        <select
          id="lawsuit-status"
          className="lawsuit-filter-control"
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
          style={controlStyle}
        >
          <option value="all">All statuses</option>
          {PUBLIC_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lawsuit-state" style={labelStyle}>
          State
        </label>
        <select
          id="lawsuit-state"
          className="lawsuit-filter-control"
          value={filters.state}
          onChange={(e) => update({ state: e.target.value })}
          style={controlStyle}
        >
          <option value="">All states</option>
          {US_STATES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
