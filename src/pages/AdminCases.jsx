import React, { useEffect, useState, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import AdminStatusBar from '../components/admin/shared/AdminStatusBar';
import AdminFilterPill from '../components/admin/shared/AdminFilterPill';
import AdminSortDropdown from '../components/admin/shared/AdminSortDropdown';
import AlertSummaryBar from '../components/admin/cases/AlertSummaryBar';
import NeedsAttentionSection from '../components/admin/cases/NeedsAttentionSection';
import { getTabCounts, filterByTab } from '../components/admin/cases/CaseManagerTabs';
import CaseManagerRow from '../components/admin/cases/CaseManagerRow';
import AdminCaseExpanded from '../components/admin/cases/AdminCaseExpanded';
import StickyFooter from '../components/admin/cases/StickyFooter';
import ForceCloseModal from '../components/admin/ForceCloseModal';

function daysSince(d) { return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 0; }
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortCases(cases, sortBy, lawyerMap, needsAttentionIds) {
  return [...cases].sort((a, b) => {
    if (sortBy === 'attention') {
      const aNeeds = needsAttentionIds.has(a.id) ? 0 : 1;
      const bNeeds = needsAttentionIds.has(b.id) ? 0 : 1;
      if (aNeeds !== bNeeds) return aNeeds - bNeeds;
      return new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date);
    }
    if (sortBy === 'oldest') return new Date(a.submitted_at || a.created_date) - new Date(b.submitted_at || b.created_date);
    if (sortBy === 'status') {
      const p = { submitted: 0, under_review: 1, available: 2, assigned: 3, in_progress: 4, closed: 5, rejected: 6, expired: 7 };
      const diff = (p[a.status] ?? 10) - (p[b.status] ?? 10);
      return diff !== 0 ? diff : new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date);
    }
    if (sortBy === 'severity') return (SEVERITY_ORDER[a.ai_severity] ?? 3) - (SEVERITY_ORDER[b.ai_severity] ?? 3);
    if (sortBy === 'business') return (a.business_name || '').localeCompare(b.business_name || '');
    if (sortBy === 'lawyer') {
      const la = a.assigned_lawyer_id ? (lawyerMap[a.assigned_lawyer_id]?.full_name || '') : '';
      const lb = b.assigned_lawyer_id ? (lawyerMap[b.assigned_lawyer_id]?.full_name || '') : '';
      return la.localeCompare(lb);
    }
    return new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date);
  });
}

const STAGES = [
  { key: 'submitted', label: 'Submitted', color: '#9A3412', bg: 'rgba(251,146,60,0.08)', accent: '#FB923C' },
  { key: 'under_review', label: 'In Review', color: '#1E3A8A', bg: 'rgba(59,130,246,0.08)', accent: '#3B82F6' },
  { key: 'available', label: 'Available', color: '#9A3412', bg: 'rgba(194,65,12,0.08)', accent: '#EA580C' },
  { key: 'assigned', label: 'Assigned', color: '#92400E', bg: 'rgba(217,119,6,0.08)', accent: '#D97706' },
  { key: 'in_progress', label: 'In Progress', color: '#15803D', bg: 'rgba(22,163,74,0.08)', accent: '#16A34A' },
  { key: 'closed', label: 'Closed', color: '#64748B', bg: 'rgba(148,163,184,0.05)' },
  { key: 'rejected', label: 'Rejected', color: '#991B1B', bg: 'rgba(220,38,38,0.05)' },
];
const ACTIVE_KEYS = new Set(['submitted', 'under_review', 'available', 'assigned', 'in_progress']);

const TAB_PILLS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active Pipeline' },
  { key: 'marketplace', label: 'Available Cases' },
  { key: 'with_lawyers', label: 'With Lawyers' },
  { key: 'resolved', label: 'Resolved' },
];

const SORT_OPTIONS = [
  { value: 'attention', label: 'Needs Attention First' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'status', label: 'Status' },
  { value: 'severity', label: 'Severity (High First)' },
  { value: 'business', label: 'Business Name A–Z' },
  { value: 'lawyer', label: 'Lawyer Name A–Z' },
];

export default function AdminCases() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('attention');
  const [activeTab, setActiveTab] = useState('all');
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [forceCloseCase, setForceCloseCase] = useState(null);
  const [closeSaving, setCloseSaving] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [contactLogs, setContactLogs] = useState([]);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const loadData = async () => {
    const [allCases, allLawyers, allLogs] = await Promise.all([
      base44.entities.Case.list('-created_date', 500),
      base44.entities.LawyerProfile.list('-created_date', 500),
      base44.entities.ContactLog.list('-created_date', 500),
    ]);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    const toExpire = allCases.filter(c => c.status === 'available' && (c.created_date || c.submitted_at) < ninetyDaysAgo);
    const now = new Date().toISOString();
    for (const c of toExpire) {
      await base44.entities.Case.update(c.id, { status: 'expired', expired_at: now });
      await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'expired', event_description: 'This case was not matched with an attorney within 90 days.', actor_role: 'system', visible_to_user: true, created_at: now });
      c.status = 'expired'; c.expired_at = now;
    }
    setCases(allCases); setLawyers(allLawyers); setContactLogs(allLogs);
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) setSearch(searchParam);
      await loadData(); setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const lawyerMap = useMemo(() => { const m = {}; lawyers.forEach(l => { m[l.id] = l; }); return m; }, [lawyers]);
  const approvedLawyers = useMemo(() => lawyers.filter(l => l.account_status === 'approved'), [lawyers]);

  const { unclaimed, awaitingContact, needsAttentionIds } = useMemo(() => {
    const now = Date.now();
    const unc = cases.filter(c => c.status === 'available' && daysSince(c.approved_at || c.created_date) >= 7);
    const awc = cases.filter(c => c.status === 'assigned' && c.assigned_at && !c.contact_logged_at && (now - new Date(c.assigned_at).getTime()) >= 86400000);
    return { unclaimed: unc, awaitingContact: awc, needsAttentionIds: new Set([...unc, ...awc].map(c => c.id)) };
  }, [cases]);

  const secondaryStats = useMemo(() => {
    const pendingReview = cases.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
    const activeLawyers = lawyers.filter(l => l.subscription_status === 'active').length;
    const lawyerApps = lawyers.filter(l => l.account_status === 'pending_approval').length;
    const assignedWithLawyer = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
    let compliance = '—';
    if (assignedWithLawyer.length > 0) {
      const compliant = assignedWithLawyer.filter(c => c.contact_logged_at && (new Date(c.contact_logged_at) - new Date(c.assigned_at)) <= 86400000).length;
      compliance = `${Math.round((compliant / assignedWithLawyer.length) * 100)}%`;
    }
    return { pendingReview, activeLawyers, lawyerApps, compliance };
  }, [cases, lawyers]);

  const summaryStats = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);
    const newToday = cases.filter(c => c.submitted_at && c.submitted_at >= todayStart.toISOString()).length;
    const approvedWeek = cases.filter(c => c.approved_at && c.approved_at >= weekStart.toISOString()).length;
    const rejectedWeek = cases.filter(c => c.status === 'rejected' && c.created_date >= weekStart.toISOString()).length;
    const approvedCases = cases.filter(c => c.submitted_at && c.approved_at);
    let avgReview = '—';
    if (approvedCases.length > 0) {
      const avg = approvedCases.reduce((sum, c) => sum + (new Date(c.approved_at) - new Date(c.submitted_at)) / 3600000, 0) / approvedCases.length;
      avgReview = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
    }
    return { newToday, approvedWeek, rejectedWeek, avgReview };
  }, [cases]);

  const recentSubmissions = useMemo(() => cases.filter(c => c.status === 'submitted').sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date)).slice(0, 5), [cases]);
  const overdueContacts = useMemo(() => {
    const cutoff = new Date(Date.now() - 86400000).toISOString();
    return cases.filter(c => c.status === 'assigned' && c.assigned_at && c.assigned_at < cutoff && c.assigned_lawyer_id).map(c => {
      if (contactLogs.some(l => l.case_id === c.id)) return null;
      const lawyer = lawyers.find(l => l.id === c.assigned_lawyer_id);
      if (!lawyer) return null;
      return { caseId: c.id, caseName: c.business_name, lawyerName: lawyer.full_name, hoursOverdue: Math.floor((Date.now() - new Date(c.assigned_at).getTime()) / 3600000) };
    }).filter(Boolean);
  }, [cases, lawyers, contactLogs]);

  // Status bar cells
  const statusCells = useMemo(() => {
    const counts = {};
    STAGES.forEach(s => { counts[s.key] = 0; });
    cases.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });
    let bottleneck = null, maxCount = 0;
    STAGES.forEach(s => { if (ACTIVE_KEYS.has(s.key) && counts[s.key] > maxCount) { maxCount = counts[s.key]; bottleneck = s.key; } });
    return STAGES.map(s => ({
      key: s.key, label: s.label, value: counts[s.key],
      bg: s.bg, color: s.color,
      active: pipelineStatus === s.key,
      accentBorder: s.key === bottleneck && counts[s.key] > 0 ? s.accent : undefined,
      onClick: () => { setPipelineStatus(pipelineStatus === s.key ? null : s.key); setActiveTab('all'); },
      ariaLabel: `Filter to ${s.label}: ${counts[s.key]} cases`,
    }));
  }, [cases, pipelineStatus]);

  const secondaryText = (
    <span>
      {secondaryStats.pendingReview} pending · {secondaryStats.activeLawyers} lawyer{secondaryStats.activeLawyers !== 1 ? 's' : ''} · {secondaryStats.lawyerApps} app{secondaryStats.lawyerApps !== 1 ? 's' : ''} · {secondaryStats.compliance} contact
    </span>
  );

  const displayCases = useMemo(() => {
    let result = cases;
    if (pipelineStatus) result = result.filter(c => c.status === pipelineStatus);
    else result = filterByTab(result, activeTab);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter(c => {
        const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
        return (c.business_name || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q) || (c.case_id || '').toLowerCase().includes(q) || (c.narrative || '').toLowerCase().includes(q) || (c.ai_summary || '').toLowerCase().includes(q) || (lawyer?.full_name || '').toLowerCase().includes(q);
      });
    }
    return result;
  }, [cases, pipelineStatus, activeTab, debouncedSearch, lawyerMap]);

  const sorted = useMemo(() => sortCases(displayCases, sortBy, lawyerMap, needsAttentionIds), [displayCases, sortBy, lawyerMap, needsAttentionIds]);
  const tabCounts = useMemo(() => getTabCounts(cases), [cases]);

  const handleForceClose = async (formData) => {
    if (!forceCloseCase) return;
    setCloseSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Case.update(forceCloseCase.id, { status: 'closed', closed_at: now, resolution_type: 'admin_closed', resolution_notes: formData.resolution_notes, resolved_by: 'admin' });
    await base44.entities.TimelineEvent.create({ case_id: forceCloseCase.id, event_type: 'closed', event_description: 'This case has been closed by the platform administrator.', actor_role: 'admin', visible_to_user: true, created_at: now });
    setCloseSaving(false); setForceCloseCase(null); setExpandedId(null); loadData();
  };

  const handleForceAssign = async (caseData, lawyer) => {
    setActionSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Case.update(caseData.id, { status: 'assigned', assigned_lawyer_id: lawyer.id, assigned_at: now });
    await base44.entities.TimelineEvent.create({ case_id: caseData.id, event_type: 'assigned', event_description: 'An attorney has been assigned to review your case.', actor_role: 'admin', visible_to_user: true, created_at: now });
    setActionSaving(false); loadData();
  };

  const handleReassign = async (caseData) => {
    const now = new Date().toISOString();
    const lp = caseData.assigned_lawyer_id ? lawyerMap[caseData.assigned_lawyer_id] : null;
    await base44.entities.Case.update(caseData.id, { status: 'available', assigned_lawyer_id: '', assigned_at: '' });
    if (lp) await base44.entities.LawyerProfile.update(lp.id, { cases_reclaimed: (lp.cases_reclaimed || 0) + 1 });
    await base44.entities.TimelineEvent.create({ case_id: caseData.id, event_type: 'reclaimed', event_description: 'This case has been returned to the available case pool by an administrator.', actor_role: 'admin', visible_to_user: false, created_at: now });
    setExpandedId(null); loadData();
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading Case Manager" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
        <h1 className="sr-only">Case Manager</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading cases…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AdminPageHeader
          title="Case Manager"
          statusBar={<AdminStatusBar cells={statusCells} secondaryText={secondaryText} />}
          alertBar={
            <AlertSummaryBar
              cases={cases} needsAttentionCount={needsAttentionIds.size} summaryStats={summaryStats}
              recentSubmissions={recentSubmissions} overdueContacts={overdueContacts} lawyerMap={lawyerMap}
              onExpandAttention={() => setAttentionOpen(!attentionOpen)} attentionExpanded={attentionOpen}
            />
          }
          searchValue={search} onSearchChange={setSearch}
          searchPlaceholder="Search by business, city, case ID, lawyer, or keyword…"
          filterPills={
            <>
              {TAB_PILLS.map(p => (
                <AdminFilterPill
                  key={p.key} label={`${p.label}${tabCounts[p.key] !== undefined ? ` (${tabCounts[p.key]})` : ''}`}
                  active={!pipelineStatus && activeTab === p.key}
                  onClick={() => { setActiveTab(p.key); setPipelineStatus(null); }}
                />
              ))}
            </>
          }
          sortDropdown={<AdminSortDropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />}
          listHeader={
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--slate-500)' }}>
              {pipelineStatus ? <>{sorted.length} <span style={{ textTransform: 'capitalize' }}>{pipelineStatus.replace('_', ' ')}</span> · <button onClick={() => setPipelineStatus(null)} style={{ background: 'none', border: 'none', color: '#C2410C', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}>Clear filter</button></> : `All (${sorted.length})`}
            </span>
          }
        />

        {attentionOpen && needsAttentionIds.size > 0 && (
          <NeedsAttentionSection unclaimed={unclaimed} awaitingContact={awaitingContact} lawyerMap={lawyerMap} approvedLawyers={approvedLawyers} onForceAssign={handleForceAssign} onForceClose={setForceCloseCase} onReclaim={handleReassign} saving={actionSaving} />
        )}

        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
          {sorted.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>No cases match your current filters.</p>
            </div>
          )}
          {sorted.map(c => {
            const isExpanded = expandedId === c.id;
            const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
            return (
              <React.Fragment key={c.id}>
                <CaseManagerRow caseData={c} lawyer={lawyer} expanded={isExpanded} onToggle={() => setExpandedId(isExpanded ? null : c.id)} />
                {isExpanded && <AdminCaseExpanded caseData={c} lawyer={lawyer} onForceClose={setForceCloseCase} onReassign={handleReassign} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <StickyFooter viewingCount={sorted.length} totalCount={cases.length} cases={cases} />
      <ForceCloseModal open={!!forceCloseCase} caseData={forceCloseCase} onCancel={() => { if (!closeSaving) setForceCloseCase(null); }} onSubmit={handleForceClose} saving={closeSaving} />
    </div>
  );
}