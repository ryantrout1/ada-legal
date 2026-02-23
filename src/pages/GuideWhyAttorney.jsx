import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideWhyAttorney() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Why You Need an ADA Attorney"
        typeBadge="Know Your Rights"
        badgeColor="#C2410C"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="private-enforcement"
            title="The ADA Is Primarily Enforced Through Private Lawsuits"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Congress designed it this way.</strong></p>
                <p style={{ margin: 0 }}>
                  The ADA's fee-shifting provision (42 U.S.C. §12205) was modeled
                  after the Civil Rights Act of 1964. Congress intentionally created
                  economic incentives for private attorneys to enforce the law —
                  recognizing that government agencies alone cannot monitor every
                  business, sidewalk, and website in the country.
                </p>
              </>
            }
          >
            <p>
              The DOJ does not have the resources to investigate every ADA complaint.
              In practice, the ADA is enforced primarily through private lawsuits
              filed by individuals and their attorneys. Over{' '}
              <strong>8,800 federal ADA Title III lawsuits</strong> were filed in
              2024. The DOJ filed a tiny fraction of those.
            </p>
            <p>
              This is by design. Congress built attorney's fees into the ADA so that
              private attorneys would be economically motivated to take on ADA cases
              — even when the individual plaintiff has no money. When a case
              succeeds, the defendant pays the attorney's fees. This is called{' '}
              <strong>"fee shifting"</strong> and it's why most ADA attorneys can
              take your case at no cost to you.
            </p>
            <p>
              Without private attorneys enforcing the ADA, most barriers would never
              be addressed. Filing a government complaint alone is not enough — the
              agencies are overwhelmed and under-resourced.
            </p>
          </GuideSection>

          <GuideSection
            id="what-attorneys-do"
            title="What an ADA Attorney Does That You Can't Do Alone"
          >
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { num: '1', title: 'Identifies all applicable laws — not just the ADA.', desc: "Your situation may be covered by the ADA, your state's civil rights law, the Fair Housing Act, Section 504, or multiple laws simultaneously. An attorney knows which claims give you the strongest position and the most remedies." },
                { num: '2', title: 'Sends a legally effective demand letter.', desc: 'A demand letter from an attorney carries weight that a personal complaint does not. It cites specific code sections, establishes a legal record, and signals that you\'re serious about enforcement.' },
                { num: '3', title: 'Navigates standing and procedural requirements.', desc: 'ADA cases have specific requirements — you must have standing (personally encountered the barrier), meet filing deadlines, and in some states, comply with pre-suit notice rules. Missing any of these can kill an otherwise valid case.' },
                { num: '4', title: 'Maximizes your remedies.', desc: "At the federal level, Title III only provides injunctive relief and fees. But your attorney may be able to file state-law claims that add monetary damages. In California, that's a minimum of $4,000 per violation. An attorney who knows your state's laws can significantly change your outcome." },
                { num: '5', title: "Handles everything — you don't go to court.", desc: 'The vast majority of ADA cases settle. Your attorney handles the demand letter, negotiations, and settlement. Most clients never see the inside of a courtroom.' },
                { num: '6', title: 'It costs you nothing.', desc: "Because of fee shifting, ADA attorneys typically work on contingency for Title III cases. The defendant — not you — pays the attorney's fees." }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  display: 'flex', gap: '14px', padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.25rem',
                    fontWeight: 700, color: '#C2410C', flexShrink: 0, width: '28px'
                  }}>{item.num}</span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="risk-pro-se"
            title="The Risk of Going Alone"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Pro Se ADA Filings Are Surging — and Failing</strong></p>
                <p style={{ margin: 0 }}>
                  Federal pro se (self-represented) ADA Title III filings increased
                  40% in 2025 compared to 2024. Courts and defense attorneys report
                  that many of these filings cite non-existent cases, contain
                  procedural errors, and are being dismissed. Most appear to be
                  generated using AI tools without legal review.
                </p>
              </>
            }
          >
            <p>
              Filing an ADA lawsuit without an attorney (called "pro se" filing) is
              technically allowed, but it comes with serious risks:
            </p>
            <p>
              <strong>Procedural errors:</strong> ADA cases have specific procedural
              requirements. Filing in the wrong court, missing a deadline, or failing
              to properly serve the defendant can result in immediate dismissal.
            </p>
            <p>
              <strong>AI-generated filings are backfiring.</strong> Courts are seeing
              a surge in pro se ADA filings that appear to be generated by AI tools.
              These filings often cite cases that don't exist, misstate legal
              standards, and contain factual errors. Judges are increasingly
              sanctioning these filings, which harms both the individual and the
              credibility of legitimate ADA enforcement.
            </p>
            <p>
              <strong>You may hurt your own case.</strong> If you send an amateurish
              demand letter or file a flawed complaint, the business and its insurance
              company will take you less seriously. A professional attorney's
              correspondence signals that the case has merit and the business should
              settle.
            </p>
            <p>
              <strong>You leave money on the table.</strong> Without an attorney, you
              may not know about state-law remedies that could add significant damages
              to your case. You may also settle for far less than the case is worth.
            </p>
            <p>
              <strong>You may hurt other people's cases.</strong> Poorly filed ADA
              lawsuits contribute to a narrative that ADA enforcement is frivolous.
              Every dismissed case makes it slightly harder for the next legitimate
              plaintiff. Working with a qualified attorney ensures your case
              strengthens the system rather than undermining it.
            </p>
          </GuideSection>

          <GuideSection
            id="how-we-help"
            title="How ADA Legal Link Connects You"
          >
            <p>
              ADA Legal Link is a marketplace that connects people who have
              experienced ADA violations with attorneys who specialize in disability
              rights law. Here's how it works:
            </p>
            <p>
              <strong>You report a violation.</strong> Our intake form collects the
              details an attorney needs — location, type of barrier, when it
              happened, and any documentation you have. It takes about 5–10 minutes.
            </p>
            <p>
              <strong>Attorneys review your case.</strong> Attorneys in our network
              who handle your type of case and serve your geographic area can review
              your report and initiate support.
            </p>
            <p>
              <strong>You get matched — typically within 48 hours.</strong> An
              attorney contacts you to discuss your case, explain your options, and
              begin the process. Most ADA cases proceed at no cost to you.
            </p>
            <p>
              <strong>We monitor for quality.</strong> Attorneys in our network must
              log contact within 24 hours of claiming a case. We track outcomes and
              maintain standards so that our community gets the best representation
              available.
            </p>
            <p>
              You don't need to know which law applies, which court to file in, or
              what your state allows. That's what the attorney is for. Your job is
              simply to report what happened.
            </p>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}