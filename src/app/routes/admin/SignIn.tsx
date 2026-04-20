/**
 * Admin sign-in.
 *
 * Renders Clerk's hosted SignIn component. Path is /admin/sign-in/*
 * (trailing wildcard required so Clerk can handle its internal routing
 * steps like email verification, second-factor, etc.).
 *
 * After successful sign-in, Clerk redirects to /admin (the guarded route).
 */

import { SignIn } from '@clerk/clerk-react';

export default function AdminSignIn() {
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
      <SignIn
        path="/admin/sign-in"
        routing="path"
        signUpUrl="/admin/sign-in"
        forceRedirectUrl="/admin"
      />
    </main>
  );
}
