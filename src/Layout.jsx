import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Menu, X, User, LogOut, Eye, BarChart3, Mail, Clock, MessageSquare } from 'lucide-react';
import LogoBrand from './components/LogoBrand';
import LiveAnnouncer from './components/a11y/LiveAnnouncer';
import AuditButton from './components/a11y/AuditButton';
import LandingFooterNew from './components/landing/LandingFooterNew';
import EarlyAccessBanner from './components/EarlyAccessBanner';
import FeedbackButton from './components/FeedbackButton';
import DisplaySettings, { applyPreferences, loadPreferences } from './components/a11y/DisplaySettings';
import UserAvatarMenu from './components/UserAvatarMenu';
import { ComingSoonProvider } from './components/useComingSoonModal';

export default function Layout({ children, currentPageName }) {
  // Scroll to top on page change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageName]);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const settingsButtonRef = React.useRef(null);

  // Fix 1: Ensure meta viewport allows zooming (remove any platform-injected restrictions)
  React.useEffect(() => {
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
      const content = vp.getAttribute('content') || '';
      if (content.includes('user-scalable') || content.includes('maximum-scale') || content.includes('minimum-scale')) {
        vp.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    }
  }, []);

  // Set lang attribute + apply display preferences
  React.useEffect(() => {
    document.documentElement.lang = 'en';
    const prefs = loadPreferences();
    applyPreferences(prefs);
  }, []);

  // Favicon
  React.useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.type = 'image/png';
    link.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png';

    // Open Graph / social media meta tags
    const ogTags = {
      'og:title': 'ADA Legal Link — Know the Law. Know Your Rights.',
      'og:description': 'The complete ADA Accessibility Standards — reorganized for clarity, searchable by topic, and built to be fully accessible to everyone. 42 interactive diagrams. Free forever.',
      'og:image': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/og-social-card.png',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:type': 'website',
      'og:site_name': 'ADA Legal Link',
      'og:url': 'https://adalegallink.com',
      'twitter:card': 'summary_large_image',
      'twitter:title': 'ADA Legal Link — Know the Law. Know Your Rights.',
      'twitter:description': 'The complete ADA Accessibility Standards — reorganized, searchable, and fully accessible. 42 interactive diagrams. Free forever.',
      'twitter:image': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/og-social-card.png',
    };
    Object.entries(ogTags).forEach(([key, value]) => {
      const attr = key.startsWith('twitter:') ? 'name' : 'property';
      let meta = document.querySelector(`meta[${attr}="${key}"]`);
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attr, key); document.head.appendChild(meta); }
      meta.setAttribute('content', value);
    });
    // Page title
    document.title = 'ADA Legal Link — Know the Law. Know Your Rights.';
  }, []);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const firstLink = document.querySelector('#mobile-nav-panel a, #mobile-nav-panel button');
        if (firstLink) firstLink.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        document.querySelector('.mobile-menu-btn')?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const PAGE_TITLES = {
    Home: 'Home', Intake: 'Report a Violation', RightsPathway: 'Know Your Rights', MyCases: 'My Cases',
    CaseDetail: 'Case Detail', Marketplace: 'Available Cases', LawyerDashboard: 'My Cases',
    LawyerProfile: 'My Profile', LawyerRegister: 'Attorney Registration',
    LawyerLanding: 'For Attorneys', StandardsGuide: 'ADA Standards Guide',
    Admin: 'Admin Dashboard', AdminReview: 'Review Queue', AdminCases: 'Case Manager',
    AdminAnalytics: 'Analytics', AdminLawyers: 'Attorney Network', AdminEmails: 'Email Templates', AdminFeedback: 'Feedback',
    TitleIIPathway: 'Government Accessibility Complaints',
    TitleIPathway: 'Workplace Disability Discrimination'
  };

  React.useEffect(() => {
    if (currentPageName === 'Home') {
      document.title = 'ADA Legal Link — Know Your Rights. Then Enforce Them.';
    } else {
      const title = PAGE_TITLES[currentPageName] || currentPageName;
      document.title = `${title} — ADA Legal Link`;
    }
    setMobileMenuOpen(false);
    setSettingsOpen(false);
  }, [currentPageName]);

  return (
    <LiveAnnouncer>
    <ComingSoonProvider>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 0 }} role="presentation">
      <style>{`
        /* Design System Variables */
        :root {
          --slate-900: #1E293B;
          --slate-800: #334155;
          --slate-700: #475569;
          --slate-600: #475569;
          --slate-500: #475569;
          --slate-400: #CBD5E1;
          --slate-300: #E2E8F0;
          --slate-200: #948F88;
          --slate-100: #F1F5F9;
          --slate-50: #FAF7F2;
          
          --terra-900: #7C2D12;
          --terra-800: #9A3412;
          --terra-700: #9A3412;
          --terra-600: #C2410C;
          --terra-500: #EA580C;
          --terra-400: #F97316;
          --terra-300: #FB923C;
          --terra-200: #FED7AA;
          --terra-100: #FEF1EC;
          --terra-50: #FFF7ED;
          
          --success-600: #16A34A;
          --success-100: #DCFCE7;
          --warning-600: #D97706;
          --warning-100: #FEF3C7;
          --error-600: #DC2626;
          --error-100: #FEE2E2;
          --info-600: #2563EB;
          --info-100: #DBEAFE;
          
          --surface: #FFFFFF;
          --space-xs: 0.25rem;
          --space-sm: 0.5rem;
          --space-md: 1rem;
          --space-lg: 1.5rem;
          --space-xl: 2rem;
          --space-2xl: 3rem;
          
          --radius-sm: 0.25rem;
          --radius-md: 0.5rem;
          --radius-lg: 0.75rem;
        }
        
        /* Base Styles */
        body {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: var(--slate-50);
          color: var(--slate-800);
          margin: 0;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Fraunces', Georgia, serif;
          color: var(--slate-900);
          font-weight: 600;
          line-height: 1.2;
        }
        
        /* Skip Link — handled by globals.css .skip-to-main */
        
        /* Focus Styles — handled by globals.css */
        
        /* Links */
        a {
          color: var(--terra-600);
          text-decoration: none;
        }
        
        a:hover {
          color: var(--terra-700);
          text-decoration: underline;
        }
      `}</style>

      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-200px',
          left: '16px',
          background: '#C2410C',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '0 0 8px 8px',
          zIndex: 10000,
          fontWeight: 600,
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9375rem',
          textDecoration: 'none',
          transition: 'top 0.2s'
        }}
        onFocus={(e) => e.target.style.top = '0px'}
        onBlur={(e) => e.target.style.top = '-200px'}
      >
        Skip to main content
      </a>

      {/* Early Access Banner — public pages only */}
      {!loading && !['Admin', 'AdminReview', 'AdminCases', 'AdminAnalytics', 'AdminLawyers', 'AdminEmails', 'LawyerDashboard', 'LawyerProfile', 'LawyerCaseDetail', 'Marketplace'].includes(currentPageName) && (
        <EarlyAccessBanner />
      )}

      {/* Header */}
      <header role="banner" aria-label="Site header" style={
        !loading && !user && currentPageName === 'Home'
          ? {
              position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 1000,
              backgroundColor: 'rgba(30,41,59,0.97)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              color: 'white', height: '72px',
              display: 'flex', alignItems: 'center',
              boxShadow: 'none', border: 'none', outline: 'none'
            }
          : {
              backgroundColor: 'var(--slate-900)',
              color: 'white', height: '72px',
              display: 'flex', alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }
      }>
        <div style={{
            width: '100%',
            padding: '0 clamp(16px, 4vw, 40px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
          <Link to={createPageUrl('Home')} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontFamily: 'Fraunces, serif',
            fontWeight: 700
          }}>
            <LogoBrand size={44} variant="dark-bg" />
            <span className="mobile-brand-text">ADA Legal <span style={{ color: '#C2410C' }}>Link</span></span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.5rem',
              minWidth: '44px',
              minHeight: '44px'
            }}
            className="mobile-menu-btn"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" style={{
            display: 'flex',
            alignItems: 'center',
            gap: (!loading && !user) ? '32px' : '2rem'
          }} className="desktop-nav">
            {!loading && (
              <>
                {!user && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} className="desktop-nav-public-links" style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('LawyerLanding')} className="desktop-nav-public-links" style={{ color: currentPageName === 'LawyerLanding' ? '#D4570A' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }} aria-current={currentPageName === 'LawyerLanding' ? 'page' : undefined}>
                      For Attorneys
                    </Link>
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      style={{
                        background: 'var(--terra-600)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: 'Manrope, sans-serif',
                        minHeight: '44px'
                      }}
                    >
                      Sign In
                    </button>
                  </>
                )}
                
                {user?.role === 'user' && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('MyCases')} style={{ color: currentPageName === 'MyCases' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'MyCases' ? 'page' : undefined}>
                      My Cases
                    </Link>
                    <UserAvatarMenu user={user} onLogout={handleLogout} />
                  </>
                )}
                
                {user?.role === 'lawyer' && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('Marketplace')} style={{ color: currentPageName === 'Marketplace' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'Marketplace' ? 'page' : undefined}>
                      Available Cases
                    </Link>
                    <Link to={createPageUrl('LawyerDashboard')} style={{ color: currentPageName === 'LawyerDashboard' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'LawyerDashboard' ? 'page' : undefined}>
                      My Cases
                    </Link>
                    <Link to={createPageUrl('LawyerProfile')} style={{ color: currentPageName === 'LawyerProfile' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'LawyerProfile' ? 'page' : undefined}>
                      Profile
                    </Link>
                    <UserAvatarMenu user={user} onLogout={handleLogout} />
                  </>
                )}
                
                {user?.role === 'admin' && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('AdminReview')} style={{ color: currentPageName === 'AdminReview' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'AdminReview' ? 'page' : undefined}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} style={{ color: (currentPageName === 'AdminCases' || currentPageName === 'Admin') ? '#D4570A' : 'white' }} aria-current={currentPageName === 'AdminCases' ? 'page' : undefined}>
                      Case Manager
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} style={{ color: currentPageName === 'AdminLawyers' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'AdminLawyers' ? 'page' : undefined}>
                      Lawyers
                    </Link>
                    <UserAvatarMenu user={user} onLogout={handleLogout} extraMenuItems={[
                      { to: createPageUrl('AdminAnalytics'), icon: <BarChart3 size={15} />, label: 'Platform Intelligence' },
                      { to: createPageUrl('AdminEmails'), icon: <Mail size={15} />, label: 'Email Templates' },
                      { to: createPageUrl('AdminFeedback'), icon: <MessageSquare size={15} />, label: 'Feedback' },
                    ]} />
                  </>
                )}
              </>
            )}

            {/* Display Settings */}
            <div style={{ position: 'relative' }} className="desktop-settings-btn">
              <button
                ref={settingsButtonRef}
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-label="Display preferences"
                aria-expanded={settingsOpen}
                aria-haspopup="dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Eye size={20} aria-hidden="true" />
              </button>
              {settingsOpen && (
                <DisplaySettings
                  variant="dropdown"
                  isOpen={settingsOpen}
                  onClose={() => {
                    setSettingsOpen(false);
                    settingsButtonRef.current?.focus();
                  }}
                />
              )}
            </div>
          </nav>
        </div>

      </header>

      {/* Mobile Navigation — Fixed Overlay (outside header to avoid backdrop-filter containing block issue) */}
      {mobileMenuOpen && (
        <>
          {/* Overlay backdrop */}
          <div
            className="mobile-nav-overlay"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: '72px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 998,
              display: 'none'
            }}
            aria-hidden="true"
          />
          {/* Menu panel */}
          <nav
            aria-label="Mobile navigation"
            id="mobile-nav-panel"
            className="mobile-nav"
            style={{
              position: 'fixed',
              top: '72px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#1A1F2B',
              zIndex: 999,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '8px 0 24px',
              display: 'none'
            }}
          >
            {/* Display Settings — inline in mobile menu */}
            <DisplaySettings
              variant="inline"
              isOpen={true}
              onClose={() => {}}
            />
            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {!user && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('LawyerLanding')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'LawyerLanding' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'LawyerLanding' ? 'page' : undefined}>
                      For Attorneys
                    </Link>
                    <button
                      onClick={() => { setMobileMenuOpen(false); base44.auth.redirectToLogin(); }}
                      style={{
                        background: 'var(--terra-600)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: 'Manrope, sans-serif',
                        minHeight: '44px',
                        width: '100%',
                        textAlign: 'center',
                        margin: '8px 16px',
                        boxSizing: 'border-box',
                        maxWidth: 'calc(100% - 32px)'
                      }}
                    >
                      Sign In
                    </button>
                  </>
                )}
                
                {user?.role === 'user' && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('MyCases')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      My Cases
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px 0', padding: '12px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>{user.email}</p>
                    </div>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} style={{
                      background: 'transparent', color: 'white', border: '1px solid white',
                      padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      minHeight: '44px', width: 'calc(100% - 32px)', margin: '0 16px 8px', textAlign: 'center',
                    }}>
                      Sign Out
                    </button>
                  </>
                )}
                
                {user?.role === 'lawyer' && (

                  <>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('Marketplace')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Available Cases
                    </Link>
                    <Link to={createPageUrl('LawyerDashboard')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      My Cases
                    </Link>
                    <Link to={createPageUrl('LawyerProfile')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Profile
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px 0', padding: '12px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>{user.email}</p>
                    </div>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} style={{
                      background: 'transparent', color: 'white', border: '1px solid white',
                      padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      minHeight: '44px', width: 'calc(100% - 32px)', margin: '0 16px 8px', textAlign: 'center',
                    }}>
                      Sign Out
                    </button>
                  </>
                )}
                
                {user?.role === 'admin' && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('AdminReview')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminReview' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} onClick={() => setMobileMenuOpen(false)} style={{ color: (currentPageName === 'AdminCases' || currentPageName === 'Admin') ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Case Manager
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminLawyers' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Lawyers
                    </Link>
                    <Link to={createPageUrl('AdminAnalytics')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminAnalytics' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Platform Intelligence
                    </Link>
                    <Link to={createPageUrl('AdminEmails')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminEmails' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Email Templates
                    </Link>
                    <Link to={createPageUrl('AdminFeedback')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminFeedback' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Feedback
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px 0', padding: '12px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>{user.email}</p>
                    </div>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} style={{
                      background: 'transparent', color: 'white', border: '1px solid white',
                      padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      minHeight: '44px', width: 'calc(100% - 32px)', margin: '0 16px 8px', textAlign: 'center',
                    }}>
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </nav>
        </>
      )}

      {/* Main Content */}
      <main id="main-content" role="main" style={{ flex: 1, margin: 0 }}>
        {children}
      </main>

      {/* Floating Feedback Button — public pages only */}
      {!loading && !['Admin', 'AdminReview', 'AdminCases', 'AdminAnalytics', 'AdminLawyers', 'AdminEmails', 'AdminFeedback', 'LawyerDashboard', 'LawyerProfile', 'LawyerCaseDetail', 'Marketplace'].includes(currentPageName) && (
        <FeedbackButton />
      )}

      {/* Landing page footer — rendered outside main as sibling */}
      {currentPageName === 'Home' && !loading && !user && <LandingFooterNew />}

      {/* Global footer — hidden on landing page */}
      {currentPageName !== 'Home' && (
        <footer role="contentinfo" style={{
          backgroundColor: 'var(--slate-900)',
          color: 'var(--slate-400)',
          padding: '2rem 0',
          marginTop: 0
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 1.5rem',
            textAlign: 'center'
          }}>
            <LogoBrand size={96} glow variant="dark-bg" className="footer-logo" style={{ display: 'block', margin: '0 auto 12px' }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              © 2026 <span style={{ color: '#4B5563' }}>ADA Legal</span>{' '}
              <span style={{ color: '#C2410C', opacity: 0.7 }}>Link</span>.
              {' '}All rights reserved.
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Connecting people with experienced ADA attorneys.
            </p>
          </div>
        </footer>
      )}

      <style>{`
        .mobile-nav-overlay {
          display: none !important;
        }
        @media (max-width: 860px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .desktop-settings-btn {
            display: none !important;
          }
          .mobile-nav {
            display: block !important;
          }
          .mobile-nav-overlay {
            display: block !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
          .footer-logo {
            width: 64px !important;
            height: 64px !important;
          }
        }
        @media (max-width: 420px) {
          .mobile-brand-text {
            font-size: 1.125rem !important;
          }
        }
      `}</style>

    </div>
    </ComingSoonProvider>
    <aside role="complementary" aria-label="Accessibility tools" style={{ position: 'relative', zIndex: 9999 }}>
      <AuditButton currentPageName={currentPageName} />
    </aside>
    </LiveAnnouncer>
  );
}