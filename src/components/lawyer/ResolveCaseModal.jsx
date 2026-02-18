import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../a11y/FocusTrap';

const RESOLUTION_OPTIONS = [
  { value: 'engaged', label: 'Engaged', desc: 'I am representing this claimant' },
  { value: 'referred_out', label: 'Referred Out', desc: 'I referred this to another attorney' },
  { value: 'not_viable', label: 'Not Viable', desc: 'This case does not have sufficient merit to pursue' },
  { value: 'claimant_unresponsive', label: 'Claimant Unresponsive', desc: 'I could not reach the claimant after multiple attempts' },
  { value: 'claimant_declined', label: 'Claimant Declined', desc: 'The claimant decided not to pursue legal action' }
];

const VALUE_OPTIONS = [
  { value: 'under_5k', label: 'Under $5,000' },
  { value: '5k_25k', label: '$5,000 – $25,000' },
  { value: '25k_75k', label: '$25,000 – $75,000' },
  { value: '75k_plus', label: '$75,000+' }
];

const TIMELINE_OPTIONS = [
  { value: '1_3_months', label: '1–3 months' },
  { value: '3_6_months', label: '3–6 months' },
  { value: '6_12_months', label: '6–12 months' },
  { value: '12_plus_months', label: '12+ months' }
];

const RESOLUTION_LABELS = {
  engaged: 'Engaged — representing this claimant',
  referred_out: 'Referred Out — referred to another attorney',
  not_viable: 'Not Viable — insufficient merit',
  claimant_unresponsive: 'Claimant Unresponsive',
  claimant_declined: 'Claimant Declined'
};

export default function ResolveCaseModal({ open, caseData, onSubmit, onCancel, saving }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    resolution_type: '',
    resolution_notes: '',
    estimated_case_value: '',
    expected_timeline: ''
  });

  const trapRef = useFocusTrap(open && !!caseData, () => { if (!saving) handleClose(); });

  if (!open || !caseData) return null;

  const isEngaged = form.resolution_type === 'engaged';
  const canProceedStep1 = !!form.resolution_type;
  const canProceedStep2 = form.resolution_notes.trim().length > 0 &&
    (!isEngaged || (form.estimated_case_value && form.expected_timeline));

  const handleSubmit = () => {
    onSubmit(form);
  };

  const handleClose = () => {
    setStep(1);
    setForm({ resolution_type: '', resolution_notes: '', estimated_case_value: '', expected_timeline: '' });
    onCancel();
  };

  const selectStyle = {
    width: '100%', padding: '0.5rem 0.75rem',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
    border: '2px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
    color: 'var(--slate-800)', outline: 'none', backgroundColor: 'white'
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="resolve-heading"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem'
      }} onClick={e => { if (e.target === e.currentTarget && !saving) handleClose(); }}>
      <div ref={trapRef} style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflow: 'auto', padding: 'var(--space-xl)'
      }}>
        <h2 id="resolve-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--slate-900)', margin: '0 0 var(--space-lg) 0'
        }}>
          Resolve Case — {caseData.business_name}
        </h2>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-lg)' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              backgroundColor: s <= step ? 'var(--terra-600)' : 'var(--slate-200)'
            }} />
          ))}
        </div>

        {/* Step 1: Resolution Type */}
        {step === 1 && (
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.75rem' }}>
              How was this case resolved?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {RESOLUTION_OPTIONS.map(opt => (
                <label key={opt.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: form.resolution_type === opt.value ? '2px solid var(--terra-600)' : '2px solid var(--slate-200)',
                  backgroundColor: form.resolution_type === opt.value ? 'var(--terra-50)' : 'white'
                }}>
                  <input
                    type="radio" name="resolution_type"
                    checked={form.resolution_type === opt.value}
                    onChange={() => setForm(p => ({ ...p, resolution_type: opt.value }))}
                    style={{ marginTop: '3px', accentColor: 'var(--terra-600)' }}
                  />
                  <div>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)', display: 'block', marginTop: '2px' }}>
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: 'var(--space-lg)' }}>
              <button type="button" onClick={handleClose} style={cancelStyle}>Cancel</button>
              <button type="button" disabled={!canProceedStep1} onClick={() => setStep(2)} style={{
                ...btnStyle, backgroundColor: canProceedStep1 ? 'var(--terra-600)' : 'var(--slate-300)',
                cursor: canProceedStep1 ? 'pointer' : 'not-allowed'
              }}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div>
            {isEngaged && (
              <>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.5rem' }}>
                  Estimated Case Value *
                </p>
                <select value={form.estimated_case_value} onChange={e => setForm(p => ({ ...p, estimated_case_value: e.target.value }))} style={{ ...selectStyle, marginBottom: '1rem' }}>
                  <option value="">Select…</option>
                  {VALUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.5rem' }}>
                  Expected Timeline *
                </p>
                <select value={form.expected_timeline} onChange={e => setForm(p => ({ ...p, expected_timeline: e.target.value }))} style={{ ...selectStyle, marginBottom: '1rem' }}>
                  <option value="">Select…</option>
                  {TIMELINE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </>
            )}

            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.5rem' }}>
              Resolution Notes *
            </p>
            <textarea
              value={form.resolution_notes}
              onChange={e => setForm(p => ({ ...p, resolution_notes: e.target.value }))}
              placeholder="Briefly describe the outcome or reason for closing this case..."
              rows={4}
              style={{ ...selectStyle, resize: 'vertical', minHeight: '100px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-lg)' }}>
              <button type="button" onClick={() => setStep(1)} style={cancelStyle}>← Back</button>
              <button type="button" disabled={!canProceedStep2} onClick={() => setStep(3)} style={{
                ...btnStyle, backgroundColor: canProceedStep2 ? 'var(--terra-600)' : 'var(--slate-300)',
                cursor: canProceedStep2 ? 'pointer' : 'not-allowed'
              }}>
                Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.75rem' }}>
              Please confirm your resolution:
            </p>

            <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
              <SummaryRow label="Resolution Type" value={RESOLUTION_LABELS[form.resolution_type] || form.resolution_type} />
              {isEngaged && (
                <>
                  <SummaryRow label="Estimated Value" value={VALUE_OPTIONS.find(o => o.value === form.estimated_case_value)?.label} />
                  <SummaryRow label="Expected Timeline" value={TIMELINE_OPTIONS.find(o => o.value === form.expected_timeline)?.label} />
                </>
              )}
              <SummaryRow label="Notes" value={form.resolution_notes} />
            </div>

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.75rem', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-md)',
              border: '1px solid #FDE68A', marginBottom: 'var(--space-lg)'
            }}>
              <AlertTriangle size={16} style={{ color: '#92400E', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                This action will close the case and notify the claimant. This cannot be undone.
              </p>
            </div>

            <button type="button" disabled={saving} onClick={handleSubmit} style={{
              ...btnStyle, width: '100%', backgroundColor: saving ? 'var(--slate-400)' : 'var(--terra-600)',
              cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '0.75rem'
            }}>
              {saving ? 'Closing Case…' : 'Confirm & Close Case'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => { if (!saving) setStep(2); }} style={cancelStyle}>
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-800)', margin: '2px 0 0' }}>
        {value || '—'}
      </p>
    </div>
  );
}

const btnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '0.625rem 1.5rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
  fontWeight: 700, color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
  minHeight: '44px'
};

const cancelStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
  color: 'var(--slate-600)', padding: '0.5rem'
};