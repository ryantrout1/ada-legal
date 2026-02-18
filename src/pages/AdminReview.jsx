import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Building2, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import CaseDetailPanel from '../components/admin/CaseDetailPanel';
import ReviewActions from '../components/admin/ReviewActions';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function AdminReview() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const loadCases = async () => {
    const submitted = await base44.entities.Case.filter(
      { status: 'submitted' },
      'created_date',
      200
    );
    setCases(submitted);
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        if (user?.role === 'lawyer') {
          window.location.href = createPageUrl('LawyerDashboard');
        } else {
          window.location.href = createPageUrl('MyCases');
        }
        return;
      }
      await loadCases();
      setLoading(false);
    }
    init();
  }, []);

  const handleActionComplete = () => {
    setExpandedId(null);
    loadCases();
  };

  if (loading) {
    return (
      <div
        role="status" aria-label="Loading review queue"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 200px)', gap: '1rem'
        }}
      >
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-600)' }}>Loading review queue…</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)',
      minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700,
          color: 'var(--slate-900)',
          marginBottom: 'var(--space-xs)'
        }}>
          QC Review Queue
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '1rem',
          color: 'var(--slate-600)',
          marginBottom: 'var(--space-xl)'
        }}>
          {cases.length} case{cases.length !== 1 ? 's' : ''} pending review
        </p>

        {cases.length === 0 && (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', textAlign: 'center'
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--slate-600)', margin: 0
            }}>
              All clear — no cases pending review.
            </p>
          </div>
        )}

        {cases.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)'
          }}>
            {cases.map(c => {
              const isExpanded = expandedId === c.id;
              const isPhysical = c.violation_type === 'physical_space';
              return (
                <div key={c.id} style={{
                  backgroundColor: 'var(--surface)',
                  border: `1px solid ${isExpanded ? 'var(--terra-600)' : 'var(--slate-200)'}`,
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s'
                }}>
                  {/* Row header */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', minHeight: '64px'
                    }}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded
                      ? <ChevronDown size={18} style={{ color: 'var(--terra-600)', flexShrink: 0 }} />
                      : <ChevronRight size={18} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
                    }

                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                      backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF', flexShrink: 0
                    }}>
                      {isPhysical
                        ? <Building2 size={16} aria-hidden="true" style={{ color: '#1D4ED8' }} />
                        : <Globe size={16} aria-hidden="true" style={{ color: '#7C3AED' }} />
                      }
                    </span>

                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.8125rem',
                      color: 'var(--slate-600)', flexShrink: 0, width: '80px'
                    }}>
                      {c.id?.slice(0, 8)}
                    </span>

                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                      fontWeight: 600, color: 'var(--slate-800)',
                      flex: 1, minWidth: 0, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {c.business_name}
                    </span>

                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      color: 'var(--slate-600)', flexShrink: 0, display: 'none'
                    }} className="review-city-col">
                      {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                    </span>

                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      color: 'var(--slate-600)', flexShrink: 0
                    }}>
                      {formatDate(c.submitted_at || c.created_date)}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div>
                      <CaseDetailPanel caseData={c} />
                      <ReviewActions caseData={c} onActionComplete={handleActionComplete} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .review-city-col { display: inline !important; }
        }
      `}</style>
    </div>
  );
}