import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideMobilityDevices() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Wheelchairs & Mobility Devices"
        typeBadge="Reference"
        badgeColor="#C2410C"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="wheelchairs-always"
            title="Wheelchairs Are Always Allowed"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.137(a) — Title II</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity shall permit individuals with mobility
                  disabilities to use wheelchairs and manually-powered mobility
                  aids, such as walkers, crutches, canes, braces, or other similar
                  devices designed for use by individuals with mobility disabilities,
                  in any areas open to pedestrian use."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.311(a) — Title III</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public accommodation shall permit individuals with mobility
                  disabilities to use wheelchairs and manually-powered mobility aids…
                  in any areas open to pedestrian use."
                </p>
              </>
            }
          >
            <p>
              Under the ADA, <strong>wheelchairs and manually-powered mobility
              devices</strong> must always be allowed anywhere the public is
              permitted to go. No exceptions. This includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Manual and power wheelchairs</li>
              <li style={{ marginBottom: '6px' }}>Walkers and rollators</li>
              <li style={{ marginBottom: '6px' }}>Crutches and canes</li>
              <li style={{ marginBottom: '6px' }}>Braces and similar devices</li>
            </ul>
            <p>
              A business or government agency <strong>cannot</strong> ask a person
              to leave their wheelchair or deny entry because of it. They cannot
              charge extra for wheelchair use, and they cannot require the person
              to transfer to a standard chair.
            </p>
          </GuideSection>

          <GuideSection
            id="opdmd"
            title="Other Power-Driven Mobility Devices (OPDMDs)"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.137(b) — Title II</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity shall make reasonable modifications in its
                  policies, practices, or procedures to permit the use of other
                  power-driven mobility devices by individuals with mobility
                  disabilities, unless the public entity can demonstrate that the
                  class of other power-driven mobility devices cannot be operated
                  in accordance with legitimate safety requirements."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.104 — Definition</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Other power-driven mobility device means any mobility device
                  powered by batteries, fuel, or other engines… that is used by
                  individuals with mobility disabilities for the purpose of
                  locomotion."
                </p>
              </>
            }
          >
            <p>
              Beyond traditional wheelchairs, some people with disabilities use
              <strong> other power-driven mobility devices (OPDMDs)</strong>.
              These include:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Segways</li>
              <li style={{ marginBottom: '6px' }}>Golf carts</li>
              <li style={{ marginBottom: '6px' }}>Electric scooters (not the kick type)</li>
              <li style={{ marginBottom: '6px' }}>All-terrain vehicles used for mobility</li>
            </ul>
            <p>
              Businesses and government agencies must generally allow OPDMDs, but
              they <strong>can evaluate</strong> whether a particular device is
              appropriate for their facility. This is different from wheelchairs,
              which are always allowed.
            </p>
          </GuideSection>

          <GuideSection
            id="five-factors"
            title="The Five Assessment Factors"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.137(b)(2) / §36.311(b)(2)</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  In determining whether to permit an OPDMD, factors to consider
                  include:
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (i) The type, size, weight, dimensions, and speed of the device;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (ii) The facility's volume of pedestrian traffic;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (iii) The facility's design and operational characteristics
                  (e.g., indoor vs. outdoor, type of terrain);
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (iv) Whether legitimate safety requirements can be established
                  to permit the safe operation of the device; and
                </p>
                <p style={{ margin: 0, paddingLeft: '12px' }}>
                  (v) Whether the use of the device creates a substantial risk of
                  serious harm to the immediate environment or natural or cultural
                  resources, or poses a conflict with Federal land management laws
                  and regulations.
                </p>
              </>
            }
          >
            <p>
              When deciding whether to allow a specific OPDMD, a business or agency
              must consider <strong>five factors</strong>:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Device characteristics:</strong> How big, heavy, and fast
                is it? A Segway in a small boutique is very different from one at
                a large outdoor zoo.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Pedestrian traffic:</strong> How crowded is the space?
                A busy museum during peak hours may not safely accommodate a
                golf cart.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Facility design:</strong> Is it indoor or outdoor?
                Narrow hallways? Stairs? Rough terrain?
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Safety:</strong> Can safety rules be established to make
                the device work? Speed limits, designated paths, etc.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Environmental impact:</strong> Would the device damage the
                environment or conflict with land management regulations?
              </li>
            </ol>
            <p>
              The key point: a business <strong>cannot simply ban all
              OPDMDs</strong>. They must make a case-by-case or class-by-class
              assessment based on these factors.
            </p>
          </GuideSection>

          <GuideSection
            id="what-they-can-ask"
            title="What They Can and Cannot Ask"
          >
            <p>
              The rules about questions are similar to service animals:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Cannot ask about your disability.</strong> A business
                cannot ask "What's wrong with you?" or "Why do you need that
                device?"
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Can ask if the device is for a disability.</strong> If
                it's not obvious, they may ask: "Is this device being used because
                of a mobility disability?" This is a yes-or-no question.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Cannot require proof.</strong> No doctor's note,
                registration, or certificate can be demanded.
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.137(d) / §36.311(c)">
              <p style={{ margin: 0 }}>
                "A public entity shall not ask an individual using a wheelchair or
                other power-driven mobility device questions about the nature and
                extent of the individual's disability." An entity may ask a person
                using an OPDMD to provide a credible assurance that the device is
                required because of a disability — this can be a valid disability
                parking placard or other reasonable demonstration.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="storage"
            title="Storage and Handling"
          >
            <p>
              Businesses must allow you to keep your mobility device with you.
              They <strong>cannot</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Require you to leave your wheelchair at the door
              </li>
              <li style={{ marginBottom: '8px' }}>
                Charge you a "storage fee" for your device
              </li>
              <li style={{ marginBottom: '8px' }}>
                Move or handle your device without your permission
              </li>
            </ul>
            <p>
              If your wheelchair or device is damaged by a business (for example,
              by an airline during travel), you may be entitled to repair or
              replacement costs. Airlines are covered under the Air Carrier Access
              Act, not the ADA, but the principle is similar.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA mobility device
                rights. State and local laws may provide additional protections.
                For legal advice about your specific situation, connect with an
                experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}