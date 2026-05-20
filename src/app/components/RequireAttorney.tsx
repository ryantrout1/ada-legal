/**
 * Protects the portal subtree: unauthenticated users get redirected to
 * /portal/sign-in.
 *
 * Client-side guard only. The server boundary is requireAttorney in
 * api/_attorney.ts (which also resolves the firm scope) — that is the real
 * security boundary. Never trust this guard alone. Mirrors RequireAdmin.
 */

import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function RequireAttorney({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();

  // Don't flash the sign-in redirect while Clerk is still hydrating.
  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-50 text-ink-500">
        Loading…
      </main>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/portal/sign-in" replace />;
  }

  return <>{children}</>;
}
