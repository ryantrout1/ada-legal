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
        <div role="status" aria-label="Loading feedback" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="a11y-spinner" aria-hidden="true" />
          <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading feedback…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', minHeight: 'calc(100vh - 200px)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <AdminPageHeader title="Feedback" />
        <FeedbackStatCards stats={stats} />

        {/* Filters */}
        <div role="group" aria-label="Filter feedback" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '24px 0 16px' }}>
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

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {filtered.length} feedback item{filtered.length !== 1 ? 's' : ''} shown
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
  const id = React.useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label htmlFor={id} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          padding: '8px 12px', borderRadius: '8px',
          border: '1px solid var(--card-border)', background: 'var(--card-bg)',
          color: 'var(--body)', minHeight: '44px', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}