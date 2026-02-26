import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideSocialMedia() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Social Media & Digital Content Accessibility"
        typeBadge="Guide"
        badgeColor="#5B2C6F"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="overview"
            title="Why Social Media Accessibility Matters"
          >
            <p>
              Government agencies and businesses increasingly use social media to
              share important information — emergency alerts, public meetings,
              service updates, job postings, and community events. If that
              content isn't accessible, people with disabilities are <strong>cut
              off from essential information</strong>.
            </p>
            <p>
              Under the ADA, the obligation to communicate effectively with
              people with disabilities applies to <strong>all channels</strong>
              you use — including social media platforms, email newsletters,
              videos, and digital graphics.
            </p>
          </GuideSection>

          <GuideSection
            id="alt-text"
            title="Alt Text on Images"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 SC 1.1.1 — Non-text Content (Level A)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "All non-text content that is presented to the user has a text
                  alternative that serves the equivalent purpose, except for"
                  specified exceptions such as decorative images, CAPTCHAs, and
                  content that is purely sensory. Images posted on social media
                  that convey information require meaningful text alternatives.
                </p>
              </>
            }
          >
            <p>
              Every image posted on social media that conveys information needs
              <strong> alt text</strong> (alternative text) — a written
              description that screen readers read aloud. Most platforms now
              support it:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>X (Twitter):</strong> When composing a post with an
                image, click "Add description" on the image thumbnail
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Facebook:</strong> Click "Edit" on an uploaded photo and
                select "Alternative Text"
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Instagram:</strong> On the final screen before posting,
                tap "Advanced Settings" → "Write Alt Text"
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>LinkedIn:</strong> Click the image after uploading and
                select "Add alt text"
              </li>
            </ul>
            <p>
              <strong>Good alt text describes what the image shows</strong> and
              why it matters in context. "Photo of a building" is vague.
              "Accessible entrance to City Hall showing automatic doors and
              level entry" is useful.
            </p>
          </GuideSection>

          <GuideSection
            id="captions"
            title="Captions on Videos"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 SC 1.2.2 — Captions (Prerecorded) (Level A)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Captions are provided for all prerecorded audio content in
                  synchronized media."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>SC 1.2.4 — Captions (Live) (Level AA)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Captions are provided for all live audio content in
                  synchronized media."
                </p>
              </>
            }
          >
            <p>
              All videos shared on social media must have <strong>accurate
              captions</strong>. This includes prerecorded videos and live
              streams.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Auto-generated captions are not sufficient:</strong>
                Platforms like YouTube and Facebook auto-generate captions, but
                they're often inaccurate — especially with names, technical terms,
                accents, or multiple speakers. You must <strong>review and
                correct</strong> auto-generated captions before publishing.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Burned-in vs. closed captions:</strong> Closed captions
                (that can be turned on/off) are preferred because users can
                customize size and appearance. If the platform doesn't support
                closed captions, burn the captions directly into the video
                (open captions).
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Caption quality:</strong> Captions must be synchronized
                with the audio, include speaker identification when multiple
                people speak, and note relevant non-speech sounds (like
                "[applause]" or "[alarm sounding]").
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="audio-descriptions"
            title="Audio Descriptions for Video"
          >
            <p>
              <strong>Audio descriptions</strong> narrate important visual
              information that isn't conveyed through dialogue alone. They help
              people who are blind or have low vision understand what's happening
              on screen.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                During natural pauses in dialogue, a narrator describes key
                visual elements — actions, scene changes, on-screen text, and
                facial expressions that convey meaning
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>When needed:</strong> Any video where important
                information is conveyed visually — a presentation with slides,
                a demonstration, a tour of a facility
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>When not needed:</strong> A "talking head" video where
                one person speaks directly to the camera with no visual content
                beyond their face
              </li>
            </ul>

            <GuideLegalCallout citation="WCAG 2.1 SC 1.2.5 — Audio Description (Prerecorded) (Level AA)">
              <p style={{ margin: 0 }}>
                "Audio description is provided for all prerecorded video content
                in synchronized media." This applies to all prerecorded video
                where visual information is needed to understand the content.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="plain-language"
            title="Plain Language in Posts"
          >
            <p>
              Social media posts should be written in <strong>clear, simple
              language</strong> that's easy for everyone to understand —
              including people with cognitive disabilities, learning
              disabilities, or limited English proficiency:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Use short sentences and common words
              </li>
              <li style={{ marginBottom: '8px' }}>
                Explain acronyms on first use (e.g., "ADA (Americans with
                Disabilities Act)")
              </li>
              <li style={{ marginBottom: '8px' }}>
                Put the most important information first
              </li>
              <li style={{ marginBottom: '8px' }}>
                Avoid jargon unless your audience expects it
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="hashtags-and-design"
            title="Accessible Hashtags & Graphics"
          >
            <p>
              Small formatting choices make a big difference for accessibility:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { practice: 'CamelCase hashtags', bad: '#accessibleparkingrequirements', good: '#AccessibleParkingRequirements', why: 'Screen readers read CamelCase as separate words. Without it, they read one long nonsensical string.' },
                { practice: 'Color contrast in graphics', bad: 'Light yellow text on white background', good: 'Dark text on light background (4.5:1 ratio)', why: 'Social media graphics with text must meet the same contrast standards as web content.' },
                { practice: 'Don\'t embed text in images', bad: 'Posting an image of a flyer with all event details in the image', good: 'Include key details in the post text itself, with image as supplementary', why: 'Text in images can\'t be read by screen readers, can\'t be resized, and can\'t be translated.' },
                { practice: 'Limit emoji use', bad: '🎉🎊✨🥳🎈 BIG NEWS 🎈🥳✨🎊🎉', good: 'Big news! 🎉', why: 'Screen readers read every emoji aloud. Ten emojis in a row becomes an exhausting experience.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.practice}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '0 0 4px' }}>
                    <span style={{
                      fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                      background: '#FEE2E2', color: '#991B1B', fontWeight: 600
                    }}>Avoid</span>
                    <code style={{
                      fontSize: '0.8rem', background: '#FEF2F2', padding: '2px 6px',
                      borderRadius: '4px', color: '#7F1D1D', wordBreak: 'break-all'
                    }}>{item.bad}</code>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '0 0 6px' }}>
                    <span style={{
                      fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                      background: '#DCFCE7', color: '#166534', fontWeight: 600
                    }}>Better</span>
                    <code style={{
                      fontSize: '0.8rem', background: '#F0FDF4', padding: '2px 6px',
                      borderRadius: '4px', color: '#14532D', wordBreak: 'break-all'
                    }}>{item.good}</code>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--slate-500)', lineHeight: 1.6 }}>{item.why}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="title-ii-exception"
            title="Title II Web Rule & Social Media"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.202 — Exceptions</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(4) Preexisting social media posts" are excepted from the
                  WCAG 2.1 conformance requirement.
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(2) Content posted by a third party" — content not posted by
                  or under the control of the public entity is also excepted.
                </p>
                <p style={{ margin: 0 }}>
                  However, the general obligations under Title II — including
                  effective communication (§35.160) and reasonable modifications
                  (§35.130) — continue to apply to all content, including social
                  media.
                </p>
              </>
            }
          >
            <p>
              The 2024 Title II web rule has specific provisions about social
              media:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Preexisting posts are excepted:</strong> Social media
                posts published <em>before</em> the compliance date (April 2026
                or 2027) don't need to retroactively meet WCAG 2.1.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>New posts must comply:</strong> After the compliance
                date, all new social media content posted by or for the
                government entity must meet WCAG 2.1 Level AA — including
                images with alt text, captioned videos, and accessible graphics.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Third-party content is excepted:</strong> Comments and
                posts by members of the public on a government's social media
                page are not the entity's responsibility.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>But broader obligations remain:</strong> Even apart from
                the web rule, Title II's effective communication requirement
                means government agencies must ensure their social media
                communications are accessible to people with disabilities.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="live-streams"
            title="Live Streams & Real-Time Captioning"
          >
            <p>
              Live video is increasingly used for public meetings, press
              conferences, and community events. WCAG 2.1 Level AA requires
              <strong> real-time captions for live audio content</strong>.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>CART captioning</strong> (Communication Access Realtime
                Translation) uses a trained stenographer typing in real time.
                It's the most accurate option for live events.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>AI auto-captioning</strong> (like YouTube Live's auto
                captions) is improving but still makes significant errors,
                especially with names, technical terms, and accented speech.
                It may be acceptable for informal content but is generally
                <strong> not sufficient</strong> for official government
                proceedings.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Post-event:</strong> After a live stream ends, review
                and correct the captions before the recording is posted
                permanently.
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about social media and
                digital content accessibility. Accessibility obligations may vary
                based on whether you're a government entity (Title II) or private
                business (Title III). For legal advice about your specific
                situation, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}