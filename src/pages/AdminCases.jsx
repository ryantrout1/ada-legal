import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Search } from 'lucide-react';
import AdminCaseRow from '../components/admin/cases/AdminCaseRow';
import AdminCaseExpanded from '../components/admin/cases/AdminCaseExpanded';
import ForceCloseModal from '../components/admin/ForceCloseModal';

const STATE_NAME_TO_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
  'Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY',
  'Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
  'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
  'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
};

function normalizeState(s) {
  if (!s) return '';
  const trimmed = s.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed] || trimmed;
}

const STATUS_PRIORITY = {
  submitted: 0, under_review: 1, available: 2, approved: 3,
  assigned: 4, in_progress: 5, closed: 6, rejected: 7, expired: 8
};

function sortCases(cases, sortBy) {
  return [...cases].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.submitted_at || a.created_date) - new Date(b.submitted_at || b.created_date);
    }
    if (sortBy === 'status') {
      const pa = STATUS_PRIORITY[a.status] ?? 10;
      const pb = STATUS_PRIORITY[b.status] ?? 10;
      if (pa !== pb) return pa - pb;
      return new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date);
    }
    if (sortBy === 'name') {
      return (a.business_name || '').localeCompare(b.business_name || '');
    }
    // default: newest
    return new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date);
  });
}

export default function AdminCases() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [violationFilter, setViolationFilter] = useState('all');
  const [lawyerFilter, setLawyerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedId, setExpandedId] = useState(null);
  const [forceCloseCase, setForceCloseCase] = useState(null);
  const [closeSaving, setCloseSaving] = useState(false);

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

  const handleReassign = async (caseData) => {
    const now = new Date().toISOString();
    const lawyerProfile = caseData.assigned_lawyer_id ? lawyerMap[caseData.assigned_lawyer_id] : null;
    await base44.entities.Case.update(caseData.id, {
      status: 'available', assigned_lawyer_id: '', assigned_at: ''
    });
    if (lawyerProfile && lawyerProfile.cases_reclaimed != null) {
      await base44.entities.LawyerProfile.update(lawyerProfile.id, {
        cases_reclaimed: (lawyerProfile.cases_reclaimed || 0) + 1
      });
    }
    await base44.entities.TimelineEvent.create({
      case_id: caseData.id, event_type: 'reclaimed',
      event_description: 'This case has been returned to the marketplace by an administrator.',
      actor_role: 'admin', visible_to_user: false, created_at: now
    });
    setExpandedId(null);
    loadData();
  };

  const lawyerMap = {};
  lawyers.forEach(l => { lawyerMap[l.id] = l; });

  // Lawyers who have/had cases assigned
  const assignedLawyerIds = [...new Set(cases.filter(c => c.assigned_lawyer_id).map(c => c.assigned_lawyer_id))];
  const assignedLawyers = assignedLawyerIds.map(id => lawyerMap[id]).filter(Boolean);

  const filtered = cases.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (violationFilter !== 'all' && c.violation_type !== violationFilter) return false;
    if (lawyerFilter !== 'all' && c.assigned_lawyer_id !== lawyerFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const idMatch = (c.id || '').toLowerCase().includes(q);
      const nameMatch = (c.business_name || '').toLowerCase().includes(q);
      if (!idMatch && !nameMatch) return false;
    }
    return true;
  });

  const sorted = sortCases(filtered, sortBy);

  if (loading) {
    return (
      <div role="status" aria-label="Loading cases" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <h1 className="sr-only">All Cases</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading cases…</p>
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
            All Cases
          </h1>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            color: '#475569'
          }}>
            {filtered.length} case{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filter Bar */}
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
              placeholder="Search by business name or case ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search cases"
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
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={violationFilter}
            onChange={e => setViolationFilter(e.target.value)}
            style={selectStyle}
            aria-label="Filter by violation type"
          >
            <option value="all">All Violations</option>
            <option value="physical_space">Physical Space</option>
            <option value="digital_website">Digital / Website</option>
          </select>
          <select
            value={lawyerFilter}
            onChange={e => setLawyerFilter(e.target.value)}
            style={selectStyle}
            aria-label="Filter by assigned lawyer"
          >
            <option value="all">All Lawyers</option>
            {assignedLawyers.sort((a, b) => a.full_name.localeCompare(b.full_name)).map(l => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={selectStyle}
            aria-label="Sort cases"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">Status</option>
            <option value="name">Business Name A–Z</option>
          </select>
        </div>

        {/* Case List */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '12px', overflow: 'hidden'
        }}>
          {sorted.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
                No cases match your filters.
              </p>
            </div>
          )}

          {sorted.map(c => {
            const isExpanded = expandedId === c.id;
            const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
            return (
              <React.Fragment key={c.id}>
                <AdminCaseRow
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