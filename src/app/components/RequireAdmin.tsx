/**
 * Protects the /admin subtree.
 *
 * Two gates, in order: signed in at all (Clerk), then allowlisted
 * (server). The second is asked of /api/admin/me rather than evaluated
 * here, because the allowlist lives in server env and duplicating it in
 * the bundle would both publish it and create a copy that can drift.
 *
 * This remains a CLIENT-side guard and is not the security boundary —
 * requireAdmin() on every /api/admin/* route is. What this fixes is the
 * user-facing half of the same hole: before M6 any signed-in Clerk user
 * rendered the full admin shell, and Clerk is the attorney portal's auth
 * provider, so every pilot attorney saw an admin console.
 *
 * A denied user gets a plain explanation, not a redirect to sign-in.
 * Bouncing someone to a sign-in page they are already past reads as a
 * broken app and invites them to try again.
 */

import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

type Status = 'checking' | 'allowed' | 'denied';

const shellStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '2rem',
  textAlign: 'center' as const,
  fontFamily: 'Manrope, system-ui, sans-serif',
  color: 'var(--body)',
  background: 'var(--page-bg)',
};

export default function RequireAdmin({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/admin/me', { credentials: 'include' });
        if (!cancelled) setStatus(resp.ok ? 'allowed' : 'denied');
      } catch {
        // Fail closed: a failed check is not permission.
        if (!cancelled) setStatus('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <main style={shellStyle}>Loading…</main>;
  }

  if (!isSignedIn) {
    return <Navigate to="/admin/sign-in" replace />;
  }

  if (status === 'checking') {
    return <main style={shellStyle}>Checking access…</main>;
  }

  if (status === 'denied') {
    return (
      <main style={shellStyle} role="alert">
        <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--heading)' }}>
          You don&rsquo;t have access to the admin area
        </h1>
        <p style={{ margin: 0, maxWidth: '46ch', lineHeight: 1.6 }}>
          Your account is signed in but isn&rsquo;t on the admin list. If you
          reached this from the attorney portal, your case work lives at{' '}
          <a href="/portal" style={{ color: 'var(--link)' }}>
            /portal
          </a>
          .
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
