/**
 * PortalPlaceholder — honest "coming soon" panel for nav destinations whose
 * backend doesn't exist yet (Calendar, Contacts, Settings). The nav links are
 * visible (so the shell matches the mockup's information architecture) but the
 * route renders a clearly-labelled placeholder rather than fabricated data.
 *
 * Ref: Phase 5 §7.1 (stub Calendar / Contacts / Settings).
 */

import { Helmet } from 'react-helmet-async';

interface Props {
  title: string;
  blurb?: string;
}

export default function PortalPlaceholder({ title, blurb }: Props) {
  return (
    <>
      <Helmet>
        <title>{title} — ADA Legal Link</title>
      </Helmet>
      <section className="lw-placeholder" aria-labelledby="lw-placeholder-h">
        <span className="lw-badge-soon">Coming soon</span>
        <h1 id="lw-placeholder-h">{title}</h1>
        <p>
          {blurb ??
            `${title} isn't available in the workspace yet. It's on the roadmap — for now, use Inbox and Matters to work your cases.`}
        </p>
      </section>
    </>
  );
}
