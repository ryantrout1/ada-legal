/**
 * App root.
 *
 * Wires:
 *   - ClerkProvider (auth context for the whole app)
 *   - BrowserRouter (client-side routing)
 *   - Top-level route tree: public / + admin sign-in + protected /admin
 *
 * Public routes use no auth context. The admin route tree is wrapped in
 * a guard that redirects to /admin/sign-in if the user isn't signed in.
 *
 * Ref: docs/ARCHITECTURE.md §5 — auth model
 */

import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { requireClerkPublishableKey } from '@/lib/env';
import PublicPlaceholder from './routes/public/PublicPlaceholder';
import AdminSignIn from './routes/admin/SignIn';
import AdminPlaceholder from './routes/admin/AdminPlaceholder';
import RequireAdmin from './components/RequireAdmin';

const PUBLISHABLE_KEY = requireClerkPublishableKey();

export default function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicPlaceholder />} />

          {/* Admin auth entry */}
          <Route path="/admin/sign-in/*" element={<AdminSignIn />} />

          {/* Protected admin tree */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPlaceholder />
              </RequireAdmin>
            }
          />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}
