import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideServiceAnimals() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Service Animals & the ADA"
        typeBadge="Reference"
        badgeColor="#C2410C"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          {/* Section 1: Definition */}
          <GuideSection
            id="definition"
            title="What Is a Service Animal?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.104 — Definition</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Service animal means any dog that is individually trained to do
                  work or perform tasks for the benefit of an individual with a
                  disability, including a physical, sensory, psychiatric,
                  intellectual, or other mental disability."
                </p>
              </>
            }
          >
            <p>
              Under the ADA, a <strong>service animal</strong> is a <strong>dog</strong> that
              has been individually trained to do work or perform tasks directly related
              to a person's disability. The key word is <em>trained</em> — the dog
              must be able to perform a specific task that helps with the disability.
            </p>
            <p>Examples of tasks include:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Guiding a person who is blind</li>
              <li style={{ marginBottom: '6px' }}>Alerting a person who is deaf to sounds</li>
              <li style={{ marginBottom: '6px' }}>Pulling a wheelchair</li>
              <li style={{ marginBottom: '6px' }}>Alerting and protecting a person having a seizure</li>
              <li style={{ marginBottom: '6px' }}>Reminding a person with a mental health condition to take medication</li>
              <li style={{ marginBottom: '6px' }}>Calming a person with PTSD during an anxiety attack</li>
            </ul>
          </GuideSection>

          {/* Section 2: Miniature Horses */}
          <GuideSection
            id="miniature-horses"
            title="Miniature Horses"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.136(i)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity shall make reasonable modifications in policies,
                  practices, or procedures to permit the use of a miniature horse by
                  an individual with a disability if the miniature horse has been
                  individually trained to do work or perform tasks for the benefit of
                  the individual with a disability."
                </p>
              </>
            }
          >
            <p>
              The ADA also has a special provision for <strong>miniature
              horses</strong>. While the primary definition covers dogs only,
              businesses and government entities must make reasonable modifications
              to allow miniature horses that have been individually trained as
              service animals.
            </p>
            <p>
              The entity may consider: (1) the type, size, and weight of the horse;
              (2) whether the handler has control; (3) whether the horse is
              housebroken; and (4) whether the horse can be safely accommodated in
              the facility.
            </p>
          </GuideSection>

          {/* Section 3: NOT Service Animals */}
          <GuideSection
            id="not-service-animals"
            title="Emotional Support Animals Are Not Service Animals"
          >
            <p>
              This is one of the most common areas of confusion. Under the ADA,
              <strong> emotional support animals (ESAs) are not service
              animals</strong>. An ESA provides comfort simply by being present but
              has not been trained to perform a specific task.
            </p>
            <p>
              This means businesses and government agencies <strong>do not have
              to</strong> allow emotional support animals under the ADA.
            </p>

            <GuideLegalCallout citation="Important Distinction">
              <p style={{ margin: 0 }}>
                <strong>Housing is different.</strong> Under the Fair Housing Act
                (FHA), landlords <em>must</em> allow emotional support animals as a
                reasonable accommodation, even if the property has a "no pets" policy.
                The ADA and FHA are separate laws with different rules.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          {/* Section 4: Two Questions */}
          <GuideSection
            id="two-questions"
            title="The Two Questions Businesses Can Ask"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.136(f) / §36.302(c)(6)</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  A public entity or place of public accommodation <em>shall not</em>
                  ask about the nature or extent of a person's disability. They may
                  ask only:
                </p>
                <p style={{ margin: '0 0 6px', paddingLeft: '12px' }}>
                  (1) Is the dog a service animal required because of a disability?
                </p>
                <p style={{ margin: 0, paddingLeft: '12px' }}>
                  (2) What work or task has the dog been trained to perform?
                </p>
              </>
            }
          >
            <p>
              When it's not obvious that a dog is a service animal, a business or
              government employee may ask only <strong>two questions</strong>:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '10px', fontWeight: 600 }}>
                "Is this a service animal required because of a disability?"
              </li>
              <li style={{ fontWeight: 600 }}>
                "What work or task has the dog been trained to perform?"
              </li>
            </ol>
            <p>They <strong>cannot</strong>:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Ask about the person's disability</li>
              <li style={{ marginBottom: '6px' }}>Require documentation, ID cards, or proof of training</li>
              <li style={{ marginBottom: '6px' }}>Ask the dog to demonstrate its task</li>
            </ul>
          </GuideSection>

          {/* Section 5: Where They Must Be Allowed */}
          <GuideSection
            id="where-allowed"
            title="Where Service Animals Must Be Allowed"
          >
            <p>
              Service animals must be allowed <strong>anywhere the public is
              normally allowed to go</strong>. This includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Restaurants and cafes (including food preparation areas if employees are present)</li>
              <li style={{ marginBottom: '6px' }}>Stores and shopping centers</li>
              <li style={{ marginBottom: '6px' }}>Hotels and motels</li>
              <li style={{ marginBottom: '6px' }}>Hospitals, doctor's offices, and clinics</li>
              <li style={{ marginBottom: '6px' }}>Schools and universities</li>
              <li style={{ marginBottom: '6px' }}>Movie theaters, sports arenas, and concert venues</li>
              <li style={{ marginBottom: '6px' }}>Government offices, courthouses, and libraries</li>
              <li style={{ marginBottom: '6px' }}>Taxis, rideshares, and public transportation</li>
            </ul>
            <p>
              A business <strong>cannot charge a pet fee or deposit</strong> for a
              service animal. They also cannot isolate the person or treat them less
              favorably because of the service animal.
            </p>
          </GuideSection>

          {/* Section 6: When a Service Animal Can Be Excluded */}
          <GuideSection
            id="exclusion"
            title="When a Service Animal Can Be Removed"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.136(b)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity may ask an individual with a disability to remove
                  a service animal from the premises if: (1) The animal is out of
                  control and the animal's handler does not take effective action to
                  control it; or (2) The animal is not housebroken."
                </p>
              </>
            }
          >
            <p>
              A business or government entity can only ask a person to remove their
              service animal in <strong>two situations</strong>:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>The animal is out of control</strong> and the handler does
                not take effective action to control it (for example, the dog is
                barking aggressively and the handler cannot make it stop).
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>The animal is not housebroken</strong> (not toilet-trained).
              </li>
            </ol>
            <p>
              Even if the service animal must be removed, the business <strong>must
              still offer</strong> the person with a disability the opportunity to
              participate in services without the animal.
            </p>
          </GuideSection>

          {/* Section 7: Other Key Rules */}
          <GuideSection
            id="other-rules"
            title="Other Important Rules"
          >
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Allergies and fear are not valid reasons</strong> to deny
                access. If another person is allergic to dogs, the business must
                accommodate both people — for example, by seating them in different
                areas.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>No documentation is required.</strong> There is no official
                certification, registration, or ID card for service animals. Websites
                selling "service animal registrations" are not recognized by the DOJ.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Breed restrictions don't apply.</strong> A business cannot
                exclude a service animal based on breed, size, or weight.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Handlers are responsible for the animal's behavior</strong>
                and for cleaning up after the animal. The service animal should be
                under control at all times — on a leash, harness, or tether unless
                that interferes with the animal's tasks.
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide is for informational purposes only. Service animal rights
                can vary depending on state and local laws, which may provide broader
                protections than the ADA. For legal advice about your specific
                situation, connect with an ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}