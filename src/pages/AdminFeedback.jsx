import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import FeedbackStatCards from '../components/admin/feedback/FeedbackStatCards';
import FeedbackTable from '../components/admin/feedback/FeedbackTable';

const ADMIN_PAGES = ['Admin', 'AdminReview', 'AdminCases', 'AdminAnalytics', 'AdminLawyers', 'AdminEmails', 'AdminFeedback'];

export default function AdminFeedback() {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPage, setFilterPage] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      const items = await base44.entities.Feedback.list('-created_date', 500);
      setFeedback(items);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      total: feedback.length,
      newCount: feedback.filter(f => f.status === 'new').length,
      thisWeek: feedback.filter(f => new Date(f.created_date) >= weekAgo).length,
    };
  }, [feedback]);

  const pageNames = useMemo(() => {
    const names = new Set(feedback.map(f => f.page_name).filter(Boolean));
    return Array.from(names).sort();
  }, [feedback]);

  const filtered = useMemo(() => {
    return feedback.filter(f => {
      if (filterType !== 'all' && f.feedback_type !== filterType) return false;
      if (filterStatus !== 'all' && f.status !== filterStatus) return false;
      if (filterPage !== 'all' && f.page_name !== filterPage) return false;
      return true;
    });
  }, [feedback, filterType, filterStatus, filterPage]);

  const handleStatusChange = async (id, newStatus) => {
    await base44.entities.Feedback.update(id, { status: newStatus });
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
      <style>{`
        button:focus-visible, a:focus-visible, select:focus-visible,
        input:focus-visible, textarea:focus-visible, [role="button"]:focus-visible {
          outline: 3px solid var(--accent-light); outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        @media (prefers-contrast: more) { button, a, input, select, textarea { border-width: 2px !important; } }
      `}</style>
        <div className="a11y-spinner" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <AdminPageHeader title="Feedback" subtitle="User feedback and suggestions" />
        <FeedbackStatCards stats={stats} />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '24px 0 16px' }}>
          <FilterSelect label="Type" value={filterType} onChange={setFilterType} options={[
            { value: 'all', label: 'All Types' },
            { value: 'suggestion', label: 'Suggestion' },
            { value: 'bug_report', label: 'Bug Report' },
            { value: 'question', label: 'Question' },
            { value: 'general_feedback', label: 'General Feedback' },
          ]} />
          <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'new', label: 'New' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'archived', label: 'Archived' },
          ]} />
          <FilterSelect label="Page" value={filterPage} onChange={setFilterPage} options={[
            { value: 'all', label: 'All Pages' },
            ...pageNames.map(p => ({ value: p, label: p.length > 40 ? p.slice(0, 40) + '…' : p })),
          ]} />
        </div>

        <FeedbackTable
          feedback={filtered}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      aria-label={`Filter by ${label}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
        padding: '8px 12px', borderRadius: '8px',
        border: '1px solid #E2E8F0', background: 'white',
        color: 'var(--body)', minHeight: '38px', cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}