import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import trackEvent from '../components/analytics/trackEvent';
import { createPageUrl } from '../utils';
import { CheckCircle, Flag, ArrowUpDown, Zap } from 'lucide-react';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import AdminStatusBar from '../components/admin/shared/AdminStatusBar';
import AdminActionButton from '../components/admin/shared/AdminActionButton';
import AdminSortDropdown from '../components/admin/shared/AdminSortDropdown';
import QCCaseCard from '../components/admin/review/QCCaseCard';
import QCActionModal from '../components/admin/review/QCActionModal';
import CompactViewsFilterRow from '../components/admin/review/CompactViewsFilterRow';
import ViewModeToggle from '../components/admin/review/ViewModeToggle';
import ClusterRow from '../components/admin/review/ClusterRow';
import BulkActionModal from '../components/admin/review/BulkActionModal';
import FilterPanel, { EMPTY_FILTERS, countActiveFilters } from '../components/admin/review/FilterPanel';
import { useSavedViews } from '../components/admin/review/SavedViews';
import TriageMode from '../components/admin/review/TriageMode';
import { renderEmailTemplate } from '../components/emails/renderTemplate';

const SORT_OPTIONS_LIST = [
  { value: 'oldest', label: 'Oldest First' },
  { value: 'newest', label: 'Newest First' },
  { value: 'severity', label: 'Severity (High First)' },
  { value: 'completeness', label: 'Completeness (Ready First)' },
  { value: 'cluster', label: 'Cluster Size (Largest First)' },
];
const SORT_OPTIONS_CLUSTER = [
  { value: 'most', label: 'Most Reports' },
  { value: 'severity', label: 'Highest Severity' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

export default function AdminReview() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [cases, setCases] = useState([]);
  const [sortOrder, setSortOrder] = useState('oldest');
  const [dashboardFilter, setDashboardFilter] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [clusterSort, setClusterSort] = useState('most');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [activeViewId, setActiveViewId] = useState(null);
  const [modalState, setModalState] = useState({ open: false, action: null, caseData: null });
  const [bulkModal, setBulkModal] = useState({ open: false, action: null, clusterId: null, cases: [] });
  const [expandedClusterCase, setExpandedClusterCase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [triageOpen, setTriageOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (!filtersOpen) return; const h = (e) => { if (e.key === 'Escape') setFiltersOpen(false); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [filtersOpen]);

  const loadCases = async () => {
    const [submitted, underReview] = await Promise.all([
      base44.entities.Case.filter({ status: 'submitted' }, 'created_date', 500),
      base44.entities.Case.filter({ status: 'under_review' }, 'created_date', 500),
    ]);
    setCases([...submitted, ...underReview]);
  };

  useEffect(() => {
    async function init() {
      let user;
      try { user = await base44.auth.me(); } catch { base44.auth.redirectToLogin(createPageUrl('AdminReview')); return; }
      if (user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      setUserId(user.id || user.email);
      await loadCases(); setLoading(false);
    }
    init();
  }, []);

  const { views: savedViews, addView, removeView } = useSavedViews(userId);

  // Status bar cells
  const statusCells = useMemo(() => {
    const submitted = cases.filter(c => c.status === 'submitted');
    const total = submitted.length;
    const ready = submitted.filter(c => (c.ai_completeness_score ?? 0) >= 80).length;
    const needs = submitted.filter(c => (c.ai_completeness_score ?? 0) < 50).length;
    const high = submitted.filter(c => c.ai_severity === 'high').length;
    const clusterIds = new Set();
    submitted.forEach(c => { if (c.ai_duplicate_cluster_id && (c.ai_duplicate_cluster_size ?? 0) >= 2) clusterIds.add(c.ai_duplicate_cluster_id); });
    return [
      { key: 'total', label: 'Queue Total', value: total, color: 'var(--slate-800)', active: !dashboardFilter, onClick: () => setDashboardFilter(null) },
      { key: 'ready', label: 'Ready', value: ready, bg: 'rgba(220,252,231,0.5)', color: '#15803D', active: dashboardFilter === 'ready', onClick: () => setDashboardFilter(dashboardFilter === 'ready' ? null : 'ready') },
      { key: 'needs', label: 'Needs Info', value: needs, bg: 'rgba(254,243,199,0.5)', color: '#B45309', warn: needs > 0, active: dashboardFilter === 'needs', onClick: () => setDashboardFilter(dashboardFilter === 'needs' ? null : 'needs') },
      { key: 'high', label: 'High Sev', value: high, bg: 'rgba(254,226,226,0.5)', color: '#B91C1C', active: dashboardFilter === 'high', onClick: () => setDashboardFilter(dashboardFilter === 'high' ? null : 'high') },
      { key: 'clusters', label: 'Clusters', value: clusterIds.size, bg: 'rgba(219,234,254,0.5)', color: '#1E3A8A', active: dashboardFilter === 'clusters', onClick: () => setDashboardFilter(dashboardFilter === 'clusters' ? null : 'clusters') },
    ];
  }, [cases, dashboardFilter]);

  const secondaryText = useMemo(() => {
    const submitted = cases.filter(c => c.status === 'submitted');
    const today = new Date().toISOString().split('T')[0];
    const newToday = submitted.filter(c => (c.submitted_at || c.created_date || '').startsWith(today)).length;
    const clusterMap = {};
    submitted.forEach(c => { if (c.ai_duplicate_cluster_id && (c.ai_duplicate_cluster_size ?? 0) >= 2) { if (!clusterMap[c.ai_duplicate_cluster_id] || (c.ai_duplicate_cluster_size ?? 0) > clusterMap[c.ai_duplicate_cluster_id].size) clusterMap[c.ai_duplicate_cluster_id] = { name: c.business_name, size: c.ai_duplicate_cluster_size ?? 0 }; } });
    let topCluster = null;
    Object.values(clusterMap).forEach(v => { if (!topCluster || v.size > topCluster.size) topCluster = v; });
    const readyPct = submitted.length > 0 ? Math.round((submitted.filter(c => (c.ai_completeness_score ?? 0) >= 80).length / submitted.length) * 100) : 0;
    return <span>{newToday} new today{topCluster ? ` · Top cluster: ${topCluster.name} (${topCluster.size})` : ''} · {readyPct}% review-ready</span>;
  }, [cases]);

  const displayCases = useMemo(() => {
    let result = cases;
    if (dashboardFilter) {
      const submitted = result.filter(c => c.status === 'submitted');
      if (dashboardFilter === 'ready') result = submitted.filter(c => (c.ai_completeness_score ?? 0) >= 80);
      else if (dashboardFilter === 'needs') result = submitted.filter(c => (c.ai_completeness_score ?? 0) < 50);
      else if (dashboardFilter === 'high') result = submitted.filter(c => c.ai_severity === 'high');
      else if (dashboardFilter === 'clusters') result = submitted.filter(c => c.ai_duplicate_cluster_id && (c.ai_duplicate_cluster_size ?? 0) >= 2);
      else result = submitted;
    }
    const f = filters;
    if (f.status === 'submitted') result = result.filter(c => c.status === 'submitted');
    else if (f.status === 'under_review') result = result.filter(c => c.status === 'under_review');
    if (f.violationTypes.length) result = result.filter(c => f.violationTypes.includes(c.violation_type));
    if (f.severities.length) result = result.filter(c => f.severities.includes(c.ai_severity));
    if (f.completeness.length) result = result.filter(c => { const s = c.ai_completeness_score ?? 0; return (f.completeness.includes('ready') && s >= 80) || (f.completeness.includes('partial') && s >= 50 && s < 80) || (f.completeness.includes('incomplete') && s < 50); });
    if (f.states.length) result = result.filter(c => f.states.includes(c.state));
    if (f.categories.length) result = result.filter(c => f.categories.includes(c.ai_category));
    if (f.hasCluster) result = result.filter(c => (c.ai_duplicate_cluster_size ?? 0) >= 2);
    if (f.flaggedOnly) result = result.filter(c => c.qc_flagged);
    if (f.dateAfter) result = result.filter(c => new Date(c.submitted_at || c.created_date) >= new Date(f.dateAfter));
    if (f.dateBefore) result = result.filter(c => new Date(c.submitted_at || c.created_date) <= new Date(f.dateBefore + 'T23:59:59'));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(c => (c.business_name || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q) || (c.case_id || '').toLowerCase().includes(q) || (c.narrative || '').toLowerCase().includes(q) || (c.ai_summary || '').toLowerCase().includes(q) || (c.url_domain || '').toLowerCase().includes(q));
    }
    return result;
  }, [cases, dashboardFilter, filters, searchQuery]);

  const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
  const flaggedCases = displayCases.filter(c => c.qc_flagged);
  const sortedCases = [...displayCases].sort((a, b) => {
    if (a.qc_flagged && !b.qc_flagged) return -1; if (!a.qc_flagged && b.qc_flagged) return 1;
    if (sortOrder === 'severity') return (SEVERITY_ORDER[a.ai_severity] ?? 3) - (SEVERITY_ORDER[b.ai_severity] ?? 3);
    if (sortOrder === 'completeness') return (b.ai_completeness_score ?? 0) - (a.ai_completeness_score ?? 0);
    if (sortOrder === 'cluster') return (b.ai_duplicate_cluster_size ?? 0) - (a.ai_duplicate_cluster_size ?? 0);
    const dA = new Date(a.submitted_at || a.created_date), dB = new Date(b.submitted_at || b.created_date);
    return sortOrder === 'oldest' ? dA - dB : dB - dA;
  });

  const { clusters, individualCases } = useMemo(() => {
    const clusterMap = {}; const individuals = [];
    displayCases.forEach(c => { const cid = c.ai_duplicate_cluster_id; if (cid && (c.ai_duplicate_cluster_size ?? 0) >= 2) { if (!clusterMap[cid]) clusterMap[cid] = []; clusterMap[cid].push(c); } else individuals.push(c); });
    let clusterList = Object.entries(clusterMap).map(([id, cs]) => {
      const highestSev = ['high', 'medium', 'low'].find(s => cs.some(c => c.ai_severity === s)) || null;
      const avgScore = Math.round(cs.map(c => c.ai_completeness_score ?? 0).reduce((a, b) => a + b, 0) / cs.length);
      const dates = cs.map(c => new Date(c.submitted_at || c.created_date));
      return { id, cases: cs, highestSev, avgScore, newest: Math.max(...dates), oldest: Math.min(...dates) };
    });
    const CLUSTER_SEV_ORDER = { high: 0, medium: 1, low: 2 };
    if (clusterSort === 'most') clusterList.sort((a, b) => b.cases.length - a.cases.length);
    else if (clusterSort === 'severity') clusterList.sort((a, b) => (CLUSTER_SEV_ORDER[a.highestSev] ?? 3) - (CLUSTER_SEV_ORDER[b.highestSev] ?? 3));
    else if (clusterSort === 'newest') clusterList.sort((a, b) => b.newest - a.newest);
    else if (clusterSort === 'oldest') clusterList.sort((a, b) => a.oldest - b.oldest);
    return { clusters: clusterList, individualCases: individuals };
  }, [displayCases, clusterSort]);

  const handleBulkApprove = (clusterId, cs) => setBulkModal({ open: true, action: 'approve', clusterId, cases: cs });
  const handleBulkReject = (clusterId, cs) => setBulkModal({ open: true, action: 'reject', clusterId, cases: cs });
  const handleBulkConfirm = async ({ reason, comment }) => {
    setSaving(true); const now = new Date().toISOString();
    if (bulkModal.action === 'approve') {
      for (const c of bulkModal.cases) { await base44.entities.Case.update(c.id, { status: 'available', approved_at: now, qc_reviewer_notes: comment || null }); await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'approved', event_description: 'Your case has been approved and is now visible to attorneys.', actor_role: 'admin', visible_to_user: true, created_at: now }); try { const prefLabel = c.contact_preference === 'phone' ? 'Phone' : c.contact_preference === 'email' ? 'Email' : 'No Preference'; const rendered = await renderEmailTemplate('case_approved', { reporter_name: c.contact_name, business_name: c.business_name, contact_preference: prefLabel, case_url: window.location.origin + '/MyCases' }); if (rendered) await base44.integrations.Core.SendEmail({ to: c.contact_email, subject: rendered.subject, body: rendered.body }); } catch {} }
      setToast({ type: 'success', message: `${bulkModal.cases.length} cases approved` });
    }
    if (bulkModal.action === 'reject') {
      const R = [{ value: 'insufficient_detail', emailText: 'We were unable to fully evaluate your report.' }, { value: 'not_ada_violation', emailText: 'The issue does not appear to fall under ADA.' }, { value: 'duplicate', emailText: 'This report is a duplicate.' }, { value: 'incomplete_contact', emailText: 'Contact information was incomplete.' }, { value: 'other', emailText: '' }];
      const txt = (R.find(r => r.value === reason)?.emailText || '') + (comment ? ' ' + comment : '');
      const url = window.location.origin + '/MyCases';
      for (const c of bulkModal.cases) { await base44.entities.Case.update(c.id, { status: 'rejected', qc_rejection_reason: reason, qc_reviewer_notes: comment || null }); await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'rejected', event_description: 'After review, this report did not meet criteria.', actor_role: 'admin', visible_to_user: true, created_at: now }); try { const rendered = await renderEmailTemplate('case_rejected', { reporter_name: c.contact_name, business_name: c.business_name, rejection_reason: txt, case_url: url, standards_guide_url: window.location.origin + '/StandardsGuide', intake_url: window.location.origin + '/Intake' }); if (rendered) await base44.integrations.Core.SendEmail({ to: c.contact_email, subject: rendered.subject, body: rendered.body }); } catch {} }
      setToast({ type: 'success', message: `${bulkModal.cases.length} cases rejected` });
    }
    await loadCases(); setSaving(false); setBulkModal({ open: false, action: null, clusterId: null, cases: [] });
  };

  const openModal = (action, caseData) => setModalState({ open: true, action, caseData });
  const closeModal = () => { if (!saving) setModalState({ open: false, action: null, caseData: null }); };

  const handleConfirm = async ({ reason, comment, internalNotes }) => {
    if (!modalState.caseData) return; setSaving(true);
    const c = modalState.caseData; const now = new Date().toISOString();
    if (modalState.action === 'approve') {
      base44.analytics.track({ eventName: 'admin_case_reviewed', properties: { action: 'approve', case_id: c.id } });
      trackEvent('admin_case_reviewed', { action: 'approve', case_id: c.id }, 'AdminReview');
      base44.analytics.track({ eventName: 'case_status_changed', properties: { case_id: c.id, old_status: c.status, new_status: 'available' } });
      trackEvent('case_status_changed', { case_id: c.id, old_status: c.status, new_status: 'available' }, 'AdminReview');
      await base44.entities.Case.update(c.id, { status: 'available', approved_at: now, qc_reviewer_notes: comment || null });
      await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'approved', event_description: 'Your case has been approved and is now visible to attorneys.', actor_role: 'admin', visible_to_user: true, created_at: now });
      if (comment) await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'reviewed', event_description: `QC Note: ${comment}`, actor_role: 'admin', visible_to_user: false, created_at: now });
      // Send case_approved email to reporter
      try {
        const prefLabel = c.contact_preference === 'phone' ? 'Phone' : c.contact_preference === 'email' ? 'Email' : 'No Preference';
        const rendered = await renderEmailTemplate('case_approved', { reporter_name: c.contact_name, business_name: c.business_name, contact_preference: prefLabel, case_url: window.location.origin + '/MyCases' });
        if (rendered) await base44.integrations.Core.SendEmail({ to: c.contact_email, subject: rendered.subject, body: rendered.body });
      } catch {}
      setToast({ type: 'success', message: 'Case approved' });
    }
    if (modalState.action === 'reject') {
      base44.analytics.track({ eventName: 'admin_case_reviewed', properties: { action: 'reject', case_id: c.id } });
      trackEvent('admin_case_reviewed', { action: 'reject', case_id: c.id }, 'AdminReview');
      base44.analytics.track({ eventName: 'case_status_changed', properties: { case_id: c.id, old_status: c.status, new_status: 'rejected' } });
      trackEvent('case_status_changed', { case_id: c.id, old_status: c.status, new_status: 'rejected' }, 'AdminReview');
      await base44.entities.Case.update(c.id, { status: 'rejected', qc_rejection_reason: reason, qc_reviewer_notes: internalNotes || null });
      await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'rejected', event_description: 'After review, this report did not meet the criteria.', actor_role: 'admin', visible_to_user: true, created_at: now });
      await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'reviewed', event_description: `Rejection: ${reason}${internalNotes ? `. Note: ${internalNotes}` : ''}`, actor_role: 'admin', visible_to_user: false, created_at: now });
      const R = [{ value: 'appears_compliant', t: 'Appears to meet ADA standards.' }, { value: 'not_ada_violation', t: 'Does not fall under ADA.' }, { value: 'insufficient_documentation', t: 'Insufficient documentation.' }, { value: 'exempt_entity', t: 'Entity may be exempt.' }, { value: 'statute_of_limitations', t: 'Timeline limitations.' }, { value: 'already_remediated', t: 'Barrier may have been remediated.' }, { value: 'duplicate', t: 'Duplicate submission.' }, { value: 'other', t: '' }];
      const emailTxt = (R.find(r => r.value === reason)?.t || '') + (comment ? ' ' + comment : '');
      try { const rendered = await renderEmailTemplate('case_rejected', { reporter_name: c.contact_name, business_name: c.business_name, rejection_reason: emailTxt, case_url: window.location.origin + '/MyCases', standards_guide_url: window.location.origin + '/StandardsGuide', intake_url: window.location.origin + '/Intake' }); if (rendered) await base44.integrations.Core.SendEmail({ to: c.contact_email, subject: rendered.subject, body: rendered.body }); } catch {}
      setToast({ type: 'success', message: 'Case rejected & email sent' });
    }
    if (modalState.action === 'flag') {
      base44.analytics.track({ eventName: 'admin_case_reviewed', properties: { action: 'flag', case_id: c.id } });
      trackEvent('admin_case_reviewed', { action: 'flag', case_id: c.id }, 'AdminReview');
      await base44.entities.Case.update(c.id, { qc_flagged: true, qc_flag_reason: reason, qc_reviewer_notes: comment || c.qc_reviewer_notes || null });
      await base44.entities.TimelineEvent.create({ case_id: c.id, event_type: 'reviewed', event_description: `Flagged: ${reason}${comment ? `. Note: ${comment}` : ''}`, actor_role: 'admin', visible_to_user: false, created_at: now });
      setToast({ type: 'warning', message: 'Case flagged' });
    }
    await loadCases(); setSaving(false); closeModal();
  };

  if (loading) {
    return (<div role="status" aria-label="Loading review queue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}><div className="a11y-spinner" aria-hidden="true" /><p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading review queue…</p></div>);
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
      <style>{`
        button:focus-visible, a:focus-visible, select:focus-visible,
        input:focus-visible, textarea:focus-visible, [role="button"]:focus-visible {
          outline: 3px solid var(--accent-light); outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        @media (prefers-contrast: more) { button, a, input, select, textarea { border-width: 2px !important; } }
      `}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AdminPageHeader
          title="QC Review Queue"
          actionButton={
            <AdminActionButton
              icon={<Zap size={14} />} label="Triage"
              onClick={() => setTriageOpen(true)} disabled={displayCases.length === 0}
            />
          }
          statusBar={<AdminStatusBar cells={statusCells} secondaryText={secondaryText} />}
          searchValue={searchQuery} onSearchChange={setSearchQuery}
          searchPlaceholder="Search by business, city, state, case ID, or keyword…"
          filterPills={
            <>
              {userId && (
                <CompactViewsFilterRow
                  views={savedViews} activeViewId={activeViewId}
                  onApply={(v) => { setActiveViewId(v.id); setSearchQuery(v.config.search || ''); setFilters(v.config.filters ? { ...EMPTY_FILTERS, ...v.config.filters } : { ...EMPTY_FILTERS }); setSortOrder(v.config.sortOrder || 'oldest'); setClusterSort(v.config.clusterSort || 'most'); setViewMode(v.config.viewMode || 'list'); }}
                  onRemove={(id) => { removeView(id); if (activeViewId === id) setActiveViewId(null); }}
                  onSave={(name) => addView(name, { search: searchQuery, filters, sortOrder, clusterSort, viewMode })}
                  filterCount={countActiveFilters(filters)} onToggleFilters={() => setFiltersOpen(!filtersOpen)} filtersOpen={filtersOpen}
                />
              )}
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </>
          }
          sortDropdown={
            <AdminSortDropdown
              value={viewMode === 'list' ? sortOrder : clusterSort}
              onChange={viewMode === 'list' ? setSortOrder : setClusterSort}
              options={viewMode === 'list' ? SORT_OPTIONS_LIST : SORT_OPTIONS_CLUSTER}
            />
          }
          listHeader={
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--slate-500)' }}>
              {dashboardFilter ? <><span style={{ textTransform: 'capitalize' }}>{dashboardFilter}</span> ({displayCases.length})</> : `All (${displayCases.length})`}
              {dashboardFilter && (
                <> · <button onClick={() => setDashboardFilter(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}>Clear filter</button></>
              )}
            </span>
          }
        />

        <FilterPanel filters={filters} onChange={(f) => { setFilters(f); setActiveViewId(null); }} open={filtersOpen} />

        {flaggedCases.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #FDE68A' }}>
            <Flag size={16} style={{ color: '#92400E' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: '#92400E' }}>{flaggedCases.length} case{flaggedCases.length !== 1 ? 's' : ''} flagged for review</span>
          </div>
        )}

        {cases.length === 0 ? (
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><CheckCircle size={28} style={{ color: '#15803D' }} /></div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 8px' }}>All caught up — no cases pending review</h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body-secondary)', margin: 0 }}>New submissions will appear here automatically.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedCases.map(c => <QCCaseCard key={c.id} caseData={c} onApprove={() => openModal('approve', c)} onReject={() => openModal('reject', c)} onFlag={() => openModal('flag', c)} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clusters.map(cl => <ClusterRow key={cl.id} clusterId={cl.id} cases={cl.cases} onBulkApprove={handleBulkApprove} onBulkReject={handleBulkReject} onExpandCase={(c) => setExpandedClusterCase(expandedClusterCase?.id === c.id ? null : c)} />)}
            {expandedClusterCase && <div style={{ marginTop: '-6px' }}><QCCaseCard key={expandedClusterCase.id} caseData={expandedClusterCase} defaultExpanded={true} onApprove={() => openModal('approve', expandedClusterCase)} onReject={() => openModal('reject', expandedClusterCase)} onFlag={() => openModal('flag', expandedClusterCase)} /></div>}
            {individualCases.length > 0 && (
              <>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: '20px 0 4px' }}>Individual Reports ({individualCases.length})</h2>
                {individualCases.map(c => <QCCaseCard key={c.id} caseData={c} onApprove={() => openModal('approve', c)} onReject={() => openModal('reject', c)} onFlag={() => openModal('flag', c)} />)}
              </>
            )}
          </div>
        )}
      </div>

      <BulkActionModal open={bulkModal.open} action={bulkModal.action} businessName={bulkModal.cases[0]?.business_name || ''} count={bulkModal.cases.length} onConfirm={handleBulkConfirm} onCancel={() => { if (!saving) setBulkModal({ open: false, action: null, clusterId: null, cases: [] }); }} saving={saving} />
      <QCActionModal open={modalState.open} action={modalState.action} businessName={modalState.caseData?.business_name} onConfirm={handleConfirm} onCancel={closeModal} saving={saving} />
      {triageOpen && <TriageMode filteredCases={displayCases} onExit={(s) => { setTriageOpen(false); const t = s.approved + s.rejected + s.flagged + s.skipped; if (t > 0) setToast({ type: 'success', message: `Session: ${t} reviewed — ${s.approved} approved, ${s.rejected} rejected, ${s.flagged} flagged, ${s.skipped} skipped` }); }} onCasesChanged={loadCases} />}

      {toast && (
        <div role="alert" aria-live="assertive" style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, padding: '12px 24px', borderRadius: '10px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer', backgroundColor: toast.type === 'success' ? '#15803D' : '#D97706', color: 'white' }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }}} tabIndex="0" onClick={() => setToast(null)}>
          ✓ {toast.message}
        </div>
      )}
    </div>
  );
}