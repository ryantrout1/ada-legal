import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideDigitalBarriers() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Website & App Barriers: Your Rights"
        typeBadge="Digital Rights"
        badgeColor="var(--link)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="websites-covered"
            title="Websites Are Covered by the ADA"
            simpleContent={
              <>
                <p>Yes, websites and apps are covered by the ADA.</p>
                <p>If a business or government has a website, it must work for people with disabilities.</p>
                <p>This includes screen readers, keyboard navigation, and captions on videos.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>DOJ Guidance (March 2022)</strong></p>
                <p style={{ margin: '0 0 16px' }}>
                  "The Department of Justice has consistently taken the position that
                  the ADA's requirements apply to all the goods, services, privileges,
                  or activities offered by public accommodations, including those
                  offered on the web."
                </p>
                <p style={{ margin: '0 0 12px' }}><strong>Title II Web Rule (April 2024)</strong></p>
                <p style={{ margin: 0 }}>
                  The DOJ published a final rule requiring state and local government
                  websites and mobile apps to conform to WCAG 2.1 Level AA. Compliance
                  deadlines: April 2026 (50,000+ population) and April 2027 (under
                  50,000).
                </p>
              </>
            }
          >
            <p>
              If you tried to use a website or mobile app and couldn't — because your
              screen reader didn't work, you couldn't navigate with a keyboard, or the
              site was impossible to use with assistive technology — that may be an ADA
              violation.
            </p>
            <p>
              <strong>Title III (businesses):</strong> The DOJ has confirmed that
              websites of businesses open to the public must be accessible. Courts have
              consistently ruled that inaccessible websites violate the ADA when the
              business has a physical location. Some courts have extended this to
              online-only businesses as well.
            </p>
            <p>
              <strong>Title II (government):</strong> The DOJ's April 2024 rule
              explicitly requires state and local government websites and apps to meet
              WCAG 2.1 Level AA. This includes public school websites, court filing
              systems, benefit applications, voting information, and transit tools.
            </p>
            <p>
              Website accessibility lawsuits make up roughly <strong>28% of all federal
              ADA Title III filings</strong>. This is one of the fastest-growing areas
              of ADA enforcement.
            </p>
          </GuideSection>

          <GuideSection
            id="common-barriers"
            title="What Counts as a Digital Barrier?"
            simpleContent={
              <>
                <p>Here are common problems on websites that block people with disabilities:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Images with no description (alt text) for blind users.</li>
                  <li style={{ marginBottom: "6px" }}>Videos with no captions for deaf users.</li>
                  <li style={{ marginBottom: "6px" }}>Forms that do not work with a keyboard.</li>
                  <li style={{ marginBottom: "6px" }}>Text that is too small or hard to read.</li>
                </ul>
              </>
            }
          >
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { num: '1', title: 'Screen Reader Incompatibility', desc: "Images without alt text, unlabeled buttons, forms without field labels, dynamic content that isn't announced — these prevent blind and low-vision users from navigating the site." },
                { num: '2', title: 'Keyboard Navigation Failures', desc: "If you can't tab through a website's menus, links, and forms using only a keyboard, wheelchair users, people with motor disabilities, and blind users who don't use a mouse are locked out." },
                { num: '3', title: 'Missing Video Captions', desc: "Videos without captions exclude deaf and hard-of-hearing users. Auto-generated captions don't count if they're inaccurate." },
                { num: '4', title: 'Poor Color Contrast', desc: 'Text that blends into the background is unreadable for people with low vision or color blindness. WCAG requires a minimum contrast ratio of 4.5:1 for normal text.' },
                { num: '5', title: 'Inaccessible Forms & Checkout', desc: "If an online form doesn't work with assistive technology — drop-downs that can't be opened, CAPTCHAs that have no audio alternative, error messages that aren't announced — users with disabilities can't complete transactions." },
                { num: '6', title: 'Inaccessible Mobile Apps', desc: 'The same requirements apply to mobile apps. Buttons too small to tap, gestures with no alternative, and missing screen reader support are all barriers.' },
                { num: '7', title: 'Inaccessible PDFs & Documents', desc: "PDFs that are scanned images (no selectable text), documents without heading structure, and forms that can't be filled in with assistive technology are barriers — especially when they're the only way to access government services or important information." }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  display: 'flex', gap: '14px', padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.25rem',
                    fontWeight: 700, color: 'var(--link)', flexShrink: 0, width: '28px'
                  }}>{item.num}</span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="document-digital"
            title="How to Document a Digital Barrier"
            simpleContent={
              <>
                <p>If you find a website barrier, save the evidence:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Take screenshots of the problem.</li>
                  <li style={{ marginBottom: "6px" }}>Write down the website address (URL) and the date.</li>
                  <li style={{ marginBottom: "6px" }}>Note what you were trying to do and what went wrong.</li>
                  <li style={{ marginBottom: "6px" }}>Record the screen if you can.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>What Courts Look For</strong></p>
                <p style={{ margin: 0 }}>
                  In website accessibility cases, courts evaluate whether the plaintiff
                  personally encountered the barrier, whether the barrier prevented
                  meaningful access, and whether the website operator had notice.
                  Screenshots with timestamps and specific descriptions of what failed
                  are the strongest evidence.
                </p>
              </>
            }
          >
            <p>
              If you encounter an inaccessible website or app, here's how to document
              it:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Screenshot the problem</strong> — capture the page, error, or
                element that's inaccessible. On most computers, use the built-in
                screenshot tool. On phones, press the power + volume buttons.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Note the URL</strong> — copy the exact web address from your
                browser's address bar.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Record the date and time</strong> — this establishes when you
                encountered the barrier.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Describe what you were trying to do</strong> — "I was trying to
                schedule an appointment" or "I was trying to check out" or "I was
                trying to read the menu."
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Describe what happened</strong> — "My screen reader skipped
                over the appointment calendar" or "I couldn't select a date because the
                dropdown was keyboard-inaccessible."
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Note what assistive technology you use</strong> — JAWS, NVDA,
                VoiceOver, ZoomText, keyboard-only navigation, etc.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Try again and document the retry</strong> — if the barrier
                persists, note that too. This shows it's a systemic issue, not a
                temporary glitch.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="what-to-do"
            title="What Can You Do About It?"
            simpleContent={
              <>
                <p>You have options when a website is not accessible:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Report it here on ADA Legal Link.</li>
                  <li style={{ marginBottom: "6px" }}>File a complaint with the DOJ.</li>
                  <li style={{ marginBottom: "6px" }}>A lawyer can send a demand letter or file a lawsuit.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>No Pre-Suit Notice Required (Federal)</strong></p>
                <p style={{ margin: 0 }}>
                  Under federal ADA law, you do not need to notify the website owner
                  before filing a lawsuit. However, some states (including California
                  under SB 1197) have notice requirements or incentives for website
                  accessibility claims. Your attorney will know the rules in your state.
                </p>
              </>
            }
          >
            <p>
              <strong>Option 1: Report it to us.</strong> Submit a report through ADA
              Legal Link's intake form. Include your screenshots and description. We'll
              connect you with an attorney who handles digital accessibility cases. Many
              of these attorneys work on contingency — you pay nothing out of pocket.
            </p>
            <p>
              <strong>Option 2: Contact the business directly.</strong> Some businesses
              genuinely don't know their website is inaccessible. An email to their
              customer service or ADA coordinator explaining the barrier may prompt a
              fix. However, this does not preserve your legal rights the way working
              with an attorney does.
            </p>
            <p>
              <strong>Option 3: File a government complaint.</strong> For government
              websites: file with the DOJ at{' '}
              <a href="https://civilrights.justice.gov/" target="_blank"
                 rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                civilrights.justice.gov
              </a>. For business websites: you can file with the DOJ, but individual
              website complaints rarely result in DOJ action. Private legal action is
              far more effective.
            </p>
            <p>
              <strong>Option 4: File with the FTC.</strong> If a company claims its
              website is accessible (or uses an "accessibility overlay" widget) but it
              actually isn't, this may be a deceptive practice. The FTC has taken action
              against at least one overlay company for misleading claims.
            </p>
          </GuideSection>

          <GuideSection
            id="lawsuit-trends"
            title="Website Lawsuits Are Increasing"
            simpleContent={
              <>
                <p>More and more people are suing over website barriers. Courts agree that websites must be accessible.</p>
                <p>Thousands of website lawsuits are filed every year.</p>
                <p>Businesses that fix their websites early avoid lawsuits and reach more customers.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Key Statistics</strong></p>
                <p style={{ margin: 0 }}>
                  Website accessibility lawsuits made up approximately 28% of all
                  federal ADA Title III filings in 2024. Over 8,800 total ADA Title III
                  lawsuits were filed in federal courts in 2024 — a 7% increase over
                  2023. The top three states for filings are California, New York, and
                  Florida.
                </p>
              </>
            }
          >
            <p>
              Website accessibility is one of the most active areas of ADA enforcement.
              Over <strong>2,400 website-specific ADA lawsuits</strong> were filed in
              federal courts in 2024. When combined with state court filings and demand
              letters, the number is significantly higher.
            </p>
            <p>
              The industries most frequently sued include e-commerce, restaurants,
              hotels, healthcare providers, and financial services. Small businesses are
              not exempt — the majority of targets have under $25 million in revenue.
            </p>
            <p>
              Courts have been clear: if your business serves the public and has a
              website, that website must be accessible. The technical standard most
              courts reference is <strong>WCAG 2.1 Level AA</strong> — the same
              standard the DOJ adopted in its 2024 Title II rule.
            </p>
            <p>
              The message for website owners is simple: proactive accessibility is far
              less expensive than defending a lawsuit. The message for users who
              encounter barriers is equally clear: you have legal rights, and attorneys
              are actively seeking these cases.
            </p>
          </GuideSection>

          <GuideSection
            id="overlays"
            title="A Note About 'Accessibility Widgets' and Overlays"
            simpleContent={
              <>
                <p>Some websites use "accessibility widgets" or overlays. These are plug-ins that claim to fix accessibility problems.</p>
                <p>Most experts say these tools do not work well. They can actually make things worse.</p>
                <p>Using an overlay does not protect a business from lawsuits.</p>
              </>
            }
          >
            <p>
              If you're a business owner, you may have been sold an "accessibility
              overlay" — a toolbar widget that claims to make your website ADA compliant
              with a single line of code. These products (such as accessiBe, UserWay,
              AudioEye's overlay product, and others) have been widely criticized by the
              accessibility community, disability advocates, and multiple courts.
            </p>
            <p>
              In 2024, the FTC ordered one overlay company to pay <strong>$1 million
              </strong> for misleading claims about its product's ability to make
              websites accessible. Overlays do not fix underlying code problems. Screen
              reader users frequently report that overlays make websites{' '}
              <em>harder</em> to use, not easier.
            </p>
            <p>
              If you've installed an overlay and believe your website is compliant, it
              may not be. Consider a professional accessibility audit and code
              remediation.
            </p>

            <GuideLegalCallout citation="Important">
              <p style={{ margin: 0 }}>
                If you're a user who encounters a website with an overlay toolbar that
                still doesn't work for you — that is still an ADA violation and you can
                still report it.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
