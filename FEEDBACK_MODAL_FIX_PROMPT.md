# CRITICAL FIX: FeedbackModal must be immune to DisplaySettings CSS

## THE PROBLEM

`DisplaySettings.jsx` injects global CSS with `!important` that overrides all elements on the page:
```css
h2 { color: #FFFFFF !important; }
input { background-color: #1A1A1A !important; color: #FFFFFF !important; }
button { border: 2px solid #FFFFFF !important; }
```

The FeedbackModal must ALWAYS render with a light cream theme regardless of dark mode or high contrast mode. We have tried CSS exemptions, JS DOM manipulation, Shadow DOM — none have worked because the global selectors keep winning.

## THE SOLUTION

The fix has TWO parts that MUST both be done:

### PART 1: Make DisplaySettings SKIP the feedback modal entirely

In `src/components/a11y/DisplaySettings.jsx`, find the `applyPreferences` function. Every global CSS selector that targets bare elements (h1-h6, p, label, span, input, select, textarea, button, a) must be scoped so they do NOT apply inside `#feedback-modal-panel`.

**Find EVERY occurrence of these patterns in the HIGH CONTRAST section** and wrap them with `:not(#feedback-modal-panel *)`:

Change:
```css
h1, h2, h3, h4, h5, h6 {
  color: #FFFFFF !important;
}
```
To:
```css
h1:not(#feedback-modal-panel *), h2:not(#feedback-modal-panel *), h3:not(#feedback-modal-panel *), h4:not(#feedback-modal-panel *), h5:not(#feedback-modal-panel *), h6:not(#feedback-modal-panel *) {
  color: #FFFFFF !important;
}
```

Change:
```css
p, li, dd, dt, td, th, label, figcaption, blockquote {
  color: #F0F0F0 !important;
}
```
To:
```css
p:not(#feedback-modal-panel *), li:not(#feedback-modal-panel *), dd:not(#feedback-modal-panel *), dt:not(#feedback-modal-panel *), td:not(#feedback-modal-panel *), th:not(#feedback-modal-panel *), label:not(#feedback-modal-panel *), figcaption:not(#feedback-modal-panel *), blockquote:not(#feedback-modal-panel *) {
  color: #F0F0F0 !important;
}
```

Change:
```css
span, small {
  color: #D0D0D0 !important;
}
```
To:
```css
span:not(#feedback-modal-panel *), small:not(#feedback-modal-panel *) {
  color: #D0D0D0 !important;
}
```

Change:
```css
a {
  color: #FFD700 !important;
  text-decoration: underline !important;
}
```
To:
```css
a:not(#feedback-modal-panel *) {
  color: #FFD700 !important;
  text-decoration: underline !important;
}
```

Change:
```css
input, select, textarea {
  background-color: #1A1A1A !important;
  border: 2px solid #FFFFFF !important;
  color: #FFFFFF !important;
}
```
To:
```css
input:not(#feedback-modal-panel *), select:not(#feedback-modal-panel *), textarea:not(#feedback-modal-panel *) {
  background-color: #1A1A1A !important;
  border: 2px solid #FFFFFF !important;
  color: #FFFFFF !important;
}
```

Change:
```css
input::placeholder, textarea::placeholder {
  color: #D0D0D0 !important;
}
```
To:
```css
input:not(#feedback-modal-panel *)::placeholder, textarea:not(#feedback-modal-panel *)::placeholder {
  color: #D0D0D0 !important;
}
```

Change:
```css
input:focus, select:focus, textarea:focus {
  border-color: #FFD700 !important;
}
```
To:
```css
input:not(#feedback-modal-panel *):focus, select:not(#feedback-modal-panel *):focus, textarea:not(#feedback-modal-panel *):focus {
  border-color: #FFD700 !important;
}
```

Change:
```css
button {
  border: 2px solid #FFFFFF !important;
}
```
To:
```css
button:not(#feedback-modal-panel *) {
  border: 2px solid #FFFFFF !important;
}
```

**Do the SAME for the DARK MODE section** — find the same bare element selectors and add `:not(#feedback-modal-panel *)` to each one.

### PART 2: Rewrite FeedbackModal as a simple component with NO Shadow DOM

Replace `src/components/FeedbackModal.jsx` entirely with a simple React component:
- NO Shadow DOM, NO createPortal, NO ShadowHost
- NO `<style>` tag inside the component
- Use ONLY React inline styles on every element
- The `id="feedback-modal-panel"` on the outer panel div is REQUIRED (this is what Part 1 keys off of)
- Import `X` and `CheckCircle` from `lucide-react` normally
- Keep all existing functionality: form state, Feedback entity create, analytics tracking, Escape key, click-outside-to-close
- Keep the same visual design: cream background (#FAF7F2), dark text (#334155), white inputs, terracotta submit button (#C2410C)

## CRITICAL RULES
1. Do NOT use a `<style>` tag anywhere in FeedbackModal.jsx
2. Do NOT use CSS classes for styling — only inline styles
3. The `id="feedback-modal-panel"` attribute MUST be on the modal panel div
4. Every bare element selector in DisplaySettings.jsx MUST get the `:not(#feedback-modal-panel *)` exclusion
5. This applies to BOTH the dark mode AND high contrast CSS blocks
6. Do NOT remove or modify the modal exemption blocks that already exist at the end of each CSS section — they serve as a backup

## WHY THIS WORKS
The `:not()` pseudo-class tells the browser "apply this rule to every h2 EXCEPT ones that are descendants of #feedback-modal-panel". This means the global high contrast/dark mode rules will simply never match elements inside the feedback modal. The modal's own inline styles will be the only styles that apply. No specificity war. No override chain. The rules just don't match.
