# B44 → Vercel Drift Ledger (M0)

**CONTENT FREEZE DECLARED — 2026-07-22.** From this point until the M7 cutover, the Base44 repo and app receive **zero commits and zero Publishes** (M8 decommission excepted). All new work lands in `ada-legal`. This ledger is the authoritative delta between the April 2026 content port and current B44 main; each migration phase re-ports from B44 at the revision frozen here: **`ada-legal-link-B44` @ `6b1e9ac`**.

Diff counts are `diff -w` changed lines vs the Vercel counterpart. "manual-diff" = architectures differ (componentized vs monolith, or rebuilt page) so line counts aren't meaningful — port from B44 as design authority. Last-edit = most recent B44 commit touching the file.


## M1 — Chrome / Layout / DisplaySettings

_2 files tracked · 0 identical · 0 drifted · 2 manual-diff · 0 B44-only (no Vercel counterpart yet)_


### Manual-diff (architecture differs — B44 is design authority)

| B44 file | Vercel counterpart | Last B44 edit |
|---|---|---|
| `src/pages/Layout.jsx` | `src/app/AppShell.tsx` |  |
| `src/components/a11y/DisplaySettings.jsx` | `src/app/components/AccessibilityPanel.tsx` | 2026-06-15 · a11y(ada-chat): complete WCAG 2.2 AAA pass across all 5 display modes |


## M2 — Guides, chapters, StandardsGuide landing, AboutAda

_123 files tracked · 43 identical · 67 drifted · 0 manual-diff · 13 B44-only (no Vercel counterpart yet)_


### Drifted (1:1 counterpart, changed lines desc)

| B44 file | Δ lines | Last B44 edit |
|---|---:|---|
| `src/components/guide/ChapterPageLayout.jsx` | 837 | 2026-06-06 · Rename reading-level UI label 'Legal' -> 'Professional' everywhere in B44 |
| `src/pages/AboutAda.jsx` | 566 | 2026-06-11 · Remove pre-launch CTA row from About Ada page |
| `src/pages/StandardsGuide.jsx` | 348 | 2026-06-06 · chore(lint): clear all 34 lint errors |
| `src/components/guide/ShareBar.jsx` | 252 | 2026-03-02 · feat: complete guide system token migration — 97 files |
| `src/components/guide/GuideHeroBanner.jsx` | 176 | 2026-06-11 · Promote HomeV2 to live landing page |
| `src/components/guide/AutoCiteLinks.jsx` | 120 | 2026-03-02 · feat: complete guide system token migration — 97 files |
| `src/components/guide/GuideReportCTA.jsx` | 97 | 2026-06-11 · Promote HomeV2 to live landing page |
| `src/components/guide/GuideReadingLevelBar.jsx` | 30 | 2026-06-05 · File changes |
| `src/pages/StandardsCh6.jsx` | 23 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/StandardsCh4.jsx` | 21 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/StandardsCh8.jsx` | 21 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/StandardsCh3.jsx` | 19 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/components/guide/GuideStyles.jsx` | 18 | 2026-03-07 · Fix 3 Reading & Comprehension cross-section audit findings |
| `src/pages/StandardsCh7.jsx` | 17 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/StandardsCh10.jsx` | 17 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/GuideTurningHandrails.jsx` | 16 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/StandardsCh5.jsx` | 15 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/GuideEntrances.jsx` | 14 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideParkingRequirements.jsx` | 14 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideRamps.jsx` | 14 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideReachRanges.jsx` | 14 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideRestrooms.jsx` | 14 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/StandardsCh9.jsx` | 13 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/GuideAccessibleDocuments.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideAdaCoordinators.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideAdaProtections.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideBarrierRemoval.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideCriminalJustice.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideDigitalBarriers.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideEducation.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideEffectiveCommunication.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideEmergencyManagement.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideEmployment.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideFilingComplaint.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideHotelsLodging.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideHousing.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideIntroToAda.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideLegalOptions.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideMedicalFacilities.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideMobilityDevices.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideNewConstruction.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideParking.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuidePlaygrounds.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideProgramAccess.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideReasonableModifications.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideRestaurantsRetail.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideServiceAnimals.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideSidewalks.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideSignage.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideSmallBusiness.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideSocialMedia.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideSwimmingPools.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideTaxIncentives.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideTitleI.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideTitleII.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideTitleIII.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideVoting.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideWcagExplained.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideWebFirstSteps.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideWebRule.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideWebTesting.jsx` | 12 | 2026-03-07 · Fix 3 reading level audit findings |
| `src/pages/GuideWhatToExpect.jsx` | 11 | 2026-06-06 · chore(lint): clear all 34 lint errors |
| `src/pages/GuideWhyAttorney.jsx` | 11 | 2026-06-06 · chore(lint): clear all 34 lint errors |
| `src/pages/StandardsCh1.jsx` | 7 | 2026-02-26 · Simple reading level: 73 plain-language summaries across all 10 chapters |
| `src/pages/StandardsCh2.jsx` | 7 | 2026-03-02 · feat: complete guide system token migration — 97 files |
| `src/components/guide/GuideSection.jsx` | 4 | 2026-03-03 · feat: Phase 1 Reading Level infrastructure |
| `src/components/guide/GuideLegalCallout.jsx` | 4 | 2026-03-03 · feat: Phase 1 Reading Level infrastructure |


### B44-only (to be built on Vercel in this phase)

| B44 file | Last B44 edit |
|---|---|
| `src/components/guide/CiteLink.jsx` | 2026-03-02 · feat: complete guide system token migration — 97 files |
| `src/components/guide/ADAAssistant.jsx` | 2026-05-20 · feat(a11y): feature-flagged universal-Ada CTA stubs across 7 components — Plan C Phase C3b-iii |
| `src/components/guide/AskADAHelper.jsx` | 2026-06-20 · Pin guide AI helper to Opus 4.7 on Base44 credits |
| `src/components/standards/BreadcrumbAndInfo.jsx` | 2026-06-11 · Promote HomeV2 to live landing page |
| `src/components/standards/ChapterNavigator.jsx` | 2026-03-02 · feat: Standards Guide design token migration (Phase 1) |
| `src/components/standards/QuickFilters.jsx` | 2026-03-02 · feat: Standards Guide design token migration (Phase 1) |
| `src/components/standards/ResourceCard.jsx` | 2026-03-02 · feat: Standards Guide design token migration (Phase 1) |
| `src/components/standards/ResourceSection.jsx` | 2026-03-02 · feat: Standards Guide design token migration (Phase 1) |
| `src/components/standards/ResourceSections.jsx` | 2026-03-05 · feat: backlog items — Title I/III pages, case messaging, filter buttons |
| `src/components/standards/ShareCardButton.jsx` | 2026-03-02 · feat: Standards Guide design token migration (Phase 1) |
| `src/components/standards/StandardsHero.jsx` | 2026-06-21 · Standards Guide hero: match background glow to the homepage hero |
| `src/components/standards/StandardsSidebar.jsx` | 2026-03-02 · fix: sidebar count badges invisible in HC mode |
| `src/components/standards/StandardsStyles.jsx` | 2026-06-21 · Standards Guide hero: match homepage hero metrics (alignment + headline) |


<details><summary>43 identical files (re-verify at port time only)</summary>

- `src/components/guide/diagrams/ATMDiagram.jsx`
- `src/components/guide/diagrams/AmusementRideDiagram.jsx`
- `src/components/guide/diagrams/AssemblySeatingDiagram.jsx`
- `src/components/guide/diagrams/AssistiveListeningDiagram.jsx`
- `src/components/guide/diagrams/BathtubDiagram.jsx`
- `src/components/guide/diagrams/BenchDiagram.jsx`
- `src/components/guide/diagrams/BoatingDiagram.jsx`
- `src/components/guide/diagrams/ClearFloorDiagram.jsx`
- `src/components/guide/diagrams/CounterDiagram.jsx`
- `src/components/guide/diagrams/CurbRampDiagram.jsx`
- `src/components/guide/diagrams/DetentionCellDiagram.jsx`
- `src/components/guide/diagrams/DiningSurfaceDiagram.jsx`
- `src/components/guide/diagrams/DoorDiagram.jsx`
- `src/components/guide/diagrams/DressingRoomDiagram.jsx`
- `src/components/guide/diagrams/DrinkingFountainDiagram.jsx`
- `src/components/guide/diagrams/ElevatorDiagram.jsx`
- `src/components/guide/diagrams/GolfDiagram.jsx`
- `src/components/guide/diagrams/GrabBarDetailDiagram.jsx`
- `src/components/guide/diagrams/GuestRoomDiagram.jsx`
- `src/components/guide/diagrams/HandrailDiagram.jsx`
- `src/components/guide/diagrams/KitchenDiagram.jsx`
- `src/components/guide/diagrams/KneeToeDiagram.jsx`
- `src/components/guide/diagrams/LULAElevatorDiagram.jsx`
- `src/components/guide/diagrams/LavatoryDiagram.jsx`
- `src/components/guide/diagrams/LoadingZoneDiagram.jsx`
- `src/components/guide/diagrams/OperablePartsDiagram.jsx`
- `src/components/guide/diagrams/ParkingDiagram.jsx`
- `src/components/guide/diagrams/PlatformLiftDiagram.jsx`
- `src/components/guide/diagrams/PlayAreaDiagram.jsx`
- `src/components/guide/diagrams/PoolDiagram.jsx`
- `src/components/guide/diagrams/ProtrudingObjectsDiagram.jsx`
- `src/components/guide/diagrams/RampDiagram.jsx`
- `src/components/guide/diagrams/ReachRangeDiagram.jsx`
- `src/components/guide/diagrams/ResidentialUnitDiagram.jsx`
- `src/components/guide/diagrams/ShowerDiagram.jsx`
- `src/components/guide/diagrams/SignageDiagram.jsx`
- `src/components/guide/diagrams/StairwayDiagram.jsx`
- `src/components/guide/diagrams/TelephoneDiagram.jsx`
- `src/components/guide/diagrams/ToiletStallDiagram.jsx`
- `src/components/guide/diagrams/TransportationDiagram.jsx`
- `src/components/guide/diagrams/TurningSpaceDiagram.jsx`
- `src/components/guide/diagrams/UrinalDiagram.jsx`
- `src/components/guide/diagrams/WalkingSurfaceDiagram.jsx`

</details>


## M3 — Lawsuits (rebuild from B44 design; Neon-backed)

_2 files tracked · 0 identical · 0 drifted · 0 manual-diff · 2 B44-only (no Vercel counterpart yet)_


### B44-only (to be built on Vercel in this phase)

| B44 file | Last B44 edit |
|---|---|
| `src/pages/Lawsuits.jsx` | 2026-07-08 · fix(cohesion): identical grid on Attorneys + Lawsuits — kills the lopsided right-side gap |
| `src/pages/LawsuitDetail.jsx` | 2026-06-05 · File changes |


## M4 — Attorneys (rebuild; current Vercel page is a hardcoded mock)

_3 files tracked · 0 identical · 0 drifted · 1 manual-diff · 2 B44-only (no Vercel counterpart yet)_


### Manual-diff (architecture differs — B44 is design authority)

| B44 file | Vercel counterpart | Last B44 edit |
|---|---|---|
| `src/pages/Attorneys.jsx` | `src/app/routes/public/Attorneys.tsx` | 2026-07-08 · fix(cohesion): Attorneys page root matches Lawsuits — same background/content framing |


### B44-only (to be built on Vercel in this phase)

| B44 file | Last B44 edit |
|---|---|
| `src/components/attorneys/AttorneyCard.jsx` | 2026-07-07 · polish(cohesion): unify Attorneys + Lawsuits visual grammar |
| `src/components/attorneys/AttorneyFilters.jsx` | 2026-06-05 · File changes |


## M5 — HomeV2 + landing-v2 + Ada chat components

_21 files tracked · 0 identical · 0 drifted · 12 manual-diff · 9 B44-only (no Vercel counterpart yet)_


### Manual-diff (architecture differs — B44 is design authority)

| B44 file | Vercel counterpart | Last B44 edit |
|---|---|---|
| `src/pages/HomeV2.jsx` | `src/app/routes/public/Home.tsx` | 2026-06-26 · retire the old Base44 lawyer marketplace (§3.5c) |
| `src/components/ada/AdaBubble.jsx` | `src/app/routes/public/Chat.tsx` | 2026-06-06 · feat(ada): site-wide Ada bubble — Phase 1 (rules-based triage) |
| `src/components/ada/AdaChat.jsx` | `src/app/routes/public/Chat.tsx` | 2026-06-22 · Ada (B44): stop surfacing the test host ada.adalegallink.com to users |
| `src/components/ada/AdaConfirmBar.jsx` | `src/app/routes/public/Chat.tsx` | 2026-05-19 · feat(ada): ReadingLevelPicker + ConfirmBar + Input |
| `src/components/ada/AdaErrorBanner.jsx` | `src/app/routes/public/Chat.tsx` | 2026-05-19 · feat(ada): ResumeCard + ErrorBanner + SummaryCard |
| `src/components/ada/AdaInput.jsx` | `src/app/routes/public/Chat.tsx` | 2026-06-15 · a11y(ada-chat): complete WCAG 2.2 AAA pass across all 5 display modes |
| `src/components/ada/AdaMessageBubble.jsx` | `src/app/routes/public/Chat.tsx` | 2026-06-15 · a11y(ada-chat): complete WCAG 2.2 AAA pass across all 5 display modes |
| `src/components/ada/AdaMessageList.jsx` | `src/app/routes/public/Chat.tsx` | 2026-06-14 · fix(ada-chat): single-bubble waiting state — render thinking indicator inside Ada's reply bubble so it transitions to her answer in place; drop the detached indicator + empty placeholder card |
| `src/components/ada/AdaReadingLevelPicker.jsx` | `src/app/routes/public/Chat.tsx` | 2026-06-15 · fix(ada-chat): soften dark-mode selected reading-level pill — use --body (soft silver) not --heading (near-white) so the selected tab isn't a glaring white block in dark mode; AAA text + visibility preserved, bright retained in Contrast/Low-Vision |
| `src/components/ada/AdaResumeCard.jsx` | `src/app/routes/public/Chat.tsx` | 2026-05-19 · feat(ada): ResumeCard + ErrorBanner + SummaryCard |
| `src/components/ada/AdaSummaryCard.jsx` | `src/app/routes/public/Chat.tsx` | 2026-07-08 · feat(ada): enable the 'Open my summary' CTA on completed conversations |
| `src/components/ada/AdaTypingIndicator.jsx` | `src/app/routes/public/Chat.tsx` | 2026-06-14 · fix(ada-chat): single-bubble waiting state — render thinking indicator inside Ada's reply bubble so it transitions to her answer in place; drop the detached indicator + empty placeholder card |


### B44-only (to be built on Vercel in this phase)

| B44 file | Last B44 edit |
|---|---|
| `src/components/landing-v2/AdaSoonModal.jsx` | 2026-06-11 · Surface 'Why she's called Ada' pre-launch |
| `src/components/landing-v2/FinalCtaV2.jsx` | 2026-06-08 · HomeV2: consistent CTA color coding — purple=Ada, terracotta=Standards Guide |
| `src/components/landing-v2/HeroV2.jsx` | 2026-06-11 · Surface 'Why she's called Ada' pre-launch |
| `src/components/landing-v2/LandingV2Styles.jsx` | 2026-06-11 · Surface 'Why she's called Ada' pre-launch |
| `src/components/landing-v2/ScopeSection.jsx` | 2026-06-06 · HomeV2: switch headings from Fraunces to Manrope; load Manrope webfont |
| `src/components/landing-v2/StoryV2.jsx` | 2026-06-06 · HomeV2: switch headings from Fraunces to Manrope; load Manrope webfont |
| `src/components/landing-v2/ThreeTitlesV2.jsx` | 2026-06-08 · HomeV2: consistent CTA color coding — purple=Ada, terracotta=Standards Guide |
| `src/components/landing-v2/TrustV2.jsx` | 2026-06-06 · HomeV2: switch headings from Fraunces to Manrope; load Manrope webfont |
| `src/components/landing-v2/TwoPathsSection.jsx` | 2026-06-06 · HomeV2: switch headings from Fraunces to Manrope; load Manrope webfont |


## M6 — Admin (Gina’s UI)

_18 files tracked · 0 identical · 9 drifted · 0 manual-diff · 9 B44-only (no Vercel counterpart yet)_


### Drifted (1:1 counterpart, changed lines desc)

| B44 file | Δ lines | Last B44 edit |
|---|---:|---|
| `src/pages/AdminFirmDetail.jsx` | 1051 | 2026-07-02 · feat(admin): firm-detail header overhaul — scannable, actionable, AAA |
| `src/pages/AdminSessionDetail.jsx` | 707 | 2026-05-18 · feat(admin): wire AdminSessions list + AdminSessionDetail pages |
| `src/pages/AdminAttorneyEdit.jsx` | 590 | 2026-07-01 · feat(admin): Attorneys — full-row targets; archive moves to the record |
| `src/pages/AdminIntakes.jsx` | 514 | 2026-05-18 · feat(admin): AdminIntakes list page (replaces Phase 0 stub) |
| `src/pages/AdminAttorneys.jsx` | 444 | 2026-07-01 · feat(admin): Attorneys — full-row targets; archive moves to the record |
| `src/pages/AdminSessions.jsx` | 415 | 2026-05-18 · feat(admin): wire AdminSessions list + AdminSessionDetail pages |
| `src/pages/AdminFirms.jsx` | 381 | 2026-07-01 · feat(admin): LinkedRow — full-row targets, applied to Firms (Phase 1) |
| `src/pages/AdminFirmEdit.jsx` | 378 | 2026-07-01 · feat(admin): edit every firm detail — FirmForm + AdminFirmEdit |
| `src/pages/AdminSettings.jsx` | 194 | 2026-05-18 · feat(admin): AdminSettings wired to GET/PATCH /api/admin/settings |


### B44-only (to be built on Vercel in this phase)

| B44 file | Last B44 edit |
|---|---|
| `src/pages/AdminAnalyticsV2.jsx` | 2026-05-18 · feat(admin): AdminAnalyticsV2 with all six analytics views |
| `src/pages/AdminClassActions.jsx` | 2026-05-18 · feat(admin): wire Class Actions, Mass Actions, and Litigation edit pages |
| `src/pages/AdminDashboard.jsx` | 2026-05-18 · feat(admin): AdminDashboard with six at-a-glance count tiles |
| `src/pages/AdminFeedbackV2.jsx` | 2026-05-18 · feat(admin): AdminFeedbackV2 placeholder — feedback not yet collected |
| `src/pages/AdminIntakeDetail.jsx` | 2026-05-18 · feat(admin): AdminIntakeDetail page + routing registration |
| `src/pages/AdminLitigationEdit.jsx` | 2026-07-02 · fix(admin): nationwide sentinel — display + round-trip |
| `src/pages/AdminMassActions.jsx` | 2026-05-18 · feat(admin): wire Class Actions, Mass Actions, and Litigation edit pages |
| `src/pages/AdminStandardsGuide.jsx` | 2026-05-18 · feat(admin): scaffold 11 admin stub pages + Phase 0 connectivity test |
| `src/pages/AdminSubscribers.jsx` | 2026-05-18 · feat(admin): scaffold 11 admin stub pages + Phase 0 connectivity test |


## Notes
- **Ada chat components (M5):** the 11 `src/components/ada/*.jsx` files were diffed against the Vercel `Chat.tsx` monolith — line counts suppressed as meaningless. Their B44 last-edit history (WCAG 2.2 AAA pass 06-15, single-bubble waiting state 06-14, summary CTA 07-08, site-wide bubble 06-06) is the feature delta to carry over.
- **`ChapterPageLayout.jsx` (Δ837)** includes the B44 "Legal → Professional" reading-level rename — the single largest shell divergence in M2.
- **AskADAHelper / ADAAssistant / CiteLink** exist only on B44 (M2 B44-only) — the AI guide helper needs a new Vercel Anthropic endpoint at port time.
- Litigation **data** reconciliation is tracked separately in `litigation-reconciliation/RECONCILIATION.md`.
