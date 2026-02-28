import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import RecentPopover from './RecentPopover';
import LawyerAlertsPopover from './LawyerAlertsPopover';

export default function AlertSummaryBar({
  cases,
  needsAttentionCount,
  summaryStats,
  recentSubmissions,
  overdueContacts,
  lawyerMap,
  onExpandAttention,
  attentionExpanded,
}) {
  const [recentOpen, setRecentOpen] = useState(false);
  const [lawyerAlertsOpen, setLawyerAlertsOpen] = useState(false);
  const recentRef = useRef(null);
  const lawyerRef = useRef(null);

  const hasAlerts = needsAttentionCount > 0;
  const recentCount = recentSubmissions.length;
  const alertCount = overdueContacts.length;

  // Close popovers on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (recentOpen) { setRecentOpen(false); recentRef.current?.focus(); }
        if (lawyerAlertsOpen) { setLawyerAlertsOpen(false); lawyerRef.current?.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [recentOpen, lawyerAlertsOpen]);

  // Close on outside click
  useEffect(() => {
    if (!recentOpen && !lawyerAlertsOpen) return;
    const handler = (e) => {
      if (recentOpen && recentRef.current && !recentRef.current.closest('.alert-bar-container')?.contains(e.target)) {
        setRecentOpen(false);
      }
      if (lawyerAlertsOpen && lawyerRef.current && !lawyerRef.current.closest('.alert-bar-container')?.contains(e.target)) {
        setLawyerAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [recentOpen, lawyerAlertsOpen]);

  return (
    <div className="alert-bar-container" style={{ position: 'relative' }}>
      <div
        role="status"
        aria-label={hasAlerts ? `${needsAttentionCount} cases need attention` : 'Summary statistics'}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px 12px',
          padding: '8px 14px',
          minHeight: '40px',
          backgroundColor: hasAlerts ? '#FFFBEB' : 'var(--slate-50)',
          border: `1px solid ${hasAlerts ? '#FDE68A' : 'var(--slate-200)'}`,
          borderRadius: '8px',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.85rem',
          color: hasAlerts ? '#92400E' : 'var(--slate-600)',
        }}
      >
        {/* Left: attention count + summary stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 auto', flexWrap: 'wrap' }}>
          {hasAlerts && (
            <>
              <button
                onClick={onExpandAttention}
                aria-expanded={attentionExpanded}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                  fontWeight: 700, color: '#92400E', padding: '2px 4px',
                  minHeight: '44px', borderRadius: '4px',
                }}
              >
                <AlertTriangle size={14} aria-hidden="true" />
                {needsAttentionCount} need attention
                {attentionExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <span style={{ color: hasAlerts ? '#D4A574' : 'var(--slate-500)' }}>·</span>
            </>
          )}
          <span>Today: <strong>{summaryStats.newToday}</strong> new</span>
          <span style={{ color: hasAlerts ? '#D4A574' : 'var(--slate-500)' }}>·</span>
          <span>This week: <strong>{summaryStats.approvedWeek}</strong> approved, <strong>{summaryStats.rejectedWeek}</strong> rejected</span>
          <span style={{ color: hasAlerts ? '#D4A574' : 'var(--slate-500)' }}>·</span>
          <span>Avg review: <strong>{summaryStats.avgReview}</strong></span>
        </div>

        {/* Right: popover trigger links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <button
              ref={recentRef}
              onClick={() => { setRecentOpen(!recentOpen); setLawyerAlertsOpen(false); }}
              aria-haspopup="true"
              aria-expanded={recentOpen}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--terra-600)', padding: '2px 4px', minHeight: '44px',
                display: 'inline-flex', alignItems: 'center', borderRadius: '4px',
                textDecoration: 'underline', textUnderlineOffset: '2px',
              }}
            >
              Recent ({recentCount})
            </button>
            {recentOpen && (
              <RecentPopover
                submissions={recentSubmissions}
                onClose={() => { setRecentOpen(false); recentRef.current?.focus(); }}
              />
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              ref={lawyerRef}
              onClick={() => { setLawyerAlertsOpen(!lawyerAlertsOpen); setRecentOpen(false); }}
              aria-haspopup="true"
              aria-expanded={lawyerAlertsOpen}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                color: alertCount > 0 ? '#B91C1C' : 'var(--terra-600)',
                padding: '2px 4px', minHeight: '44px',
                display: 'inline-flex', alignItems: 'center', borderRadius: '4px',
                textDecoration: 'underline', textUnderlineOffset: '2px',
              }}
            >
              Lawyer Alerts ({alertCount})
            </button>
            {lawyerAlertsOpen && (
              <LawyerAlertsPopover
                overdueContacts={overdueContacts}
                lawyerMap={lawyerMap}
                onClose={() => { setLawyerAlertsOpen(false); lawyerRef.current?.focus(); }}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .alert-bar-container [role="status"] {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}