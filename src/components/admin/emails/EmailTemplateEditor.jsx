import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, Eye, Save, Send, ArrowLeft } from 'lucide-react';
import RichEmailEditor from './RichEmailEditor';
import EmailPreviewModal from './EmailPreviewModal';

const SAMPLE_DATA = {
  reporter_name: 'Jane Doe',
  business_name: 'Sunrise Coffee Co.',
  violation_type: 'Physical Space',
  incident_date: '2026-01-15',
  case_url: 'https://app.example.com/MyCases',
  rejection_reason: 'We were unable to fully evaluate your report due to insufficient documentation.',
  standards_guide_url: 'https://app.example.com/StandardsGuide',
  intake_url: 'https://app.example.com/Intake',
  contact_preference: 'Email',
  attorney_name: 'John Smith, Esq.',
  attorney_firm: 'Smith & Associates',
  case_location: 'Phoenix, AZ',
  reporter_email: 'jane@example.com',
  reporter_phone: '(555) 123-4567',
  dashboard_url: 'https://app.example.com/LawyerDashboard',
  assigned_at: 'February 24, 2026 at 3:15 PM',
  subscribe_url: 'https://app.example.com/LawyerSubscription',
  new_case_count: '5',
  new_case_plural: 's',
  state_match_note: '<p><strong>3</strong> of these cases are in your licensed states (AZ, CA).</p>',
  type_badges: '<span style="display:inline-block;padding:4px 10px;background:#DBEAFE;color:#1D4ED8;border-radius:12px;font-weight:600;">3 Physical</span> <span style="display:inline-block;padding:4px 10px;background:#F3E8FF;color:#7C3AED;border-radius:12px;font-weight:600;">2 Digital</span>',
  case_table: '<table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr style="background-color:#F8FAFC;"><th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;">Business</th><th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;">Type</th><th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748B;">Location</th></tr></thead><tbody><tr><td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">Sunrise Coffee</td><td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">Physical</td><td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;">Phoenix, AZ</td></tr></tbody></table>',
  more_text: '',
  browse_url: 'https://app.example.com/Marketplace',
};

export default function EmailTemplateEditor({ template, onBack, onSaved }) {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState(null);


  useEffect(() => {
    if (template) {
      setSubject(template.subject_line || '');
      setBodyHtml(template.body_html || '');
      setShowPreview(false);
    }
  }, [template?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const variables = template?.available_variables || [];

  const replaceVars = (text) => {
    let result = text;
    for (const [key, value] of Object.entries(SAMPLE_DATA)) {
      result = result.split(`{{${key}}}`).join(value);
    }
    return result;
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    await base44.entities.EmailTemplate.update(template.id, {
      subject_line: subject,
      body_html: bodyHtml,
      last_edited_at: new Date().toISOString(),
      edited_by: user?.email || 'admin'
    });
    setSaving(false);
    setToast({ type: 'success', message: 'Template saved' });
    onSaved();
  };

  const handleSendTest = async () => {
    setSending(true);
    const user = await base44.auth.me();
    const renderedSubject = replaceVars(subject);
    const renderedBody = replaceVars(bodyHtml);
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `[TEST] ${renderedSubject}`,
      body: renderedBody
    });
    setSending(false);
    setToast({ type: 'success', message: `Test email sent to ${user.email}` });
  };

  const copyVariable = (v) => {
    navigator.clipboard.writeText(`{{${v}}}`);
    setToast({ type: 'success', message: `Copied {{${v}}}` });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (!template) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--terra-600)', padding: '8px 4px', minHeight: '44px'
        }}>
          <ArrowLeft size={16} /> Back to Templates
        </button>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
          color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>
          {template.template_key}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Left — Editor */}
        <div style={{ flex: '1 1 600px', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Template info */}
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '12px', padding: '20px'
          }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 4px' }}>
              {template.template_name}
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
              {template.trigger_description}
            </p>
          </div>

          {/* Subject line */}
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '12px', padding: '20px'
          }}>
            <label style={{
              display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
              fontWeight: 700, color: '#64748B', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.9375rem', border: '2px solid var(--slate-200)',
                borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
                color: 'var(--slate-900)', minHeight: '44px'
              }}
              onFocus={e => { e.target.style.borderColor = '#1D4ED8'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--slate-200)'; }}
            />
          </div>

          {/* Visual Rich Text Editor */}
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '12px', padding: '20px'
          }}>
            <label style={{
              display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
              fontWeight: 700, color: '#64748B', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>
              Email Body
            </label>
            <RichEmailEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              variables={variables}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleSave} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 24px', backgroundColor: saving ? '#94A3B8' : 'var(--terra-600)',
              color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, minHeight: '44px'
            }}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save Template'}
            </button>
            <button onClick={handlePreview} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 24px', backgroundColor: 'white',
              color: 'var(--slate-700)', border: '1px solid var(--slate-300)',
              borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, minHeight: '44px'
            }}>
              <Eye size={16} /> Preview
            </button>
            <button onClick={handleSendTest} disabled={sending} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 24px', backgroundColor: 'white',
              color: sending ? '#94A3B8' : '#1D4ED8', border: `1px solid ${sending ? '#CBD5E1' : '#93C5FD'}`,
              borderRadius: '8px', cursor: sending ? 'not-allowed' : 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, minHeight: '44px'
            }}>
              <Send size={16} /> {sending ? 'Sending…' : 'Send Test'}
            </button>
          </div>
        </div>

        {/* Right — Variables + Preview */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Variables */}
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '12px', padding: '16px'
          }}>
            <h3 style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: '#64748B', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>
              Available Variables
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {variables.map(v => (
                <div key={v} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px'
                }}>
                  <code style={{
                    fontFamily: 'monospace', fontSize: '0.75rem', color: '#C2410C', fontWeight: 600
                  }}>
                    {'{{' + v + '}}'}
                  </code>
                  <button
                    onClick={() => copyVariable(v)}
                    aria-label={`Copy ${v}`}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: '#94A3B8', display: 'flex', minWidth: '28px', minHeight: '28px',
                      alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--terra-600)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
              {variables.length === 0 && (
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                  No variables defined
                </p>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="assertive" style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, padding: '12px 24px', borderRadius: '10px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer',
          backgroundColor: '#15803D', color: 'white'
        }} onClick={() => setToast(null)}>
          ✓ {toast.message}
        </div>
      )}
    </div>
  );
}