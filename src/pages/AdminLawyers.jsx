import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Search } from 'lucide-react';
import AttorneyOverviewBar from '../components/admin/lawyers/AttorneyOverviewBar';
import AttorneyAlertBar from '../components/admin/lawyers/AttorneyAlertBar';
import AttorneyRow from '../components/admin/lawyers/AttorneyRow';
import AttorneyExpandedPanel from '../components/admin/lawyers/AttorneyExpandedPanel';
import ActionButtons from '../components/admin/lawyers/ActionButtons';

// Sort helper: compute lawyer "badness" score for worst-performers sort
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

  const handleQuickApprove = async (lawyer) => {
    const now = new Date().toISOString();
    const updates = { account_status: 'approved', approved_at: now };
    if (!lawyer.date_joined) updates.date_joined = now;
    await base44.entities.LawyerProfile.update(lawyer.id, updates);
    setToast(`${lawyer.full_name} approved.`);
    await loadData();
  };

  const filtered = useMemo(() => {
    let result = lawyers;

    // Status filter
    if (statusFilter === 'active') result = result.filter(l => l.subscription_status === 'active' && l.account_status === 'approved');
    else if (statusFilter === 'pending') result = result.filter(l => l.account_status === 'pending_approval');
    else if (statusFilter === 'inactive') result = result.filter(l => (l.subscription_status === 'inactive' || l.subscription_status === 'canceled') && l.account_status === 'approved');
    else if (statusFilter === 'suspended') result = result.filter(l => l.account_status === 'suspended');

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.full_name || '').toLowerCase().includes(q) ||
        (l.firm_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.states_of_practice || []).some(s => s.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'name') result = [...result].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    else if (sortBy === 'active') {
      result = [...result].sort((a, b) => {
        const ac = cases.filter(c => c.assigned_lawyer_id === b.id && (c.status === 'assigned' || c.status === 'in_progress')).length;
        const bc = cases.filter(c => c.assigned_lawyer_id === a.id && (c.status === 'assigned' || c.status === 'in_progress')).length;
        return ac - bc;
      });
    } else if (sortBy === 'response') {
      result = [...result].sort((a, b) => {
        const scoreA = worstScore(a, cases, contactLogs);
        const scoreB = worstScore(b, cases, contactLogs);
        return scoreB - scoreA; // Higher compliance = better
      });
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else {
      // worst performers
      result = [...result].sort((a, b) => worstScore(a, cases, contactLogs) - worstScore(b, cases, contactLogs));
    }

    return result;
  }, [lawyers, cases, contactLogs, search, statusFilter, sortBy]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading attorneys" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
        <h1 className="sr-only">Attorney Network</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading attorneys…</p>
      </div>
    );
  }

  const filterPills = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'suspended', label: 'Suspended' },
  ];

  const selectStyle = {
    minHeight: '44px', padding: '8px 12px',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
    color: '#334155', backgroundColor: 'white',
    border: '1px solid var(--slate-200)', borderRadius: '8px',
    outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Page title */}
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
          Attorney Network
        </h1>

        {/* Row 1: Overview bar */}
        <AttorneyOverviewBar lawyers={lawyers} cases={cases} contactLogs={contactLogs} />

        {/* Row 2: Alert bar */}
        <AttorneyAlertBar lawyers={lawyers} cases={cases} contactLogs={contactLogs} onQuickApprove={handleQuickApprove} />

        {/* Row 3: Search + filter pills + sort */}
        <div className="attorney-search-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search by name, firm, email, or state…"
              value={search} onChange={e => setSearch(e.target.value)}
              aria-label="Search attorneys"
              style={{ ...selectStyle, width: '100%', paddingLeft: '2.25rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {filterPills.map(p => (
              <button
                key={p.key} onClick={() => setStatusFilter(p.key)}
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: statusFilter === p.key ? 700 : 500,
                  padding: '6px 14px', minHeight: '44px', borderRadius: '100px', cursor: 'pointer',
                  border: statusFilter === p.key ? '2px solid var(--slate-900)' : '1px solid var(--slate-200)',
                  backgroundColor: statusFilter === p.key ? 'var(--slate-900)' : 'white',
                  color: statusFilter === p.key ? 'white' : 'var(--slate-600)',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort order" style={{ ...selectStyle, flexShrink: 0 }}>
            <option value="worst">Worst Performers</option>
            <option value="name">Name A-Z</option>
            <option value="active">Most Active Cases</option>
            <option value="response">Best Response Rate</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Attorney list */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              {lawyers.length === 0 ? (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem' }}>
                    ⚖️
                  </div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 8px' }}>
                    No attorneys have joined yet
                  </p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569', margin: 0 }}>
                    When lawyers register on the For Attorneys page, they'll appear here for your review.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: '0 0 8px' }}>
                    No attorneys match these filters.
                  </p>
                  <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
                    color: '#C2410C', padding: '4px', minHeight: '44px',
                  }}>
                    Reset filters
                  </button>
                </>
              )}
            </div>
          ) : (
            filtered.map(l => (
              <AttorneyRow
                key={l.id}
                lawyer={l}
                cases={cases}
                contactLogs={contactLogs}
                isExpanded={expandedId === l.id}
                onToggle={() => setExpandedId(expandedId === l.id ? null : l.id)}
                onQuickApprove={handleQuickApprove}
              >
                <AttorneyExpandedPanel
                  lawyer={l}
                  cases={cases}
                  contactLogs={contactLogs}
                  actionButtons={
                    <ActionButtons
                      lawyer={l} cases={cases} contactLogs={contactLogs}
                      onRefresh={loadData} onToast={setToast}
                    />
                  }
                />
              </AttorneyRow>
            ))
          )}
        </div>

        {/* Count footer */}
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'center', padding: '4px' }}>
          Showing {filtered.length} of {lawyers.length} attorney{lawyers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="assertive" style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, backgroundColor: '#15803D', color: 'white',
          padding: '12px 24px', borderRadius: '10px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer',
        }} onClick={() => setToast('')}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}