/**
 * App root.
 *
 * Public routes render without any Clerk context. The admin subtree
 * is wrapped in ClerkProvider, which only initializes when a user
 * actually navigates into /admin/*.
 *
 * Why ClerkProvider is scoped to /admin/* and NOT the root:
 * The Clerk Production instance for ada-legal is configured with a
 * custom frontend API domain (clerk.adalegallink.com). While we stay
 * on Base44 for production DNS, that domain has no CNAME and the
 * Clerk JS bundle fails to load. If ClerkProvider sat at the root,
 * that failure would block public routes too. Mounting it only in
 * the admin branch makes the public chat fully independent of Clerk
 * DNS state.
 *
 * Ref: docs/ARCHITECTURE.md §5 — auth model
 */

import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { requireClerkPublishableKey } from '../lib/env';
import PublicLayout from './layouts/PublicLayout';
import Home from './routes/public/Home';
import Chat from './routes/public/Chat';
import AdminSignIn from './routes/admin/SignIn';
import AdminPlaceholder from './routes/admin/AdminPlaceholder';
import RequireAdmin from './components/RequireAdmin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no Clerk context */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
        </Route>

        {/* Admin tree — ClerkProvider only wraps this subtree */}
        <Route path="/admin/*" element={<AdminShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function AdminShell() {
  const publishableKey = requireClerkPublishableKey();
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <Routes>
        <Route path="sign-in/*" element={<AdminSignIn />} />
        <Route
          path="*"
          element={
            <RequireAdmin>
              <AdminPlaceholder />
            </RequireAdmin>
          }
        />
      </Routes>
    </ClerkProvider>
  );
}
