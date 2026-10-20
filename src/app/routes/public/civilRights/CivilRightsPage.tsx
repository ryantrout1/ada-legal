/**
 * /civil-rights and /civil-rights/:state
 *
 * A standalone page for preparing a state civil rights complaint form.
 * Deliberately isolated: no links or promotions to Ada or Spot (normal
 * site navigation only), no AI, nothing filed on anyone's behalf.
 *
 * /civil-rights/az redirects to /civil-rights/arizona (vercel.json); the
 * client does the same for any other alias. An unknown state shows the
 * picker with a plain note. While `civil_rights_enabled` is off the page
 * explains itself and says "coming soon" instead of a Start button.
 */

import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { listStates, resolveState, CANONICAL_PATH } from '../../../../lib/civilRights/states/index.js';
import { UI } from '../../../../lib/civilRights/copy.js';
import type { StateConfig } from '../../../../lib/civilRights/types.js';
import { useCivilRightsEnabled } from '../../../hooks/useCivilRightsEnabled.js';
import { CivilRightsWizard } from './CivilRightsWizard.js';
import { CivilRightsLanding } from './CivilRightsLanding.js';

const SECTION = 'max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-16';

export default function CivilRightsPage() {
  const { state } = useParams();
  if (!state) return <StatePicker />;
  const config = resolveState(state);
  if (!config) return <StatePicker unknown />;
  if (state !== config.slug) return <Navigate to={CANONICAL_PATH(config)} replace />;
  return <StateIntro config={config} />;
}

function StatePicker({ unknown = false }: { unknown?: boolean }) {
  return (
    <section className={SECTION}>
      <Helmet>
        <title>{`${UI.pickerTitle} | ADA Legal Link`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-ink-900 mb-6">
        {UI.pickerTitle}
      </h1>
      {unknown ? <p className="mb-4 text-lg font-medium text-ink-900">{UI.pickerUnknown}</p> : null}
      <p className="mb-8 text-lg text-ink-700 leading-relaxed">{UI.pickerIntro}</p>
      <ul className="mb-6 space-y-3">
        {listStates().map((s) => (
          <li key={s.code}>
            <Link
              to={CANONICAL_PATH(s)}
              className="inline-flex min-h-[44px] items-center rounded-md border-2 border-control-border px-5 py-2 text-lg font-medium text-ink-900 hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-base text-ink-700">{UI.pickerMore}</p>
    </section>
  );
}

function StateIntro({ config }: { config: StateConfig }) {
  const flag = useCivilRightsEnabled();
  const [started, setStarted] = useState(false);

  return (
    <>
      <Helmet>
        <title>{`${UI.title(config.name)} | ADA Legal Link`}</title>
        {flag !== 'on' ? <meta name="robots" content="noindex" /> : null}
      </Helmet>
      {started ? (
        <section className={SECTION}>
          <h1 className="sr-only">{UI.title(config.name)}</h1>
          <CivilRightsWizard config={config} onExit={() => setStarted(false)} />
        </section>
      ) : (
        <CivilRightsLanding config={config} status={flag} onStart={() => setStarted(true)} />
      )}
    </>
  );
}
