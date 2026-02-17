import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Flag, Search } from 'lucide-react';

const accountColors = {
  pending_approval: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DCFCE7', text: '#15803D' },
  suspended: { bg: '#FEE2E2', text: '#B91C1C' },
  removed: { bg: '#F1F5F9', text: '#475569' }
};

const subColors = {
  inactive: { bg: '#F1F5F9', text: '#475569' },
  active: { bg: '#DCFCE7', text: '#15803D' },
  canceled: { bg: '#FEE2E2', text: '#B91C1C' },
  past_due: { bg: '#FEF3C7', text: '#92400E' }
};

function Badge({ label, colorMap }) {
  const c = colorMap[label] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.625rem',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
      color: c.text, backgroundColor: c.bg, borderRadius: '9999px',
      textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap'
    }}>
      {(label || '').replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminLawyers() {
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadLawyers = async () => {
    const all = await base44.entities.LawyerProfile.list('-created_date', 500);
    setLawyers(all);
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      await loadLawyers();
      setLoading(false);
    }
    init();
  }, []);

  const handleApprove = async (lawyer) => {
    setProcessing(true);
    await base44.entities.LawyerProfile.update(lawyer.id, {
      account_status: 'approved',
      approved_at: new Date().toISOString()
    });
    await loadLawyers();
    setProcessing(false);
  };

  const handleSuspend = async (lawyer) => {
    setProcessing(true);
    await base44.entities.LawyerProfile.update(lawyer.id, {
      account_status: 'suspended'
    });
    await loadLawyers();
    setProcessing(false);
  };

  const filtered = lawyers.filter(l => {
    if (statusFilter !== 'all' && l.account_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = (l.full_name || '').toLowerCase().includes(q);
      const firmMatch = (l.firm_name || '').toLowerCase().includes(q);
      const emailMatch = (l.email || '').toLowerCase().includes(q);
      if (!nameMatch && !firmMatch && !emailMatch) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading lawyers…</p>
      </div>
    );
  }

  const selectStyle = {
    minHeight: '40px', padding: '0.5rem 0.75rem',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
    color: 'var(--slate-700)', backgroundColor: 'var(--surface)',
    border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
    outline: 'none', cursor: 'pointer'
  };

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-xl)'
        }}>
          Lawyer Management
        </h1>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap',
          marginBottom: 'var(--space-lg)', alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
            <Search size={16} style={{
              position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--slate-400)', pointerEvents: 'none'
            }} />
            <input
              type="text"
              placeholder="Search by name, firm, or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, width: '100%', paddingLeft: '2.25rem' }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="removed">Removed</option>
          </select>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            color: 'var(--slate-500)', marginLeft: 'auto'
          }}>
            {filtered.length} lawyer{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* List */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden'
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-500)', margin: 0 }}>
                No lawyers match your filters.
              </p>
            </div>
          )}

          {filtered.map(l => {
            const isExpanded = expandedId === l.id;
            return (
              <div key={l.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : l.id)}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center',
                    gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)',
                    background: isExpanded ? 'var(--slate-50)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: '56px'
                  }}
                >
                  {isExpanded
                    ? <ChevronDown size={16} style={{ color: 'var(--terra-600)', flexShrink: 0 }} />
                    : <ChevronRight size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
                      color: 'var(--slate-800)'
                    }}>
                      {l.full_name}
                    </span>
                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      color: 'var(--slate-500)', marginLeft: '0.75rem'
                    }}>
                      {l.firm_name}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                    color: 'var(--slate-500)', display: 'none'
                  }} className="lawyer-email-col">
                    {l.email}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <Badge label={l.account_status} colorMap={accountColors} />
                    <Badge label={l.subscription_status} colorMap={subColors} />
                  </div>
                  {l.flagged && (
                    <Flag size={16} style={{ color: '#B91C1C', flexShrink: 0 }} />
                  )}
                </button>

                {isExpanded && (
                  <div style={{
                    padding: 'var(--space-lg)', borderTop: '1px solid var(--slate-200)',
                    backgroundColor: 'var(--slate-50)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)'
                    }}>
                      <DetailItem label="Email" value={l.email} />
                      <DetailItem label="Phone" value={l.phone} />
                      <DetailItem label="States of Practice" value={(l.states_of_practice || []).join(', ')} />
                      <DetailItem label="Bar Numbers" value={l.bar_numbers} />
                      <DetailItem label="Marketplace Rules" value={l.marketplace_rules_accepted ? 'Accepted' : 'Not Accepted'} />
                      {l.flag_reason && <DetailItem label="Flag Reason" value={l.flag_reason} />}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                      {l.account_status === 'pending_approval' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(l)}
                          disabled={processing}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
                            fontSize: '0.875rem', fontWeight: 700, color: 'white',
                            backgroundColor: processing ? 'var(--slate-400)' : '#15803D',
                            border: 'none', borderRadius: 'var(--radius-md)',
                            cursor: processing ? 'not-allowed' : 'pointer', minHeight: '44px'
                          }}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      )}
                      {l.account_status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleSuspend(l)}
                          disabled={processing}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
                            fontSize: '0.875rem', fontWeight: 700, color: 'white',
                            backgroundColor: processing ? 'var(--slate-400)' : '#B91C1C',
                            border: 'none', borderRadius: 'var(--radius-md)',
                            cursor: processing ? 'not-allowed' : 'pointer', minHeight: '44px'
                          }}
                        >
                          <XCircle size={16} /> Suspend
                        </button>
                      )}
                      {l.account_status === 'suspended' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(l)}
                          disabled={processing}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
                            fontSize: '0.875rem', fontWeight: 700, color: 'white',
                            backgroundColor: processing ? 'var(--slate-400)' : '#15803D',
                            border: 'none', borderRadius: 'var(--radius-md)',
                            cursor: processing ? 'not-allowed' : 'pointer', minHeight: '44px'
                          }}
                        >
                          <CheckCircle size={16} /> Reinstate
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .lawyer-email-col { display: inline !important; }
        }
      `}</style>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
        color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em',
        margin: '0 0 2px 0'
      }}>{label}</p>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
        color: 'var(--slate-800)', margin: 0
      }}>{value || '—'}</p>
    </div>
  );
}