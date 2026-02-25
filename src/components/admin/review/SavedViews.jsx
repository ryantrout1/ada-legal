import React, { useState } from 'react';
import { Bookmark, X, Plus } from 'lucide-react';

const DEFAULT_VIEWS = [
  {
    id: '__default_triage',
    name: 'Triage Queue',
    config: {
      search: '',
      filters: {
        status: 'submitted', violationTypes: [], severities: [],
        completeness: [], states: [], categories: [],
        hasCluster: false, dateAfter: '', dateBefore: '', flaggedOnly: false,
      },
      sortOrder: 'severity',
      clusterSort: 'most',
      viewMode: 'list',
    },
  },
  {
    id: '__default_needsinfo',
    name: 'Needs Follow-up',
    config: {
      search: '',
      filters: {
        status: 'submitted', violationTypes: [], severities: [],
        completeness: ['incomplete'], states: [], categories: [],
        hasCluster: false, dateAfter: '', dateBefore: '', flaggedOnly: false,
      },
      sortOrder: 'completeness',
      clusterSort: 'most',
      viewMode: 'list',
    },
  },
  {
    id: '__default_hotclusters',
    name: 'Hot Clusters',
    config: {
      search: '',
      filters: {
        status: 'all_pending', violationTypes: [], severities: [],
        completeness: [], states: [], categories: [],
        hasCluster: true, dateAfter: '', dateBefore: '', flaggedOnly: false,
      },
      sortOrder: 'cluster',
      clusterSort: 'most',
      viewMode: 'cluster',
    },
  },
];

const STORAGE_KEY = 'qc_saved_views_';

function loadViews(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + userId);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveViews(userId, views) {
  localStorage.setItem(STORAGE_KEY + userId, JSON.stringify(views));
}

export function useSavedViews(userId) {
  const [views, setViews] = React.useState(() => {
    const stored = loadViews(userId);
    return stored || [...DEFAULT_VIEWS];
  });

  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (!userId) return;
    if (!initialized.current) {
      const stored = loadViews(userId);
      if (!stored) saveViews(userId, DEFAULT_VIEWS);
      initialized.current = true;
    }
  }, [userId]);

  const persist = (next) => { setViews(next); saveViews(userId, next); };

  const addView = (name, config) => {
    if (views.length >= 10) return false;
    const v = { id: 'v_' + Date.now(), name, config };
    persist([...views, v]);
    return true;
  };

  const removeView = (id) => {
    persist(views.filter(v => v.id !== id));
  };

  return { views, addView, removeView };
}

export default function SavedViews({ views, activeViewId, onApply, onRemove, onSave }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {views.map(v => (
          <div
            key={v.id}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 12px', borderRadius: '100px', minHeight: '36px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              backgroundColor: activeViewId === v.id ? 'var(--slate-900)' : 'white',
              color: activeViewId === v.id ? 'white' : 'var(--slate-700)',
              borderColor: activeViewId === v.id ? 'var(--slate-900)' : 'var(--slate-300)',
              transition: 'all 0.15s',
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
                color: activeViewId === v.id ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                display: 'flex', alignItems: 'center', padding: '2px',
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 12px', borderRadius: '100px', minHeight: '36px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', border: '1px dashed var(--slate-300)',
            backgroundColor: 'transparent', color: 'var(--slate-500)',
          }}
          aria-label="Save current view"
        >
          <Plus size={14} /> Save View
        </button>
      </div>

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
            <label htmlFor="sv-name" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              View name
            </label>
            <input
              id="sv-name"
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
    </>
  );
}