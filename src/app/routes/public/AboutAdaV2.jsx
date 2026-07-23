/**
 * AboutAda — ported from Base44 (src/pages/AboutAda.jsx @ 6b1e9ac),
 * which the drift ledger records as five edits ahead of the previous
 * port. Replaces the earlier 258-line version wholesale rather than
 * reconciling edit-by-edit: B44 is the design authority for this page
 * and a wholesale port is both faster and closer to parity.
 *
 * Port seams: the reading-level context moves to this app's provider
 * (already mounted in PublicLayout); B44's flat page routes become real
 * paths. No Base44 SDK usage on this page to remove.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useReadingLevel } from '../../components/standards/ReadingLevelContext.js';

export default function AboutAda() {
  // Reading level from the accessibility panel (eyeball, top-right):
  // 'simple' (5th grade) | 'standard' (current) | 'professional' (UI label
  // "Professional"). This page has no separate legal/citation text, so the
  // Professional level reuses the Standard content; only Simple is a distinct version.
  const { readingLevel } = useReadingLevel();

  // Page title & meta description
  React.useEffect(() => {
    document.title = "Why she's called Ada — ADA Legal Link";
    const descContent = "The AI assistant on ADA Legal Link is named in honor of Ada Lovelace and the Americans with Disabilities Act. Here's why.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', descContent);
  }, []);

  // Per-mode design tokens (defined + remapped per display mode in
  // DisplaySettings.jsx) so Dark / Warm / High-Contrast / Low-Vision reach
  // this page. --link / --section-label are the AAA-safe terra (#9A3412).
  const INK = 'var(--heading)';
  const BODY = 'var(--body)';
  const MUTED = 'var(--body-secondary)';
  const LINK = 'var(--link)';
  const SECTION_LABEL = 'var(--section-label)';
  const ACCENT = 'var(--accent)';
  const SURFACE = 'var(--card-bg)';
  const BORDER = 'var(--card-border)';

  const pageStyle = {
    backgroundColor: 'var(--page-bg, #FAF7F2)',
    padding: '32px 20px 80px',
    minHeight: 'calc(100vh - 72px)',
  };

  const containerStyle = { maxWidth: '640px', margin: '0 auto' };

  const breadcrumbStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.875rem',
    color: MUTED,
    marginBottom: '32px',
  };

  const breadcrumbLinkStyle = { color: LINK, textDecoration: 'underline' };

  const eyebrowStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Courier New", monospace',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: SECTION_LABEL,
    margin: '0 0 16px',
  };

  const h1Style = {
    fontFamily: 'Fraunces, Georgia, serif',
    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
    fontWeight: 600,
    color: INK,
    lineHeight: 1.15,
    margin: '0 0 32px',
  };

  const ledeStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.25rem',
    lineHeight: 1.65,
    color: INK,
    margin: '0 0 48px',
    fontWeight: 400,
  };

  const h2Style = {
    fontFamily: 'Fraunces, Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: 600,
    color: INK,
    lineHeight: 1.25,
    margin: '48px 0 20px',
  };

  const h3Style = {
    fontFamily: 'Fraunces, Georgia, serif',
    fontSize: '1.375rem',
    fontWeight: 600,
    color: INK,
    lineHeight: 1.3,
    margin: '0 0 16px',
  };

  const pStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '1.0625rem',
    lineHeight: 1.75,
    color: BODY,
    margin: '0 0 20px',
  };

  const pullQuoteStyle = {
    borderLeft: `4px solid ${ACCENT}`,
    paddingLeft: '24px',
    margin: '40px 0 8px',
    fontFamily: 'Fraunces, Georgia, serif',
    fontStyle: 'italic',
    fontSize: '1.375rem',
    lineHeight: 1.5,
    color: INK,
  };

  const captionStyle = {
    paddingLeft: '28px',
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.875rem',
    color: MUTED,
    margin: '0 0 32px',
    fontStyle: 'normal',
  };

  const glossStyle = {
    ...pStyle,
    fontStyle: 'italic',
    color: MUTED,
    margin: '0 0 20px',
  };

  const calloutStyle = {
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    padding: '28px',
    margin: '48px 0',
  };

  const dividerStyle = { border: 0, borderTop: `1px solid ${BORDER}`, margin: '48px 0' };

  const ulStyle = {
    paddingLeft: '20px', margin: 0,
    fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', lineHeight: 1.75, color: BODY,
  };

  const liStyle = { margin: '0 0 16px' };

  const extLinkStyle = { color: LINK, textDecoration: 'underline', fontWeight: 600 };

  // ───────────────────────── STANDARD / LEGAL body ─────────────────────────
  // Used for 'standard' and 'professional' (Legal) — current 8th-grade prose.
  const standardBody = (
    <>
      <p style={ledeStyle}>
        The AI assistant you talk to on this site is named in honor of two things. A woman who imagined what computers could become a century before anyone built one. And the law that finally said nobody gets shut out.
      </p>

      <h2 style={h2Style}>Ada Lovelace</h2>
      <p style={pStyle}>
        Augusta Ada King, Countess of Lovelace, was born in London in 1815. She was a mathematician at a time when women weren't expected to be anything of the kind. Her closest collaborator was Charles Babbage, the inventor of an enormous mechanical calculating machine called the Analytical Engine.
      </p>
      <p style={pStyle}>
        The Engine was never built in her lifetime. But Ada wrote a set of notes about what it could do — and she saw further than anyone else, including Babbage. She described loops. She described conditionals. She wrote what historians now consider the first published computer program. And she wrote something stranger and bigger than that: that a machine like this could one day work on more than numbers. It could, she said, compose music.
      </p>
      <p style={pStyle}>
        She called what she did <span style={{ fontWeight: 500, color: INK }}>poetical science</span>. She lived with chronic illness for most of her adult life, and she died of cancer at the age of thirty-six. She did the work anyway.
      </p>

      <figure style={{ margin: 0 }}>
        <blockquote style={pullQuoteStyle}>
          "The Analytical Engine has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform."
        </blockquote>
        <figcaption style={captionStyle}>
          <cite style={{ fontStyle: 'inherit' }}>Ada Lovelace, Note G, 1843</cite>
        </figcaption>
      </figure>

      <p style={pStyle}>
        That sentence is one of the most-cited lines in the history of computing. It's a warning we still need: a machine does what you tell it to. The judgment of what to ask it for is yours.
      </p>

      <h2 style={h2Style}>The Americans with Disabilities Act</h2>
      <p style={pStyle}>
        One hundred and seventy-five years after Ada Lovelace was born, on July 26, 1990, President George H. W. Bush signed the Americans with Disabilities Act into law on the South Lawn of the White House. He called it the world's first comprehensive declaration of equality for people with disabilities. He was right.
      </p>
      <p style={pStyle}>
        The law did not appear out of nowhere. It was won by disabled people themselves — including the Capitol Crawl in March of that year, when dozens of disabled activists got out of their wheelchairs and pulled themselves up the steps of the U.S. Capitol to make Congress see, in plain physical terms, what inaccessibility means.
      </p>
      <p style={pStyle}>
        The ADA says, in five titles, that nobody gets shut out: not from a job, not from a city service, not from a store or a hotel or a doctor's office, not from a phone call, not from a bus or a train. Thirty-five years later, the work of actually delivering on that promise is still going on.
      </p>

      <h2 style={h2Style}>Why this Ada</h2>
      <p style={pStyle}>
        The two names share initials. That's a coincidence. The reason the assistant on this site carries both names is not.
      </p>
      <p style={pStyle}>
        Ada Lovelace believed a machine could do more than arithmetic. She imagined it could help with the parts of life that needed care, attention, and judgment — the parts she called poetical. Nearly two centuries later, machines can do many of the things she described. They can compose music. They can read text. They can, sometimes, listen.
      </p>
      <p style={pStyle}>
        The Americans with Disabilities Act says where they should be listening first. Where the work is hardest. Where the consequences of being shut out are most severe. The ADA is the framework for what access actually means in American life, and it is still, every day, being tested.
      </p>
      <p style={pStyle}>
        Ada — the assistant on this site — exists at the place where those two ideas meet. Her job is to help when access fails. To listen, in plain words, to what happened. To help figure out what it was, what part of the law applies, and what comes next. She is named in honor of two histories, and she was built to do the work both of them point to.
      </p>

      <aside style={calloutStyle} aria-labelledby="ada-callout-heading">
        <h3 id="ada-callout-heading" style={h3Style}>What Ada is, and what she isn't.</h3>
        <p style={{ ...pStyle, margin: '0 0 16px' }}>
          Ada is an AI assistant. She is not a lawyer. She is not the real Ada Lovelace, who died in 1852 and whose work and memory belong to her family and to history.
        </p>
        <p style={{ ...pStyle, margin: 0 }}>
          What she is, is a careful intake — built by people who care about the ADA community — to help the first conversation you have about an access problem be a useful one.
        </p>
      </aside>
    </>
  );

  // ───────────────────────────── SIMPLE body ───────────────────────────────
  // 5th-grade reading level: same story beats, short plain sentences,
  // everyday words, hard terms explained. The 1843 quote is kept with a
  // plain-language gloss right after it.
  const simpleBody = (
    <>
      <p style={ledeStyle}>
        The helper on this website is named Ada. The name honors two things. First, a woman who dreamed about what computers could do — long before computers were built. Second, a law that says no one should be left out.
      </p>

      <h2 style={h2Style}>Ada Lovelace</h2>
      <p style={pStyle}>
        Ada Lovelace was born in London in 1815. She loved math. Back then, most people did not think girls should do math. She did it anyway.
      </p>
      <p style={pStyle}>
        She worked with a man named Charles Babbage. He was building a giant calculating machine. People called it the Analytical Engine. It was never finished while she was alive.
      </p>
      <p style={pStyle}>
        Ada wrote notes about the machine. She saw something no one else did. She figured out how to give the machine a list of steps to follow. Many people call this the first computer program. She also had a bigger idea: a machine like this might do more than math one day. It might even make music.
      </p>
      <p style={pStyle}>
        Ada was sick for much of her life. She died of cancer when she was 36 years old. She did the work anyway.
      </p>

      <figure style={{ margin: 0 }}>
        <blockquote style={pullQuoteStyle}>
          "The Analytical Engine has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform."
        </blockquote>
        <figcaption style={captionStyle}>
          <cite style={{ fontStyle: 'inherit' }}>Ada Lovelace, Note G, 1843</cite>
        </figcaption>
      </figure>
      <p style={glossStyle}>
        In plain words: a machine only does what we tell it to do. Choosing what to ask for is our job, not the machine's.
      </p>

      <p style={pStyle}>
        Those words are famous. People who study computers still say them today. They remind us of something true: a machine only does what we tell it. We are the ones who decide what to ask for.
      </p>

      <h2 style={h2Style}>The Americans with Disabilities Act</h2>
      <p style={pStyle}>
        On July 26, 1990, the United States passed a law called the Americans with Disabilities Act. People call it the ADA for short. President George H. W. Bush signed it. He said it was the first big promise of equal rights for people with disabilities. He was right.
      </p>
      <p style={pStyle}>
        The law did not just happen. Disabled people fought for it. One famous moment was the Capitol Crawl. In March 1990, many disabled people left their wheelchairs and pulled themselves up the stone steps of the U.S. Capitol. They did this so lawmakers could see what it feels like to be shut out.
      </p>
      <p style={pStyle}>
        The ADA says no one should be locked out. Not from a job. Not from a city service. Not from a store, a hotel, or a doctor's office. Not from a phone call, a bus, or a train. The law is 35 years old now. People are still working to make that promise real.
      </p>

      <h2 style={h2Style}>Why this Ada</h2>
      <p style={pStyle}>
        The two names — Ada Lovelace and the ADA — start with the same letters. That part is just luck. But the reason our helper has both names is on purpose.
      </p>
      <p style={pStyle}>
        Ada Lovelace believed a machine could do more than add numbers. She thought it could help with parts of life that need care and good judgment. Almost two hundred years later, machines can do many things she imagined. They can make music. They can read words. Sometimes, they can listen.
      </p>
      <p style={pStyle}>
        The ADA tells us where that help matters most. It matters most where people get shut out. That is where the harm is greatest.
      </p>
      <p style={pStyle}>
        Ada — the helper on this site — lives where those two ideas meet. Her job is to help when access fails. She listens, in plain words, to what happened. She helps you figure out what went wrong, which part of the law fits, and what to do next. She is named after two stories, and she was built to do the work both of them call for.
      </p>

      <aside style={calloutStyle} aria-labelledby="ada-callout-heading">
        <h3 id="ada-callout-heading" style={h3Style}>What Ada is, and what she is not.</h3>
        <p style={{ ...pStyle, margin: '0 0 16px' }}>
          Ada is an AI helper. She is not a lawyer. She is not the real Ada Lovelace. The real Ada Lovelace died in 1852. Her work and her memory belong to her family and to history.
        </p>
        <p style={{ ...pStyle, margin: 0 }}>
          Ada is a careful first step. People who care about the disability community built her. She helps the first talk you have about an access problem be a good one.
        </p>
      </aside>
    </>
  );

  return (
    <div style={pageStyle}>
      <article style={containerStyle}>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" style={breadcrumbStyle}>
          <Link to="/" style={breadcrumbLinkStyle}>Home</Link>
          <span aria-hidden="true" style={{ margin: '0 8px', color: MUTED }}>/</span>
          <span aria-current="page">About Ada</span>
        </nav>

        {/* Eyebrow */}
        <p style={eyebrowStyle}>About Ada</p>

        {/* H1 */}
        <h1 style={h1Style}>Why she's called Ada.</h1>

        {/* Body — swaps with the reading-level control (eyeball panel). */}
        {readingLevel === 'simple' ? simpleBody : standardBody}

        {/* Divider */}
        <hr style={dividerStyle} />

        {/* Further reading */}
        <h2 style={{ ...h2Style, marginBottom: '20px' }}>Further reading</h2>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <a href="https://www.bl.uk/people/ada-lovelace" target="_blank" rel="noopener noreferrer" style={extLinkStyle}>
              Ada Lovelace at the British Library
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            <span style={{ color: BODY }}> — biography and surviving manuscripts.</span>
          </li>
          <li style={liStyle}>
            <a href="https://www.ada.gov/" target="_blank" rel="noopener noreferrer" style={extLinkStyle}>
              ADA.gov
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            <span style={{ color: BODY }}> — the official U.S. Department of Justice site for the Americans with Disabilities Act.</span>
          </li>
          <li style={liStyle}>
            <a href="https://www.archives.gov/news/articles/capitol-crawl-30th-anniversary" target="_blank" rel="noopener noreferrer" style={extLinkStyle}>
              The Capitol Crawl, 30th anniversary
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            <span style={{ color: BODY }}> — National Archives feature on the protest that helped pass the ADA.</span>
          </li>
        </ul>
      </article>
    </div>
  );
}
