import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideWebFirstSteps() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="First Steps Toward Web Compliance"
        typeBadge="Action Plan"
        badgeColor="#5B2C6F"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="overview"
            title="Getting Started"
          >
            <p>
              If your organization is covered by the ADA's Title II web rule —
              or you're a private business aiming for digital accessibility —
              the question isn't whether to act, but <strong>where to start
              </strong>. This guide gives you a practical roadmap.
            </p>
            <p>
              You don't need to fix everything overnight. The key is to
              <strong> start now, document your progress, and build
              accessibility into your workflow</strong> going forward.
            </p>
          </GuideSection>

          <GuideSection
            id="audit"
            title="Step 1: Conduct an Accessibility Audit"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>ADA.gov — Web Rule First Steps</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  The DOJ recommends that entities "audit the accessibility of
                  existing web content and mobile apps" as a first step toward
                  compliance. This includes both automated scanning and manual
                  testing.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>28 CFR §35.200</strong> requires conformance with
                  WCAG 2.1 Level AA. An audit evaluates your current content
                  against these specific success criteria to identify gaps.
                </p>
              </>
            }
          >
            <p>
              An accessibility audit tells you <strong>where you stand
              today</strong>. It should combine two approaches:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Automated scanning:</strong> Tools like <strong>axe
                </strong> (by Deque), <strong>WAVE</strong> (by WebAIM), or
                Google Lighthouse can quickly scan pages and flag common issues
                like missing alt text, low contrast, and missing form labels.
                These tools catch roughly <strong>30–40% of issues</strong>.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Manual testing:</strong> A person tests the site using a
                <strong> keyboard only</strong> (no mouse), a <strong>screen
                reader</strong> (like NVDA, JAWS, or VoiceOver), and checks for
                logical reading order, clear navigation, and understandable
                content. This catches the other 60–70% of issues.
              </li>
            </ul>
            <p>
              <strong>Example:</strong> An automated scan may flag that an image
              has no alt text. But only manual testing reveals that a dropdown
              menu can't be opened with a keyboard, or that a screen reader reads
              a table in the wrong order.
            </p>
          </GuideSection>

          <GuideSection
            id="prioritize"
            title="Step 2: Prioritize Issues by Severity"
          >
            <p>
              Once you know the issues, <strong>prioritize them</strong>. Not all
              accessibility problems are equally serious. Focus first on:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { priority: 'Critical', color: '#991B1B', bg: '#FEE2E2', desc: 'Blocks access entirely — users cannot complete a task at all. Examples: form can\'t be submitted by keyboard, no captions on required video content, page has a keyboard trap.' },
                { priority: 'Serious', color: '#D97706', bg: '#FEF3C7', desc: 'Makes tasks very difficult. Examples: poor contrast makes text hard to read, images of text with no alternative, focus order jumps unpredictably.' },
                { priority: 'Moderate', color: '#1E3A8A', bg: '#DBEAFE', desc: 'Causes inconvenience but doesn\'t block access. Examples: missing skip navigation link, heading levels skipped, decorative images with unnecessary alt text.' },
                { priority: 'Minor', color: '#16A34A', bg: '#DCFCE7', desc: 'Best practice issues. Examples: link text says "click here" instead of something descriptive, redundant ARIA attributes.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <span style={{
                    display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
                    padding: '2px 10px', borderRadius: '100px',
                    background: item.bg, color: item.color, marginBottom: '6px'
                  }}>{item.priority}</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <p>
              Also prioritize your <strong>highest-traffic pages</strong> and
              <strong> essential services</strong> first — the homepage, online
              forms, payment portals, and public meeting pages affect the most
              people.
            </p>
          </GuideSection>

          <GuideSection
            id="remediation-plan"
            title="Step 3: Create a Remediation Plan"
          >
            <p>
              With priorities set, create a <strong>written remediation
              plan</strong> with specific timelines:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>List every issue</strong> found in the audit, grouped by
                priority
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Assign owners</strong> — who is responsible for fixing
                each category of issue (web team, content team, vendor)
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Set deadlines</strong> — critical issues should be
                addressed first, ideally within weeks, not months
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Track progress</strong> — use a spreadsheet, project
                management tool, or accessibility-specific dashboard
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Re-test</strong> — verify that fixes actually resolve the
                issues and don't create new ones
              </li>
            </ol>
            <p>
              <strong>Tip:</strong> A written plan with dates also demonstrates
              <strong> good faith</strong> effort, which can matter in
              enforcement contexts.
            </p>
          </GuideSection>

          <GuideSection
            id="vendor-contracts"
            title="Step 4: Build Accessibility Into Vendor Contracts"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>DOJ Guidance on Third-Party Content</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  While the web rule excepts third-party content not under the
                  entity's control, content posted by or for the entity — including
                  content managed through vendor platforms — remains the entity's
                  responsibility.
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity may not… use contractual, licensing, or other
                  arrangements as a subterfuge to evade its obligations." —
                  28 CFR §35.130(b)(3)
                </p>
              </>
            }
          >
            <p>
              If you use third-party vendors for your website, CMS, forms, payment
              systems, or apps — <strong>you're still responsible</strong> for
              their accessibility. Include these in vendor contracts:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>WCAG 2.1 Level AA conformance</strong> as a requirement,
                not a goal
              </li>
              <li style={{ marginBottom: '10px' }}>
                Vendor must provide a <strong>VPAT / Accessibility Conformance
                Report</strong> (ACR) based on testing, not self-declaration
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Remediation timelines</strong> for any issues discovered
                after deployment
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessibility testing</strong> as part of acceptance
                criteria before launch
              </li>
            </ul>
            <p>
              <strong>Example:</strong> A city uses a vendor for its online
              permitting system. If the vendor's platform has inaccessible forms,
              the city — not the vendor — is responsible under the ADA. The
              contract should ensure the vendor delivers an accessible product.
            </p>
          </GuideSection>

          <GuideSection
            id="training"
            title="Step 5: Train Content Creators"
          >
            <p>
              Most accessibility issues are introduced when <strong>content is
              created</strong> — not during initial development. Everyone who
              adds or updates content needs basic training:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Write meaningful alt text</strong> for every image
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Use proper heading structure</strong> (H1, H2, H3 in
                order — don't skip levels)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Write descriptive link text</strong> ("View the meeting
                agenda" not "Click here")
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Create accessible documents</strong> — tagged PDFs with
                reading order, not just scanned images
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Add captions</strong> to all videos before posting
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Use sufficient color contrast</strong> when choosing
                colors for graphics or presentations
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="ongoing-testing"
            title="Step 6: Establish Ongoing Testing"
          >
            <p>
              Accessibility isn't a one-time fix. <strong>New content is added
              constantly</strong>, and each update can introduce new issues.
              Build testing into your regular workflow:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Automated scans</strong> on a regular schedule (weekly or
                monthly) to catch regressions
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Manual review</strong> of new pages and features before
                they go live
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>User testing</strong> with people who use assistive
                technology — this is the gold standard
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Feedback mechanism</strong> — a way for visitors to
                report accessibility issues they encounter
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="document-efforts"
            title="Step 7: Document Everything"
          >
            <p>
              Keep records of your accessibility work. This matters for two
              reasons:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Good faith:</strong> If a complaint is filed, documented
                efforts show you're taking accessibility seriously and working
                toward compliance — not ignoring the issue.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Institutional knowledge:</strong> Staff turnover is
                inevitable. Written plans, policies, and procedures ensure
                accessibility work continues.
              </li>
            </ul>
            <p>
              Document your audit results, remediation plan, training records,
              vendor accessibility requirements, and testing schedule.
            </p>
          </GuideSection>

          <GuideSection
            id="tools"
            title="Useful Testing Tools"
          >
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { name: 'axe DevTools (Deque)', type: 'Automated', desc: 'Browser extension that scans a page and reports WCAG violations with fix suggestions. Free core version available.' },
                { name: 'WAVE (WebAIM)', type: 'Automated', desc: 'Visual tool that adds icons directly on the page showing errors, alerts, and structural information. Free browser extension.' },
                { name: 'Lighthouse (Google)', type: 'Automated', desc: 'Built into Chrome DevTools. Includes an accessibility audit section based on axe-core. Good for quick checks.' },
                { name: 'NVDA (Screen Reader)', type: 'Manual', desc: 'Free screen reader for Windows. Essential for testing how content sounds to blind users. Pair with Firefox or Chrome.' },
                { name: 'VoiceOver (Screen Reader)', type: 'Manual', desc: 'Built into macOS and iOS. No installation needed. Test with Safari for the most accurate results.' },
                { name: 'Colour Contrast Analyser', type: 'Specialized', desc: 'Free tool by The Paciello Group. Eyedropper tool to check color contrast ratios against WCAG thresholds.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--slate-900)' }}>{item.name}</p>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
                      borderRadius: '100px',
                      background: item.type === 'Automated' ? '#EDE9FE' : item.type === 'Manual' ? '#FEF3C7' : '#DBEAFE',
                      color: item.type === 'Automated' ? '#5B2C6F' : item.type === 'Manual' ? '#92400E' : '#1E3A8A'
                    }}>{item.type}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about approaching web
                accessibility compliance. Every organization's situation is
                different, and the technical and legal requirements can be complex.
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