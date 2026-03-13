import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle } from 'lucide-react';
import FormField from '../components/intake/FormField';
import StateMultiSelect from '../components/lawyer/StateMultiSelect';

const inputStyle = {
  width: '100%', minHeight: '44px', padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
  color: 'var(--heading)', backgroundColor: 'var(--surface)',
  border: '2px solid var(--border)', borderRadius: 'var(--radius-md)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
};

const focusHandler = (e) => {
  e.target.style.borderColor = 'var(--link)';
  e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.15)';
};
const blurHandler = (e) => {
  e.target.style.borderColor = 'var(--border)';
  e.target.style.boxShadow = 'none';
};

export default function LawyerRegister() {
  const [form, setForm] = useState({
    full_name: '', firm_name: '', email: '', phone: '',
    states_of_practice: [], bar_numbers: '', rules_accepted: false
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.firm_name.trim()) e.firm_name = 'Firm name is required';
    const email = form.email.trim();
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (form.states_of_practice.length === 0) e.states_of_practice = 'Select at least one state';
    if (!form.bar_numbers.trim()) e.bar_numbers = 'Bar number is required';
    if (!form.rules_accepted) e.rules_accepted = 'You must accept the platform rules';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      // Prevent duplicate registrations with the same email
      const existing = await base44.entities.LawyerProfile.filter({ email: form.email.trim() });
      if (existing && existing.length > 0) {
        setSubmitError('An application with this email address already exists. If you need help accessing your account, contact support@adalegallink.com.');
        setSubmitting(false);
        return;
      }

      await base44.entities.LawyerProfile.create({
        full_name: form.full_name.trim(),
        firm_name: form.firm_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        states_of_practice: form.states_of_practice,
        bar_numbers: form.bar_numbers.trim(),
        account_status: 'pending_approval',
        subscription_status: 'inactive',
        marketplace_rules_accepted: true,
        flagged: false
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Lawyer registration failed:', err);
      setSubmitError('Something went wrong. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        backgroundColor: 'var(--page-bg-subtle)', minHeight: 'calc(100vh - 200px)',
        padding: 'var(--space-xl) var(--space-lg)'
      }}>
        <div style={{ maxWidth: '620px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', padding: 'clamp(2rem, 4vw, 3rem)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'var(--success-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-xl)'
            }}>
              <CheckCircle size={40} style={{ color: 'var(--success-600)' }} />
            </div>
            <h2 style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700,
              color: 'var(--heading)', marginBottom: 'var(--space-sm)'
            }}>
              Application Submitted
            </h2>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem',
              color: 'var(--body)', lineHeight: 1.6, maxWidth: '440px',
              margin: '0 auto'
            }}>
              Our team will review your application and notify you by email within 48 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--page-bg-subtle)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <style>{`
        .lawyer-reg-btn:focus-visible {
          outline: 3px solid var(--accent-light);
          outline-offset: 2px;
        }
        input:focus-visible, select:focus-visible, textarea:focus-visible {
          border-color: var(--link) !important;
          box-shadow: 0 0 0 3px rgba(29,78,216,0.15) !important;
          outline: none;
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
        @media (prefers-contrast: more) {
          input, select, textarea { border-width: 3px !important; }
        }
      `}</style>
      <div style={{ maxWidth: '620px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--heading)',
          marginBottom: 'var(--space-xs)', textAlign: 'center'
        }}>
          Join ADA Legal Link
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--body-secondary)', textAlign: 'center',
          marginBottom: 'var(--space-2xl)'
        }}>
          Apply to receive exclusive, pre-screened ADA violation cases.
        </p>

        <div style={{
          backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <FormField label="Full Name" id="full_name" required error={errors.full_name}>
            <input id="full_name" type="text" placeholder="Jane Doe"
              value={form.full_name} onChange={e => update('full_name', e.target.value)}
              onFocus={focusHandler} onBlur={blurHandler}
              aria-required="true" aria-invalid={!!errors.full_name} style={inputStyle} />
          </FormField>

          <FormField label="Firm Name" id="firm_name" required error={errors.firm_name}>
            <input id="firm_name" type="text" placeholder="Doe & Associates"
              value={form.firm_name} onChange={e => update('firm_name', e.target.value)}
              onFocus={focusHandler} onBlur={blurHandler}
              aria-required="true" aria-invalid={!!errors.firm_name} style={inputStyle} />
          </FormField>

          <FormField label="Email" id="email" required error={errors.email}>
            <input id="email" type="email" placeholder="jane@doelaw.com"
              value={form.email} onChange={e => update('email', e.target.value)}
              onFocus={focusHandler} onBlur={blurHandler}
              aria-required="true" aria-invalid={!!errors.email} style={inputStyle} />
          </FormField>

          <FormField label="Phone" id="phone" required error={errors.phone}>
            <input id="phone" type="tel" placeholder="(555) 123-4567"
              value={form.phone} onChange={e => update('phone', e.target.value)}
              onFocus={focusHandler} onBlur={blurHandler}
              aria-required="true" aria-invalid={!!errors.phone} style={inputStyle} />
          </FormField>

          <FormField label="State(s) of Practice" id="states" required error={errors.states_of_practice}>
            <StateMultiSelect
              selected={form.states_of_practice}
              onChange={v => update('states_of_practice', v)}
              error={errors.states_of_practice}
            />
          </FormField>

          <FormField label="Bar Number(s)" id="bar_numbers" required error={errors.bar_numbers}
            helperText="Enter your bar number. If licensed in multiple states, separate with commas.">
            <input id="bar_numbers" type="text" placeholder="e.g., 12345 or CA-12345, NY-67890"
              value={form.bar_numbers} onChange={e => update('bar_numbers', e.target.value)}
              onFocus={focusHandler} onBlur={blurHandler}
              aria-required="true" aria-invalid={!!errors.bar_numbers} style={inputStyle} />
          </FormField>

          {/* Marketplace rules checkbox */}
          <div style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <label
              htmlFor="rules_accepted"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.5
              }}
            >
              <input
                id="rules_accepted"
                type="checkbox"
                checked={form.rules_accepted}
                onChange={e => update('rules_accepted', e.target.checked)}
                style={{
                  width: '20px', height: '20px', accentColor: 'var(--accent)',
                  cursor: 'pointer', flexShrink: 0, marginTop: '2px'
                }}
              />
              <span>
                I have read and agree to the ADA Legal Link Rules, including the requirement to contact reporters within 24 hours of initiating support.
              </span>
            </label>
            {errors.rules_accepted && (
              <p role="alert" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: '#B91C1C', margin: '0.375rem 0 0 2.25rem'
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {errors.rules_accepted}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit} className="lawyer-reg-btn"
            disabled={submitting}
            style={{
              width: '100%', padding: '0.875rem',
              fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
              color: 'var(--dark-heading)',
              backgroundColor: submitting ? 'var(--body-secondary)' : 'var(--section-label)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              minHeight: '52px', transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => { if (!submitting) e.target.style.backgroundColor = 'var(--section-label)'; }}
            onMouseLeave={e => { if (!submitting) e.target.style.backgroundColor = 'var(--section-label)'; }}
          >
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>

          {submitError && (
            <p role="alert" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: '#B91C1C', backgroundColor: 'var(--error-100)',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              marginTop: 'var(--space-md)'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              {submitError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}