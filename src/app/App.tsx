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
import ClassActions from './routes/public/ClassActions.js';
import Lawsuits from './routes/public/Lawsuits.js';
import LawsuitDetail from './routes/public/LawsuitDetail.js';
import ClassActionDetail from './routes/public/ClassActionDetail.js';
import Attorneys from './routes/public/Attorneys.js';
import ForAttorneys from './routes/public/ForAttorneys.js';
import Accessibility from './routes/public/Accessibility.js';
import AboutAda from './routes/public/AboutAda.js';
import Privacy from './routes/public/Privacy.js';
import Terms from './routes/public/Terms.js';
import Glossary from './routes/public/Glossary.js';
import SessionPackagePage from './routes/public/SessionPackagePage.js';
import StandardsGuide from './routes/public/StandardsGuide.js';
import StandardsChapter from './routes/public/StandardsChapter.js';
import GuidePage from './routes/public/GuidePage.js';
import PhotoCapture from './routes/public/PhotoCapture.js';
import SpotLanding from './routes/public/SpotLanding.js';
import SpotReadout from './routes/public/spot/SpotReadout.js';
import SpotReview from './routes/review/SpotReview.js';
import ReviewLayout from './routes/review/ReviewLayout.js';
import PhotoReviewQueue from './routes/review/PhotoReviewQueue.js';
import PhotoReviewLabel from './routes/review/PhotoReviewLabel.js';
import AdminSignIn from './routes/admin/SignIn.js';
import AdminSignUp from './routes/admin/SignUp.js';
import AdminSessions from './routes/admin/AdminSessions.js';
import AdminSessionDetail from './routes/admin/AdminSessionDetail.js';
import AdminAttorneys from './routes/admin/AdminAttorneys.js';
import AdminAttorneyEdit from './routes/admin/AdminAttorneyEdit.js';
import AdminFirms from './routes/admin/AdminFirms.js';
import AdminCases from './routes/admin/AdminCases.js';
import AdminFirmDetail from './routes/admin/AdminFirmDetail.js';
import AdminFirmEdit from './routes/admin/AdminFirmEdit.js';
import AdminListings from './routes/admin/AdminListings.js';
import AdminListingEdit from './routes/admin/AdminListingEdit.js';
import AdminListingConfigEdit from './routes/admin/AdminListingConfigEdit.js';
import AdminListingPreview from './routes/admin/AdminListingPreview.js';
import AdminSubscriptions from './routes/admin/AdminSubscriptions.js';
import AdminIntakes from './routes/admin/AdminIntakes.js';
import AdminSettings from './routes/admin/AdminSettings.js';
import AdminAnalytics from './routes/admin/AdminAnalytics.js';
import AdminPhotoReview from './routes/admin/AdminPhotoReview.js';
import AdminPhotoReviewDetail from './routes/admin/AdminPhotoReviewDetail.js';
import PortalLayout from './layouts/PortalLayout.js';
import PortalSignIn from './routes/portal/SignIn.js';
import PortalSignUp from './routes/portal/SignUp.js';
import PortalInbox from './routes/portal/PortalInbox.js';
import PortalBoard from './routes/portal/PortalBoard.js';
import PortalAccount from './routes/portal/PortalAccount.js';
import PortalFirmLawyers from './routes/portal/PortalFirmLawyers.js';
import PortalTasks from './routes/portal/PortalTasks.js';
import PortalPipeline from './routes/portal/PortalPipeline.js';
import PortalLitigations from './routes/portal/PortalLitigations.js';
import PortalPool from './routes/portal/PortalPool.js';
import PortalLitigationDetail from './routes/portal/PortalLitigationDetail.js';
import PortalCaseDetail from './routes/portal/PortalCaseDetail.js';
import PortalNewMatter from './routes/portal/PortalNewMatter.js';
import PortalAgenda from './routes/portal/PortalAgenda.js';
import { HelmetProvider } from 'react-helmet-async';
import RequireAdmin from './components/RequireAdmin.js';
import RequireAttorney from './components/RequireAttorney.js';
import ScrollToTop from './components/ScrollToTop.js';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public routes — no Clerk context */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          {/* M3: /lawsuits is the new canonical route. /class-actions stays
              live alongside it until Phase 4 flips it to a 301, so the
              legacy links in the sitemap and session packages keep
              resolving while the detail page is still being built. */}
          <Route path="/lawsuits" element={<Lawsuits />} />
          <Route path="/lawsuits/:slug" element={<LawsuitDetail />} />
          <Route path="/class-actions" element={<ClassActions />} />
          <Route
            path="/class-actions/:slug"
            element={<ClassActionDetail />}
          />
          <Route path="/attorneys" element={<Attorneys />} />
          <Route path="/for-attorneys" element={<ForAttorneys />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/about-ada" element={<AboutAda />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/s/:slug" element={<SessionPackagePage />} />
          <Route path="/standards-guide" element={<StandardsGuide />} />
          <Route
            path="/standards-guide/chapter/:num"
            element={<StandardsChapter />}
          />
          <Route
            path="/standards-guide/guide/:slug"
            element={<GuidePage />}
          />

          {/* Spot — business-facing screening. Inside PublicLayout so it wears
              the site chrome (header/nav/footer), like the other public pages.
              Ships dark via the spot_enabled flag. */}
          <Route path="/spot" element={<SpotLanding />} />
          {/* Public hosted readout — the buyer's report link from the email. */}
          <Route path="/spot/r/:slug" element={<SpotReadout />} />
        </Route>

        {/* Standalone — internal field-test capture tool. Deliberately
            outside PublicLayout so there's no nav, footer, or other
            chrome competing with the single-task form. Unlisted; not
            linked from the public site. See /plan: /photo. */}
        <Route path="/photo" element={<PhotoCapture />} />

        {/* Standalone — Spot internal report review + model A/B. Admin-gated
            at the API (requireAdmin); own surface, not the bench review. */}
        <Route path="/spot-review" element={<SpotReview />} />



        {/* Standalone — public, no-auth reviewer tool for Peter/Gina/Ryan.
            Self-identifies by name (no login); outside PublicLayout and
            Clerk, same discipline as /photo. Unlisted. */}
        <Route element={<ReviewLayout />}>
          <Route path="/review" element={<PhotoReviewQueue />} />
          <Route path="/review/:id" element={<PhotoReviewLabel />} />
        </Route>

        {/* Admin tree — ClerkProvider only wraps this subtree */}
        <Route path="/admin/*" element={<AdminShell />} />

        {/* Attorney portal — ClerkProvider only wraps this subtree, same
            DNS-scoping discipline as AdminShell (see note above). */}
        <Route path="/portal/*" element={<PortalShell />} />
      </Routes>
    </BrowserRouter>
    </HelmetProvider>
  );
}

function AdminShell() {
  const publishableKey = requireClerkPublishableKey();
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <Routes>
        <Route path="sign-in/*" element={<AdminSignIn />} />
        <Route path="sign-up/*" element={<AdminSignUp />} />
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
          <Route path="cases" element={<AdminCases />} />
          <Route path="attorneys" element={<AdminAttorneys />} />
          <Route path="attorneys/new" element={<AdminAttorneyEdit />} />
          <Route path="attorneys/:id" element={<AdminAttorneyEdit />} />
          <Route path="firms" element={<AdminFirms />} />
          <Route path="firms/new" element={<AdminFirmEdit />} />
          <Route path="firms/:id" element={<AdminFirmDetail />} />
          <Route path="firms/:id/edit" element={<AdminFirmEdit />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="listings/new" element={<AdminListingEdit />} />
          <Route path="listings/:id" element={<AdminListingEdit />} />
          <Route
            path="listings/:id/config"
            element={<AdminListingConfigEdit />}
          />
          <Route
            path="listings/:id/preview"
            element={<AdminListingPreview />}
          />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="intakes" element={<AdminIntakes />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="photo-review" element={<AdminPhotoReview />} />
          <Route path="photo-review/:id" element={<AdminPhotoReviewDetail />} />
          <Route path="*" element={<Navigate to="/admin/sessions" replace />} />
        </Route>
      </Routes>
    </ClerkProvider>
  );
}

/**
 * PortalShell — the attorney portal subtree. ClerkProvider wraps ONLY this
 * branch, mirroring AdminShell. Do NOT lift ClerkProvider to the root: the
 * Clerk production frontend-API domain (clerk.adalegallink.com) has no DNS
 * while we stay on Base44 for production, so a root mount would break public
 * routes too. (See the AdminShell note above.)
 */
function PortalShell() {
  const publishableKey = requireClerkPublishableKey();
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <Routes>
        <Route path="sign-in/*" element={<PortalSignIn />} />
        <Route path="sign-up/*" element={<PortalSignUp />} />
        <Route
          element={
            <RequireAttorney>
              <PortalLayout />
            </RequireAttorney>
          }
        >
          <Route index element={<PortalInbox />} />
          <Route path="board" element={<PortalBoard />} />
          <Route path="tasks" element={<PortalTasks />} />
          <Route path="agenda" element={<PortalAgenda />} />
          <Route path="pipeline" element={<PortalPipeline />} />
          <Route path="litigations" element={<PortalLitigations />} />
          <Route path="pool" element={<PortalPool />} />
          <Route path="litigations/:id" element={<PortalLitigationDetail />} />
          <Route path="cases/new" element={<PortalNewMatter />} />
          <Route path="cases/:id" element={<PortalCaseDetail />} />
          <Route path="account" element={<PortalAccount />} />
          <Route path="firm" element={<PortalFirmLawyers />} />
          {/* Back-compat: the old Settings path now redirects to Account. */}
          <Route path="settings" element={<Navigate to="/portal/account" replace />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Route>
      </Routes>
    </ClerkProvider>
  );
}
