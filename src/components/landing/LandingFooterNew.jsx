import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { CheckCircle } from 'lucide-react';
import LogoBrand from '../LogoBrand';
import { useComingSoon } from '../useComingSoonModal';

const footerLinkStyle = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
  color: 'var(--dark-body-secondary)', textDecoration: 'none', minHeight: '44px',
  display: 'inline-flex', alignItems: 'center'
};

const colHeadingStyle = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--dark-muted)', margin: '0 0 12px'
};

export default function LandingFooterNew() {
  const { openModal } = useComingSoon();
  return (
    <footer role="contentinfo" style={{
      background: 'var(--dark-bg-footer)', padding: '56px 1.5rem 32px',
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Columns */}
        <div className="landing-footer-columns" style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '40px', marginBottom: '40px'
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <LogoBrand size={24} variant="dark-bg" />
              <span style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 700,
                color: 'var(--dark-heading)'
              }}>
                ADA Legal Link
              </span>
            </div>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
              color: 'var(--dark-muted)', lineHeight: 1.7, margin: 0
            }}>
              ADA Legal Link is not a law firm and does not provide legal advice. By submitting a report, you are not entering into an attorney-client relationship. Attorney listings do not constitute endorsements. Results may vary.
            </p>
          </div>

          {/* Standards Guide */}
          <div>
            <p style={colHeadingStyle}>Standards Guide</p>
            <nav aria-label="Standards Guide footer links" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link to={createPageUrl('GuideIntroToAda')} className="landing-footer-link" style={footerLinkStyle}>Know Your Rights</Link>
              <Link to={createPageUrl('StandardsGuide')} className="landing-footer-link" style={footerLinkStyle}>Business Compliance</Link>
              <Link to={createPageUrl('StandardsGuide')} className="landing-footer-link" style={footerLinkStyle}>Design Standards</Link>
              <Link to={createPageUrl('GuideEffectiveCommunication')} className="landing-footer-link" style={footerLinkStyle}>Web Accessibility</Link>
            </nav>
          </div>

          {/* Take Action */}
          <div>
            <p style={colHeadingStyle}>Take Action</p>
            <nav aria-label="Take action footer links" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button onClick={() => openModal('report_violation')} className="landing-footer-link" style={{ ...footerLinkStyle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Report a Violation</button>
              <Link to={createPageUrl('LawyerLanding')} className="landing-footer-link" style={footerLinkStyle}>For Attorneys</Link>
              <a href="https://www.ada.gov/file-a-complaint/" target="_blank" rel="noopener noreferrer" className="landing-footer-link" style={footerLinkStyle}>File DOJ Complaint</a>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p style={colHeadingStyle}>Legal</p>
            <nav aria-label="Legal footer links" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="#accessibility" className="landing-footer-link" style={footerLinkStyle}>Accessibility Statement<span className="sr-only"> (coming soon)</span></a>
              <a href="#privacy" className="landing-footer-link" style={footerLinkStyle}>Privacy<span className="sr-only"> (coming soon)</span></a>
              <a href="#terms" className="landing-footer-link" style={footerLinkStyle}>Terms<span className="sr-only"> (coming soon)</span></a>
              <a href="mailto:support@adalegalconnect.com" className="landing-footer-link" style={footerLinkStyle}>Contact Us</a>
            </nav>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px'
        }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
            color: 'var(--dark-muted)', margin: 0
          }}>
            © 2026 ADA Legal Link. All rights reserved.
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(45,106,79,0.2)', border: '1px solid rgba(45,106,79,0.4)',
            borderRadius: '100px', padding: '4px 12px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
            color: 'var(--accent-success)'
          }}>
            <CheckCircle size={14} aria-hidden="true" />
            WCAG 2.2 AAA Conformant
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .landing-footer-columns {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .landing-footer-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}