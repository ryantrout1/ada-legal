import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideWhatToExpect() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="What to Expect: The ADA Legal Process"
        typeBadge="Process Guide"
        badgeColor="#C2410C"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="document"
            title="Step 1 — Document the Violation"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Standing — Why Documentation Matters</strong></p>
                <p style={{ margin: 0 }}>
                  To bring a lawsuit, you must have "standing" — you must have
                  personally encountered the barrier. Courts have dismissed ADA cases
                  where the plaintiff could not show they actually visited the
                  location or used the service. Photos, dates, and details prove you
                  were there and what you experienced.
                </p>
              </>
            }
          >
            <p>
              Before anything else, gather evidence. This doesn't need to be fancy —
              a smartphone is enough:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Take photos or video</strong> of the barrier (a missing ramp,
                broken lift, inaccessible entrance, blocked aisle, missing grab bars)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Note the date, time, and exact location</strong> (address,
                floor, room number)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Write down what happened</strong> — what were you trying to
                do, and how did the barrier prevent it?
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Save any communications</strong> — if you asked a manager for
                help and were refused, write down what was said
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Note witnesses</strong> if anyone else was present
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>For websites:</strong> Take screenshots, note the URL, and
                describe what you were trying to do (screen reader couldn't read it,
                keyboard couldn't navigate it, no alt text on images)
              </li>
            </ul>
            <p>
              Your documentation is the foundation of everything that follows. An
              attorney's first question will be: <em>"What did you see, and can you
              prove it?"</em>
            </p>
          </GuideSection>

          <GuideSection
            id="report"
            title="Step 2 — Report It Through ADA Legal Link"
          >
            <p>
              Our intake form collects the information an attorney needs to evaluate
              your case. It takes about <strong>5–10 minutes</strong> and asks:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                What type of violation occurred (physical barrier, digital barrier,
                service denial, communication failure)
              </li>
              <li style={{ marginBottom: '6px' }}>
                Where it happened (business name, address, government entity)
              </li>
              <li style={{ marginBottom: '6px' }}>When it happened</li>
              <li style={{ marginBottom: '6px' }}>How it affected you</li>
              <li style={{ marginBottom: '6px' }}>
                Whether you have photos or documentation
              </li>
            </ul>
            <p>
              Once submitted, your report becomes available to qualified attorneys who
              specialize in your type of case and geographic area can review it and
              initiate support. Most cases get attorney contact within{' '}
              <strong>24–48 hours</strong>.
            </p>
            <p>
              You don't pay anything to submit a report. Attorney fees are typically
              handled through the ADA's fee-shifting provisions — the business pays
              your attorney's fees if the case succeeds.
            </p>
          </GuideSection>

          <GuideSection
            id="demand-letter"
            title="Step 3 — Attorney Review & Demand Letter"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>What Is a Demand Letter?</strong></p>
                <p style={{ margin: 0 }}>
                  A demand letter is a formal written notice from your attorney to the
                  business or government entity, identifying the ADA violations, citing
                  the specific legal standards, and requesting corrective action within
                  a specified timeframe (usually 30–60 days). Most ADA cases resolve at
                  this stage without ever going to court.
                </p>
              </>
            }
          >
            <p>
              Once an attorney takes your case, the typical first step is a{' '}
              <strong>demand letter</strong>. This letter:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                Identifies the specific ADA violations found at the location or on the
                website
              </li>
              <li style={{ marginBottom: '6px' }}>
                Cites the relevant sections of the 2010 ADA Standards or other
                applicable law
              </li>
              <li style={{ marginBottom: '6px' }}>
                Explains the legal obligation to fix the barriers
              </li>
              <li style={{ marginBottom: '6px' }}>
                Requests specific corrective actions (install a ramp, add grab bars,
                fix website accessibility)
              </li>
              <li style={{ marginBottom: '6px' }}>
                Sets a deadline for compliance (typically 30–60 days)
              </li>
              <li style={{ marginBottom: '6px' }}>
                Notes that failure to comply may result in a lawsuit
              </li>
            </ul>
            <p>
              <strong>Why demand letters work:</strong> Most businesses would rather
              fix the problem than go to court. The cost of installing a ramp or
              fixing a website is almost always less than the cost of defending a
              lawsuit. A well-crafted demand letter gives the business a clear path
              to compliance.
            </p>
            <p>
              <strong>What it costs you:</strong> Typically nothing. If the case
              resolves at the demand letter stage, the attorney's fees are often
              included in the settlement.
            </p>
          </GuideSection>

          <GuideSection
            id="settlement"
            title="Step 4 — Negotiation & Settlement"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Typical Settlement Components</strong></p>
                <p style={{ margin: 0 }}>
                  ADA settlements usually include: (1) a remediation plan with specific
                  fixes and deadlines, (2) attorney's fees and costs, and (3) in states
                  that allow it, monetary damages to the complainant. Some settlements
                  include monitoring provisions to ensure the fixes are actually
                  completed.
                </p>
              </>
            }
          >
            <p>
              The vast majority of ADA cases settle before trial. A settlement
              typically includes:
            </p>
            <p>
              <strong>Injunctive relief (the fixes):</strong> The business agrees to
              make specific accessibility improvements by a specific date. This might
              include installing ramps, widening doorways, adding grab bars, fixing
              website code, training staff, or modifying policies.
            </p>
            <p>
              <strong>Attorney's fees:</strong> Under federal ADA law, the prevailing
              party can recover reasonable attorney's fees. This is built into
              settlements — the business pays your attorney directly.
            </p>
            <p>
              <strong>Monetary damages (depends on state):</strong> At the federal
              level, Title III does not provide monetary damages. However, many states
              add significant damage provisions. In California under the Unruh Act,
              minimum statutory damages are $4,000 per violation. Your attorney will
              know what your state allows.
            </p>
            <p>
              <strong>Monitoring:</strong> Some settlements include a requirement that
              the business submit proof of compliance within a set period, or allow
              follow-up inspections.
            </p>
            <p>
              <strong>Timeline:</strong> From demand letter to settlement, most
              straightforward cases resolve in <strong>2–6 months</strong>. Complex
              cases with multiple violations or uncooperative defendants can take
              longer.
            </p>
          </GuideSection>

          <GuideSection
            id="court"
            title="Step 5 — If It Goes to Court"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>42 U.S.C. §12205</strong></p>
                <p style={{ margin: '0 0 12px' }}>
                  "In any action or administrative proceeding commenced pursuant to
                  this chapter, the court or agency, in its discretion, may allow the
                  prevailing party, other than the United States, a reasonable
                  attorney's fee, including litigation expenses, and costs."
                </p>
                <p style={{ margin: 0 }}>
                  This fee-shifting provision is what makes it economically possible
                  for individuals to enforce the ADA through private lawsuits.
                </p>
              </>
            }
          >
            <p>
              If the business refuses to cooperate, the next step is filing a lawsuit
              in federal or state court. Here's what to expect:
            </p>
            <p>
              <strong>Filing:</strong> Your attorney files a complaint in court
              identifying the violations and requesting injunctive relief and fees.
            </p>
            <p>
              <strong>Discovery:</strong> Both sides exchange documents and
              information. Your attorney may hire an accessibility expert to inspect
              the property or audit the website.
            </p>
            <p>
              <strong>Motions:</strong> The defendant may file a motion to dismiss. If
              the case survives, settlement discussions often intensify.
            </p>
            <p>
              <strong>Trial:</strong> ADA Title III cases that go to trial are
              relatively rare. When they do, the main question is whether the barrier
              exists and whether the standard applies. These are usually factual
              questions, not disputed legal theories.
            </p>
            <p>
              <strong>Timeline:</strong> If a case goes to litigation, expect{' '}
              <strong>6–18 months</strong> from filing to resolution. Trials themselves
              are typically brief (1–3 days for a standard accessibility case).
            </p>
            <p>
              <strong>Your cost:</strong> Most ADA attorneys work on contingency for
              Title III cases, meaning you pay nothing unless the case succeeds. Even
              if the case goes to trial, attorney's fees are recoverable from the
              defendant.
            </p>
          </GuideSection>

          <GuideSection
            id="common-questions"
            title="Common Questions About the Process"
          >
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '8px 0'
            }}>
              {[
                {
                  q: '"Do I need to give the business a chance to fix it first?"',
                  a: 'No. Under federal ADA law, there is no "notice and cure" requirement for Title III claims (though some states, like California and Texas, have pre-suit notice requirements). Your attorney will know your state\'s rules. However, a demand letter is standard practice and often leads to faster resolution.'
                },
                {
                  q: '"What if I can\'t afford an attorney?"',
                  a: "ADA Title III cases are often taken on contingency because attorney's fees are recoverable from the defendant. You typically pay nothing out of pocket. When you report through ADA Legal Link, the attorneys in our network understand this fee structure."
                },
                {
                  q: '"How long does the whole process take?"',
                  a: 'Simple cases (single barrier, cooperative business): 1–3 months from demand letter to resolution. Moderate cases: 3–6 months. Complex or litigated cases: 6–18 months.'
                },
                {
                  q: '"Will I have to go to court?"',
                  a: 'Very unlikely. The vast majority of ADA cases settle before trial. Your involvement is typically limited to the initial intake, reviewing settlement terms, and possibly a brief deposition.'
                },
                {
                  q: '"What if the business fixes it after I report but before the case resolves?"',
                  a: "The case is not automatically dismissed. Courts recognize that a business could fix a barrier and then let it fall back into disrepair. Your attorney can still pursue attorney's fees and seek a consent decree requiring ongoing compliance."
                },
                {
                  q: '"What is \'standing\' and why does it matter?"',
                  a: 'Standing means you must have personally experienced the barrier. You must have visited the location (or attempted to use the website) and been denied access. "Drive-by" lawsuits — where someone sues without actually attempting to use the facility — have faced increasing judicial skepticism. Document your visit.'
                }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{
                    margin: '0 0 8px', fontWeight: 700,
                    color: 'var(--slate-900)', fontSize: '0.95rem',
                    fontStyle: 'italic'
                  }}>{item.q}</p>
                  <p style={{
                    margin: 0, fontSize: '0.9rem',
                    color: 'var(--slate-600)', lineHeight: 1.75
                  }}>{item.a}</p>
                </div>
              ))}
            </div>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}