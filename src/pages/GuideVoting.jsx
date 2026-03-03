import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideVoting() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Voting & Election Accessibility"
        typeBadge="Specialized"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="overview"
            title="Your Right to Vote Accessibly"
            simpleContent={
              <><p>The ADA gives you the right to vote independently and privately, even if you have a disability.</p><p>Polling places must be accessible. You must be able to get inside and use the voting machines.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "No qualified individual with a disability shall, on the basis
                  of disability, be excluded from participation in or be denied
                  the benefits of the services, programs, or activities of a
                  public entity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(b)(1)(ii)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  A public entity may not "afford a qualified individual with a
                  disability an opportunity to participate in or benefit from the
                  aid, benefit, or service that is not equal to that afforded
                  others."
                </p>
              </>
            }
          >
            <p>
              Voting is one of the most fundamental rights in a democracy.
              Under the ADA, state and local governments must ensure that people
              with disabilities can <strong>vote privately, independently, and
              with the same convenience</strong> as everyone else.
            </p>
            <p>
              This obligation applies to <strong>every aspect</strong> of the
              voting process — registering to vote, getting to and into the
              polling place, casting a ballot, and receiving election
              information.
            </p>
            <p>
              The Department of Justice has made voting accessibility a
              <strong> priority enforcement area</strong>, filing numerous
              lawsuits and settlements against jurisdictions with inaccessible
              polling places.
            </p>
          </GuideSection>

          <GuideSection
            id="polling-places"
            title="Polling Place Physical Accessibility"
            simpleContent={
              <><p>Polling places must be physically accessible:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Ramps and accessible entrances</li><li style={{ marginBottom: "6px" }}>Wide enough paths for wheelchairs</li><li style={{ marginBottom: "6px" }}>Voting booths at wheelchair height</li><li style={{ marginBottom: "6px" }}>Accessible parking nearby</li></ul><p>If a building is not accessible, the election office must move the polling place.</p></>
            }
          >
            <p>
              The <strong>physical building</strong> used as a polling place must
              be accessible to voters with mobility, visual, and other
              disabilities. The DOJ has developed a detailed checklist covering
              five key areas:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { area: 'Parking', items: 'Accessible parking spaces close to the entrance, van-accessible spaces, proper signage, firm surface on the route from parking to the door' },
                { area: 'Sidewalks & walkways', items: 'Level, firm surfaces; no steps without ramps; curb ramps at street crossings; clear path at least 36 inches wide' },
                { area: 'Building entrance', items: 'At least one accessible entrance with no steps; doors that can be opened with one hand; threshold no higher than ½ inch' },
                { area: 'Interior route', items: 'Accessible path from entrance to voting area; hallways at least 36 inches wide; no obstructions; adequate lighting' },
                { area: 'Voting area', items: 'Accessible voting booth at wheelchair height; adequate maneuvering space; clear signage directing to accessible equipment' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.area}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.items}</p>
                </div>
              ))}
            </div>
            <p>
              <strong>Important:</strong> If a building cannot be made accessible,
              the jurisdiction must <strong>relocate the polling place</strong>
              to an accessible location — not simply offer curbside voting as
              the only option.
            </p>
          </GuideSection>

          <GuideSection
            id="voting-equipment"
            title="Accessible Voting Equipment"
            simpleContent={
              <><p>At least one voting machine at each polling place must be accessible.</p><p>It must work for people who are blind (with audio), people in wheelchairs (at the right height), and people who cannot use their hands (with alternative controls).</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Help America Vote Act §301(a)(3)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "The voting system shall be accessible for individuals with
                  disabilities, including nonvisual accessibility for the blind
                  and visually impaired, in a manner that provides the same
                  opportunity for access and participation (including privacy and
                  independence) as for other voters."
                </p>
                <p style={{ margin: 0 }}>
                  Combined with Title II's program access requirement (28 CFR
                  §35.150), jurisdictions must ensure that voting equipment
                  enables private and independent voting.
                </p>
              </>
            }
          >
            <p>
              Every polling place must have at least one <strong>accessible
              voting machine</strong> that allows voters with disabilities to
              cast their ballot <strong>privately and independently</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Audio ballots:</strong> Headphones and a tactile keypad
                for voters who are blind or have low vision
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Large display:</strong> Adjustable font size and high
                contrast for voters with low vision
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Sip-and-puff or switch devices:</strong> For voters who
                cannot use their hands
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Wheelchair-height booth:</strong> The machine must be
                positioned so a seated voter can reach all controls
              </li>
            </ul>
            <p>
              Poll workers must be <strong>trained</strong> on how to set up
              and assist voters with the accessible equipment. An accessible
              machine that poll workers don't know how to operate is effectively
              inaccessible.
            </p>
          </GuideSection>

          <GuideSection
            id="curbside-voting"
            title="Curbside Voting"
            simpleContent={
              <><p>If you cannot get inside the polling place, you can vote curbside.</p><p>Poll workers bring the ballot to your car. You vote there and hand it back.</p><p>Curbside voting should be available at every polling place.</p></>
            }
          >
            <p>
              <strong>Curbside voting</strong> allows a voter to remain in their
              vehicle or at the entrance while poll workers bring a ballot to
              them. It serves as an <strong>alternative</strong> — not a
              replacement for making the polling place itself accessible.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Clear signage outside the polling place must tell voters that
                curbside voting is available and how to request it
              </li>
              <li style={{ marginBottom: '8px' }}>
                A doorbell, phone number, or visible sign-in area must allow
                the voter to <strong>notify poll workers</strong> they need
                curbside assistance
              </li>
              <li style={{ marginBottom: '8px' }}>
                Poll workers must bring the ballot <strong>promptly</strong> —
                voters should not have to wait significantly longer than
                in-person voters
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Privacy must be maintained</strong> — the voter should
                be able to mark the ballot without others seeing their choices
              </li>
            </ul>

            <GuideLegalCallout citation="DOJ Guidance">
              <p style={{ margin: 0 }}>
                The DOJ has stated that curbside voting alone does not satisfy
                the ADA's requirements. "The ADA requires that voters with
                disabilities be provided an equally effective opportunity to
                vote. Curbside voting may supplement but cannot replace
                accessible polling places."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="communication"
            title="Effective Communication at the Polls"
            simpleContent={
              <><p>Polling places must communicate effectively with voters who have disabilities:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Large print ballots for people with low vision</li><li style={{ marginBottom: "6px" }}>Help reading the ballot if you ask for it</li><li style={{ marginBottom: "6px" }}>Clear and simple instructions</li></ul></>
            }
          >
            <p>
              The effective communication obligation applies fully to
              elections:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Deaf voters:</strong> Sign language interpreters or
                written communication must be available if a voter needs
                assistance understanding ballot questions or procedures
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Blind and low-vision voters:</strong> Ballot information
                in large print, audio format, or Braille. The accessible voting
                machine should provide audio output for the full ballot.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Cognitive disabilities:</strong> Plain-language
                instructions and patient, respectful assistance from trained
                poll workers
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Election websites:</strong> Voter registration portals,
                sample ballots, polling place finders, and election results must
                be accessible to screen readers and meet WCAG 2.1 Level AA
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="absentee"
            title="Absentee & Mail-In Ballot Accessibility"
            simpleContent={
              <><p>Absentee and mail-in voting must also be accessible.</p><p>The application form must be available in accessible formats. Some states offer online voting tools that work with screen readers.</p></>
            }
          >
            <p>
              Absentee and mail-in voting must also be accessible:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Application forms</strong> must be available in
                accessible formats (large print, electronic, Braille)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Ballots</strong> should be available in large print and
                electronic formats that work with screen readers
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Envelope design</strong> matters — instructions printed
                in small type on complex envelopes can be a barrier
              </li>
              <li style={{ marginBottom: '8px' }}>
                Some jurisdictions offer <strong>electronic ballot
                marking</strong> tools that allow voters to mark their
                ballot on a computer before printing and mailing it
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="common-violations"
            title="Common Violations"
            simpleContent={
              <><p>Common voting accessibility problems include:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Polling places in buildings without ramps</li><li style={{ marginBottom: "6px" }}>Broken accessible voting machines</li><li style={{ marginBottom: "6px" }}>Poll workers who do not know how to help</li><li style={{ marginBottom: "6px" }}>No curbside voting option</li></ul></>
            }
          >
            <p>
              The DOJ's surveys and enforcement actions have identified these as
              the <strong>most common</strong> polling place accessibility
              violations:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { violation: 'No accessible parking', detail: 'Polling place lot has no marked accessible spaces, or the route from parking to entrance has steps or uneven ground.' },
                { violation: 'Steps at the entrance', detail: 'Building has stairs with no ramp or temporary ramp available. Many older buildings — churches, schools — have this problem.' },
                { violation: 'Accessible machine not set up', detail: 'The jurisdiction purchased accessible voting equipment but poll workers don\'t know how to set it up or offer it.' },
                { violation: 'No curbside voting signage', detail: 'Curbside voting is technically available but no signage tells voters how to request it.' },
                { violation: 'Doors too heavy or narrow', detail: 'Entrance doors require more than 5 pounds of force to open, or interior doors are too narrow for a wheelchair.' },
                { violation: 'Temporary ramps that are unsafe', detail: 'Steep, narrow, or unstable temporary ramps that don\'t meet slope requirements (max 1:12) or lack handrails.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--heading)' }}>{item.violation}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.detail}</p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about voting
                accessibility requirements under the ADA. Voting rights also
                involve the Voting Rights Act and state election laws. For legal
                advice about your rights or a specific accessibility barrier at
                a polling place, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}