/**
 * Attorney portal sign-in.
 *
 * Renders Clerk's hosted SignIn at /portal/sign-in/* (trailing wildcard so
 * Clerk can run its internal steps). After sign-in, Clerk redirects to /portal.
 *
 * AAA theming (approval note 5): out-of-the-box Clerk is AA. The `appearance`
 * variables below pin AAA-contrast colors drawn from the design tokens
 * (src/app.css) — colorText ink-900 (16.5:1 on surface), colorPrimary
 * accent-500 (white-on-accent ~8:1 AAA). The tests/a11y/portal-aaa.spec.ts
 * audit confirms /portal/sign-in at runtime.
 */

import { SignIn } from '@clerk/clerk-react';

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

export default function PortalSignIn() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-8">
      <SignIn
        path="/portal/sign-in"
        routing="path"
        signUpUrl="/portal/sign-up"
        forceRedirectUrl="/portal"
        appearance={portalClerkAppearance}
      />
    </main>
  );
}
