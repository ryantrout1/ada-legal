# Manual accessibility checklist

This document covers what automated tools cannot verify. Run through
this checklist before every public-facing release.

**Assumption:** you have read the accessibility statement at
`/accessibility` and agree that AAA is the floor. This checklist
exists to catch failures that axe-core misses.

---

## Why a manual checklist

Automated accessibility tools (axe-core, Lighthouse, WAVE) catch
roughly 30-40% of real accessibility problems. They are excellent
at finding things that are mechanically checkable: missing alt text,
low color contrast, improper ARIA roles, keyboard-trap risks that
show up in the DOM.

They cannot verify:

- That a screen reader announces content in the right order and at
  the right moments
- That the reading order makes sense when the CSS grid collapses
- That the keyboard tab order is logical
- That error messages are actually understood by the people they're
  shown to
- That a blind user can complete the core task (describe an incident,
  get information, find an attorney)
- That a user with cognitive disabilities can recover from a mistake
- That a user with motor impairments can hit every interactive target
- That the plain-language mode actually reads as plain language

This checklist walks you through those verifications.

---

## Setup — tools you need

- **VoiceOver** (macOS) or **NVDA** (Windows, free). Both are free
  and are what disabled users actually use. Screen reader emulators
  in Chrome DevTools are not sufficient.
- **A keyboard** (no mouse — pretend you don't have one)
- **Chrome DevTools** for emulating `prefers-reduced-motion`,
  `forced-colors: active`, and slow networks
- A mobile device for mobile-specific checks (iOS Safari + Android Chrome)

---

## Pre-flight

- [ ] Confirm the latest commit is deployed to production
- [ ] Run axe-core Playwright suite: `npm run test:a11y`. Zero AAA
  violations expected. If there are any, fix before continuing.

---

## Route-by-route manual check

### `/` (homepage)

**Screen reader pass**
- [ ] Landmarks announce: banner (header), navigation, main, contentinfo (footer)
- [ ] Headings read in logical order (h1 → h2 → h3, no skips)
- [ ] "Skip to main content" link works (if present; add one if not)
- [ ] Links describe their destination without surrounding context
  ("Talk to Ada" not just "click here")
- [ ] No content is announced twice (common CSS + aria-label mistake)

**Keyboard pass**
- [ ] Tab order matches visual reading order
- [ ] Focus ring is visible on every stop (do not lose focus)
- [ ] "Talk to Ada" CTA is reachable in 3 tabs or fewer
- [ ] Footer links are reachable

**Reduced motion**
- [ ] DevTools → Rendering → prefers-reduced-motion: reduce
- [ ] Reload page
- [ ] No animation plays

**Forced colors**
- [ ] DevTools → Rendering → forced-colors: active
- [ ] Reload page
- [ ] All buttons have visible borders
- [ ] All text is readable
- [ ] Focus ring is visible (will be system Highlight color)
- [ ] No element becomes invisible because its background got stripped

### `/chat`

**Screen reader pass**
- [ ] Initial greeting from Ada is announced (aria-live=polite on
  message list works)
- [ ] New messages are announced as they arrive, not all at once when
  the conversation loads
- [ ] User messages are NOT re-announced (announcement should only
  fire on assistant messages or error banners)
- [ ] "Ada is thinking" status is announced and un-announced at
  correct times
- [ ] Microphone button state changes are announced ("pressed"
  / "not pressed")
- [ ] "Speak" toggle state changes are announced
- [ ] Reading-level picker is announced as a group with its three
  options, current selection indicated

**Keyboard pass**
- [ ] Tab goes: reading level → TTS toggle → download → new conversation
  → message list → photo button → mic → textarea → send
- [ ] Enter in the textarea sends the message; Shift+Enter inserts
  a newline (hard to test without actually trying)
- [ ] Escape cancels photo upload if one is selected
- [ ] "New conversation" confirm dialog is keyboard-navigable

**Voice input (if you have a microphone)**
- [ ] Clicking the mic starts listening; clicking again stops
- [ ] While listening, the button is visually distinct AND
  aria-pressed="true" is set
- [ ] Transcript appears in the textarea after you stop speaking
- [ ] Works in Chrome, Safari, Edge, mobile Chrome, mobile Safari
- [ ] Firefox: mic button is NOT shown (graceful fallback)

**Text-to-speech**
- [ ] Click Speak. State persists after page reload.
- [ ] After sending a message, Ada's reply is spoken automatically
- [ ] Toggling off mid-speech cancels the current utterance
- [ ] Preference persists across sessions (check localStorage
  `ada2-tts-enabled`)

**Conversation download**
- [ ] Disabled when there are no messages
- [ ] Clicking downloads a .txt file with timestamps and a header
- [ ] Filename includes today's date

**Error recovery**
- [ ] Kill the network mid-send (DevTools → Offline)
- [ ] Verify error banner appears with three buttons: Try again, Start
  over, Download what we have
- [ ] Re-enable network, click Try again → message re-sends

**Session resume**
- [ ] Send a message
- [ ] Close the tab
- [ ] Navigate back to /chat (same browser)
- [ ] Resume card appears with preview of last message
- [ ] "Continue this conversation" restores the session
- [ ] "Start a new conversation" creates a fresh session (verify the
  old one is still in the database with its original content)

**Plain language mode**
- [ ] Select "Simple" reading level
- [ ] Send a question
- [ ] Verify Ada's response:
  - [ ] Sentences are ≤ 10 words
  - [ ] No legal terminology ("Title III", "42 USC")
  - [ ] No idioms ("piece of cake", "dropped the ball")
  - [ ] One question per message
  - [ ] Consistent vocabulary (same word for same concept across the
    conversation)

### `/attorneys`

**Screen reader pass**
- [ ] Filters are announced as a group
- [ ] Practice-area chips announce their pressed state
- [ ] Attorney cards announce in reading order: name, bar number,
  practice areas, contact info
- [ ] Pagination controls announce current page and total pages

**Keyboard pass**
- [ ] Tab order: search input → state filter → practice chips →
  results → pagination
- [ ] Enter on a chip toggles it
- [ ] Enter on an attorney card opens/expands it (if applicable)

**Forced colors**
- [ ] Active practice-area chips stay visually distinct from inactive
- [ ] Attorney cards have visible borders

### `/accessibility`

**Screen reader pass**
- [ ] Headings hierarchy is correct (h1, h2, h2, h2, h2, h2)
- [ ] Lists announce as lists with correct item counts
- [ ] Email link describes itself clearly

---

## Cross-cutting checks

### Cognitive accessibility (COGA)

- [ ] In Simple mode, a person unfamiliar with legal terms can
  complete a conversation end-to-end
- [ ] Error messages are understandable without technical background
- [ ] No confusing phrasings like "Unable to process your request"
  (say: "Something went wrong. Try again or start over.")

### Motor accessibility

- [ ] Every clickable target is at least 44×44 pixels (WCAG 2.5.5 AAA)
- [ ] No time-limited interactions — any UI that disappears after a
  few seconds fails users who read slowly
- [ ] Drag-and-drop is never the only way to do something

### Mobile screen reader (iOS VoiceOver)

- [ ] Open /chat in Safari on iPhone
- [ ] Turn on VoiceOver (triple-click the side button)
- [ ] Can you:
  - [ ] Navigate through the header
  - [ ] Type a message (or dictate one)
  - [ ] Hear Ada's reply announced
  - [ ] Access the TTS toggle
  - [ ] Download the conversation

### Mobile screen reader (Android TalkBack)

- [ ] Same checks, Android Chrome + TalkBack

---

## Sign-off

When you complete a full pass, add a dated entry here:

- 2026-XX-XX — Initial manual audit. Findings: [none / list]. Fixed in: [commit SHAs].
- 2026-XX-XX — Pre-cutover audit. Findings: [...].

---

## Out of scope for this doc

The following require outside expertise and are tracked separately:

1. **Real disabled user testing.** No amount of checklist-running
   substitutes for watching 5-8 users across disability categories
   try to use Ada. Budget ~$500-800 for participant time. This must
   happen before public launch. Coordinate through disability rights
   orgs, university disability services offices, or panels like
   Fable or Axess Lab.
2. **Third-party professional audit.** Firms like Deque or Level
   Access do AAA audits for $2,000-8,000 depending on scope. A
   certified audit lends credibility to the public statement.
3. **Cognitive review by a specialist.** COGA guidance comes from
   people who study cognitive disability professionally. If the
   manual Simple-mode check surfaces complexity concerns, a
   dedicated reviewer pays for itself.
