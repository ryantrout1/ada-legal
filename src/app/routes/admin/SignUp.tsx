/**
 * Admin sign-up.
 *
 * Renders Clerk's hosted SignUp component at /admin/sign-up. Lets the
 * first admin user create an account without having a pre-existing
 * password (email code or Google OAuth, depending on Clerk config).
 *
 * Ch0 posture: open sign-up. Any account created here becomes admin
 * per the requireAdmin gate in api/_admin.ts. Tighten this to an
 * email allowlist before Ch1 DNS cutover.
 */

import { SignUp } from '@clerk/clerk-react';

export default function AdminSignUp() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAF8',
        padding: '2rem 1rem',
      }}
    >
      <SignUp
        path="/admin/sign-up"
        routing="path"
        signInUrl="/admin/sign-in"
        forceRedirectUrl="/admin"
      />
    </main>
  );
}
