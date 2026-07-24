import React from 'react';

/**
 * StoryV2 — founder story, demoted from a hero-weight section (plus rotating
 * founder quotes in the old hero) to a single grounded block near the bottom.
 * The pull-quote is lifted from the Ada page's founder note. Photo frame is a
 * placeholder until Gina's photo/video is wired in.
 */
/**
 * Founder photo. Flip STORY_PHOTO_AVAILABLE to true once the file is
 * committed at public/brand/gina-story.png — see the note at the render
 * site. Kept as an explicit constant rather than an onError fallback so
 * the missing-asset state is a deliberate decision, not a runtime accident.
 */
const STORY_PHOTO_SRC = '/brand/gina-story.png';
const STORY_PHOTO_AVAILABLE = false;

export default function StoryV2() {
  return (
    <section
      aria-labelledby="v2-story-heading"
      className="v2-section warm-keep-dark"
      style={{ background: 'var(--dark-bg-deep)', padding: '90px 0' }}
    >
      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 2rem' }}>
        <div className="v2-story-grid" style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '48px', alignItems: 'center' }}>
          {/* Founder photo.
              B44 loads this from Base44's Supabase storage — the last of
              the three Supabase-hosted assets M1 identified and deferred
              ("the story photo is only used by M5 components → pull it in
              M5"). It cannot be fetched from this sandbox (that host is
              outside the egress allowlist), and pointing the live homepage
              at storage we are decommissioning at M8 would break the page
              the day Base44 is unpublished.

              So: the framed panel renders either way, and the photo appears
              once the asset lands at the path below. No broken image, no
              placeholder pretending to be content. */}
          <div style={{
            aspectRatio: '4 / 5', borderRadius: '18px', overflow: 'hidden',
            border: '1px solid var(--dark-card-border)',
            background: 'linear-gradient(160deg, var(--body), #1e293b)',
            position: 'relative', display: 'flex', alignItems: 'flex-end',
          }}>
            {STORY_PHOTO_AVAILABLE && (
              <img
                loading="lazy"
                src={STORY_PHOTO_SRC}
                alt="Gina Schuh, co-founder of ADA Legal Link, in her wheelchair outdoors"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }}
              />
            )}
          </div>

          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--dark-label)', margin: '0 0 0.85rem' }}>
              Our story
            </p>
            <h2 id="v2-story-heading" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: 'var(--dark-heading)', lineHeight: 1.2, margin: '0 0 1.2rem', fontStyle: 'normal' }}>
              We don't want to leave anybody out.
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem', color: 'var(--dark-body-secondary)', lineHeight: 1.7, margin: '0 0 1.2rem' }}>
              We built ADA Legal Link because the people we love hit barriers every day that shouldn't
              be there. Doors too narrow. Sites that don't work with a screen reader. An "accessible"
              room that wasn't.
            </p>
            <blockquote style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '20px', fontFamily: 'Manrope, sans-serif', fontStyle: 'italic', fontSize: '1.15rem', color: 'var(--dark-body)', lineHeight: 1.6, margin: '1.8rem 0' }}>
              Whatever your disability, whatever the barrier — we don't want you left out. Not by the
              businesses you walk past every day, not by the law, and not by us.
            </blockquote>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem', color: 'var(--dark-body-secondary)', lineHeight: 1.7, margin: '0 0 1.2rem' }}>
              We come at this from two sides. Gina Schuh has spent more than 20 years navigating these
              barriers herself — as a quadriplegic, and as a J.D. and ADA rights advocate fighting for
              access. She didn't just study this law; she lives it. Ryan Trout builds the platform, with
              accessibility designed in from the first line of code instead of bolted on after.
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--dark-muted)', margin: 0 }}>
              <b style={{ color: 'var(--dark-label)' }}>Gina Schuh & Ryan Trout</b> — co-founders
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
