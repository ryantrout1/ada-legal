import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideWcagExplained() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="WCAG 2.1 Level AA — What It Requires"
        typeBadge="Standard"
        badgeColor="var(--link)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="overview"
            title="The Four Principles (POUR)"
            simpleContent={
              <>
                <p>WCAG stands for Web Content Accessibility Guidelines. It is a set of rules for making websites work for everyone.</p>
                <p>There are four main ideas: content must be Perceivable, Operable, Understandable, and Robust (POUR).</p>
              </>
            }
          >
            <p>
              The <strong>Web Content Accessibility Guidelines (WCAG) 2.1</strong>
              are organized around four principles. Every requirement falls under
              one of these ideas — remembered by the acronym <strong>POUR</strong>:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { letter: 'P', name: 'Perceivable', desc: 'People must be able to perceive the content — through sight, hearing, or touch' },
                { letter: 'O', name: 'Operable', desc: 'People must be able to use and navigate the interface — not just with a mouse' },
                { letter: 'U', name: 'Understandable', desc: 'The content and interface must be clear and predictable' },
                { letter: 'R', name: 'Robust', desc: 'Content must work reliably across different technologies and assistive tools' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '16px',
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--link)', color: 'var(--page-bg)', fontWeight: 700,
                    fontFamily: 'Fraunces, serif', fontSize: '1.125rem', flexShrink: 0
                  }}>{item.letter}</span>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'var(--heading)' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p>
              WCAG defines three levels of conformance: <strong>Level A</strong>
              (minimum), <strong>Level AA</strong> (the standard required by the
              ADA web rule), and <strong>Level AAA</strong> (highest). The ADA
              rule requires both Level A and Level AA success criteria.
            </p>
          </GuideSection>

          <GuideSection
            id="perceivable"
            title="Perceivable"
            simpleContent={
              <>
                <p>People must be able to see or hear your content.</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Images need text descriptions.</li>
                  <li style={{ marginBottom: "6px" }}>Videos need captions.</li>
                  <li style={{ marginBottom: "6px" }}>Text must be big enough and have good contrast.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 Principle 1 — Perceivable</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>1.1 Text Alternatives:</strong> "All non-text content
                  that is presented to the user has a text alternative that serves
                  the equivalent purpose."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>1.2 Time-Based Media:</strong> Provide alternatives
                  for time-based media, including captions for prerecorded and
                  live audio, and audio descriptions for prerecorded video.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>1.3 Adaptable:</strong> "Create content that can be
                  presented in different ways without losing information or
                  structure."
                </p>
                <p style={{ margin: 0 }}>
                  <strong>1.4.3 Contrast (Minimum — AA):</strong> "The visual
                  presentation of text and images of text has a contrast ratio of
                  at least 4.5:1," except for large text (3:1), incidental text,
                  and logotypes.
                </p>
              </>
            }
          >
            <p>
              People must be able to <strong>see, hear, or otherwise
              sense</strong> all the content on a page. Key requirements:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Text alternatives for images:</strong> Every image needs
                <strong> alt text</strong> that describes its purpose. A photo
                of a building entrance might have: "Accessible entrance with
                automatic doors at City Hall."
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Captions for video:</strong> All prerecorded videos need
                accurate captions. Live streams also need real-time captions
                at Level AA.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Audio descriptions:</strong> Videos that convey important
                visual information (charts, actions, on-screen text) need audio
                descriptions for blind users.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Color contrast:</strong> Text must have a <strong>4.5:1
                contrast ratio</strong> against its background. Large text
                (18pt or 14pt bold) needs only 3:1. Light gray text on white
                backgrounds is a common failure.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Don't rely on color alone:</strong> If a required field
                is shown only by turning red, a screen reader user won't know
                it's required. Use labels, icons, or text in addition to color.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="operable"
            title="Operable"
            simpleContent={
              <>
                <p>People must be able to use your website without a mouse.</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Everything must work with just a keyboard.</li>
                  <li style={{ marginBottom: "6px" }}>Users must have enough time to read and use content.</li>
                  <li style={{ marginBottom: "6px" }}>Nothing should flash in a way that causes seizures.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 Principle 2 — Operable</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>2.1 Keyboard Accessible:</strong> "All functionality
                  of the content is operable through a keyboard interface without
                  requiring specific timings for individual keystrokes."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>2.4.7 Focus Visible (AA):</strong> "Any keyboard
                  operable user interface has a mode of operation where the keyboard
                  focus indicator is visible."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>2.5.1 Pointer Gestures (AA — WCAG 2.1):</strong> "All
                  functionality that uses multipoint or path-based gestures for
                  operation can be operated with a single pointer without a
                  path-based gesture."
                </p>
                <p style={{ margin: 0 }}>
                  <strong>2.3.1 Three Flashes or Below Threshold:</strong>
                  "Web pages do not contain anything that flashes more than three
                  times in any one second period."
                </p>
              </>
            }
          >
            <p>
              People must be able to <strong>use</strong> the website — navigate
              it, fill out forms, click buttons, and interact with all features.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Keyboard accessible:</strong> Every interactive element —
                links, buttons, forms, menus, sliders — must work with a
                <strong> keyboard alone</strong>. Many people can't use a mouse
                due to mobility impairments.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>No keyboard traps:</strong> A user navigating with Tab
                must never get stuck in a component they can't leave.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Visible focus indicator:</strong> When someone tabs through
                a page, there must be a <strong>visible outline or highlight</strong>
                showing which element has focus.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Enough time:</strong> If content has a time limit (like
                a session timeout), users must be able to extend it.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>No seizure-inducing content:</strong> Nothing on the page
                should flash more than 3 times per second.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Touch targets (new in 2.1):</strong> Complex gestures
                (like pinch-to-zoom) must have single-pointer alternatives.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="understandable"
            title="Understandable"
            simpleContent={
              <>
                <p>Your website must be easy to understand and use.</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Text should be clear and simple.</li>
                  <li style={{ marginBottom: "6px" }}>Pages should work in a predictable way.</li>
                  <li style={{ marginBottom: "6px" }}>Forms should help users avoid and fix mistakes.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 Principle 3 — Understandable</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>3.1.1 Language of Page (A):</strong> "The default human
                  language of each Web page can be programmatically determined."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>3.2.1 On Focus (A):</strong> "When any user interface
                  component receives focus, it does not initiate a change of
                  context."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>3.3.1 Error Identification (A):</strong> "If an input
                  error is automatically detected, the item that is in error is
                  identified and the error is described to the user in text."
                </p>
                <p style={{ margin: 0 }}>
                  <strong>3.3.3 Error Suggestion (AA):</strong> "If an input error
                  is automatically detected and suggestions for correction are
                  known, then the suggestions are provided to the user."
                </p>
              </>
            }
          >
            <p>
              Content and navigation must be <strong>clear and predictable</strong>.
              Users shouldn't be surprised or confused by how the site works.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Page language declared:</strong> The HTML must specify the
                language (e.g., <code style={{
                  background: 'var(--border-lighter)', padding: '1px 6px',
                  borderRadius: '4px', fontSize: '0.85em'
                }}>lang="en"</code>) so screen readers pronounce words correctly.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Predictable behavior:</strong> The page should not
                unexpectedly change when a user focuses on something or fills in
                a form field. For example, selecting a dropdown option should
                <em> not</em> automatically submit a form.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Clear error messages:</strong> When a form has errors,
                the site must clearly <strong>identify which field</strong> has
                the problem and describe the error in text. At Level AA, it must
                also <strong>suggest how to fix it</strong>.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Consistent navigation:</strong> Navigation menus should
                appear in the same location on every page.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="robust"
            title="Robust"
            simpleContent={
              <>
                <p>Your website must work with different devices and assistive technology.</p>
                <p>This means using proper HTML code so screen readers and other tools can understand your content.</p>
              </>
            }
          >
            <p>
              Content must work reliably with <strong>current and future
              technologies</strong>, including assistive technologies like screen
              readers, magnifiers, and voice control software.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Valid HTML:</strong> Code must be well-formed — proper
                opening and closing tags, no duplicate IDs, and correct nesting.
                Broken HTML confuses assistive technology.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Name, role, value:</strong> Every user interface component
                (button, form field, tab, slider) must expose its <strong>name
                </strong> (what it is), <strong>role</strong> (what it does), and
                <strong> value/state</strong> (its current setting) to assistive
                technology.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Status messages:</strong> When something changes on the
                page (like a success confirmation or an error count), screen
                reader users must be notified without losing their place.
              </li>
            </ul>

            <GuideLegalCallout citation="WCAG 2.1, Guideline 4.1">
              <p style={{ margin: 0 }}>
                "Maximize compatibility with current and future user agents,
                including assistive technologies." This principle ensures content
                remains accessible as technology evolves.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="levels"
            title="Level A vs. AA vs. AAA"
            simpleContent={
              <>
                <p>WCAG has three levels:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}><strong>Level A:</strong> The bare minimum. Fixes the worst barriers.</li>
                  <li style={{ marginBottom: "6px" }}><strong>Level AA:</strong> The standard most laws require. This is what most websites should aim for.</li>
                  <li style={{ marginBottom: "6px" }}><strong>Level AAA:</strong> The highest level. Nice to have but not usually required by law.</li>
                </ul>
              </>
            }
          >
            <p>
              WCAG organizes its requirements into <strong>three levels</strong>:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { level: 'Level A', desc: 'The bare minimum. Addresses the most serious barriers — like missing alt text, no keyboard access, and content that causes seizures.', note: 'Required by the ADA rule' },
                { level: 'Level AA', desc: 'The standard for most laws worldwide. Adds contrast requirements, captions for live content, visible focus indicators, and error suggestions.', note: 'Required by the ADA rule' },
                { level: 'Level AAA', desc: 'The highest standard. Includes sign language for video, 7:1 contrast, and no timing restrictions at all. Aspirational for most sites.', note: 'Not required by ADA' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '0.95rem' }}>{item.level}</span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
                      borderRadius: '100px',
                      background: item.note === 'Not required by ADA' ? 'var(--border-lighter)' : '#DCFCE7',
                      color: item.note === 'Not required by ADA' ? 'var(--body-secondary)' : 'var(--accent-success)'
                    }}>{item.note}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="common-failures"
            title="Common Failures with Examples"
            simpleContent={
              <>
                <p>The most common website accessibility problems are:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Missing alt text on images.</li>
                  <li style={{ marginBottom: "6px" }}>Low contrast text that is hard to read.</li>
                  <li style={{ marginBottom: "6px" }}>Forms without labels.</li>
                  <li style={{ marginBottom: "6px" }}>Links that just say "click here" without explaining where they go.</li>
                  <li style={{ marginBottom: "6px" }}>Videos without captions.</li>
                </ul>
              </>
            }
          >
            <p>
              These are the accessibility issues found <strong>most often</strong>
              on government and business websites:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { failure: 'Missing alt text on images', example: 'A chart showing COVID data has no alt text — screen reader users get "image" with no context.', criterion: '1.1.1' },
                { failure: 'Low color contrast', example: 'Light gray placeholder text on a white form field — the 2.4:1 ratio fails the 4.5:1 minimum.', criterion: '1.4.3' },
                { failure: 'No keyboard access to menus', example: 'A dropdown navigation menu only opens on mouse hover — keyboard users can\'t reach subpages.', criterion: '2.1.1' },
                { failure: 'Missing form labels', example: 'An input field has placeholder text "Email" but no associated <label> element — screen readers announce "edit text, blank."', criterion: '1.3.1' },
                { failure: 'No captions on video', example: 'A city council meeting recording has no captions — deaf residents can\'t follow the proceedings.', criterion: '1.2.2' },
                { failure: 'PDF documents not tagged', example: 'A zoning application PDF has no reading order or tags — a screen reader reads it as random text fragments.', criterion: '1.3.1' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--heading)' }}>{item.failure}</p>
                    <span style={{
                      fontSize: '0.75rem', color: 'var(--link)', background: '#F3E8FF',
                      padding: '2px 8px', borderRadius: '100px', fontWeight: 600, whiteSpace: 'nowrap'
                    }}>SC {item.criterion}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.example}</p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about WCAG 2.1 Level AA
                requirements. Web accessibility is a technical and legal area that
                benefits from professional evaluation. For legal advice about your
                obligations or your rights, connect with an experienced ADA
                attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
