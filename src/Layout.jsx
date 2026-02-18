import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Scale, Menu, X, User, LogOut } from 'lucide-react';
import LiveAnnouncer from './components/a11y/LiveAnnouncer';
import AuditButton from './components/a11y/AuditButton';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
    CaseDetail: 'Case Detail', Marketplace: 'Marketplace', LawyerDashboard: 'My Cases',
    LawyerProfile: 'My Profile', LawyerRegister: 'Attorney Registration',
    LawyerLanding: 'For Attorneys', Admin: 'Admin Dashboard',
    AdminReview: 'Review Queue', AdminCases: 'All Cases',
    AdminAnalytics: 'Analytics', AdminLawyers: 'Manage Lawyers'
  };

  React.useEffect(() => {
    const title = PAGE_TITLES[currentPageName] || currentPageName;
    document.title = `${title} — ADA Legal Marketplace`;
  }, [currentPageName]);

  return (
    <LiveAnnouncer>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        /* Design System Variables */
        :root {
          --slate-900: #1E293B;
          --slate-800: #334155;
          --slate-700: #475569;
          --slate-600: #475569;
          --slate-500: #64748B;
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

      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Header */}
      <header role="banner" style={
        !loading && !user && currentPageName === 'Home'
          ? {
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
              backgroundColor: 'rgba(30,41,59,0.97)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              color: 'white', height: '72px',
              display: 'flex', alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }
          : {
              backgroundColor: 'var(--slate-900)',
              color: 'white', padding: '1rem 0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }
      }>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem',
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
            <Scale size={32} style={{ color: 'var(--terra-400)' }} />
            <span>ADA Legal</span>
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
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav role="navigation" aria-label="Main navigation" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }} className="desktop-nav">
            {!loading && (
              <>
                {!user && (
                  <>
                    <Link to={createPageUrl('Intake')} className="desktop-nav-public-links" style={{ color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }}>
                      Report Violation
                    </Link>
                    <Link to={createPageUrl('LawyerLanding')} className="desktop-nav-public-links" style={{ color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }}>
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
                    <Link to={createPageUrl('Intake')} style={{ color: 'white' }}>
                      Report Violation
                    </Link>
                    <Link to={createPageUrl('MyCases')} style={{ color: 'white' }}>
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
                    <Link to={createPageUrl('Marketplace')} style={{ color: 'white' }}>
                      Marketplace
                    </Link>
                    <Link to={createPageUrl('LawyerDashboard')} style={{ color: 'white' }}>
                      My Cases
                    </Link>
                    <Link to={createPageUrl('LawyerProfile')} style={{ color: 'white' }}>
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
                    <Link to={createPageUrl('Admin')} style={{ color: 'white' }}>
                      Dashboard
                    </Link>
                    <Link to={createPageUrl('AdminReview')} style={{ color: 'white' }}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} style={{ color: 'white' }}>
                      All Cases
                    </Link>
                    <Link to={createPageUrl('AdminAnalytics')} style={{ color: 'white' }}>
                      Analytics
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} style={{ color: 'white' }}>
                      Lawyers
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
          <nav role="navigation" aria-label="Mobile navigation" style={{
            display: 'none',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--slate-700)'
          }} className="mobile-nav">
            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!user && (
                  <>
                    <Link to={createPageUrl('Intake')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Report Violation
                    </Link>
                    <Link to={createPageUrl('LawyerLanding')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      For Attorneys
                    </Link>
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      style={{
                        background: 'var(--terra-600)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem',
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
                    <Link to={createPageUrl('Intake')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Report Violation
                    </Link>
                    <Link to={createPageUrl('MyCases')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      My Cases
                    </Link>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                      fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px'
                    }}>
                      <strong>USER</strong> {user.email}
                    </span>
                    <button onClick={handleLogout} style={{
                      background: 'transparent',
                      color: 'white',
                      border: '1px solid white',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      minHeight: '44px'
                    }}>
                      Sign Out
                    </button>
                  </>
                )}
                
                {user?.role === 'lawyer' && (
                  <>
                    <Link to={createPageUrl('Marketplace')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Marketplace
                    </Link>
                    <Link to={createPageUrl('LawyerDashboard')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      My Cases
                    </Link>
                    <Link to={createPageUrl('LawyerProfile')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Profile
                    </Link>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                      fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px'
                    }}>
                      <strong>LAWYER</strong> {user.email}
                    </span>
                    <button onClick={handleLogout} style={{
                      background: 'transparent',
                      color: 'white',
                      border: '1px solid white',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      minHeight: '44px'
                    }}>
                      Sign Out
                    </button>
                  </>
                )}
                
                {user?.role === 'admin' && (
                  <>
                    <Link to={createPageUrl('Admin')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Dashboard
                    </Link>
                    <Link to={createPageUrl('AdminReview')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      All Cases
                    </Link>
                    <Link to={createPageUrl('AdminAnalytics')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Analytics
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Lawyers
                    </Link>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px',
                      fontFamily: 'Manrope, sans-serif', borderRadius: '100px', padding: '4px 12px'
                    }}>
                      <strong>ADMIN</strong> {user.email}
                    </span>
                    <button onClick={handleLogout} style={{
                      background: 'transparent',
                      color: 'white',
                      border: '1px solid white',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      minHeight: '44px'
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

      {/* Footer — hidden on landing page (it has its own footer) */}
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
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              © 2026 ADA Legal Marketplace. All rights reserved.
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Connecting people with experienced ADA attorneys.
            </p>
          </div>
        </footer>
      )}

      <style>{`
        @media (max-width: 768px) {
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
        @media (max-width: 600px) {
          .desktop-nav-public-links {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }
      `}</style>

      <AuditButton currentPageName={currentPageName} />
    </div>
    </LiveAnnouncer>
  );
}