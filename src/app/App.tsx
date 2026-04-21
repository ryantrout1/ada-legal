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
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { requireClerkPublishableKey } from '../lib/env.js';
import PublicLayout from './layouts/PublicLayout.js';
import AdminLayout from './layouts/AdminLayout.js';
import Home from './routes/public/Home.js';
import Chat from './routes/public/Chat.js';
import Attorneys from './routes/public/Attorneys.js';
import Accessibility from './routes/public/Accessibility.js';
import AdminSignIn from './routes/admin/SignIn.js';
import AdminSessions from './routes/admin/AdminSessions.js';
import AdminSessionDetail from './routes/admin/AdminSessionDetail.js';
import AdminAttorneys from './routes/admin/AdminAttorneys.js';
import AdminAttorneyEdit from './routes/admin/AdminAttorneyEdit.js';
import AdminSettings from './routes/admin/AdminSettings.js';
import AdminAnalytics from './routes/admin/AdminAnalytics.js';
import RequireAdmin from './components/RequireAdmin.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no Clerk context */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/attorneys" element={<Attorneys />} />
          <Route path="/accessibility" element={<Accessibility />} />
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
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/sessions" replace />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="sessions/:id" element={<AdminSessionDetail />} />
          <Route path="attorneys" element={<AdminAttorneys />} />
          <Route path="attorneys/new" element={<AdminAttorneyEdit />} />
          <Route path="attorneys/:id" element={<AdminAttorneyEdit />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="*" element={<Navigate to="/admin/sessions" replace />} />
        </Route>
      </Routes>
    </ClerkProvider>
  );
}
