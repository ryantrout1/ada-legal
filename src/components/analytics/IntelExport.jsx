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
function normalizeState(s) { if (!s) return ''; const t = s.trim(); if (t.length === 2) return t.toUpperCase(); return STATE_NAME_TO_ABBR[t] || t; }
function esc(val) { const str = String(val ?? ''); if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`; return str; }

export default function IntelExport({ activeTab, cases, lawyers, contactLogs }) {
  const handleExport = () => {
    const rows = [];
    const dateStr = new Date().toISOString().split('T')[0];

    if (activeTab === 'operations') {
      // Operations CSV export
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      rows.push(['ADA Legal Link — Operations Report']);
      rows.push([`Generated: ${dateStr}`]);
      rows.push([]);

      // Pipeline
      rows.push(['PERFORMANCE SNAPSHOT']);
      rows.push(['Metric', 'Value']);
      rows.push(['Submitted This Month', cases.filter(c => c.submitted_at && c.submitted_at >= monthStart).length]);
      rows.push(['Approved This Month', cases.filter(c => c.approved_at && c.approved_at >= monthStart).length]);
      rows.push(['Assigned This Month', cases.filter(c => c.assigned_at && c.assigned_at >= monthStart).length]);
      rows.push(['Available Now', cases.filter(c => c.status === 'available').length]);
      rows.push([]);

      // Funnel
      const contactSet = new Set(contactLogs.map(l => l.case_id));
      rows.push(['ENGAGEMENT FUNNEL']);
      rows.push(['Stage', 'Count']);
      rows.push(['Submitted', cases.length]);
      rows.push(['Approved', cases.filter(c => ['available', 'expired', 'assigned', 'in_progress', 'closed'].includes(c.status)).length]);
      rows.push(['Viewed', cases.filter(c => (c.marketplace_views || 0) > 0).length]);
      rows.push(['Assigned', cases.filter(c => ['assigned', 'in_progress', 'closed'].includes(c.status)).length]);
      rows.push(['Contacted', cases.filter(c => contactSet.has(c.id)).length]);
      rows.push(['Resolved', cases.filter(c => c.status === 'closed').length]);
      rows.push([]);

      // Lawyer performance
      rows.push(['LAWYER PERFORMANCE']);
      rows.push(['Name', 'Firm', 'Active Cases', 'Resolved', 'Total', 'Response Rate']);
      lawyers.filter(l => l.account_status === 'approved').forEach(l => {
        const myCases = cases.filter(c => c.assigned_lawyer_id === l.id);
        const active = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
        const resolved = myCases.filter(c => c.status === 'closed').length;
        const withAssign = myCases.filter(c => c.assigned_at);
        let rr = '—';
        if (withAssign.length > 0) {
          const r24 = withAssign.filter(c => {
            const deadline = new Date(new Date(c.assigned_at).getTime() + 86400000);
            return contactLogs.some(lg => lg.case_id === c.id && lg.lawyer_id === l.id && new Date(lg.logged_at || lg.created_date) <= deadline);
          }).length;
          rr = Math.round((r24 / withAssign.length) * 100) + '%';
        }
        rows.push([l.full_name, l.firm_name, active, resolved, myCases.length, rr]);
      });
    } else {
      // ADA Impact CSV export
      rows.push(['ADA Legal Link — State of Accessibility Report']);
      rows.push([`Generated: ${dateStr}`]);
      rows.push([]);

      // Big numbers
      const clusterIds = new Set();
      cases.forEach(c => { if (c.ai_duplicate_cluster_id) clusterIds.add(c.ai_duplicate_cluster_id); });
      const noClusters = cases.filter(c => !c.ai_duplicate_cluster_id).length;
      const communities = new Set();
      cases.forEach(c => { const key = `${(c.city || '').trim().toLowerCase()}|${(c.state || '').trim().toUpperCase()}`; if (key !== '|') communities.add(key); });
      const connected = cases.filter(c => ['assigned', 'in_progress', 'closed'].includes(c.status)).length;

      rows.push(['KEY METRICS']);
      rows.push(['Total Violations Reported', cases.length]);
      rows.push(['Businesses Identified', clusterIds.size + noClusters]);
      rows.push(['Communities Represented', communities.size]);
      rows.push(['Cases Connected to Attorneys', connected]);
      rows.push([]);

      // Geographic
      const stateMap = {};
      cases.forEach(c => { const st = normalizeState(c.state); if (st) stateMap[st] = (stateMap[st] || 0) + 1; });
      rows.push(['GEOGRAPHIC DISTRIBUTION']);
      rows.push(['State', 'Reports']);
      Object.entries(stateMap).sort((a, b) => b[1] - a[1]).forEach(([st, count]) => rows.push([st, count]));
      rows.push([]);

      // Top businesses
      const bizMap = {};
      cases.forEach(c => {
        const cid = c.ai_duplicate_cluster_id || `solo_${c.id}`;
        if (!bizMap[cid]) bizMap[cid] = { name: c.business_name || 'Unknown', location: `${c.city || ''}, ${c.state || ''}`, count: 0 };
        bizMap[cid].count++;
      });
      rows.push(['TOP 25 MOST-REPORTED BUSINESSES']);
      rows.push(['Business Name', 'Location', 'Reports']);
      Object.values(bizMap).sort((a, b) => b.count - a.count).slice(0, 25).forEach(b => rows.push([b.name, b.location, b.count]));
    }

    const csvContent = rows.map(row => row.map(esc).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = activeTab === 'operations' ? 'operations' : 'impact';
    a.download = `ada-legal-link-${suffix}-${dateStr}.csv`;
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
        padding: '0.5rem 1rem', minHeight: '44px',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
        color: 'var(--slate-700)', backgroundColor: 'transparent',
        border: '1px solid var(--slate-700)', borderRadius: 'var(--radius-md)',
        cursor: 'pointer', transition: 'background-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Download size={16} /> Export Report
    </button>
  );
}