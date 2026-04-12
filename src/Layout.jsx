import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Menu, X, User, Eye, Mail, MessageSquare, Camera } from 'lucide-react';
import LogoBrand from './components/LogoBrand';
import LiveAnnouncer from './components/a11y/LiveAnnouncer';
import AuditButton from './components/a11y/AuditButton';
import LandingFooterNew from './components/landing/LandingFooterNew';
import EarlyAccessBanner from './components/EarlyAccessBanner';
import FeedbackButton from './components/FeedbackButton';
import DisplaySettings, { applyPreferences, loadPreferences } from './components/a11y/DisplaySettings';
import UserAvatarMenu from './components/UserAvatarMenu';
import { ComingSoonProvider } from './components/useComingSoonModal';
import { ReadingLevelProvider } from './components/a11y/ReadingLevelContext';

export default function Layout({ children, currentPageName }) {
  // Scroll to top on page change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageName]);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = React.useState(false);
  const settingsButtonRef = React.useRef(null);
  const mobileSettingsButtonRef = React.useRef(null);

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
    if (mobileMenuOpen || mobileSettingsOpen) {
      document.body.style.overflow = 'hidden';
      if (mobileMenuOpen) {
        setTimeout(() => {
          const firstLink = document.querySelector('#mobile-nav-panel a, #mobile-nav-panel button');
          if (firstLink) firstLink.focus();
        }, 50);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen, mobileSettingsOpen]);

  React.useEffect(() => {
    if (!mobileMenuOpen && !mobileSettingsOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (mobileSettingsOpen) {
          setMobileSettingsOpen(false);
          mobileSettingsButtonRef.current?.focus();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, mobileSettingsOpen]);

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
    CaseDetail: 'Case Detail', Marketplace: 'Available Cases', LawyerDashboard: 'Attorney: My Cases',
    LawyerProfile: 'My Profile', LawyerRegister: 'Attorney Registration',
    LawyerCaseDetail: 'Attorney Case Detail',
    LawyerLanding: 'For Attorneys', StandardsGuide: 'ADA Standards Guide',
    Admin: 'Admin Dashboard', AdminReview: 'Review Queue', AdminCases: 'Case Manager',
    AdminAnalytics: 'Analytics', AdminLawyers: 'Attorney Network', AdminEmails: 'Email Templates', AdminFeedback: 'Feedback', AdminPhotoAnalyzer: 'ADA Photo', AdminIntakeAI: 'Talk to Ada',
    TitleIIPathway: 'Government Accessibility Complaints',
    TitleIPathway: 'Workplace Disability Discrimination',
    // Standards Chapters
    StandardsCh1: 'Ch 1: Application & Administration',
    StandardsCh2: 'Ch 2: Scoping Requirements',
    StandardsCh3: 'Ch 3: Building Blocks',
    StandardsCh4: 'Ch 4: Accessible Routes',
    StandardsCh5: 'Ch 5: General Site & Building Elements',
    StandardsCh6: 'Ch 6: Plumbing Elements & Facilities',
    StandardsCh7: 'Ch 7: Communication Elements & Features',
    StandardsCh8: 'Ch 8: Special Rooms, Spaces & Elements',
    StandardsCh9: 'Ch 9: Built-In Elements',
    StandardsCh10: 'Ch 10: Recreation Facilities',
    // Guide Pages
    GuideAccessibleDocuments: 'Making Documents Accessible',
    GuideAdaCoordinators: 'ADA Coordinators: Roles & Requirements',
    GuideAdaProtections: 'Who the ADA Protects',
    GuideBarrierRemoval: "Barrier Removal: What's Readily Achievable?",
    GuideCriminalJustice: 'Criminal Justice & the ADA',
    GuideDigitalBarriers: 'Website & App Barriers: Your Rights',
    GuideEducation: 'Education & the ADA',
    GuideEffectiveCommunication: 'Effective Communication',
    GuideEmergencyManagement: 'Emergency Management & Disability',
    GuideEmployment: 'Employment & the ADA (Title I)',
    GuideEntrances: 'Accessible Entrances & Doors',
    GuideFilingComplaint: 'How to File an ADA Complaint',
    GuideHotelsLodging: 'Hotels & Lodging Accessibility',
    GuideHousing: 'Housing, Apartments & the ADA',
    GuideIntroToAda: 'Introduction to the ADA',
    GuideLegalOptions: 'Your Legal Options After an ADA Violation',
    GuideMedicalFacilities: 'Medical Facility Accessibility',
    GuideMobilityDevices: 'Wheelchairs & Mobility Devices',
    GuideNewConstruction: 'New Construction & Alterations',
    GuideParking: 'Accessible Parking Rights',
    GuideParkingRequirements: 'Accessible Parking Requirements',
    GuidePlaygrounds: 'Accessible Playgrounds',
    GuideProgramAccess: 'Program Accessibility',
    GuideRamps: 'Ramps & Slope Requirements',
    GuideReachRanges: 'Reach Ranges & Operable Parts',
    GuideReasonableModifications: 'Reasonable Modifications',
    GuideRestaurantsRetail: 'Restaurants & Retail Accessibility',
    GuideRestrooms: 'Accessible Restroom Requirements',
    GuideServiceAnimals: 'Service Animals & the ADA',
    GuideSidewalks: 'Sidewalks & Pedestrian Access',
    GuideSignage: 'ADA Signage Requirements',
    GuideSmallBusiness: 'Small Business ADA Primer',
    GuideSocialMedia: 'Social Media & Digital Content Accessibility',
    GuideSwimmingPools: 'Swimming Pool Accessibility',
    GuideTaxIncentives: 'ADA Tax Incentives for Businesses',
    GuideTitleI: 'Title I: Employment Rights',
    GuideTitleII: 'Title II: State & Local Government Obligations',
    GuideTitleIII: 'Title III: Public Accommodations & Businesses',
    GuideTurningHandrails: 'Turning Spaces & Handrail Profiles',
    GuideVoting: 'Voting & Election Accessibility',
    GuideWcagExplained: 'WCAG 2.1 Level AA — What It Requires',
    GuideWebFirstSteps: 'First Steps Toward Web Compliance',
    GuideWebRule: 'Title II Web & Mobile App Accessibility Rule',
    GuideWebTesting: 'How to Test Your Website for Accessibility',
    GuideWhatToExpect: 'What to Expect: The ADA Legal Process',
    GuideWhyAttorney: 'Why You Need an ADA Attorney',
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
    setMobileSettingsOpen(false);
  }, [currentPageName]);

  return (
    <LiveAnnouncer>
    <ReadingLevelProvider>
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
          background-color: var(--page-bg);
          color: var(--body);
          margin: 0;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Fraunces', Georgia, serif;
          color: var(--heading);
          font-weight: 600;
          line-height: 1.2;
        }
        
        /* Skip Link — handled by globals.css .skip-to-main */
        
        /* Focus Styles — handled by globals.css */
        
        /* Links */
        a {
          color: var(--section-label);
          text-decoration: none;
        }
        
        a:hover {
          color: var(--section-label);
          text-decoration: underline;
        }
      `}</style>

      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-200px',
          left: '16px',
          background: 'var(--accent)',
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
      {!loading && !['Admin', 'AdminReview', 'AdminCases', 'AdminAnalytics', 'AdminLawyers', 'AdminEmails', 'AdminPhotoAnalyzer', 'AdminIntakeAI', 'LawyerDashboard', 'LawyerProfile', 'LawyerCaseDetail', 'Marketplace'].includes(currentPageName) && (
        <EarlyAccessBanner />
      )}

      {/* Header */}
      <header role="banner" aria-label="Site header" style={
        !loading && !user && currentPageName === 'Home'
          ? {
              position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 1000,
              backgroundColor: 'var(--dark-bg)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              color: 'white', height: '72px',
              display: 'flex', alignItems: 'center',
              boxShadow: 'none', border: 'none', outline: 'none'
            }
          : {
              backgroundColor: 'var(--dark-bg)',
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
          <Link to={user ? createPageUrl('Home') + '?view=home' : createPageUrl('Home')} style={{
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
            <span className="mobile-brand-text">ADA Legal <span style={{ color: 'var(--accent-lighter)' }}>Link</span></span>
          </Link>

          {/* Mobile: Eye (Display Settings) + Hamburger (Menu) */}
          <div className="mobile-header-buttons" style={{ display: 'none', alignItems: 'center', gap: '4px' }}>
            <button
              ref={mobileSettingsButtonRef}
              onClick={() => {
                setMobileSettingsOpen(!mobileSettingsOpen);
                if (mobileMenuOpen) setMobileMenuOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
              aria-label="Display settings"
              aria-expanded={mobileSettingsOpen}
              aria-haspopup="dialog"
            >
              <Eye size={22} aria-hidden="true" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (mobileSettingsOpen) setMobileSettingsOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
                minWidth: '44px',
                minHeight: '44px'
              }}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop Navigation — Approach 2: Ops Strip + Utility Menu */}
          <nav aria-label="Main navigation" style={{
            display: 'flex',
            alignItems: 'center',
            gap: (!loading && !user) ? '32px' : '6px'
          }} className="desktop-nav">
            {!loading && (
              <>
                {/* ── Visitor (logged out) ── */}
                {!user && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} className="desktop-nav-public-links" style={{ color: currentPageName === 'StandardsGuide' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none', minHeight: '44px', display: 'inline-flex', alignItems: 'center', padding: '6px 12px' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('LawyerLanding')} className="desktop-nav-public-links" style={{ color: currentPageName === 'LawyerLanding' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none', minHeight: '44px', display: 'inline-flex', alignItems: 'center', padding: '6px 12px' }} aria-current={currentPageName === 'LawyerLanding' ? 'page' : undefined}>
                      For Attorneys
                    </Link>
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      style={{
                        background: 'var(--section-label)',
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

                {/* ── User: Primary = My Cases ── */}
                {user?.role === 'user' && (
                  <>
                    <Link to={createPageUrl('MyCases')} style={{ color: currentPageName === 'MyCases' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: currentPageName === 'MyCases' ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'MyCases' ? 'page' : undefined}>
                      My Cases
                    </Link>
                    <UserAvatarMenu user={user} onLogout={handleLogout} extraMenuItems={[
                      { to: createPageUrl('StandardsGuide'), icon: <Eye size={15} />, label: 'ADA Standards Guide' },
                    ]} />
                  </>
                )}

                {/* ── Lawyer: Primary = Available Cases, My Cases ── */}
                {user?.role === 'lawyer' && (
                  <>
                    <Link to={createPageUrl('Marketplace')} style={{ color: currentPageName === 'Marketplace' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: currentPageName === 'Marketplace' ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'Marketplace' ? 'page' : undefined}>
                      Available Cases
                    </Link>
                    <Link to={createPageUrl('LawyerDashboard')} style={{ color: currentPageName === 'LawyerDashboard' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: currentPageName === 'LawyerDashboard' ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'LawyerDashboard' ? 'page' : undefined}>
                      My Cases
                    </Link>
                    <UserAvatarMenu user={user} onLogout={handleLogout} extraMenuItems={[
                      { to: createPageUrl('LawyerProfile'), icon: <User size={15} />, label: 'Profile' },
                      { to: createPageUrl('StandardsGuide'), icon: <Eye size={15} />, label: 'ADA Standards Guide' },
                    ]} />
                  </>
                )}

                {/* ── Admin: Soft-launch priority = Feedback, Intelligence, Review Queue, Case Manager ── */}
                {user?.role === 'admin' && (
                  <>
                    <Link to={createPageUrl('AdminFeedback')} style={{ color: currentPageName === 'AdminFeedback' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: currentPageName === 'AdminFeedback' ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'AdminFeedback' ? 'page' : undefined}>
                      Feedback
                    </Link>
                    <Link to={createPageUrl('AdminAnalytics')} style={{ color: currentPageName === 'AdminAnalytics' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: currentPageName === 'AdminAnalytics' ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'AdminAnalytics' ? 'page' : undefined}>
                      Intelligence
                    </Link>
                    <Link to={createPageUrl('AdminReview')} style={{ color: currentPageName === 'AdminReview' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: currentPageName === 'AdminReview' ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'AdminReview' ? 'page' : undefined}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} style={{ color: (currentPageName === 'AdminCases' || currentPageName === 'Admin') ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: (currentPageName === 'AdminCases' || currentPageName === 'Admin') ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'AdminCases' ? 'page' : undefined}>
                      Case Manager
                    </Link>
                    <Link to={createPageUrl('StandardsGuide')} style={{ color: currentPageName === 'StandardsGuide' ? '#FBB040' : 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', background: currentPageName === 'StandardsGuide' ? 'rgba(251,176,64,0.08)' : 'transparent' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      Standards Guide
                    </Link>
                    <UserAvatarMenu user={user} onLogout={handleLogout} extraMenuItems={[
                      { to: createPageUrl('AdminLawyers'), icon: <User size={15} />, label: 'Lawyers' },
                      { to: createPageUrl('AdminEmails'), icon: <Mail size={15} />, label: 'Email Templates' },
                      { to: createPageUrl('AdminPhotoAnalyzer'), icon: <Camera size={15} />, label: 'ADA Photo' },
                      { to: createPageUrl('AdminIntakeAI'), icon: <MessageSquare size={15} />, label: 'Talk to Ada' },
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

      {/* Mobile Display Settings — panel triggered by Eye icon */}
      {mobileSettingsOpen && (
        <>
          <div
            className="mobile-settings-overlay"
            onClick={() => setMobileSettingsOpen(false)}
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
          <div
            className="mobile-settings-panel"
            role="dialog"
            aria-label="Display settings"
            style={{
              position: 'fixed',
              top: '72px',
              left: 0,
              right: 0,
              maxHeight: 'calc(100vh - 72px)',
              backgroundColor: 'var(--dark-card-bg)',
              zIndex: 999,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '0 0 24px',
              display: 'none',
              borderBottom: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Close bar */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              padding: '8px 12px 0',
              position: 'sticky', top: 0,
              backgroundColor: 'var(--dark-card-bg)', zIndex: 1,
            }}>
              <button
                onClick={() => {
                  setMobileSettingsOpen(false);
                  mobileSettingsButtonRef.current?.focus();
                }}
                aria-label="Close display settings"
                style={{
                  background: 'transparent', border: 'none',
                  color: 'white', cursor: 'pointer',
                  padding: '8px',
                  minWidth: '44px', minHeight: '44px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '8px',
                }}
              >
                <X size={24} />
              </button>
            </div>
            <DisplaySettings
              variant="inline"
              isOpen={true}
              onClose={() => {
                setMobileSettingsOpen(false);
                mobileSettingsButtonRef.current?.focus();
              }}
            />
          </div>
        </>
      )}

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
              backgroundColor: 'var(--dark-card-bg)',
              zIndex: 999,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '8px 0 24px',
              display: 'none'
            }}
          >
            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* ── Visitor ── */}
                {!user && (
                  <>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <Link to={createPageUrl('LawyerLanding')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'LawyerLanding' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem' }} aria-current={currentPageName === 'LawyerLanding' ? 'page' : undefined}>
                      For Attorneys
                    </Link>
                    <button
                      onClick={() => { setMobileMenuOpen(false); base44.auth.redirectToLogin(); }}
                      style={{
                        background: 'var(--section-label)',
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

                {/* ── User ── */}
                {user?.role === 'user' && (
                  <>
                    <Link to={createPageUrl('MyCases')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'MyCases' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }} aria-current={currentPageName === 'MyCases' ? 'page' : undefined}>
                      My Cases
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 16px 0', padding: '8px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: 'var(--dark-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0', padding: '0 0 4px' }}>Resources</p>
                    </div>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#FBB040' : '#B0BEC5', padding: '10px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px 0', padding: '12px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--dark-muted)', margin: '0 0 8px' }}>{user.email}</p>
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

                {/* ── Lawyer ── */}
                {user?.role === 'lawyer' && (
                  <>
                    <Link to={createPageUrl('Marketplace')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'Marketplace' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }}>
                      Available Cases
                    </Link>
                    <Link to={createPageUrl('LawyerDashboard')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'LawyerDashboard' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }}>
                      My Cases
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 16px 0', padding: '8px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: 'var(--dark-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0', padding: '0 0 4px' }}>More</p>
                    </div>
                    <Link to={createPageUrl('LawyerProfile')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'LawyerProfile' ? '#FBB040' : '#B0BEC5', padding: '10px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }}>
                      Profile
                    </Link>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#FBB040' : '#B0BEC5', padding: '10px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      ADA Standards Guide
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px 0', padding: '12px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--dark-muted)', margin: '0 0 8px' }}>{user.email}</p>
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

                {/* ── Admin ── */}
                {user?.role === 'admin' && (
                  <>
                    <Link to={createPageUrl('AdminFeedback')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminFeedback' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }}>
                      Feedback
                    </Link>
                    <Link to={createPageUrl('AdminAnalytics')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminAnalytics' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }}>
                      Intelligence
                    </Link>
                    <Link to={createPageUrl('AdminReview')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminReview' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }}>
                      Review Queue
                    </Link>
                    <Link to={createPageUrl('AdminCases')} onClick={() => setMobileMenuOpen(false)} style={{ color: (currentPageName === 'AdminCases' || currentPageName === 'Admin') ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }}>
                      Case Manager
                    </Link>
                    <Link to={createPageUrl('StandardsGuide')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'StandardsGuide' ? '#FBB040' : 'white', padding: '14px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600 }} aria-current={currentPageName === 'StandardsGuide' ? 'page' : undefined}>
                      Standards Guide
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 16px 0', padding: '8px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: 'var(--dark-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0', padding: '0 0 4px' }}>More</p>
                    </div>
                    <Link to={createPageUrl('AdminLawyers')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminLawyers' ? '#FBB040' : '#B0BEC5', padding: '10px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }}>
                      Lawyers
                    </Link>
                    <Link to={createPageUrl('AdminEmails')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminEmails' ? '#FBB040' : '#B0BEC5', padding: '10px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }}>
                      Email Templates
                    </Link>
                    <Link to={createPageUrl('AdminPhotoAnalyzer')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminPhotoAnalyzer' ? '#FBB040' : '#B0BEC5', padding: '10px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }}>
                      ADA Photo
                    </Link>
                    <Link to={createPageUrl('AdminIntakeAI')} onClick={() => setMobileMenuOpen(false)} style={{ color: currentPageName === 'AdminIntakeAI' ? '#FBB040' : '#B0BEC5', padding: '10px 16px', display: 'block', textDecoration: 'none', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }}>
                      Talk to Ada
                    </Link>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px 0', padding: '12px 0 0' }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--dark-muted)', margin: '0 0 8px' }}>{user.email}</p>
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
      <main id="main-content" role="main" style={{ flex: 1, margin: 0, backgroundColor: 'var(--page-bg)' }}>
        {children}
      </main>

      {/* Floating Feedback Button — public pages only */}
      {!loading && !['Admin', 'AdminReview', 'AdminCases', 'AdminAnalytics', 'AdminLawyers', 'AdminEmails', 'AdminFeedback', 'AdminPhotoAnalyzer', 'AdminIntakeAI', 'LawyerDashboard', 'LawyerProfile', 'LawyerCaseDetail', 'Marketplace'].includes(currentPageName) && (
        <FeedbackButton />
      )}

      {/* Landing page footer — rendered outside main as sibling */}
      {currentPageName === 'Home' && !loading && !user && <LandingFooterNew />}

      {/* Global footer — hidden on landing page */}
      {currentPageName !== 'Home' && (
        <footer role="contentinfo" style={{
          backgroundColor: 'var(--dark-bg)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 1.5rem',
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {/* Brand mark — decorative, hidden from screen readers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} aria-hidden="true">
              <LogoBrand size={28} variant="dark-bg" className="footer-logo" />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.01em' }}>
                ADA Legal Link
              </span>
            </div>

            {/* Copyright */}
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--dark-muted)', whiteSpace: 'nowrap' }}>
              © 2026 ADA Legal Link. All rights reserved.
            </p>

            {/* Tagline */}
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--dark-muted)' }}>
              Connecting people with experienced ADA attorneys.
            </p>
          </div>
        </footer>
      )}

      <style>{`
        .mobile-nav-overlay {
          display: none !important;
        }
        .mobile-settings-overlay {
          display: none !important;
        }
        .mobile-settings-panel {
          display: none !important;
        }
        /* AAA target size: desktop nav links */
        .desktop-nav a {
          min-height: 44px !important;
          display: inline-flex !important;
          align-items: center !important;
        }
        @media (max-width: 860px) {
          .mobile-header-buttons {
            display: flex !important;
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
          .mobile-settings-panel {
            display: block !important;
          }
          .mobile-settings-overlay {
            display: block !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
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
    </ReadingLevelProvider>
    <aside role="complementary" aria-label="Accessibility tools" style={{ position: 'relative', zIndex: 9999 }}>
      <AuditButton currentPageName={currentPageName} />
    </aside>
    </LiveAnnouncer>
  );
}