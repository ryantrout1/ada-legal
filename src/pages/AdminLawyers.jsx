import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import AdminStatusBar from '../components/admin/shared/AdminStatusBar';
import AdminFilterPill from '../components/admin/shared/AdminFilterPill';
import AdminSortDropdown from '../components/admin/shared/AdminSortDropdown';
import AttorneyAlertBar from '../components/admin/lawyers/AttorneyAlertBar';
import AttorneyRow from '../components/admin/lawyers/AttorneyRow';
import AttorneyExpandedPanel from '../components/admin/lawyers/AttorneyExpandedPanel';
import ActionButtons from '../components/admin/lawyers/ActionButtons';

function worstScore(l, cases, contactLogs) {
  if (l.account_status === 'pending_approval') return -1000;
  const myCases = cases.filter(c => c.assigned_lawyer_id === l.id);
  const withAssign = myCases.filter(c => c.assigned_at);
  if (withAssign.length === 0) return l.account_status === 'approved' ? 50 : 200;
  let responded24 = 0;
  withAssign.forEach(c => {
    const logs = contactLogs.filter(lg => lg.case_id === c.id && lg.lawyer_id === l.id);
    if (logs.length > 0) {
      const earliest = Math.min(...logs.map(lg => new Date(lg.logged_at || lg.created_date).getTime()));
      if ((earliest - new Date(c.assigned_at).getTime()) / 3600000 <= 24) responded24++;
    }
  });
  return Math.round((responded24 / withAssign.length) * 100);
}

const FILTER_PILLS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'suspended', label: 'Suspended' },
];

const SORT_OPTIONS = [
  { value: 'worst', label: 'Worst Performers' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'active', label: 'Most Active Cases' },
  { value: 'response', label: 'Best Response Rate' },
  { value: 'newest', label: 'Newest First' },
];

export default function AdminLawyers() {
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);
  const [cases, setCases] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('worst');
  const [toast, setToast] = useState('');

  const loadData = async () => {
    const [allLawyers, allCases, allLogs] = await Promise.all([
      base44.entities.LawyerProfile.list('-created_date', 500),
      base44.entities.Case.list('-created_date', 1000),
      base44.entities.ContactLog.list('-created_date', 1000),
    ]);
    setLawyers(allLawyers); setCases(allCases); setContactLogs(allLogs);
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      await loadData(); setLoading(false);
    }
    init();
  }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);

  const handleQuickApprove = async (lawyer) => {
    const now = new Date().toISOString();
    const updates = { account_status: 'approved', approved_at: now };
    if (!lawyer.date_joined) updates.date_joined = now;
    await base44.entities.LawyerProfile.update(lawyer.id, updates);
    setToast(`${lawyer.full_name} approved.`); await loadData();
  };

  // Status bar cells
  const statusCells = useMemo(() => {
    const total = lawyers.length;
    const active = lawyers.filter(l => l.subscription_status === 'active' && l.account_status === 'approved').length;
    const pending = lawyers.filter(l => l.account_status === 'pending_approval').length;
    const inactive = lawyers.filter(l => (l.subscription_status === 'inactive' || l.subscription_status === 'canceled') && l.account_status === 'approved').length;
    const suspended = lawyers.filter(l => l.account_status === 'suspended').length;
    return [
      { key: 'total', label: 'Total Attorneys', value: total, color: 'var(--slate-800)' },
      { key: 'active', label: 'Active', value: active, bg: '#F0FDF4', color: '#15803D' },
      { key: 'pending', label: 'Pending Approval', value: pending, bg: pending > 0 ? '#FEF3C7' : undefined, color: '#92400E', pulse: pending > 0 },
      { key: 'inactive', label: 'Inactive', value: inactive, color: 'var(--body-secondary)' },
      { key: 'suspended', label: 'Suspended', value: suspended, bg: suspended > 0 ? '#FEF2F2' : undefined, color: '#B91C1C' },
    ];
  }, [lawyers]);

  const secondaryText = useMemo(() => {
    const approved = lawyers.filter(l => l.account_status === 'approved');
    const activeCaseCount = cases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
    const avgCases = approved.length > 0 ? Math.round((activeCaseCount / approved.length) * 10) / 10 : 0;
    const withAssign = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
    let avgHrs = '—';
    if (withAssign.length > 0) {
      const times = withAssign.map(c => { const logs = contactLogs.filter(l => l.case_id === c.id); if (!logs.length) return null; const e = Math.min(...logs.map(l => new Date(l.logged_at || l.created_date).getTime())); return (e - new Date(c.assigned_at).getTime()) / 3600000; }).filter(Boolean);
      if (times.length > 0) avgHrs = Math.round(times.reduce((a, b) => a + b, 0) / times.length) + 'h';
    }
    let compliance = '—';
    if (withAssign.length > 0) {
      const c = withAssign.filter(cas => { const d = new Date(new Date(cas.assigned_at).getTime() + 86400000); return contactLogs.some(l => l.case_id === cas.id && l.contact_type === 'initial_contact' && new Date(l.logged_at || l.created_date) <= d); }).length;
      compliance = Math.round((c / withAssign.length) * 100) + '%';
    }
    return <span>Avg cases/attorney: {avgCases} · Avg response: {avgHrs} · Compliance: {compliance}</span>;
  }, [lawyers, cases, contactLogs]);

  const filtered = useMemo(() => {
    let result = lawyers;
    if (statusFilter === 'active') result = result.filter(l => l.subscription_status === 'active' && l.account_status === 'approved');
    else if (statusFilter === 'pending') result = result.filter(l => l.account_status === 'pending_approval');
    else if (statusFilter === 'inactive') result = result.filter(l => (l.subscription_status === 'inactive' || l.subscription_status === 'canceled') && l.account_status === 'approved');
    else if (statusFilter === 'suspended') result = result.filter(l => l.account_status === 'suspended');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => (l.full_name || '').toLowerCase().includes(q) || (l.firm_name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q) || (l.states_of_practice || []).some(s => s.toLowerCase().includes(q)));
    }
    if (sortBy === 'name') result = [...result].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    else if (sortBy === 'active') result = [...result].sort((a, b) => cases.filter(c => c.assigned_lawyer_id === b.id && (c.status === 'assigned' || c.status === 'in_progress')).length - cases.filter(c => c.assigned_lawyer_id === a.id && (c.status === 'assigned' || c.status === 'in_progress')).length);
    else if (sortBy === 'response') result = [...result].sort((a, b) => worstScore(b, cases, contactLogs) - worstScore(a, cases, contactLogs));
    else if (sortBy === 'newest') result = [...result].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    else result = [...result].sort((a, b) => worstScore(a, cases, contactLogs) - worstScore(b, cases, contactLogs));
    return result;
  }, [lawyers, cases, contactLogs, search, statusFilter, sortBy]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading attorneys" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
      <style>{`
        button:focus-visible, a:focus-visible, select:focus-visible,
        input:focus-visible, textarea:focus-visible, [role="button"]:focus-visible {
          outline: 3px solid var(--accent-light); outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        @media (prefers-contrast: more) { button, a, input, select, textarea { border-width: 2px !important; } }
      `}</style>
        <h1 className="sr-only">Attorney Network</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading attorneys…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AdminPageHeader
          title="Attorney Network"
          statusBar={<AdminStatusBar cells={statusCells} secondaryText={secondaryText} />}
          alertBar={<AttorneyAlertBar lawyers={lawyers} cases={cases} contactLogs={contactLogs} onQuickApprove={handleQuickApprove} />}
          searchValue={search} onSearchChange={setSearch}
          searchPlaceholder="Search by name, firm, email, or state…"
          filterPills={FILTER_PILLS.map(p => <AdminFilterPill key={p.key} label={p.label} active={statusFilter === p.key} onClick={() => setStatusFilter(p.key)} />)}
          sortDropdown={<AdminSortDropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />}
          listHeader={<span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--slate-500)' }}>{statusFilter === 'all' ? `All (${filtered.length})` : `${FILTER_PILLS.find(p => p.key === statusFilter)?.label || 'All'} (${filtered.length})`}</span>}
        />

        <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              {lawyers.length === 0 ? (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--page-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem' }}>⚖️</div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 8px' }}>No attorneys have joined yet</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body-secondary)', margin: 0 }}>When lawyers register on the For Attorneys page, they'll appear here for your review.</p>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body-secondary)', margin: '0 0 8px' }}>No attorneys match these filters.</p>
                  <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent)', padding: '4px', minHeight: '44px' }}>Reset filters</button>
                </>
              )}
            </div>
          ) : filtered.map(l => (
            <AttorneyRow key={l.id} lawyer={l} cases={cases} contactLogs={contactLogs} isExpanded={expandedId === l.id} onToggle={() => setExpandedId(expandedId === l.id ? null : l.id)} onQuickApprove={handleQuickApprove}>
              <AttorneyExpandedPanel lawyer={l} cases={cases} contactLogs={contactLogs} actionButtons={<ActionButtons lawyer={l} cases={cases} contactLogs={contactLogs} onRefresh={loadData} onToast={setToast} />} />
            </AttorneyRow>
          ))}
        </div>
      </div>

      {toast && (
        <div role="alert" aria-live="assertive" style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, backgroundColor: '#15803D', color: 'white', padding: '12px 24px', borderRadius: '10px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer' }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }}} tabIndex="0" onClick={() => setToast('')}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}