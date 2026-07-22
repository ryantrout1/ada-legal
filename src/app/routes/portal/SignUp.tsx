/**
 * Attorney portal sign-up.
 *
 * Mirrors portal SignIn. v1 onboarding is manual (Gina sends a Clerk invite
 * out-of-band; admin/backfill pairs the attorney), so this route mostly exists
 * for Clerk's internal flow links. Same AAA `appearance` as SignIn.
 */

import { SignUp } from '@clerk/clerk-react';

const portalClerkAppearance = {
  variables: {
    // Clerk's appearance.variables take literal colour strings, not CSS custom
    // properties, so these are the only hand-copied hexes left in the app. They
    // mirror the @theme tokens; if those move, move these. Ratios deliberately
    // not restated — tests/unit/tokenParity.test.ts is the authority.
    colorPrimary: '#8C3F18', // accent-500 — white text on it ≈ 8:1 (AAA)
    colorText: '#1E293B', // ink-900
    colorTextSecondary: '#3D4A5C', // ink-700
    colorBackground: '#FFFFFF',
    colorInputText: '#1E293B',
    colorInputBackground: '#FFFFFF',
    colorDanger: '#8C2E1F', // danger-500
  },
} as const;

export default function PortalSignUp() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-8">
      <SignUp
        path="/portal/sign-up"
        routing="path"
        signInUrl="/portal/sign-in"
        forceRedirectUrl="/portal"
        appearance={portalClerkAppearance}
      />
    </main>
  );
}
