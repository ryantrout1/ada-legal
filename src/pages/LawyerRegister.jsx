import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle } from 'lucide-react';
import FormField from '../components/intake/FormField';
import StateMultiSelect from '../components/lawyer/StateMultiSelect';

const inputStyle = {
  width: '100%', minHeight: '44px', padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
  color: 'var(--slate-800)', backgroundColor: 'var(--surface)',
  border: '2px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
};

const focusHandler = (e) => {
  e.target.style.borderColor = '#1D4ED8';
  e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.15)';
};
const blurHandler = (e) => {
  e.target.style.borderColor = 'var(--slate-200)';
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
    if (!form.rules_accepted) e.rules_accepted = 'You must accept the marketplace rules';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    await base44.entities.LawyerProfile.create({
      full_name: form.full_name.trim(),
      firm_name: form.firm_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      states_of_practice: form.states_of_practice,
      bar_numbers: form.bar_numbers.trim(),
      account_status: 'pending_approval',
      subscription_status: 'inactive',
      marketplace_rules_accepted: true
    });

    // Notify admins
    const admins = await base44.entities.User.list();
    const adminUsers = admins.filter(u => u.role === 'admin');
    for (const admin of adminUsers) {
      await base44.integrations.Core.SendEmail({
        to: admin.email,
        subject: 'New Lawyer Application — ADA Legal Marketplace',
        body: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1E293B;">New Lawyer Application</h2>
            <p>A new attorney has applied to join the marketplace:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Name</td><td style="padding: 8px;">${form.full_name.trim()}</td></tr>
              <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Firm</td><td style="padding: 8px;">${form.firm_name.trim()}</td></tr>
              <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Email</td><td style="padding: 8px;">${form.email.trim()}</td></tr>
              <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">State(s)</td><td style="padding: 8px;">${form.states_of_practice.join(', ')}</td></tr>
              <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Bar #</td><td style="padding: 8px;">${form.bar_numbers.trim()}</td></tr>
            </table>
            <p>Please review this application in the admin dashboard.</p>
          </div>
        `
      });
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
        padding: 'var(--space-xl) var(--space-lg)'
      }}>
        <div style={{ maxWidth: '620px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)', padding: 'clamp(2rem, 4vw, 3rem)',
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
              color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
            }}>
              Application Submitted
            </h2>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem',
              color: 'var(--slate-600)', lineHeight: 1.6, maxWidth: '440px',
              margin: '0 auto'
            }}>
              Our team will review your application and notify you by email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '620px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)',
          marginBottom: 'var(--space-xs)', textAlign: 'center'
        }}>
          Join the ADA Legal Marketplace
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--slate-500)', textAlign: 'center',
          marginBottom: 'var(--space-2xl)'
        }}>
          Apply to receive exclusive, pre-screened ADA violation cases.
        </p>

        <div style={{
          backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
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
                fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.5
              }}
            >
              <input
                id="rules_accepted"
                type="checkbox"
                checked={form.rules_accepted}
                onChange={e => update('rules_accepted', e.target.checked)}
                style={{
                  width: '20px', height: '20px', accentColor: '#C2410C',
                  cursor: 'pointer', flexShrink: 0, marginTop: '2px'
                }}
              />
              <span>
                I have read and agree to the ADA Legal Marketplace Rules, including the requirement to contact claimants within 24 hours of initiating support.
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
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '0.875rem',
              fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
              color: 'white',
              backgroundColor: submitting ? 'var(--slate-400)' : 'var(--terra-600)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              minHeight: '52px', transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => { if (!submitting) e.target.style.backgroundColor = 'var(--terra-700)'; }}
            onMouseLeave={e => { if (!submitting) e.target.style.backgroundColor = 'var(--terra-600)'; }}
          >
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}