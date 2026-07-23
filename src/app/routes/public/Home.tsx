/**
 * Home — the public landing page.
 *
 * Ported from Base44 (src/pages/HomeV2.jsx @ 6b1e9ac and the nine
 * components in src/components/landing-v2/). B44 is the design
 * authority: HomeV2 is the live landing on adalegallink.com, and this
 * is a faithful port of its composition and copy.
 *
 * WHAT THIS REPLACES: a 446-line hand-authored page written from
 * docs/ADA_PERSONA.md and docs/ADA_VOICE_GUIDE.md. That page was not
 * scaffolding — it was real work with a deliberate voice — so its copy
 * was extracted in full before replacement rather than deleted with
 * the file. Most of it turned out to already exist on B44
 * (ScopeSection is near-verbatim); five sections had no B44 equivalent
 * and were retired on the founders' call as off-brand. The record
 * lives outside the repo with the M5 salvage notes.
 *
 * PORT SEAMS (the only deliberate deviations from B44):
 *   - B44's HomeV2 gates render on base44.auth.me() and redirects
 *     logged-in users to MyCases / AdminDashboard. Dropped entirely:
 *     there is no consumer identity on Vercel, so the branch is dead
 *     code and the ?view=home escape hatch it needed is meaningless.
 *     Same call M1 made for the consumer-auth branches in the chrome.
 *   - createPageUrl('Ada') → /chat, createPageUrl('StandardsGuide') →
 *     /standards-guide.
 *   - useUniversalCta reads /api/public/site-flags instead of the
 *     Base44 SiteConfig entity. The flag is false today.
 *
 * Ref: /plan M5 Phase 1.
 */

import { Helmet } from 'react-helmet-async';
import LandingV2Styles from './components/landing/LandingV2Styles.jsx';
import { AdaSoonProvider } from './components/landing/AdaSoonModal.jsx';
import HeroV2 from './components/landing/HeroV2.jsx';
import TwoPathsSection from './components/landing/TwoPathsSection.jsx';
import ThreeTitlesV2 from './components/landing/ThreeTitlesV2.jsx';
import ScopeSection from './components/landing/ScopeSection.jsx';
import TrustV2 from './components/landing/TrustV2.jsx';
import StoryV2 from './components/landing/StoryV2.jsx';
import FinalCtaV2 from './components/landing/FinalCtaV2.jsx';

export default function Home() {
  return (
    <div className="home-v2-root" style={{ background: '#141820' }}>
      <Helmet>
        <title>ADA Legal Link — Know the Law. Know Your Rights.</title>
        <meta
          name="description"
          content="If a barrier shut you out, we help you understand what happened and connect you with someone who can help. Free."
        />
      </Helmet>
      <LandingV2Styles />
      <AdaSoonProvider>
        <HeroV2 />
        <TwoPathsSection />
        <ThreeTitlesV2 />
        <ScopeSection />
        <TrustV2 />
        <StoryV2 />
        <FinalCtaV2 />
      </AdaSoonProvider>
    </div>
  );
}
