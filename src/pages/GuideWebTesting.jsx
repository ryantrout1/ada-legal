import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideWebTesting() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="How to Test Your Website for Accessibility"
        typeBadge="Guide"
        badgeColor="var(--link)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="why-test"
            title="Why Testing Matters"
          >
            <p>
              Making a website accessible isn't a one-time task — it requires
              <strong> regular testing</strong> to find barriers, fix them, and
              make sure new content doesn't introduce new problems. The DOJ's
              Title II web rule requires conformance with WCAG 2.1 Level AA, and
              testing is how you know whether you meet that standard.
            </p>
            <p>
              Effective testing combines <strong>three approaches</strong>:
              automated scanning tools, manual keyboard and visual checks, and
              screen reader testing. No single method catches everything — you
              need all three.
            </p>
          </GuideSection>

          <GuideSection
            id="automated-tools"
            title="Automated Testing Tools"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 — Conformance Testing</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  WCAG defines conformance as meeting all Level A and Level AA
                  success criteria for entire web pages. Automated tools evaluate
                  machine-testable criteria — approximately 30–40% of all success
                  criteria.
                </p>
                <p style={{ margin: 0 }}>
                  Criteria like "text alternatives serve the equivalent purpose"
                  (SC 1.1.1) or "content is understandable" (Principle 3) require
                  human judgment and cannot be fully evaluated by automated tools
                  alone.
                </p>
              </>
            }
          >
            <p>
              Automated tools scan your web pages and flag common accessibility
              issues. They're fast and good for catching <strong>low-hanging
              fruit</strong>, but they only find about <strong>30–40% of
              issues</strong>.
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { name: 'axe DevTools (Deque)', what: 'Browser extension for Chrome and Firefox. Scans the current page and reports WCAG violations with detailed fix suggestions. Free core version covers most needs.', catches: 'Missing alt text, low contrast, missing form labels, duplicate IDs, missing landmarks' },
                { name: 'WAVE (WebAIM)', what: 'Browser extension that adds visual icons directly on the page showing errors, alerts, and structural elements. Very intuitive for non-developers.', catches: 'Empty links, missing headings, contrast errors, missing language attribute, redundant alt text' },
                { name: 'Lighthouse (Google)', what: 'Built into Chrome DevTools (Audits tab). Runs an accessibility audit based on axe-core. Good for quick checks during development.', catches: 'Similar to axe — contrast, labels, ARIA attributes, tab order issues' }
              ].map((tool, i, arr) => (
                <div key={i} style={{
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--heading)' }}>{tool.name}</p>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>{tool.what}</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>
                    <strong>Catches:</strong> {tool.catches}
                  </p>
                </div>
              ))}
            </div>
            <p>
              <strong>What automated tools miss:</strong> Whether alt text is
              actually meaningful, whether a keyboard user can complete a task,
              whether content makes sense when read aloud, whether focus order
              is logical, and whether custom components work with assistive
              technology.
            </p>
          </GuideSection>

          <GuideSection
            id="manual-testing"
            title="Manual Testing"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 SC 2.1.1 — Keyboard (Level A)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "All functionality of the content is operable through a keyboard
                  interface without requiring specific timings for individual
                  keystrokes."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>SC 1.4.4 — Resize Text (Level AA)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Except for captions and images of text, text can be resized
                  without assistive technology up to 200 percent without loss of
                  content or functionality."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>SC 1.4.3 — Contrast (Minimum) (Level AA)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The visual presentation of text and images of text has a
                  contrast ratio of at least 4.5:1."
                </p>
              </>
            }
          >
            <p>
              Manual testing catches the majority of issues that automated tools
              miss. Here's a <strong>step-by-step checklist</strong>:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { step: 'Keyboard navigation', how: 'Put your mouse away. Use Tab to move forward, Shift+Tab to move back, Enter or Space to activate. Can you reach every link, button, form field, and menu? Can you always see where you are (visible focus indicator)? Can you escape every modal and dropdown?' },
                { step: 'Zoom to 200%', how: 'Press Ctrl/Cmd + to zoom to 200%. Does all content still display? Does text reflow without horizontal scrolling? Do menus and forms still work? Nothing should be cut off or overlapping.' },
                { step: 'Check heading structure', how: 'Use the WAVE tool or browser extensions to view the heading outline. Headings should go in order: H1 → H2 → H3. No skipped levels. Every page should have exactly one H1.' },
                { step: 'Check color contrast', how: 'Use the Colour Contrast Analyser or WebAIM\'s contrast checker. Test text against its background — body text needs 4.5:1, large text (18pt or 14pt bold) needs 3:1. Don\'t forget placeholder text and disabled states.' },
                { step: 'Check form labels', how: 'Click on the text label next to each form field. If clicking the label puts your cursor in the field, the label is properly associated. If not, screen readers won\'t announce what the field is for.' },
                { step: 'Test without images', how: 'Disable images in your browser. Can you still understand the content? Any information conveyed only by images (like an icon with no text) will be lost for screen reader users.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.step}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.how}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="screen-reader-testing"
            title="Screen Reader Testing"
          >
            <p>
              Screen readers convert on-screen content to speech or Braille
              output. Testing with a screen reader reveals issues that no other
              method can catch — like <strong>confusing reading order</strong>,
              <strong> missing button names</strong>, or <strong>unlabeled
              icons</strong>.
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { name: 'VoiceOver (macOS / iOS)', cost: 'Free — built in', how: 'Press Cmd+F5 to turn on. Use Ctrl+Option+Right/Left to navigate. Best tested with Safari. Also built into every iPhone and iPad (Settings → Accessibility → VoiceOver).' },
                { name: 'NVDA (Windows)', cost: 'Free — download', how: 'Download from nvaccess.org. Press Insert+Down to start reading. Use Tab and arrow keys to navigate. Works best with Firefox or Chrome.' },
                { name: 'JAWS (Windows)', cost: 'Paid — industry standard', how: 'The most widely used screen reader among blind users. 40-minute demo mode available for free. Works best with Chrome or Edge.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--heading)' }}>{item.name}</p>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
                      borderRadius: '100px', background: '#DCFCE7', color: 'var(--accent-success)'
                    }}>{item.cost}</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.how}</p>
                </div>
              ))}
            </div>
            <p>
              <strong>What to listen for:</strong> Can you tell what every button
              and link does? Are images described? Do form fields announce their
              labels? When the page changes (like after submitting a form), does
              the screen reader announce the change?
            </p>
          </GuideSection>

          <GuideSection
            id="common-issues"
            title="Most Common Issues Found"
          >
            <p>
              Research from WebAIM's annual survey of the top 1 million websites
              consistently finds the <strong>same issues</strong> year after year:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { issue: 'Missing alternative text', pct: '~55% of pages', fix: 'Add descriptive alt text to every meaningful image. Use alt="" for decorative images.' },
                { issue: 'Low color contrast', pct: '~83% of pages', fix: 'Ensure body text has 4.5:1 ratio. Use a contrast checker tool before finalizing designs.' },
                { issue: 'Empty links', pct: '~50% of pages', fix: 'Links with only an icon must have aria-label or visually hidden text. A link should never announce as just "link."' },
                { issue: 'Missing form labels', pct: '~46% of pages', fix: 'Every input needs an associated <label> element. Placeholder text is not a substitute.' },
                { issue: 'Inaccessible PDFs', pct: 'Very common', fix: 'PDFs must be tagged with a reading order. Scanned image PDFs need OCR processing first.' },
                { issue: 'Missing document language', pct: '~18% of pages', fix: 'Add lang="en" to the <html> element so screen readers use correct pronunciation.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--heading)' }}>{item.issue}</p>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
                      borderRadius: '100px', background: '#FEE2E2', color: 'var(--section-label)'
                    }}>{item.pct}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>
                    <strong>Fix:</strong> {item.fix}
                  </p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="testing-frequency"
            title="How Often to Test"
          >
            <p>
              Accessibility testing should be part of your <strong>regular
              workflow</strong>, not a once-a-year event:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Before every launch:</strong> Run automated scans and
                manual keyboard testing on any new page, feature, or redesign
                before it goes live.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>After every major update:</strong> CMS updates, theme
                changes, new plugins, or content migrations can introduce new
                barriers.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Quarterly audits:</strong> A more thorough review —
                including screen reader testing — on a regular schedule catches
                issues introduced by day-to-day content updates.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Continuous monitoring:</strong> Automated scanning tools
                can be set to run weekly or monthly and alert you to regressions.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Annual comprehensive audit:</strong> A full evaluation
                by an accessibility specialist provides the most complete picture
                and helps prioritize the year's remediation work.
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about web accessibility
                testing. Comprehensive testing may require specialized expertise.
                For legal advice about your obligations or your rights, connect
                with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}