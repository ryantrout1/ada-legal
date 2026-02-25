import React from 'react';
import { Search, X } from 'lucide-react';

/*
  Universal admin page header — Layers 1-4 of the admin page structure.
  Props:
    title             - Page title string (Layer 1)
    actionButton      - ReactNode for right-side action button (Layer 1)
    statusBar         - ReactNode for Layer 2 status bar
    alertBar          - ReactNode for Layer 3 alert bar (null = hidden)
    searchValue       - string for search input (Layer 4)
    onSearchChange    - fn(string)
    searchPlaceholder - string
    filterPills       - ReactNode for filter pills
    sortDropdown      - ReactNode for sort dropdown
    listHeader        - ReactNode for Layer 5
*/
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Layer 1 — Page Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '44px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0, lineHeight: 1.2 }}>
          {title}
        </h1>
        {actionButton && <div style={{ flexShrink: 0 }}>{actionButton}</div>}
      </div>

      {/* Layer 2 — Status Bar */}
      {statusBar && <div>{statusBar}</div>}

      {/* Layer 3 — Alert Bar (conditional) */}
      {alertBar && <div>{alertBar}</div>}

      {/* Layer 4 — Search + Filters Row */}
      {(onSearchChange || filterPills || sortDropdown) && (
        <div className="admin-search-filters-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onSearchChange && (
            <div style={{ position: 'relative', flex: '0 1 auto', width: '40%', minWidth: '200px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={e => onSearchChange(e.target.value)}
                aria-label="Search"
                style={{
                  width: '100%', minHeight: '44px', padding: '8px 36px 8px 36px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                  border: '1px solid var(--slate-200)', borderRadius: '8px',
                  backgroundColor: 'white', boxSizing: 'border-box', outline: 'none',
                  color: 'var(--slate-800)',
                }}
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: 'var(--slate-400)', display: 'flex', minHeight: '44px', minWidth: '44px',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          {filterPills && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 auto', minWidth: 0 }}>{filterPills}</div>}
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