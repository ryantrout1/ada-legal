import React, { useState } from 'react';
import { Plus, X, SlidersHorizontal } from 'lucide-react';

export default function CompactViewsFilterRow({
  views, activeViewId, onApply, onRemove, onSave,
  filterCount, onToggleFilters, filtersOpen,
}) {
  const [showModal, setShowModal] = useState(false);
  const [viewName, setViewName] = useState('');

  const handleSave = () => {
    if (!viewName.trim()) return;
    const ok = onSave(viewName.trim());
    if (ok !== false) {
      setViewName('');
      setShowModal(false);
    }
  };

  return (
    <>
      <div className="qc-views-filter-row" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px', minHeight: '44px',
      }}>
        {/* Left: saved view chips */}
        <div className="qc-views-scroll" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          overflow: 'auto', flex: '1 1 auto', minWidth: 0,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {views.map(v => (
            <div
              key={v.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '3px 10px', borderRadius: '100px', minHeight: '32px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', flexShrink: 0,
                backgroundColor: activeViewId === v.id ? 'var(--slate-900)' : 'white',
                color: activeViewId === v.id ? 'white' : 'var(--slate-700)',
                borderColor: activeViewId === v.id ? 'var(--slate-900)' : 'var(--slate-300)',
              }}
            >
              <button
                onClick={() => onApply(v)}
                style={{
                  background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', padding: '2px 0',
                }}
                aria-label={`Apply view: ${v.name}`}
              >
                {v.name}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(v.id); }}
                aria-label={`Remove view: ${v.name}`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: activeViewId === v.id ? 'rgba(255,255,255,0.7)' : '#4B5563',
                  display: 'flex', alignItems: 'center', padding: '2px',
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '3px 10px', borderRadius: '100px', minHeight: '32px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', border: '1px dashed var(--slate-300)',
              backgroundColor: 'transparent', color: 'var(--slate-500)', whiteSpace: 'nowrap', flexShrink: 0,
            }}
            aria-label="Save current view"
          >
            <Plus size={12} /> Save View
          </button>
        </div>

        {/* Right: Advanced Filters button */}
        <button
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          className="admin-filter-pill"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '8px 20px', minHeight: '44px', fontFamily: 'Manrope, sans-serif',
            fontSize: '0.85rem', fontWeight: filtersOpen ? 700 : 500, cursor: 'pointer',
            border: filtersOpen ? 'none' : '1px solid var(--slate-200)', borderRadius: '20px',
            backgroundColor: filtersOpen ? '#C2410C' : 'white',
            color: filtersOpen ? 'white' : 'var(--slate-800)', flexShrink: 0, position: 'relative',
          }}
        >
          <SlidersHorizontal size={14} />
          Filters
          {filterCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '18px', height: '18px', borderRadius: '50%',
              backgroundColor: filtersOpen ? 'white' : 'var(--terra-600)',
              color: filtersOpen ? '#C2410C' : 'white',
              fontSize: '0.65rem', fontWeight: 700,
            }}>
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Save View modal */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
          role="dialog" aria-modal="true" aria-label="Save current view"
        >
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            maxWidth: '400px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 12px' }}>
              Save Current View
            </h2>
            <label htmlFor="sv-name-compact" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              View name
            </label>
            <input
              id="sv-name-compact"
              autoFocus
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder='e.g. "High Severity AZ"'
              maxLength={40}
              style={{
                width: '100%', padding: '10px 12px', minHeight: '44px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                border: '1px solid var(--slate-300)', borderRadius: '8px',
                marginBottom: '16px', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  fontWeight: 600, border: '1px solid var(--slate-300)', borderRadius: '8px',
                  backgroundColor: 'white', color: 'var(--slate-700)', cursor: 'pointer', minHeight: '44px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!viewName.trim()}
                style={{
                  padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', minHeight: '44px',
                  backgroundColor: 'var(--slate-900)', color: 'white',
                  opacity: viewName.trim() ? 1 : 0.5,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .qc-views-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}