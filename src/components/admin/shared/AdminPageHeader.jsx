import React from 'react';
import { Search, X } from 'lucide-react';

export default function AdminPageHeader({
  title,
  actionButton,
  statusBar,
  alertBar,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filterPills,
  sortDropdown,
  listHeader,
}) {
  const searchId = React.useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Layer 1 — Page Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '44px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--heading)', margin: 0, lineHeight: 1.2 }}>
          {title}
        </h1>
        {actionButton && <div style={{ flexShrink: 0 }}>{actionButton}</div>}
      </div>

      {/* Layer 2 — Status Bar */}
      {statusBar && <div>{statusBar}</div>}

      {/* Layer 3 — Alert Bar */}
      {alertBar && <div role="alert" aria-live="polite">{alertBar}</div>}

      {/* Layer 4 — Search + Filters Row */}
      {(onSearchChange || filterPills || sortDropdown) && (
        <div className="admin-search-filters-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }} role="search">
          {onSearchChange && (
            <div style={{ position: 'relative', flex: '0 1 auto', width: '40%', minWidth: '200px', maxWidth: '400px' }}>
              <label htmlFor={searchId} className="sr-only">{searchPlaceholder}</label>
              <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
              <input
                id={searchId}
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={e => onSearchChange(e.target.value)}
                autoComplete="off"
                style={{
                  width: '100%', minHeight: '44px', padding: '8px 36px 8px 36px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                  border: '1px solid var(--card-border)', borderRadius: '8px',
                  backgroundColor: 'var(--card-bg)', boxSizing: 'border-box', outline: 'none',
                  color: 'var(--heading)',
                }}
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: 'var(--body-secondary)', display: 'flex', minHeight: '44px', minWidth: '44px',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {filterPills && (
            <div role="group" aria-label="Filter options" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 auto', minWidth: 0 }}>
              {filterPills}
            </div>
          )}
          {sortDropdown && <div style={{ flexShrink: 0, marginLeft: 'auto' }}>{sortDropdown}</div>}
        </div>
      )}

      {/* Layer 5 — List Header Row */}
      {listHeader && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '36px', gap: '12px' }}>
          {listHeader}
        </div>
      )}

      <style>{`
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0,0,0,0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        @media (max-width: 768px) {
          .admin-search-filters-row > div:first-child {
            max-width: 100% !important;
            flex-basis: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
