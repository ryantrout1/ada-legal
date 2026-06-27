/**
 * PortalLayout — shell for all /portal/* (authed) routes (Phase 5 §7.1).
 *
 * The lawyer-workspace shell from the mockup: a slate sidebar (brand + firm,
 * Workspace/Practice nav groups, attorney footer + sign-out) and a topbar
 * (search + notifications + help, stubbed until their backends exist), with the
 * routed page in the content column. Scoped under `.lawyer-workspace` so the
 * slate palette never reaches the consumer site.
 *
 * Identity (firm name + attorney name) comes from GET /api/portal/me; on any
 * failure the shell still renders with Clerk-derived fallbacks. Mirrors the
 * ClerkProvider-scoping discipline (see App.tsx PortalShell): this layout only
 * renders inside the Clerk-wrapped /portal subtree.
 */

import { useCallback, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Calendar,
  CheckSquare,
  Users,
  BarChart3,
  Building2,
  Settings,
  Search,
  Bell,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import {
  bootstrapSession,
  portalSessionView,
  type PortalSession,
} from '../data/portalClient.js';
import PortalNoAccount from '../routes/portal/PortalNoAccount.js';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const WORKSPACE_NAV: NavItem[] = [
  { to: '/portal', label: 'Inbox', icon: Home, end: true },
  { to: '/portal/board', label: 'My Matters', icon: FileText },
  { to: '/portal/calendar', label: 'Calendar', icon: Calendar },
  { to: '/portal/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/portal/contacts', label: 'Contacts', icon: Users },
];

const PRACTICE_NAV: NavItem[] = [
  { to: '/portal/pipeline', label: 'Reports', icon: BarChart3 },
  { to: '/portal/account', label: 'Account', icon: Settings },
];

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} className="lw-sidebar-link">
      <Icon className="lw-icon" aria-hidden="true" strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function PortalLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();

  const clerkName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Attorney';
  const [session, setSession] = useState<PortalSession | null>(null);
  const [bootError, setBootError] = useState(false);

  const reload = useCallback(() => {
    setBootError(false);
    setSession(null);
    bootstrapSession()
      .then(setSession)
      .catch(() => setBootError(true));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const view = portalSessionView({ session, error: bootError });

  if (view === 'loading') {
    return (
      <main className="lawyer-workspace min-h-screen flex items-center justify-center bg-surface-50 text-ink-500">
        Loading your workspace…
      </main>
    );
  }

  if (view === 'holding') {
    const reason = session && !session.onboarded ? session.reason : 'error';
    const email = session && !session.onboarded ? session.email : null;
    return <PortalNoAccount reason={reason} email={email} onRetry={reload} />;
  }

  // view === 'shell' → onboarded; identity fields are present on the session.
  const identity = session as Extract<PortalSession, { onboarded: true }>;
  const attorneyName = identity.attorney.name ?? clerkName;
  const firmName = identity.firm.name ?? '';

  // Owners get a "Firm" entry (roster + per-lawyer view); members don't.
  const practiceNav: NavItem[] =
    identity.firmRole === 'owner'
      ? [
          PRACTICE_NAV[0],
          { to: '/portal/firm', label: 'Firm', icon: Building2 },
          ...PRACTICE_NAV.slice(1),
        ]
      : PRACTICE_NAV;

  return (
    <div className="lawyer-workspace lw-shell">
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-surface-50 focus:rounded"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside className="lw-sidebar">
        <div className="lw-sidebar-brand">
          <NavLink to="/portal" end className="lw-logo" aria-label="ADA Legal Link attorney portal home">
            <span>ADA</span>
            <span className="accent">Legal</span>
            <span>Link</span>
          </NavLink>
          {firmName && <div className="lw-firm">{firmName}</div>}
        </div>

        <nav className="lw-sidebar-nav" aria-label="Workspace">
          <div className="lw-sidebar-section" aria-hidden="true">
            Workspace
          </div>
          {WORKSPACE_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <nav className="lw-sidebar-nav" aria-label="Practice">
          <div className="lw-sidebar-section" aria-hidden="true">
            Practice
          </div>
          {practiceNav.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="lw-sidebar-footer">
          <div className="lw-avatar" aria-hidden="true">
            {initials(attorneyName)}
          </div>
          <div className="lw-who">
            <div className="lw-name">{attorneyName}</div>
            <div className="lw-role">Attorney</div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="lw-signout"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lw-main">
        <div className="lw-topbar">
          <button type="button" className="lw-search" disabled aria-label="Search — coming soon">
            <Search size={15} aria-hidden="true" />
            <span className="lw-search-label">Search matters, clients, documents…</span>
            <span className="lw-kbd" aria-hidden="true">
              ⌘K
            </span>
          </button>
          <div className="lw-topbar-actions">
            <button type="button" className="lw-iconbtn" disabled aria-label="Notifications — coming soon">
              <Bell size={18} aria-hidden="true" />
            </button>
            <button type="button" className="lw-iconbtn" disabled aria-label="Help — coming soon">
              <HelpCircle size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <main id="portal-main" className="lw-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
