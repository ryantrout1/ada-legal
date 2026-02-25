import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Search, X, ArrowUpDown } from 'lucide-react';
import CompactPipelineBar from '../components/admin/cases/CompactPipelineBar';
import AlertSummaryBar from '../components/admin/cases/AlertSummaryBar';
import NeedsAttentionSection from '../components/admin/cases/NeedsAttentionSection';
import CaseManagerTabs, { getTabCounts, filterByTab } from '../components/admin/cases/CaseManagerTabs';
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
    if (sortBy === 'severity') {
      return (SEVERITY_ORDER[a.ai_severity] ?? 3) - (SEVERITY_ORDER[b.ai_severity] ?? 3);
    }
    if (sortBy === 'business') return (a.business_name || '').localeCompare(b.business_name || '');
    if (sortBy === 'lawyer') {
      const la = a.assigned_lawyer_id ? (lawyerMap[a.assigned_lawyer_id]?.full_name || '') : '';
      const lb = b.assigned_lawyer_id ? (lawyerMap[b.assigned_lawyer_id]?.full_name || '') : '';
      return la.localeCompare(lb);
    }
    // newest
    return new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date);
  });
}

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
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const loadData = async () => {
    const [allCases, allLawyers, allLogs] = await Promise.all([
      base44.entities.Case.list('-created_date', 500),
      base44.entities.LawyerProfile.list('-created_date', 500),
      base44.entities.ContactLog.list('-created_date', 500)
    ]);

    // Auto-expire cases available > 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const toExpire = allCases.filter(c =>
      c.status === 'available' && (c.created_date || c.submitted_at) < ninetyDaysAgo
    );
    const now = new Date().toISOString();
    for (const c of toExpire) {
      await base44.entities.Case.update(c.id, { status: 'expired', expired_at: now });
      await base44.entities.TimelineEvent.create({
        case_id: c.id, event_type: 'expired',
        event_description: 'This case was not matched with an attorney within 90 days. You may resubmit at any time.',
        actor_role: 'system', visible_to_user: true, created_at: now
      });
      c.status = 'expired';
      c.expired_at = now;
    }

    setCases(allCases);
    setLawyers(allLawyers);
    setContactLogs(allLogs);
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      // Check for ?search= URL param (e.g. from lawyer activity links)
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) setSearch(searchParam);
      await loadData();
      setLoading(false);
    }
    init();
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const lawyerMap = useMemo(() => {
    const m = {};
    lawyers.forEach(l => { m[l.id] = l; });
    return m;
  }, [lawyers]);

  const approvedLawyers = useMemo(() => {
    return lawyers.filter(l => l.account_status === 'approved');
  }, [lawyers]);

  // Needs attention cases
  const { unclaimed, awaitingContact, needsAttentionIds } = useMemo(() => {
    const now = Date.now();
    const unc = cases.filter(c => c.status === 'available' && daysSince(c.approved_at || c.created_date) >= 7);
    const awc = cases.filter(c => c.status === 'assigned' && c.assigned_at && !c.contact_logged_at && (now - new Date(c.assigned_at).getTime()) >= 86400000);
    const ids = new Set([...unc, ...awc].map(c => c.id));
    return { unclaimed: unc, awaitingContact: awc, needsAttentionIds: ids };
  }, [cases]);

  // Avg assignment days
  const avgAssignDays = useMemo(() => {
    const assigned = cases.filter(c => c.assigned_at && c.approved_at);
    if (assigned.length === 0) return '—';
    const total = assigned.reduce((sum, c) => sum + Math.max(0, (new Date(c.assigned_at) - new Date(c.approved_at)) / 86400000), 0);
    return Math.round(total / assigned.length);
  }, [cases]);

  // Filtered list
  const displayCases = useMemo(() => {
    let result = cases;

    // Pipeline status filter overrides tab
    if (pipelineStatus) {
      result = result.filter(c => c.status === pipelineStatus);
    } else {
      result = filterByTab(result, activeTab);
    }

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter(c => {
        const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
        return (c.business_name || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.state || '').toLowerCase().includes(q) ||
          (c.id || '').toLowerCase().includes(q) ||
          (c.case_id || '').toLowerCase().includes(q) ||
          (c.narrative || '').toLowerCase().includes(q) ||
          (c.ai_summary || '').toLowerCase().includes(q) ||
          (lawyer?.full_name || '').toLowerCase().includes(q);
      });
    }

    return result;
  }, [cases, pipelineStatus, activeTab, debouncedSearch, lawyerMap]);

  const sorted = useMemo(() => sortCases(displayCases, sortBy, lawyerMap, needsAttentionIds), [displayCases, sortBy, lawyerMap, needsAttentionIds]);

  const tabCounts = useMemo(() => getTabCounts(cases), [cases]);

  const handlePipelineClick = (status) => {
    if (pipelineStatus === status) {
      setPipelineStatus(null);
    } else {
      setPipelineStatus(status);
      setActiveTab('all');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPipelineStatus(null);
  };

  const handleForceClose = async (formData) => {
    if (!forceCloseCase) return;
    setCloseSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Case.update(forceCloseCase.id, {
      status: 'closed', closed_at: now, resolution_type: 'admin_closed',
      resolution_notes: formData.resolution_notes, resolved_by: 'admin'
    });
    await base44.entities.TimelineEvent.create({
      case_id: forceCloseCase.id, event_type: 'closed',
      event_description: 'This case has been closed by the platform administrator.',
      actor_role: 'admin', visible_to_user: true, created_at: now
    });
    setCloseSaving(false);
    setForceCloseCase(null);
    setExpandedId(null);
    loadData();
  };

  const handleForceAssign = async (caseData, lawyer) => {
    setActionSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Case.update(caseData.id, {
      status: 'assigned', assigned_lawyer_id: lawyer.id, assigned_at: now
    });
    await base44.entities.TimelineEvent.create({
      case_id: caseData.id, event_type: 'assigned',
      event_description: `An attorney has been assigned to review your case.`,
      actor_role: 'admin', visible_to_user: true, created_at: now
    });
    setActionSaving(false);
    loadData();
  };

  const handleReassign = async (caseData) => {
    const now = new Date().toISOString();
    const lawyerProfile = caseData.assigned_lawyer_id ? lawyerMap[caseData.assigned_lawyer_id] : null;
    await base44.entities.Case.update(caseData.id, { status: 'available', assigned_lawyer_id: '', assigned_at: '' });
    if (lawyerProfile && lawyerProfile.cases_reclaimed != null) {
      await base44.entities.LawyerProfile.update(lawyerProfile.id, { cases_reclaimed: (lawyerProfile.cases_reclaimed || 0) + 1 });
    }
    await base44.entities.TimelineEvent.create({
      case_id: caseData.id, event_type: 'reclaimed',
      event_description: 'This case has been returned to the marketplace by an administrator.',
      actor_role: 'admin', visible_to_user: false, created_at: now
    });
    setExpandedId(null);
    loadData();
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading Case Manager" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <h1 className="sr-only">Case Manager</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading cases…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--slate-900)', margin: 0 }}>
          Case Manager
        </h1>

        {/* Pipeline Dashboard */}
        <PipelineDashboard
          cases={cases}
          activeStatus={pipelineStatus}
          onStatusClick={handlePipelineClick}
          needAttentionCount={needsAttentionIds.size}
          avgAssignDays={avgAssignDays}
        />

        {/* Secondary Stat Cards */}
        <SecondaryStatCards cases={cases} lawyers={lawyers} />

        {/* Needs Attention */}
        <NeedsAttentionSection
          unclaimed={unclaimed}
          awaitingContact={awaitingContact}
          lawyerMap={lawyerMap}
          approvedLawyers={approvedLawyers}
          onForceAssign={handleForceAssign}
          onForceClose={setForceCloseCase}
          onReclaim={handleReassign}
          saving={actionSaving}
        />

        {/* Today's Summary */}
        <TodaySummaryBar cases={cases} avgAssignDays={avgAssignDays} />

        {/* Recent Submissions (collapsible) */}
        <CollapsibleSection
          id="recent-submissions"
          title="📋 Recent Submissions"
          count={cases.filter(c => c.status === 'submitted').length}
        >
          <RecentSubmissionsPanel
            cases={cases}
            onViewAll={() => { handleTabChange('active'); setSortBy('newest'); }}
          />
        </CollapsibleSection>

        {/* Lawyer Activity (collapsible) */}
        <CollapsibleSection
          id="lawyer-activity"
          title="⚖️ Lawyer Activity"
          alertCount={cases.filter(c => c.status === 'assigned' && c.assigned_at && !c.contact_logged_at && (Date.now() - new Date(c.assigned_at).getTime()) >= 86400000).length}
        >
          <LawyerActivityPanel cases={cases} lawyers={lawyers} contactLogs={contactLogs} />
        </CollapsibleSection>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by business name, city, case ID, lawyer name, or keyword…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search cases"
            style={{
              width: '100%', minHeight: '44px', padding: '10px 40px 10px 38px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              border: '1px solid var(--slate-200)', borderRadius: '10px',
              backgroundColor: 'white', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'var(--slate-400)', display: 'flex', minHeight: '44px', minWidth: '44px',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tabs + Sort */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <CaseManagerTabs
            activeTab={pipelineStatus ? 'all' : activeTab}
            onChange={handleTabChange}
            counts={tabCounts}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, paddingBottom: '4px' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--slate-400)' }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              aria-label="Sort order"
              style={{
                minHeight: '44px', padding: '8px 12px', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.8125rem', border: '1px solid var(--slate-200)', borderRadius: '8px',
                backgroundColor: 'white', color: 'var(--slate-700)', cursor: 'pointer',
              }}
            >
              <option value="attention">Needs Attention First</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status">Status</option>
              <option value="severity">Severity (High First)</option>
              <option value="business">Business Name A–Z</option>
              <option value="lawyer">Lawyer Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Pipeline status indicator */}
        {pipelineStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
              Showing: <strong style={{ color: 'var(--slate-700)', textTransform: 'capitalize' }}>{pipelineStatus.replace('_', ' ')}</strong> only
            </span>
            <button
              onClick={() => setPipelineStatus(null)}
              style={{ background: 'none', border: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--terra-600)', cursor: 'pointer', textDecoration: 'underline', padding: '4px', minHeight: '44px' }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Case List */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
          {sorted.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
                No cases match your current filters.
              </p>
            </div>
          )}
          {sorted.map(c => {
            const isExpanded = expandedId === c.id;
            const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
            return (
              <React.Fragment key={c.id}>
                <CaseManagerRow
                  caseData={c}
                  lawyer={lawyer}
                  expanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : c.id)}
                />
                {isExpanded && (
                  <AdminCaseExpanded
                    caseData={c}
                    lawyer={lawyer}
                    onForceClose={setForceCloseCase}
                    onReassign={handleReassign}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Sticky Footer */}
      <StickyFooter viewingCount={sorted.length} totalCount={cases.length} cases={cases} />

      <ForceCloseModal
        open={!!forceCloseCase}
        caseData={forceCloseCase}
        onCancel={() => { if (!closeSaving) setForceCloseCase(null); }}
        onSubmit={handleForceClose}
        saving={closeSaving}
      />
    </div>
  );
}