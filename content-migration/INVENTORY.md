# ADA Legal Link — Base44 → New Stack Migration Inventory

**Branch surveyed:** `base44-archive` @ commit `179f79c` ("Update base44 packages")
**Walked on:** April 20, 2026
**Purpose:** Classify every asset in the Base44 prototype as MIGRATE, REFERENCE, or DROP, so the rebuild preserves authored work and discards only code that belongs to the old architecture or old positioning.

---

## Legend

| Classification | Meaning |
|---|---|
| **MIGRATE** | Copy content/asset into the new repo as-is. This is authored work whose value would be lost in rewrite. |
| **REFERENCE** | Read the Base44 version while building the new version. Preserve the decisions; rewrite the code. |
| **DROP** | Not moving forward. Marketplace-era, superseded, or never used. |

Every item classified is also given a destination folder in `/content-migration/` where the raw content will live in the new repo. That folder is read-only during rebuild; features copy from it into their final locations.

---

## Top-level observations

1. **This is a bigger prototype than the brief anticipated.** 80 pages, 43 authored interactive diagrams, two full Ada system prompts, 1,984 lines of a11y infrastructure, 802 lines of global CSS. The content-migration step is real work, not a rubber stamp.

2. **The Base44 positioning is half marketplace, half public good.** The guide + standards + diagrams + Ada = the public-good half, and those are gold. The marketplace/lawyer/admin-review surfaces are the marketplace-era half, mostly DROP per the new positioning (public good + channeled enterprise, not a marketplace).

3. **Reading level naming mismatch.** Base44 uses `simple | standard | professional`. The architecture brief uses `simple | standard | legal`. **Recommendation: adopt `professional` for the new stack.** It's more user-friendly, doesn't imply legal advice, and it's what every current page and prompt already uses. I'll update the brief when we close out the inventory review.

4. **Base44-hosted assets to rehost:** only 3 unique URLs (logo, OG social card, one generic image). Quick job — download from Base44's Supabase and re-upload to Vercel Blob.

5. **No Base44 SDK dependencies carry over.** Every `base44.integrations.Core.InvokeLLM` call, every `base44.entities.*`, every `base44/functions/` file is DROP at the code level. The *logic* inside them is REFERENCE at best (severity keyword lists, case routing rules). The new stack uses direct Anthropic API + Neon + Clerk.

---

## 1. Ada prompts — the highest-value content in the repo

These are the two production-quality Ada system prompts. MIGRATE VERBATIM into `/content-migration/prompts/`. The new tool-based engine rebuilds the scaffolding around them, but the prompt text itself is preserved.

| Prompt | Source file | Lines | Purpose | Classification | Destination |
|---|---|---|---|---|---|
| **Photo analysis system prompt** | `src/pages/AdminPhotoAnalyzer.jsx` (L8–~170) | ~160 | Senior ADA analyst persona, full 2010 Standards + ADAAG coverage, JSON schema enforcement, bounding-box output, multi-photo compliance chain detection | **MIGRATE verbatim** | `/content-migration/prompts/photo-analysis.ts` |
| **Ada intake conversational prompt** | `src/pages/AdminIntakeAI.jsx` (L11–91) | ~80 | Ada persona, reading-level-aware TONE blocks, Title I/II/III routing rules, contact-sensitivity rules for disabled users, `<EXTRACT>` structured output block, violation_subtype and business_type enums | **MIGRATE verbatim** | `/content-migration/prompts/ada-intake.ts` |
| **AskADA per-page system prompt builder** | `src/components/guide/AskADAHelper.jsx` (L42+) | ~80 | Builds system prompt from page context + reading level, with prompt-injection sanitization and page-scoped answering ("if not on this page, redirect to right chapter") | **MIGRATE verbatim** | `/content-migration/prompts/ask-ada.ts` |
| Prompt-injection sanitization regex | `src/components/guide/AskADAHelper.jsx` (L223–228) | ~6 | Strips common jailbreak phrases, hard 500-char limit | **MIGRATE verbatim** | `/content-migration/prompts/sanitize.ts` |

**Note on the intake prompt:** the `<EXTRACT>` JSON block pattern is a Base44 workaround (because their `InvokeLLM` strips structured tool-use). The new stack uses Anthropic's native tool-use instead — the `finalize_intake` and `classify_complaint` tools in the brief replace this block. But the **contents** of the EXTRACT (the fields, the enums, the strength levels) all migrate as the tool schemas.

---

## 2. Interactive SVG diagrams — 43 total

Location: `src/components/guide/diagrams/`
Structure: Each is a JSX file, ~200–500 lines, with inline SVG + callout data objects + keyboard-accessible click-to-reveal interactions + plain/legal dual-language content per callout + §-linked citations to ada.gov.

**All 43 are MIGRATE.** The SVG + callout data is the content; the React wiring gets rebuilt fresh on the new stack. Destination: `/content-migration/diagrams/` — one file per diagram preserving the original JSX so the callout data and SVG paths can be extracted into the new component shape.

| # | Diagram | Primary ADA section(s) covered |
|---|---|---|
| 1 | ATMDiagram | §707 (ATMs/fare machines) |
| 2 | AmusementRideDiagram | §234 (amusement rides) |
| 3 | AssemblySeatingDiagram | §221 (assembly areas) |
| 4 | AssistiveListeningDiagram | §219, §706 (assistive listening) |
| 5 | BathtubDiagram | §607 (bathtubs) |
| 6 | BenchDiagram | §903 (benches) |
| 7 | BoatingDiagram | §235 (boating facilities) |
| 8 | ClearFloorDiagram | §305 (clear floor/ground space) |
| 9 | CounterDiagram | §904 (sales/service counters) |
| 10 | CurbRampDiagram | §406 (curb ramps) |
| 11 | DetentionCellDiagram | §232, §807 (detention/correctional) |
| 12 | DiningSurfaceDiagram | §226, §902 (dining surfaces) |
| 13 | DoorDiagram | §404 (doors, doorways, gates) — **reviewed in detail, excellent quality** |
| 14 | DressingRoomDiagram | §222, §803 (dressing/fitting rooms) |
| 15 | DrinkingFountainDiagram | §211, §602 (drinking fountains) |
| 16 | ElevatorDiagram | §407 (elevators) |
| 17 | GolfDiagram | §238 (golf facilities) |
| 18 | GrabBarDetailDiagram | §609 (grab bars) |
| 19 | GuestRoomDiagram | §224, §806 (lodging guest rooms) |
| 20 | HandrailDiagram | §505 (handrails) |
| 21 | KitchenDiagram | §212, §804 (kitchens/kitchenettes) |
| 22 | KneeToeDiagram | §306 (knee and toe clearance) |
| 23 | LULAElevatorDiagram | §408 (LULA elevators) |
| 24 | LavatoryDiagram | §606 (lavatories/sinks) |
| 25 | LoadingZoneDiagram | §209, §503 (passenger loading zones) |
| 26 | OperablePartsDiagram | §309 (operable parts) |
| 27 | ParkingDiagram | §208, §502 (parking) |
| 28 | PlatformLiftDiagram | §410 (platform lifts) |
| 29 | PlayAreaDiagram | §240, §1008 (play areas) |
| 30 | PoolDiagram | §242, §1009 (swimming pools) |
| 31 | ProtrudingObjectsDiagram | §307 (protruding objects) |
| 32 | RampDiagram | §405 (ramps) |
| 33 | ReachRangeDiagram | §308 (reach ranges) |
| 34 | ResidentialUnitDiagram | §233, §809 (residential dwelling units) |
| 35 | ShowerDiagram | §608 (shower compartments) |
| 36 | SignageDiagram | §216, §703 (signs) |
| 37 | StairwayDiagram | §504 (stairways) |
| 38 | TelephoneDiagram | §217, §704 (telephones) |
| 39 | ToiletStallDiagram | §604, §604.8 (water closets and toilet compartments) |
| 40 | TransportationDiagram | §227, §810 (transportation facilities) |
| 41 | TurningSpaceDiagram | §304 (turning space) |
| 42 | UrinalDiagram | §605 (urinals) |
| 43 | WalkingSurfaceDiagram | §302, §403 (walking surfaces) |

(Homepage meta copy claims "42 diagrams" — actual count is 43. Minor copy fix.)

---

## 3. Guide pages — 46 total

Location: `src/pages/Guide*.jsx`
Structure: Each uses `<GuideStyles>`, `<GuideHeroBanner>`, `<GuideReadingLevelBar>`, and a sequence of `<GuideSection>` blocks with `simpleContent` / `legalContent` props. This is the reading-level content structure baked into every guide page.

**All 46 are MIGRATE content, REFERENCE component structure.** Destination: `/content-migration/guide-pages/` — one markdown file per page extracting the content at each reading level. The shared `GuideSection` component gets rebuilt fresh in the new stack.

| # | Page | Topic category |
|---|---|---|
| 1 | GuideIntroToAda | Foundations — what the ADA is |
| 2 | GuideAdaProtections | Foundations — who/what is protected |
| 3 | GuideTitleI | Titles — employment |
| 4 | GuideTitleII | Titles — government |
| 5 | GuideTitleIII | Titles — public accommodations |
| 6 | GuideEmployment | Employment deep-dive |
| 7 | GuideAdaCoordinators | Title II ADA coordinator requirement |
| 8 | GuideProgramAccess | Title II program access |
| 9 | GuideBarrierRemoval | Title III readily achievable |
| 10 | GuideReasonableModifications | Reasonable modifications doctrine |
| 11 | GuideEffectiveCommunication | Effective communication requirement |
| 12 | GuideServiceAnimals | Service animals |
| 13 | GuideMobilityDevices | Mobility devices, wheelchairs, OPDMDs |
| 14 | GuideEntrances | Accessible entrances |
| 15 | GuideRamps | Ramps |
| 16 | GuideParking | Parking basics |
| 17 | GuideParkingRequirements | Parking technical requirements |
| 18 | GuideRestrooms | Restrooms |
| 19 | GuideReachRanges | Reach ranges |
| 20 | GuideTurningHandrails | Turning space + handrails |
| 21 | GuideSidewalks | Sidewalks/pedestrian paths |
| 22 | GuideSignage | Signage |
| 23 | GuideNewConstruction | New construction + alterations |
| 24 | GuideEducation | Education sector |
| 25 | GuideHousing | Housing + FHA overlap |
| 26 | GuideMedicalFacilities | Medical/healthcare facilities |
| 27 | GuideHotelsLodging | Hotels and lodging |
| 28 | GuideRestaurantsRetail | Restaurants + retail |
| 29 | GuideSmallBusiness | Small business obligations |
| 30 | GuideSwimmingPools | Swimming pools |
| 31 | GuidePlaygrounds | Playgrounds |
| 32 | GuideCriminalJustice | Criminal justice / policing / detention |
| 33 | GuideEmergencyManagement | Emergency management + disasters |
| 34 | GuideVoting | Voting accessibility |
| 35 | GuideAccessibleDocuments | Accessible documents (Word, PDF) |
| 36 | GuideDigitalBarriers | Digital barriers overview |
| 37 | GuideSocialMedia | Social media accessibility |
| 38 | GuideWebRule | Title II web rule (2024) |
| 39 | GuideWebFirstSteps | Web accessibility first steps |
| 40 | GuideWebTesting | Web accessibility testing |
| 41 | GuideWcagExplained | WCAG explained |
| 42 | GuideTaxIncentives | Tax incentives for compliance |
| 43 | GuideFilingComplaint | Filing a complaint |
| 44 | GuideLegalOptions | Legal options overview |
| 45 | GuideWhyAttorney | Why an attorney (pre-positioning-shift, review copy) |
| 46 | GuideWhatToExpect | What to expect (pre-positioning-shift, review copy) |

**Positioning review note:** Pages #45 and #46 (GuideWhyAttorney, GuideWhatToExpect) were written under the marketplace positioning. The content migrates, but copy needs review for new "public good, not marketplace" framing before going live.

---

## 4. Standards chapters — 11 total

Location: `src/pages/Standards*.jsx`
Structure: Reorganized / plain-language version of the 2010 ADA Standards, chapter-by-chapter.

**All 11 are MIGRATE content, REFERENCE structure.** Destination: `/content-migration/standards/` — one markdown file per chapter plus a landing file.

| # | Page | Covers |
|---|---|---|
| 1 | StandardsGuide | Landing / overview |
| 2 | StandardsCh1 | Ch 1 — Application & Administration |
| 3 | StandardsCh2 | Ch 2 — Scoping Requirements |
| 4 | StandardsCh3 | Ch 3 — Building Blocks |
| 5 | StandardsCh4 | Ch 4 — Accessible Routes |
| 6 | StandardsCh5 | Ch 5 — General Site & Building Elements |
| 7 | StandardsCh6 | Ch 6 — Plumbing Elements & Facilities |
| 8 | StandardsCh7 | Ch 7 — Communication Elements & Features |
| 9 | StandardsCh8 | Ch 8 — Special Rooms, Spaces & Elements |
| 10 | StandardsCh9 | Ch 9 — Built-in Elements |
| 11 | StandardsCh10 | Ch 10 — Recreation Facilities |

---

## 5. Accessibility infrastructure (the a11y directory)

Location: `src/components/a11y/`
1,984 lines total across 9 files. This is the real WCAG 2.2 AAA work.

| File | Lines | Role | Classification |
|---|---|---|---|
| `DisplaySettings.jsx` | 1,043 | The display-preferences panel: display mode (default/dark/warm/low-vision/high-contrast), font size, line spacing, font family (including Atkinson Hyperlegible, OpenDyslexic, Lexend), reading level, OS preference auto-detection, localStorage persistence with migration handling | **MIGRATE decisions, REFERENCE code** — rebuild fresh in the new stack with same UX and same preference shape |
| `ReadingLevelContext.jsx` | 78 | React context provider for reading level, syncs with DisplaySettings preferences, sets `data-reading-level` on `<html>` for CSS consumers, cross-tab sync | **REFERENCE** — rebuild fresh, same three levels (with naming aligned) |
| `AuditButton.jsx` | 272 | Floating a11y audit trigger | **REFERENCE** — useful for QA, rebuild fresh |
| `AuditPanel.jsx` | 236 | Audit result surface | **REFERENCE** — rebuild fresh |
| `AuditSiteReport.jsx` | 122 | Site-wide audit report | **REFERENCE** — rebuild fresh |
| `AuditViolationItem.jsx` | 107 | Individual violation row | **REFERENCE** — rebuild fresh |
| `FocusTrap.jsx` | 64 | Focus trap for modals | **REFERENCE** — rebuild using modern React idioms |
| `LiveAnnouncer.jsx` | 41 | ARIA live region announcer | **REFERENCE** — trivial to rebuild, same API |
| `LoadingSpinner.jsx` | 21 | WCAG-friendly loading indicator | **REFERENCE** — rebuild fresh |

Destination: `/content-migration/a11y-reference/` — copy all 9 files verbatim as design reference; the new components live in `/src/app/components/a11y/` and are written fresh.

---

## 6. Design tokens, global CSS, fonts

| Asset | Source | Classification | Destination |
|---|---|---|---|
| `src/globals.css` (802 lines) | CSS custom properties for `slate-*`, `terra-*` palettes; theme overrides for display modes (default/dark/warm/low-vision/high-contrast); focus ring (3px solid #2563EB, 2px offset); touch target min 44px under `(pointer: coarse)`; `.sr-only` utility; accordion keyframes | **MIGRATE verbatim** | `/content-migration/design-tokens/globals.css` |
| `tailwind.config.js` | HSL-variable-based color system, radix tokens, sidebar color set, accordion animation | **MIGRATE verbatim** | `/content-migration/design-tokens/tailwind.config.js` |
| `components.json` | shadcn/ui config | **REFERENCE** — rebuild fresh if we choose to keep shadcn | `/content-migration/design-tokens/components.json` |
| Font stack: **Manrope** (body), **Fraunces** (display serif) | Loaded via Google Fonts | **MIGRATE** | note in `/content-migration/design-tokens/fonts.md` |
| Accessibility fonts: **Atkinson Hyperlegible**, **OpenDyslexic**, **Lexend** | Loaded conditionally via DisplaySettings when user picks the font preference | **MIGRATE** | note in `/content-migration/design-tokens/fonts.md` |

---

## 7. Intake flow components (the marketplace-era intake wizard)

Location: `src/components/intake/`
This is the form-based multi-step intake wizard. The new architecture replaces this entirely with Ada conversational intake (§17 of the brief). But the *questions asked* and *data fields collected* are useful reference.

| File | Classification | Why |
|---|---|---|
| `CaseIdDisplay.jsx` | DROP | Marketplace-era case identifier UI |
| `ContactStep.jsx` | REFERENCE | Field list: name, email, phone, contact preference — useful ListingConfig-like reference |
| `DigitalWebsiteStep.jsx` | REFERENCE | Fields collected for digital ADA claims |
| `ExitConfirmModal.jsx` | DROP | Wizard-specific |
| `FormField.jsx` | DROP | Wizard-specific |
| `IncidentStep.jsx` | REFERENCE | Incident narrative field structure |
| `PhotoUpload.jsx` | REFERENCE | Photo upload UX pattern (multi-file, preview, size limits) |
| `PhysicalSpaceStep.jsx` | REFERENCE | Physical-violation field taxonomy |
| `ProgressBar.jsx` | DROP | Wizard-specific |
| `ReviewSection.jsx` | DROP | Wizard-specific |
| `ReviewStep.jsx` | DROP | Wizard-specific |
| `SuccessStep.jsx` | DROP | Wizard-specific — new architecture has Ada confirm, not a success step |
| `TitleIIIInfoBox.jsx` | REFERENCE | Title III explanation copy |
| `TitleTriageStep.jsx` | REFERENCE | Title I/II/III routing logic in plain English |
| `ViolationTypeStep.jsx` | REFERENCE | Violation taxonomy (physical/digital/service-animal/etc.) |
| `WhatHappensNextCallout.jsx` | REFERENCE | Post-submit expectation-setting copy |
| `WizardNavButtons.jsx` | DROP | Wizard-specific |
| `formStyles.js` | DROP | Wizard-specific |

Destination for REFERENCE items: `/content-migration/intake-reference/`

---

## 8. Emails

Location: `src/components/emails/`

| File | Classification | Notes |
|---|---|---|
| `brandedEmailTemplate.jsx` | **MIGRATE** — template shape and styling | Logo URL needs rehosting (currently pointing at Base44's Supabase) |
| `caseEmails.jsx` | **MIGRATE content, REFERENCE code** | Individual email bodies for case lifecycle events. Copy migrates; send mechanism rewrites to Resend. |
| `renderTemplate.jsx` | REFERENCE | Template renderer — new stack uses `@react-email` or equivalent |

Destination: `/content-migration/email-templates/`

---

## 9. Landing page components

Location: `src/components/landing/`
19 files. Mixed — some Know-Your-Rights-era good content, some marketplace-era.

| File | Classification | Notes |
|---|---|---|
| `BrandIcons.jsx` | MIGRATE | Brand SVG marks |
| `CommitmentSection.jsx` | REFERENCE | Commitment copy — review for new positioning |
| `CommunityVoices.jsx` | REFERENCE | Testimonial layout |
| `FinalCTA.jsx` | DROP | Marketplace-era CTA |
| `FinalCTANew.jsx` | REFERENCE | Newer CTA variant — review for new positioning |
| `ForAttorneysNew.jsx` | DROP | Marketplace-era attorney pitch (new model: free directory, not marketplace) |
| `HowItWorks.jsx` | DROP | Marketplace-era |
| `HowItWorksNew.jsx` | REFERENCE | Newer how-it-works — review |
| `KnowYourRightsSection.jsx` | MIGRATE | Rights overview — good copy |
| `LandingFooter.jsx` | DROP | Old footer |
| `LandingFooterNew.jsx` | REFERENCE | New footer — review for updated link set |
| `LandingHeroNew.jsx` | REFERENCE | Hero copy — review for new positioning |
| `LandingStyles.jsx` | MIGRATE | Styling constants |
| `LawyerHero.jsx` | DROP | Marketplace attorney recruitment |
| `LawyerHowItWorks.jsx` | DROP | Marketplace attorney recruitment |
| `LawyerValueProps.jsx` | DROP | Marketplace attorney recruitment |
| `OurStorySection.jsx` | MIGRATE | ADALL origin story — authored |
| `PricingSection.jsx` | DROP | Marketplace-era pricing (new model: free for users, paid by law firms) |
| `StoriesSection.jsx` | REFERENCE | User stories layout |

Destination: `/content-migration/landing-content/` for MIGRATE + REFERENCE items.

---

## 10. Marketplace / Lawyer / Portal / Admin surfaces — mostly DROP

These are the marketplace-era surfaces. The new architecture is fundamentally different: public Ada + paid-firm class-action listings + gov-branded enterprise intake. Most of this doesn't carry forward.

| Directory | Files | Classification | Why |
|---|---|---|---|
| `src/components/marketplace/` | 10 | **DROP** | Case-marketplace UI — superseded by Ch1 class-action directory + Ada intake |
| `src/components/lawyer/` | 23 | **DROP** | Lawyer dashboard UI — new model has no lawyer-facing dashboard in Ch0/Ch1; directory is free and curated |
| `src/components/portal/` | 8 | **DROP** | Client portal — new users get Ada conversations, not a case-tracking portal. Revisit post-Ch1. |
| `src/components/pathway/` | 3 | **REFERENCE** | "Title I/II/III pathway" routing UI — replaced by Ada conversational routing, but logic is useful reference |
| `src/components/admin/` | 19 top-level + subdirs | **DROP** (mostly) | Case-review admin surfaces. New admin panel (§13 of brief) has different shape. Review individual files for any content worth extracting. |
| `src/components/analytics/` | 24 | **DROP** | Marketplace analytics dashboards. New admin analytics are simpler in Ch0/Ch1 (§13 + §22). |
| `src/components/standards/` | 10 | **REFERENCE** | Standards-browsing UI — used on the Standards* pages. New stack rebuilds with new design; this is reference for layout decisions. |
| `src/components/shared/` | 3 | **MIGRATE decisions** | `AiPhotoAnalysisPanel.jsx` is the photo-analysis display component — the display pattern is worth preserving. Rebuild fresh on new stack. |
| `src/components/ui/` | 49 | **REFERENCE** (or fresh shadcn install) | shadcn/ui primitives. Easier to `npx shadcn@latest add` the ones we need in the new repo than to migrate these. |

Destination for REFERENCE items: `/content-migration/legacy-reference/` — unzipped for lookup, clearly labeled as deprecated.

---

## 11. Admin pages — classify individually

Location: `src/pages/Admin*.jsx`

| File | Size | Classification | Notes |
|---|---|---|---|
| `Admin.jsx` | 512 bytes | DROP | Stub router |
| `AdminAnalytics.jsx` | 512 bytes | DROP | Marketplace analytics hub |
| `AdminAnalytics.jsx.bak` | 8.5K | DROP | `.bak` file |
| `AdminCases.jsx` | 19K | DROP | Case review UI — marketplace-era |
| `AdminEmails.jsx` | 3.5K | REFERENCE | Email template editor — new admin has similar need |
| `AdminFeedback.jsx` | 5.5K | REFERENCE | Feedback inbox — may carry forward |
| `AdminIntakeAI.jsx` | 46K | **MIGRATE prompts, REFERENCE UI** | Contains the intake Ada prompt. Preview mode = precursor to the Ch1 Ada Preview sandbox. |
| `AdminLawyers.jsx` | 13K | REFERENCE | Attorney curation UI — similar need in Ch0 admin panel |
| `AdminPhotoAnalyzer.jsx` | 86K | **MIGRATE prompt, REFERENCE UI** | Contains the photo analysis prompt + multi-photo UI. The analysis display pattern is worth preserving. |
| `AdminReview.jsx` | 27K | DROP | Case-review workflow — marketplace-era |

---

## 12. Lawyer/Marketplace pages — DROP

Location: `src/pages/`

| File | Classification |
|---|---|
| `CaseDetail.jsx` | DROP — marketplace-era |
| `Intake.jsx` | DROP — form-wizard intake, replaced by Ada |
| `LawyerCaseDetail.jsx` | DROP |
| `LawyerDashboard.jsx` | DROP |
| `LawyerLanding.jsx` | DROP |
| `LawyerProfile.jsx` | DROP |
| `LawyerRegister.jsx` | DROP |
| `Marketplace.jsx` | DROP |
| `MyCases.jsx` | DROP |
| `RightsPathway.jsx` | REFERENCE — Ada now does pathway routing conversationally, but the logic is useful |
| `TitleIIIPathway.jsx` | REFERENCE — same |
| `TitleIPathway.jsx` | REFERENCE — same |
| `Home.jsx` | REFERENCE — current homepage, review for new positioning |

---

## 13. Base44 serverless functions — DROP (logic is REFERENCE)

Location: `base44/functions/`

| Function | Purpose | Classification |
|---|---|---|
| `processCaseAI/entry.ts` | Classifies cases into subtypes, severity by keyword lists | **DROP code, REFERENCE logic** — keyword lists (HIGH_KEYWORDS, MEDIUM_KEYWORDS, PHYSICAL_SUBTYPE_MAP, DIGITAL_TECH_PRIORITY) useful as seed context for new prompts or as validation checklist |
| `backfillCaseAI/entry.ts` | Batch processor | DROP |
| `contactReminder/entry.ts` | Scheduled reminder emails | REFERENCE — email cadence pattern |
| `dailyNewCasesDigest/entry.ts` | Daily admin digest | DROP |
| `onCaseReclaimed/entry.ts` | Case-lifecycle hook | DROP |
| `onLawyerApproved/entry.ts` | Lawyer approval hook | REFERENCE — Ch0 attorney-approval flow has similar need |
| `onCaseStatusChange/entry.ts` | Status change hook | DROP |

Destination for REFERENCE extracts: `/content-migration/severity-keywords.ts` + notes.

---

## 14. Top-level docs

| File | Classification | Destination |
|---|---|---|
| `ACCESSIBILITY_STANDARDS.md` (245 lines) | **MIGRATE verbatim** — WCAG fix log with SC references, apply-to-all-pages checklist | `/content-migration/accessibility-standards.md` |
| `FEEDBACK_MODAL_FIX_PROMPT.md` (156 lines) | REFERENCE — one-off fix prompt, historical | `/content-migration/legacy-reference/` |
| `README.md` (39 lines) | DROP — Base44 boilerplate README | — |
| `concept-dashboard.html` (34K) | REFERENCE — an HTML concept mockup of something | view before deciding |
| `index.html` | MIGRATE meta/OG copy, DROP Base44 CDN refs | `/content-migration/seo-meta.md` |
| `package.json` | DROP — Base44 dependencies. New Vite project has its own. | — |
| `eslint.config.js`, `postcss.config.js`, `vite.config.js`, `jsconfig.json` | DROP — new project has its own configs | — |

---

## 15. Base44-hosted assets to rehost

Only 3 unique URLs in use, all pointing at `qtrypzzcjebvfcihiynt.supabase.co` (Base44's CDN):

| Asset | Path | Purpose | Destination |
|---|---|---|---|
| ADALL logo (transparent) | `/public/6994acc34810e36068eddec2/96059e9a4_ADALL-logo-transparent.png` | Email header, nav | `/content-migration/illustrations/logo-transparent.png` → eventually Vercel Blob + `/public/logo.png` in new repo |
| OG social card | `/public/6994acc34810e36068eddec2/og-social-card.png` | Favicon + OG image + Twitter card | `/content-migration/illustrations/og-card.png` |
| Generic image | `/public/6994acc34810e36068eddec2/d5cb8191b_image.png` | Unknown — find usage before migrating | check one file usage, then migrate if content |

**Action before archive is finalized:** download all three into `/content-migration/illustrations/` so we're not dependent on Base44's CDN.

---

## 16. Privacy policy / Terms of Service

**Not found** in the repo survey. Check with Ryan — may exist elsewhere (draft doc, legal review, externally hosted). Needed before Ch0 cutover per brief §24.

---

## Content-migration folder layout (final)

```
/content-migration/
├── INVENTORY.md                 (this document, committed to main)
│
├── prompts/
│   ├── photo-analysis.ts        (verbatim from AdminPhotoAnalyzer.jsx)
│   ├── ada-intake.ts            (verbatim from AdminIntakeAI.jsx)
│   ├── ask-ada.ts               (verbatim from AskADAHelper.jsx)
│   └── sanitize.ts              (injection-sanitization regex)
│
├── diagrams/
│   ├── ATMDiagram.jsx           (43 JSX files, callout data + SVG preserved)
│   ├── ...
│   └── WalkingSurfaceDiagram.jsx
│
├── guide-pages/
│   ├── 01-intro-to-ada.md       (46 markdown files, content per reading level)
│   ├── ...
│   └── 46-what-to-expect.md
│
├── standards/
│   ├── 00-guide.md
│   ├── 01-application-and-administration.md
│   └── ... (11 files)
│
├── a11y-reference/
│   └── (9 files copied from src/components/a11y/)
│
├── design-tokens/
│   ├── globals.css              (verbatim 802 lines)
│   ├── tailwind.config.js       (verbatim)
│   └── fonts.md                 (font stack notes)
│
├── email-templates/
│   ├── branded-template.jsx     (template shape)
│   ├── case-emails.jsx          (email bodies)
│   └── notes.md                 (sending path rewrites to Resend)
│
├── landing-content/
│   └── (selected MIGRATE + REFERENCE files from landing/)
│
├── intake-reference/
│   └── (REFERENCE-classified intake wizard files for field-taxonomy lookup)
│
├── legacy-reference/
│   └── (marketplace-era / superseded stuff kept for quick reference)
│
├── illustrations/
│   ├── logo-transparent.png     (downloaded from Base44 CDN)
│   ├── og-card.png
│   └── (to-be-identified).png
│
├── accessibility-standards.md   (verbatim ACCESSIBILITY_STANDARDS.md)
├── seo-meta.md                  (extracted OG/meta copy + page titles)
└── severity-keywords.ts         (extracted from processCaseAI for prompt reference)
```

---

## Recommendations for Ryan to review

1. **Adopt `professional` as the third reading-level name** (matching Base44's existing implementation, replacing the brief's `legal`). I'll update the architecture brief when you confirm.

2. **Photo analysis & Ada intake prompts migrate verbatim.** These are the highest-value single items in the repo. The new tool-use engine wraps them with structured outputs instead of the `<EXTRACT>` block hack, but the prompt text itself is the asset.

3. **Diagrams stay as JSX**, not pure SVG files. The callout data (plain + legal language per callout, with §-linked citations) is co-located with the SVG and it's the co-location that makes them valuable. New stack rebuilds the component shell; the diagram data file is what moves.

4. **Drop the marketplace/lawyer/portal/admin-review trees wholesale** unless you specifically want something from them. The pathway logic and a few specific files (`AdminEmails`, `AdminLawyers`) are REFERENCE.

5. **The a11y directory is the crown jewel of the codebase** after the prompts and diagrams. DisplaySettings alone is 1,043 lines of tested, validated preference management with OS detection. Rebuild fresh (because component model changes), but read every line first.

6. **Rehost the 3 Base44 Supabase assets** before we do anything else, so the new stack is not dependent on Base44's CDN.

7. **`ACCESSIBILITY_STANDARDS.md` is an ongoing doc**, not a one-time migration. It should live at `/docs/ACCESSIBILITY_STANDARDS.md` in the new repo and get appended to as new fixes land.

8. **Privacy/ToS are missing.** We need them before first real user per brief §24. Track as a pre-launch to-do.

---

**End of inventory. Review items above, mark any disagreements, then we proceed to Phase A step 1 (repo skeleton) of the build order.**
