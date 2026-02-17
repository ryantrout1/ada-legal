import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Building2, Globe, Search, ChevronDown, ChevronRight } from 'lucide-react';
import CaseDetailPanel from '../components/admin/CaseDetailPanel';
import ReviewActions from '../components/admin/ReviewActions';

const statusColors = {
  submitted: { bg: '#DBEAFE', text: '#1D4ED8' },
  under_review: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DCFCE7', text: '#15803D' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  available: { bg: '#F0FDF4', text: '#166534' },
  assigned: { bg: '#E0E7FF', text: '#3730A3' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8' },
  closed: { bg: '#F1F5F9', text: '#475569' }
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }) {
  const c = statusColors[status] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.625rem',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
      color: c.text, backgroundColor: c.bg, borderRadius: '9999px',
      textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap'
    }}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminCases() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [violationFilter, setViolationFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const loadData = async () => {
    const [allCases, allLawyers] = await Promise.all([
      base44.entities.Case.list('-created_date', 500),
      base44.entities.LawyerProfile.list('-created_date', 500)
    ]);
    setCases(allCases);
    setLawyers(allLawyers);
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      await loadData();
      setLoading(false);
    }
    init();
  }, []);

  const handleActionComplete = () => {
    setExpandedId(null);
    loadData();
  };

  const lawyerMap = {};
  lawyers.forEach(l => { lawyerMap[l.id] = l; });

  const filtered = cases.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (violationFilter !== 'all' && c.violation_type !== violationFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const idMatch = (c.id || '').toLowerCase().includes(q);
      const nameMatch = (c.business_name || '').toLowerCase().includes(q);
      if (!idMatch && !nameMatch) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading cases…</p>
      </div>
    );
  }

  const selectStyle = {
    minHeight: '40px', padding: '0.5rem 0.75rem',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
    color: 'var(--slate-700)', backgroundColor: 'var(--surface)',
    border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
    outline: 'none', cursor: 'pointer'
  };

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-xl)'
        }}>
          All Cases
        </h1>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap',
          marginBottom: 'var(--space-lg)', alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
            <Search size={16} style={{
              position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--slate-400)', pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder="Search by business name or case ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                ...selectStyle, width: '100%', paddingLeft: '2.25rem'
              }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
          <select value={violationFilter} onChange={e => setViolationFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Violations</option>
            <option value="physical_space">Physical Space</option>
            <option value="digital_website">Digital / Website</option>
          </select>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            color: 'var(--slate-500)', marginLeft: 'auto'
          }}>
            {filtered.length} case{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden'
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 32px 80px 1fr 140px 100px 120px 150px',
            gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-lg)',
            backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
            color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em',
            alignItems: 'center'
          }}>
            <span></span>
            <span></span>
            <span>ID</span>
            <span>Business</span>
            <span>City / State</span>
            <span>Status</span>
            <span>Submitted</span>
            <span>Assigned Lawyer</span>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-500)', margin: 0 }}>
                No cases match your filters.
              </p>
            </div>
          )}

          {filtered.map(c => {
            const isExpanded = expandedId === c.id;
            const isPhysical = c.violation_type === 'physical_space';
            const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
            return (
              <div key={c.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  style={{
                    display: 'grid', width: '100%',
                    gridTemplateColumns: '40px 32px 80px 1fr 140px 100px 120px 150px',
                    gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-lg)',
                    background: isExpanded ? 'var(--slate-50)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    alignItems: 'center', minHeight: '52px'
                  }}
                >
                  {isExpanded
                    ? <ChevronDown size={16} style={{ color: 'var(--terra-600)' }} />
                    : <ChevronRight size={16} style={{ color: 'var(--slate-400)' }} />
                  }
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF'
                  }}>
                    {isPhysical
                      ? <Building2 size={14} style={{ color: '#1D4ED8' }} />
                      : <Globe size={14} style={{ color: '#7C3AED' }} />
                    }
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {c.id?.slice(0, 8)}
                  </span>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
                    color: 'var(--slate-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {c.business_name}
                  </span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
                    {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                  </span>
                  <StatusBadge status={c.status} />
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                    {formatDate(c.submitted_at || c.created_date)}
                  </span>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                    color: lawyer ? 'var(--slate-700)' : 'var(--slate-400)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {lawyer ? lawyer.full_name : '—'}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--slate-200)' }}>
                    <CaseDetailPanel caseData={c} />
                    {c.status === 'submitted' && (
                      <ReviewActions caseData={c} onActionComplete={handleActionComplete} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}