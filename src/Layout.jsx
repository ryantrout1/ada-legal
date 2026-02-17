import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Scale, Menu, X, User, LogOut } from 'lucide-react';

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        /* Design System Variables */
        :root {
          --slate-900: #1E293B;
          --slate-800: #334155;
          --slate-700: #475569;
          --slate-600: #64748B;
          --slate-500: #94A3B8;
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
        
        /* Skip Link */
        .skip-link {
          position: absolute;
          top: -100px;
          left: 0;
          background: var(--terra-600);
          color: white;
          padding: var(--space-sm) var(--space-md);
          text-decoration: none;
          z-index: 1000;
        }
        
        .skip-link:focus {
          top: 0;
        }
        
        /* Focus Styles */
        *:focus-visible {
          outline: 2px solid var(--terra-600);
          outline-offset: 2px;
        }
        
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

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header style={{
        backgroundColor: 'var(--slate-900)',
        color: 'white',
        padding: '1rem 0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
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
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }} className="desktop-nav">
            {!loading && (
              <>
                {!user && (
                  <>
                    <Link to={createPageUrl('Intake')} style={{ color: 'white' }}>
                      Report Violation
                    </Link>
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      style={{
                        background: 'var(--terra-600)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        minHeight: '44px'
                      }}
                    >
                      Sign In
                    </button>
                  </>
                )}
                
                {user?.role === 'user' && (
                  <>
                    <Link to={createPageUrl('MyCases')} style={{ color: 'white' }}>
                      My Cases
                    </Link>
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
                    <Link to={createPageUrl('AdminQueue')} style={{ color: 'white' }}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} style={{ color: 'white' }}>
                      All Cases
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} style={{ color: 'white' }}>
                      Lawyers
                    </Link>
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
          <nav style={{
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
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      style={{
                        background: 'var(--terra-600)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        minHeight: '44px'
                      }}
                    >
                      Sign In
                    </button>
                  </>
                )}
                
                {user?.role === 'user' && (
                  <>
                    <Link to={createPageUrl('MyCases')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      My Cases
                    </Link>
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
                    <Link to={createPageUrl('AdminQueue')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      All Cases
                    </Link>
                    <Link to={createPageUrl('AdminLawyers')} style={{ color: 'white', padding: '0.5rem 0' }}>
                      Lawyers
                    </Link>
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
      <main id="main-content" style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
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
      `}</style>
    </div>
  );
}