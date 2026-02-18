import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import LawyerBadge, { accountColors, subColors } from '../components/admin/lawyers/LawyerBadge';
import ProfileSection from '../components/admin/lawyers/ProfileSection';
import PerformanceSection from '../components/admin/lawyers/PerformanceSection';
import ActiveCasesSection from '../components/admin/lawyers/ActiveCasesSection';
import CaseHistorySection from '../components/admin/lawyers/CaseHistorySection';
import ActionButtons from '../components/admin/lawyers/ActionButtons';

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading lawyers…</p>
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
          Lawyer Management
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
              placeholder="Search by name, firm, or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, width: '100%', paddingLeft: '2.25rem' }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="removed">Removed</option>
          </select>
          <span style={{
            display: 'inline-block', padding: '0.25rem 0.75rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
            color: 'var(--slate-600)', backgroundColor: 'var(--slate-100)',
            borderRadius: '9999px', marginLeft: 'auto'
          }}>
            {filtered.length} lawyer{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* List */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden'
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-500)', margin: 0 }}>
                No lawyers match your filters.
              </p>
            </div>
          )}

          {filtered.map(l => {
            const isExpanded = expandedId === l.id;
            return (
              <div key={l.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-label={`${l.full_name} — ${l.firm_name}`}
                  onClick={() => setExpandedId(isExpanded ? null : l.id)}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center',
                    gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)',
                    background: isExpanded ? 'var(--slate-50)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: '56px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {isExpanded
                    ? <ChevronDown size={16} style={{ color: 'var(--terra-600)', flexShrink: 0 }} />
                    : <ChevronRight size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
                      color: 'var(--slate-800)'
                    }}>
                      {l.full_name}
                    </span>
                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      color: 'var(--slate-500)', marginLeft: '0.75rem'
                    }}>
                      {l.firm_name}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                    color: 'var(--slate-500)', display: 'none'
                  }} className="lawyer-email-col">
                    {l.email}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                    <LawyerBadge label={l.account_status} colorMap={accountColors} />
                    <LawyerBadge label={l.subscription_status} colorMap={subColors} />
                    {l.flagged && (
                      <span style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: '#B91C1C', flexShrink: 0
                      }} title="Flagged" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div style={{
                    padding: 'var(--space-lg)', borderTop: '1px solid var(--slate-200)',
                    backgroundColor: 'var(--slate-50)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)'
                  }}>
                    <ProfileSection lawyer={l} onSave={handleProfileSave} />
                    <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: 'var(--space-lg)' }}>
                      <PerformanceSection lawyer={l} cases={cases} contactLogs={contactLogs} />
                    </div>
                    <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: 'var(--space-lg)' }}>
                      <ActiveCasesSection lawyer={l} cases={cases} contactLogs={contactLogs} />
                    </div>
                    <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: 'var(--space-lg)' }}>
                      <CaseHistorySection lawyer={l} cases={cases} contactLogs={contactLogs} />
                    </div>
                    <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: 'var(--space-lg)' }}>
                      <ActionButtons
                        lawyer={l}
                        cases={cases}
                        contactLogs={contactLogs}
                        onRefresh={loadData}
                        onToast={setToast}
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
          role="alert"
          style={{
            position: 'fixed', bottom: 'var(--space-xl)', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1100, backgroundColor: '#15803D', color: 'white',
            padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer'
          }}
          onClick={() => setToast('')}
        >
          ✓ {toast}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .lawyer-email-col { display: inline !important; }
        }
      `}</style>
    </div>
  );
}