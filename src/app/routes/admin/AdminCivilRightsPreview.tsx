/**
 * /admin/civil-rights/preview/:state: the full public civil rights flow for
 * admins, available while `civil_rights_enabled` is still off (for Gina's
 * copy review and live checks). Behind RequireAdmin like every admin page.
 *
 * Forms finished here are saved like any other, tagged utm_source
 * "admin-preview" so they are easy to find and delete.
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { resolveState } from '../../../lib/civilRights/states/index.js';
import { UI } from '../../../lib/civilRights/copy.js';
import { CivilRightsWizard, BUTTON_PRIMARY } from '../public/civilRights/CivilRightsWizard.js';
import { IntroBody } from '../public/civilRights/CivilRightsPage.js';

export default function AdminCivilRightsPreview() {
  const { state } = useParams();
  const config = resolveState(state);
  const [started, setStarted] = useState(false);

  if (!config) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink-900 mb-4">{UI.pickerTitle}</h1>
        <p className="text-lg text-ink-900">{UI.pickerUnknown}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-6 rounded-md border-2 border-warning-500 p-3 text-base font-medium text-ink-900">
        {UI.previewBanner}
      </p>
      {started ? (
        <>
          <h1 className="sr-only">{UI.title(config.name)}</h1>
          <CivilRightsWizard config={config} preview onExit={() => setStarted(false)} />
        </>
      ) : (
        <IntroBody config={config}>
          <button type="button" className={BUTTON_PRIMARY} onClick={() => setStarted(true)}>
            {UI.start}
          </button>
        </IntroBody>
      )}
    </div>
  );
}
