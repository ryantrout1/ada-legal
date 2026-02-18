import React from 'react';
import { Download } from 'lucide-react';

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
  const t = s.trim();
  if (t.length === 2) return t.toUpperCase();
  return STATE_NAME_TO_ABBR[t] || t;
}

function esc(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportAnalytics({ cases, lawyers, contactLogs, filters }) {
  const handleExport = () => {
    const rows = [];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Header
    const activeFilters = Object.entries(filters).filter(([, v]) => v !== null).map(([k, v]) => `${k}=${v}`).join('; ');
    rows.push(['ADA Legal Connect Analytics Report']);
    rows.push([`Generated: ${dateStr}`]);
    rows.push([`Active Filters: ${activeFilters || 'None'}`]);
    rows.push([]);

    // Case Pipeline
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    rows.push(['CASE PIPELINE']);
    rows.push(['Metric', 'Value']);
    rows.push(['Submitted This Month', cases.filter(c => c.submitted_at && c.submitted_at >= monthStart).length]);
    rows.push(['Approved This Month', cases.filter(c => c.approved_at && c.approved_at >= monthStart).length]);
    rows.push(['Assigned This Month', cases.filter(c => c.assigned_at && c.assigned_at >= monthStart).length]);
    rows.push([]);

    // Marketplace Health
    rows.push(['MARKETPLACE HEALTH']);
    rows.push(['Available Now', cases.filter(c => c.status === 'available').length]);
    rows.push([]);

    // Case Outcomes
    const closed = cases.filter(c => c.status === 'closed');
    rows.push(['CASE OUTCOMES']);
    rows.push(['Total Closed', closed.length]);
    const engaged = closed.filter(c => c.resolution_type === 'engaged').length;
    rows.push(['Engagement Rate', closed.length > 0 ? `${Math.round((engaged / closed.length) * 100)}%` : '—']);
    rows.push([]);

    // Demand Intelligence
    const matchedStatuses = ['assigned', 'in_progress', 'closed'];
    const matchedCases = cases.filter(c => matchedStatuses.includes(c.status) && c.assigned_at);
    let avgDays = '—';
    if (matchedCases.length > 0) {
      const total = matchedCases.reduce((s, c) => s + (new Date(c.assigned_at) - new Date(c.approved_at || c.created_date)) / (1000 * 60 * 60 * 24), 0);
      avgDays = Math.round(total / matchedCases.length);
    }
    const reachedAvail = cases.filter(c => ['available', 'expired', ...matchedStatuses].includes(c.status));
    const expiredCount = cases.filter(c => c.status === 'expired').length;
    const unmatchedRate = reachedAvail.length > 0 ? `${Math.round((expiredCount / reachedAvail.length) * 100)}%` : '—';

    rows.push(['DEMAND INTELLIGENCE']);
    rows.push(['Avg Days to Match', avgDays]);
    rows.push(['Unmatched Rate', unmatchedRate]);
    rows.push(['Expired Cases', expiredCount]);
    rows.push([]);

    // Geographic
    const stateMap = {};
    cases.forEach(c => { const st = normalizeState(c.state); if (st) stateMap[st] = (stateMap[st] || 0) + 1; });
    rows.push(['GEOGRAPHIC BREAKDOWN']);
    rows.push(['State', 'City', 'Case Count']);
    const cityMap = {};
    cases.forEach(c => {
      const st = normalizeState(c.state);
      const city = (c.city || '').trim() || 'Unknown';
      const key = `${st}|${city}`;
      if (!cityMap[key]) cityMap[key] = { state: st, city, count: 0 };
      cityMap[key].count++;
    });
    Object.values(cityMap).sort((a, b) => b.count - a.count).forEach(r => {
      rows.push([r.state, r.city, r.count]);
    });
    rows.push([]);

    // Violation type
    const physical = cases.filter(c => c.violation_type === 'physical_space').length;
    const digital = cases.filter(c => c.violation_type === 'digital_website').length;
    rows.push(['VIOLATION TYPE BREAKDOWN']);
    rows.push(['Type', 'Count']);
    rows.push(['Physical Space', physical]);
    rows.push(['Digital / Website', digital]);
    rows.push([]);

    // Lawyer activity
    const approvedLawyers = lawyers.filter(l => l.account_status === 'approved');
    rows.push(['LAWYER ACTIVITY']);
    rows.push(['Name', 'Firm', 'Active Cases', 'Total Cases', 'Avg Contact Time (hrs)']);
    approvedLawyers.forEach(l => {
      const myCases = cases.filter(c => c.assigned_lawyer_id === l.id);
      const active = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
      const total = myCases.length;
      const casesWithAssign = myCases.filter(c => c.assigned_at);
      let avgHrs = '—';
      if (casesWithAssign.length > 0) {
        const times = casesWithAssign.map(c => {
          const logs = contactLogs.filter(lg => lg.case_id === c.id && lg.lawyer_id === l.id);
          if (logs.length === 0) return null;
          const earliest = logs.reduce((min, lg) => { const t = new Date(lg.logged_at || lg.created_date); return t < min ? t : min; }, new Date('2999-01-01'));
          return (earliest - new Date(c.assigned_at)) / (1000 * 60 * 60);
        }).filter(t => t !== null);
        if (times.length > 0) avgHrs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
      rows.push([l.full_name, l.firm_name, active, total, avgHrs]);
    });
    rows.push([]);

    // Engagement funnel
    const caseIdsWithContact = new Set(contactLogs.map(l => l.case_id));
    rows.push(['ENGAGEMENT FUNNEL']);
    rows.push(['Stage', 'Count']);
    rows.push(['Submitted', cases.length]);
    rows.push(['Approved', cases.filter(c => ['available', 'expired', 'assigned', 'in_progress', 'closed'].includes(c.status)).length]);
    rows.push(['Viewed', cases.filter(c => (c.marketplace_views || 0) > 0).length]);
    rows.push(['Assigned', cases.filter(c => matchedStatuses.includes(c.status)).length]);
    rows.push(['Contacted', cases.filter(c => caseIdsWithContact.has(c.id)).length]);
    rows.push(['Resolved', cases.filter(c => c.status === 'closed').length]);

    const csvContent = rows.map(row => row.map(esc).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ada-legal-connect-analytics-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 1rem',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
        color: 'var(--slate-700)', backgroundColor: 'transparent',
        border: '1px solid var(--slate-700)', borderRadius: 'var(--radius-md)',
        cursor: 'pointer', minHeight: '40px', transition: 'background-color 0.15s'
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Download size={16} /> Export Report
    </button>
  );
}