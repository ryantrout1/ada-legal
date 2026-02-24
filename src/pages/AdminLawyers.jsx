import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import LawyerBadge, { accountColors, subColors } from '../components/admin/lawyers/LawyerBadge';
import ProfileSection from '../components/admin/lawyers/ProfileSection';
import PerformanceSection from '../components/admin/lawyers/PerformanceSection';
import ActiveCasesSection from '../components/admin/lawyers/ActiveCasesSection';
import CaseHistorySection from '../components/admin/lawyers/CaseHistorySection';
import ActionButtons from '../components/admin/lawyers/ActionButtons';

function getAccent(l) {
  if (l.account_status === 'suspended') return '#B91C1C';
  if (l.account_status === 'pending_approval') return '#1D4ED8';
  if (l.account_status === 'approved' && l.subscription_status === 'active') return '#15803D';
  if (l.account_status === 'approved') return '#92400E';
  return '#94A3B8';
}

export default function AdminLawyers() {
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);
  const [cases, setCases] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState('');

  const loadData = async () => {
    const [allLawyers, allCases, allLogs] = await Promise.all([
      base44.entities.LawyerProfile.list('-created_date', 500),
      base44.entities.Case.list('-created_date', 1000),
      base44.entities.ContactLog.list('-created_date', 1000)
    ]);
    setLawyers(allLawyers);
    setCases(allCases);
    setContactLogs(allLogs);
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleProfileSave = async (lawyerId, updates) => {
    await base44.entities.LawyerProfile.update(lawyerId, updates);
    setToast('Profile updated.');
    await loadData();
  };

  const filtered = lawyers.filter(l => {
    if (statusFilter !== 'all' && l.account_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !(l.full_name || '').toLowerCase().includes(q) &&
        !(l.firm_name || '').toLowerCase().includes(q) &&
        !(l.email || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div role="status" aria-label="Loading lawyers" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <h1 className="sr-only">Lawyer Management</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading lawyers…</p>
      </div>
    );
  }

  const selectStyle = {
    minHeight: '44px', padding: '0.625rem 0.75rem',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
    color: '#334155', backgroundColor: 'var(--surface)',
    border: '1px solid var(--slate-200)', borderRadius: '8px',
    outline: 'none', cursor: 'pointer'
  };

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'clamp(0.75rem, 3vw, 1.5rem)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.75rem',
            fontWeight: 600, color: 'var(--slate-900)', margin: 0
          }}>
            Lawyer Management
          </h1>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569'
          }}>
            {filtered.length} lawyer{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          marginBottom: '16px', alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
            <Search size={16} style={{
              position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: '#94A3B8', pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder="Search by name, firm, or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search lawyers"
              style={{ ...selectStyle, width: '100%', paddingLeft: '2.25rem' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={selectStyle}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="removed">Removed</option>
          </select>
        </div>

        {/* List */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '12px', overflow: 'hidden'
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: '0 0 8px' }}>
                No lawyers match these filters.
              </p>
              <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
                color: '#C2410C', padding: '4px', minHeight: '44px'
              }}>
                Reset filters
              </button>
            </div>
          )}

          {filtered.map(l => {
            const isExpanded = expandedId === l.id;
            const accent = getAccent(l);
            const initial = (l.full_name || '?')[0].toUpperCase();

            return (
              <div key={l.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                {/* Collapsed Row */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`${l.full_name}, ${l.firm_name}. ${(l.account_status || '').replace(/_/g, ' ')}. ${isExpanded ? 'Collapse' : 'Expand'} details.`}
                  onClick={() => setExpandedId(isExpanded ? null : l.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : l.id); } }}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center',
                    gap: '12px', padding: '12px 16px',
                    background: isExpanded ? 'var(--slate-50)' : 'transparent',
                    borderLeft: `4px solid ${accent}`,
                    cursor: 'pointer', textAlign: 'left', minHeight: '48px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: 'var(--slate-900)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'white'
                  }}>
                    {initial}
                  </div>

                  {/* Name + Firm */}
                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
                      color: 'var(--slate-900)', margin: 0, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {l.full_name}
                    </p>
                    <p style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      color: '#475569', margin: 0
                    }}>
                      {l.firm_name}
                    </p>
                  </div>

                  {/* Email */}
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                    color: '#475569', flex: '0 1 200px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0
                  }} className="lawyer-email-col">
                    {l.email}
                  </span>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                    <LawyerBadge label={l.account_status} colorMap={accountColors} />
                    <LawyerBadge label={l.subscription_status} colorMap={subColors} />
                    {l.flagged && (
                      <span style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: '#B91C1C', flexShrink: 0
                      }} title="Flagged" aria-label="Flagged" />
                    )}
                  </div>

                  {/* Expand arrow */}
                  <span aria-hidden="true" style={{ color: '#475569', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '4px' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div style={{
                    padding: '20px', borderTop: '1px solid var(--slate-200)',
                    display: 'flex', flexDirection: 'column', gap: '16px'
                  }}>
                    <ProfileSection lawyer={l} onSave={handleProfileSave} />
                    <PerformanceSection lawyer={l} cases={cases} contactLogs={contactLogs} />
                    <ActiveCasesSection lawyer={l} cases={cases} contactLogs={contactLogs} />
                    <CaseHistorySection lawyer={l} cases={cases} contactLogs={contactLogs} />
                    <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '16px' }}>
                      <ActionButtons
                        lawyer={l} cases={cases} contactLogs={contactLogs}
                        onRefresh={loadData} onToast={setToast}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div
          role="alert" aria-live="assertive"
          style={{
            position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1100, backgroundColor: '#15803D', color: 'white',
            padding: '12px 24px', borderRadius: '10px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer'
          }}
          onClick={() => setToast('')}
        >
          ✓ {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .lawyer-email-col { display: none !important; }
        }
      `}</style>
    </div>
  );
}