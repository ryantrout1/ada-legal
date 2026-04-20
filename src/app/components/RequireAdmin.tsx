/**
 * Protects a subtree: unauthenticated users get redirected to /admin/sign-in.
 *
 * This is a client-side guard. Server-side enforcement for API routes lands
 * in Phase A Step 5 (part two — middleware) and is the real security boundary.
 * Never trust this guard alone for privileged actions.
 */

import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function RequireAdmin({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();

  // Don't flash the sign-in redirect while Clerk is still hydrating.
  if (!isLoaded) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9C9A92',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Loading…
      </main>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/admin/sign-in" replace />;
  }

  return <>{children}</>;
}
