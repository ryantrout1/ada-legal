import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Menu, X, User, LogOut } from 'lucide-react';
import LogoBrand from './components/LogoBrand';
import LiveAnnouncer from './components/a11y/LiveAnnouncer';
import AuditButton from './components/a11y/AuditButton';
import LandingFooterNew from './components/landing/LandingFooterNew';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  // Favicon
  React.useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.type = 'image/png';
    link.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994acc34810e36068eddec2/e3c293e44_logo-terracotta.png';
  }, []);

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
    Home: 'Home', Intake: 'Report a Violation', MyCases: 'My Cases',
    CaseDetail: 'Case Detail', Marketplace: 'Available Cases', LawyerDashboard: 'My Cases',
    LawyerProfile: 'My Profile', LawyerRegister: 'Attorney Registration',
    LawyerLanding: 'For Attorneys', StandardsGuide: 'ADA Standards Guide',
    Admin: 'Admin Dashboard', AdminReview: 'Review Queue', AdminCases: 'All Cases',
    AdminAnalytics: 'Analytics', AdminLawyers: 'Manage Lawyers'
  };

  React.useEffect(() => {
    const title = PAGE_TITLES[currentPageName] || currentPageName;
    document.title = `${title} — ADA Legal Link`;
    setMobileMenuOpen(false);
  }, [currentPageName]);

  return (
    <LiveAnnouncer>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} role="presentation">
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
          --slate-200: #E7E4DE;
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
              color: 'white', padding: '1rem 0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }
      }>
        <div style={
          !loading && !user && currentPageName === 'Home'
            ? {
                width: '100%',
                padding: '0 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }
            : {
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }
        }>
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
            <LogoBrand size={44} />
            <span>ADA Legal <span style={{ color: '#C2410C' }}>Link</span></span>
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
                    <Link to={createPageUrl('Intake')} className="desktop-nav-public-links" style={{ color: currentPageName === 'Intake' ? '#D4570A' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }} aria-current={currentPageName === 'Intake' ? 'page' : undefined}>
                      Report Violation
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
                    <Link to={createPageUrl('Intake')} style={{ color: currentPageName === 'Intake' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'Intake' ? 'page' : undefined}>
                      Report Violation
                    </Link>
                    <Link to={createPageUrl('MyCases')} style={{ color: currentPageName === 'MyCases' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'MyCases' ? 'page' : undefined}>
                      My Cases
                    </Link>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                      fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px',
                      whiteSpace: 'nowrap'
                    }}>
                      <strong>USER</strong> {user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      style={{
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid white',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minHeight: '44px'
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
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
                    <span style={{
                      background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                      fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px',
                      whiteSpace: 'nowrap'
                    }}>
                      <strong>LAWYER</strong> {user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      style={{
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid white',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minHeight: '44px'
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </>
                )}
                
                {user?.role === 'admin' && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('Admin')} style={{ color: currentPageName === 'Admin' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'Admin' ? 'page' : undefined}>
                      Dashboard
                    </Link>
                    <Link to={createPageUrl('AdminReview')} style={{ color: currentPageName === 'AdminReview' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'AdminReview' ? 'page' : undefined}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} style={{ color: currentPageName === 'AdminCases' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'AdminCases' ? 'page' : undefined}>
                      All Cases
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} style={{ color: currentPageName === 'AdminLawyers' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'AdminLawyers' ? 'page' : undefined}>
                      Lawyers
                    </Link>
                    <Link to={createPageUrl('AdminAnalytics')} style={{ color: currentPageName === 'AdminAnalytics' ? '#D4570A' : 'white' }} aria-current={currentPageName === 'AdminAnalytics' ? 'page' : undefined}>
                      Analytics
                    </Link>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                      fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px',
                      whiteSpace: 'nowrap'
                    }}>
                      <strong>ADMIN</strong> {user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      style={{
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid white',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minHeight: '44px'
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav aria-label="Mobile navigation" style={{
            display: 'none',
            padding: '0',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: '#1A1F2B'
          }} className="mobile-nav">
            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {!user && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('Intake')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'Intake' ? '#D4570A' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'Intake' ? 'page' : undefined}>
                      Report Violation
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
                    <Link to={createPageUrl('Intake')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Report Violation
                    </Link>
                    <Link to={createPageUrl('MyCases')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      My Cases
                    </Link>
                    <div style={{ padding: '8px 16px' }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                        fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px'
                      }}>
                        <strong>USER</strong> {user.email}
                      </span>
                    </div>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} style={{
                      background: 'transparent',
                      color: 'white',
                      border: '1px solid white',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      minHeight: '44px',
                      width: 'calc(100% - 32px)',
                      margin: '8px 16px',
                      textAlign: 'center'
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
                    <div style={{ padding: '8px 16px' }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                        fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px'
                      }}>
                        <strong>LAWYER</strong> {user.email}
                      </span>
                    </div>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} style={{
                      background: 'transparent',
                      color: 'white',
                      border: '1px solid white',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      minHeight: '44px',
                      width: 'calc(100% - 32px)',
                      margin: '8px 16px',
                      textAlign: 'center'
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
                    <Link to={createPageUrl('Admin')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Dashboard
                    </Link>
                    <Link to={createPageUrl('AdminReview')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      All Cases
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Lawyers
                    </Link>
                    <Link to={createPageUrl('AdminAnalytics')} onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }}>
                      Analytics
                    </Link>
                    <div style={{ padding: '8px 16px' }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                        fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px'
                      }}>
                        <strong>ADMIN</strong> {user.email}
                      </span>
                    </div>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} style={{
                      background: 'transparent',
                      color: 'white',
                      border: '1px solid white',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      minHeight: '44px',
                      width: 'calc(100% - 32px)',
                      margin: '8px 16px',
                      textAlign: 'center'
                    }}>
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" role="main" style={{ flex: 1 }}>
        {children}
      </main>

      {/* Landing page footer — rendered outside main as sibling */}
      {currentPageName === 'Home' && !loading && !user && <LandingFooterNew />}

      {/* Global footer — hidden on landing page */}
      {currentPageName !== 'Home' && (
        <footer role="contentinfo" style={{
          backgroundColor: 'var(--slate-900)',
          color: 'var(--slate-400)',
          padding: '2rem 0',
          marginTop: '4rem'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 1.5rem',
            textAlign: 'center'
          }}>
            <LogoBrand size={96} glow style={{ display: 'block', margin: '0 auto 12px' }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              © 2026 <span style={{ color: '#94A3B8' }}>ADA Legal</span>{' '}
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
        @media (max-width: 860px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav {
            display: block !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }
      `}</style>

    </div>
    <aside role="complementary" aria-label="Accessibility tools" style={{ position: 'relative', zIndex: 9999 }}>
      <AuditButton currentPageName={currentPageName} />
    </aside>
    </LiveAnnouncer>
  );
}