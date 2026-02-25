import React from 'react';

const RECIPIENT_COLORS = {
  reporter: { bg: '#DBEAFE', color: '#1D4ED8' },
  attorney: { bg: '#F3E8FF', color: '#7C3AED' },
  admin: { bg: '#FEF3C7', color: '#92400E' },
};

export default function EmailTemplateTable({ templates, onSelect, onToggleActive }) {
  if (!templates.length) return null;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 3fr 80px 120px',
        padding: '10px 20px', backgroundColor: '#F8FAFC',
        borderBottom: '2px solid var(--slate-200)', gap: '12px'
      }} className="email-tpl-header">
        {['Template', 'Recipient', 'Trigger', 'Active', 'Last Edited'].map(h => (
          <span key={h} style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
            color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {templates.map(tpl => {
        const rc = RECIPIENT_COLORS[tpl.recipient_type] || RECIPIENT_COLORS.reporter;
        return (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 3fr 80px 120px',
              padding: '14px 20px', gap: '12px',
              backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--slate-200)',
              cursor: 'pointer', width: '100%', textAlign: 'left',
              transition: 'background-color 0.1s', alignItems: 'center'
            }}
            className="email-tpl-row"
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FAFAF9'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)' }}>
                {tpl.template_name}
              </span>
              <span style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                {tpl.template_key}
              </span>
            </div>
            <div>
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '100px',
                backgroundColor: rc.bg, color: rc.color,
                fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                textTransform: 'capitalize'
              }}>
                {tpl.recipient_type}
              </span>
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.4 }}>
              {tpl.trigger_description}
            </span>
            <div onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleActive(tpl); }}
                aria-label={tpl.is_active ? 'Deactivate template' : 'Activate template'}
                style={{
                  width: '40px', height: '22px', borderRadius: '11px',
                  backgroundColor: tpl.is_active ? '#16A34A' : '#CBD5E1',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background-color 0.2s', padding: 0
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  position: 'absolute', top: '2px',
                  left: tpl.is_active ? '20px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#94A3B8' }}>
              {formatDate(tpl.last_edited_at)}
            </span>
          </button>
        );
      })}

      <style>{`
        @media (max-width: 768px) {
          .email-tpl-header { display: none !important; }
          .email-tpl-row {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            padding: 12px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}