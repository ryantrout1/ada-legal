/**
 * M2 Phase 2 — shell drift guards.
 *
 * Recon result: of the six shells the M2 plan listed for "re-port
 * verbatim from B44", FOUR are ahead of B44 on our side, and porting
 * B44 over them would be a regression, not a sync:
 *
 *   GuideReportCTA     B44 links to a `RightsPathway` page that was never
 *                      built, under "launching soon" copy. Ours starts a
 *                      real Ada session with guide page context and routes
 *                      to /chat, in Ada's own voice.
 *   ChapterPageLayout  Feature-equal to B44 (all-chapters map, section
 *                      blocks, prev/next) PLUS the `tldr` block B44 has no
 *                      equivalent of.
 *   AutoCiteLinks      Ours fixed a real React bug — B44 keys list items
 *                      with Math.random(), which produces a new key every
 *                      render and defeats reconciliation.
 *   ShareBar           B44 switches button styles imperatively per display
 *                      mode; ours renders only inside the always-dark hero
 *                      and uses the dark token family directly. Same output,
 *                      and it inlines the Facebook/X/LinkedIn glyphs that
 *                      lucide-react dropped for trademark reasons.
 *
 * These assertions are tripwires, not behavior tests: they fail loudly if
 * a later "sync from B44" reintroduces the older shape. Each names the
 * capability at stake rather than pinning a whole file, so ordinary
 * refactors don't trip them.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readCode as readCodeAt } from '../support/sourceText.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

/** Absence assertions run against comment-stripped source — see tests/support. */
const readCode = (rel: string) => readCodeAt(resolve(root, rel));

const CTA = 'src/app/components/standards/GuideReportCTA.jsx';
const LAYOUT = 'src/app/components/standards/ChapterPageLayout.tsx';
const CITE = 'src/app/components/standards/AutoCiteLinks.tsx';
const SHARE = 'src/app/components/standards/ShareBar.tsx';
const HERO = 'src/app/components/standards/GuideHeroBanner.tsx';

describe('GuideReportCTA keeps the live Ada handoff', () => {
  const src = read(CTA);

  it('shows the opening-soon notice instead of walking somebody into a chat', () => {
    // Pinned the session-start and the navigate until 2026-07-29. Ada is
    // not open, so both were wrong: the navigate dropped a person on a
    // conversation that cannot happen, and the session-start left a trail
    // of sessions that were never conversations.
    expect(src).toContain('useAdaSoon');
    expect(src).toMatch(/adaSoon\?\.openSoon\(\)/);
  });

  it('does not start a session for a conversation nobody is about to have', () => {
    // Comment-stripped on purpose. The restore instructions in the file
    // name both of these, and a raw-source check would fail on the very
    // note that tells the next person how to put them back.
    const code = readCodeAt(CTA);
    expect(code).not.toMatch(/startAdaSessionWithContext/);
    expect(code).not.toMatch(/navigate\('\/ada'\)/);
  });

  it('says what to put back when Ada opens', () => {
    // The guide context is what lets her first reply know which page the
    // person was reading. Losing that to a silent deletion would be a
    // worse outcome than the notice itself.
    expect(src).toMatch(/When Ada opens|restore/i);
  });

  it('does not resurrect the RightsPathway destination', () => {
    // The destination pin stands: B44's primary CTA points at a page
    // that was never built here, so linking to it would be a dead end.
    // Both CTAs land on /chat instead.
    const code = readCode(CTA);
    expect(code).not.toMatch(/RightsPathway/);
  });

  it('carries B44\u2019s copy verbatim', () => {
    // REVERSED 2026-07-24. M2 stripped the "60 seconds" framing and the
    // "launching soon" line as marketing register that overpromised.
    // The goal now is parity with what production actually shows, and
    // both lines are on the live site — so they are back, and this
    // asserts they stay. The overpromise concern was real; it is a copy
    // decision for Gina's review, not something to fix by silently
    // diverging from production.
    const src = read(CTA);
    expect(src).toMatch(/Think you experienced an ADA violation\?/);
    expect(src).toMatch(/60 [Ss]econds/);
    expect(src).toMatch(/launching soon/i);
    expect(src).toMatch(/Talk to Ada about what happened/);
  });
});

describe('ChapterPageLayout stays a superset of B44', () => {
  const src = read(LAYOUT);

  it('accepts and renders the tldr block B44 has no equivalent of', () => {
    expect(src).toMatch(/tldr\?:/);
    expect(src).toMatch(/\{tldr/);
  });

  it('keeps prev / next chapter navigation', () => {
    expect(src).toMatch(/ALL_CHAPTERS/);
    expect(src).toMatch(/const prev =/);
    expect(src).toMatch(/const next =/);
  });
});

describe('AutoCiteLinks keeps the stable-key fix', () => {
  const src = read(CITE);

  it('never keys elements with Math.random()', () => {
    // A fresh key every render forces React to discard and rebuild the
    // node; B44's copy does exactly this.
    expect(src).not.toMatch(/key=\{Math\.random\(\)\}/);
  });

  it('uses a deterministic counter for link keys', () => {
    expect(src).toMatch(/linkCounter/);
  });
});

describe('ShareBar keeps its own icon set and dark styling', () => {
  const src = read(SHARE);

  it('inlines the brand glyphs lucide-react no longer ships', () => {
    // Importing these from lucide-react would resolve to undefined and
    // render nothing.
    expect(src).not.toMatch(/import\s*\{[^}]*\b(Facebook|Twitter|Linkedin)\b[^}]*\}\s*from\s*'lucide-react'/);
    expect(src).toMatch(/function FacebookIcon/);
    expect(src).toMatch(/function TwitterIcon/);
    expect(src).toMatch(/function LinkedinIcon/);
  });

  it('does not reintroduce per-display-mode style switching', () => {
    const code = readCode(SHARE);
    expect(code).not.toMatch(/getDisplayMode/);
    expect(code).not.toMatch(/MODE_STYLES/);
  });
});

describe('GuideHeroBanner watermark', () => {
  const src = read(HERO);

  it('renders the logo watermark from the local asset', () => {
    expect(src).toMatch(/logo-transparent\.png/);
    expect(src).toMatch(/opacity:\s*0\.04/);
  });

  it('serves it locally, never from Base44 storage', () => {
    expect(readCode(HERO)).not.toMatch(/supabase/i);
  });

  it('marks the watermark decorative', () => {
    const code = readCode(HERO);
    const start = code.indexOf('<div');
    const wm = code.slice(start, code.indexOf('/>', code.indexOf('backgroundImage')));
    expect(wm, 'watermark div must be hidden from assistive tech').toMatch(/aria-hidden="true"/);
    expect(wm).toMatch(/pointerEvents:\s*'none'/);
  });
});

/**
 * A closed section must take up no room at all.
 *
 * It collapsed with `max-height: 0` and `overflow: hidden` until
 * 2026-07-29. That clips what gets painted, but the SVG diagrams inside
 * a closed section still counted toward the document's scroll height.
 * Chapter 4's content ended at 1791px and the page measured 3469px —
 * 1678px of nothing after the footer, on every chapter, because every
 * chapter has diagrams inside collapsed sections.
 *
 * Measured in a real browser before and after: seven closed panels,
 * thirteen SVGs, and hiding them reclaimed exactly the 1678px.
 *
 * Nothing was lost in the swap. max-height had no transition on it, so
 * opening and closing was never animated — only the chevron rotates.
 *
 * Ref: /triage — blank space below the footer on chapter pages.
 */
describe('a collapsed chapter section occupies nothing', () => {
  const layout = readCodeAt('src/app/components/standards/ChapterPageLayout.tsx');

  it('collapses with display, not a zero max-height', () => {
    expect(layout).toContain("display: isOpen ? 'block' : 'none'");
  });

  it('does not go back to the max-height trick', () => {
    // The 50000px was the tell: a number that large is only ever there
    // to defeat a max-height animation that, here, did not exist.
    expect(layout).not.toContain('50000px');
    expect(layout).not.toMatch(/maxHeight:\s*isOpen/);
  });
});
