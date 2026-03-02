import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AccountSettingsCard() {
  const [showDeactivate, setShowDeactivate] = useState(false);

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '24px'
    }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--heading)', margin: '0 0 20px' }}>
        Account Settings
      </h2>

      {/* Notification Preferences */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--body)', margin: '0 0 12px' }}>
          Notification Preferences
        </h3>
        {[
          'Email me when new cases match my states of practice',
          'Email me 12 hours before contact deadline',
          'Weekly case digest summary'
        ].map((label, i) => (
          <label key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 0', cursor: 'not-allowed', opacity: 0.5
          }}>
            <input type="checkbox" disabled style={{ width: '18px', height: '18px' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)' }}>{label}</span>
            <span style={{
              display: 'inline-block', padding: '1px 8px', borderRadius: '4px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
              color: 'var(--body-secondary)', backgroundColor: 'var(--border-lighter)', marginLeft: 'auto'
            }}>Coming soon</span>
          </label>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Download Data */}
        <button type="button" title="Contact support to request your data" style={{
          background: 'none', border: 'none', cursor: 'help',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--body)', padding: '4px 0', textAlign: 'left', textDecoration: 'underline',
          textDecorationStyle: 'dotted'
        }}>
          Download My Data
        </button>

        {/* Deactivate */}
        <button type="button" onClick={() => setShowDeactivate(!showDeactivate)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
          color: '#B91C1C', padding: '4px 0', textAlign: 'left'
        }}>
          Deactivate Account
        </button>

        {showDeactivate && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            backgroundColor: '#FEE2E2', borderRadius: '8px', padding: '14px'
          }}>
            <AlertTriangle size={16} style={{ color: '#B91C1C', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>
              To deactivate your account, please contact{' '}
              <a href="mailto:support@adalegalconnect.com" style={{ color: '#B91C1C', fontWeight: 700 }}>support@adalegalconnect.com</a>.
              Active cases will be returned to the available case pool.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}