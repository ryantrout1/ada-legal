import React from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

const TYPE_LABELS = {
  suggestion: { label: 'Suggestion', color: '#1E3A8A', bg: '#EFF6FF' },
  bug_report: { label: 'Bug Report', color: '#991B1B', bg: 'var(--err-bg)' },
  question: { label: 'Question', color: 'var(--wrn-fg)', bg: 'var(--wrn-bg)' },
  general_feedback: { label: 'General', color: 'var(--body-secondary)', bg: 'var(--card-bg-tinted)' },
};

const STATUS_LABELS = {
  new: { label: 'New', color: 'var(--accent)', bg: '#FEF1EC' },
  reviewed: { label: 'Reviewed', color: 'var(--suc-fg)', bg: '#F0FDF4' },
  archived: { label: 'Archived', color: 'var(--body-secondary)', bg: 'var(--card-bg-tinted)' },
};

function Badge({ label, color, bg }) {
  return (
    <span style={{
      fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
      color, background: bg, padding: '3px 10px', borderRadius: '100px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export default function FeedbackTable({ feedback, expandedId, onToggle, onStatusChange }) {
  if (feedback.length === 0) {
    return (
      <div style={{
        background: 'var(--card-bg)', border: '1px solid #E2E8F0', borderRadius: '12px',
        padding: '48px', textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>No feedback matches your filters.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '32px 100px 100px 1fr 120px 120px 80px',
        padding: '10px 16px', borderBottom: '1px solid #E2E8F0', background: 'var(--page-bg-subtle)',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
        color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em',
        gap: '8px', alignItems: 'center',
      }}
        className="feedback-table-header"
      >
        <span />
        <span>Date</span>
        <span>Type</span>
        <span>Message</span>
        <span>Name</span>
        <span>Page</span>
        <span>Status</span>
      </div>

      {feedback.map(item => {
        const isExpanded = expandedId === item.id;
        const typeInfo = TYPE_LABELS[item.feedback_type] || TYPE_LABELS.general_feedback;
        const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.new;
        const dateStr = item.created_date ? format(new Date(item.created_date), 'MMM d, yy') : '—';
        const truncatedMsg = item.message?.length > 80 ? item.message.slice(0, 80) + '…' : item.message;
        const shortPage = item.page_name ? (item.page_name.replace(/ — ADA Legal Link$/, '').slice(0, 20)) : '—';

        return (
          <div key={item.id}>
            <button
              onClick={() => onToggle(item.id)}
              style={{
                display: 'grid', gridTemplateColumns: '32px 100px 100px 1fr 120px 120px 80px',
                padding: '12px 16px', width: '100%', border: 'none', background: isExpanded ? '#FAFAF9' : 'transparent',
                cursor: 'pointer', textAlign: 'left', gap: '8px', alignItems: 'center',
                borderBottom: isExpanded ? 'none' : '1px solid #F1F5F9',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body)',
              }}
              className="feedback-table-row"
              onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#FAFAF9'; }}
              onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: '#4B5563' }}>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--body-secondary)' }}>{dateStr}</span>
              <span><Badge {...typeInfo} /></span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncatedMsg}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--body-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || '—'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--body-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortPage}</span>
              <span><Badge {...statusInfo} /></span>
            </button>

            {isExpanded && (
              <div style={{
                padding: '16px 16px 16px 56px', background: '#FAFAF9',
                borderBottom: '1px solid #E2E8F0',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="feedback-expanded-grid">
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--body-secondary)', margin: '0 0 4px', textTransform: 'uppercase' }}>Full Message</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{item.message}</p>
                  </div>
                  <div>
                    {item.email && (
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--body-secondary)', margin: '0 0 2px', textTransform: 'uppercase' }}>Email</p>
                        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--body)', margin: 0 }}>{item.email}</p>
                      </div>
                    )}
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--body-secondary)', margin: '0 0 2px', textTransform: 'uppercase' }}>Page URL</p>
                      <a href={item.page_url} target="_blank" rel="noopener noreferrer" style={{
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--accent)',
                        display: 'inline-flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all',
                      }}>
                        {item.page_url} <ExternalLink size={12} />
                      </a>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--body-secondary)', margin: '0 0 6px', textTransform: 'uppercase' }}>Update Status</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['new', 'reviewed', 'archived'].map(s => (
                          <button
                            key={s}
                            onClick={() => onStatusChange(item.id, s)}
                            style={{
                              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                              padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                              border: item.status === s ? '2px solid #1E293B' : '1px solid #E2E8F0',
                              background: item.status === s ? 'var(--heading)' : 'var(--card-bg)',
                              color: item.status === s ? 'white' : 'var(--body)',
                              minHeight: '32px',
                            }}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @media (max-width: 860px) {
          .feedback-table-header { display: none !important; }
          .feedback-table-row {
            display: flex !important; flex-direction: column !important;
            gap: 4px !important; padding: 12px 16px !important;
          }
          .feedback-expanded-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}