/**
 * AdminSettings — global admin toggles.
 *
 * Ch0 has one real setting: data_collection_enabled. More accrete here.
 * Reading a setting returns its default if unset; writing upserts to
 * the system_settings singleton row keyed 'admin'.
 */

import { useEffect, useState } from 'react';

interface Settings {
  data_collection_enabled: boolean;
  ada_chat_enabled: boolean;
  ada_photo_enabled: boolean;
  spot_enabled: boolean;
  spot_test_payment: boolean;
  lawsuits_ada_cta_enabled: boolean;
  ada_universal_cta: boolean;
}

const DEFAULT: Settings = {
  data_collection_enabled: true,
  ada_chat_enabled: true,
  ada_photo_enabled: false,
  spot_enabled: false,
  spot_test_payment: false,
  lawsuits_ada_cta_enabled: false,
  ada_universal_cta: false,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch('/api/admin/settings', { credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as { settings: Settings };
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(patch: Partial<Settings>) {
    setSaving(true);
    setError(null);
    setSavedNote(null);
    try {
      const resp = await fetch('/api/admin/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { settings: Settings };
      setSettings(data.settings);
      setSavedNote('Saved.');
      // Auto-dismiss the saved note.
      setTimeout(() => setSavedNote(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500 italic">Loading settings…</p>;

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
          Settings
        </h1>
        <p className="text-sm text-ink-500">
          Global toggles for ADA Legal Link.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {savedNote && (
        <div
          role="status"
          className="mb-4 rounded-md border border-success-500 bg-success-50 px-4 py-3 text-sm text-success-500"
        >
          {savedNote}
        </div>
      )}

      <div className="max-w-2xl space-y-4">
        <SettingRow
          title="Data collection"
          description="When on, Ada sessions capture conversation history, extracted fields, and quality metadata for learning + observability. Turning this off puts Ada into minimal-retention mode."
        >
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.data_collection_enabled}
              disabled={saving}
              onChange={(e) =>
                void save({ data_collection_enabled: e.target.checked })
              }
              className="accent-accent-500 w-5 h-5"
            />
            <span className="text-sm text-ink-700">
              {settings.data_collection_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </SettingRow>

        {/* M6: the five flags that had no UI. Until now the only way to
            flip any of these was a hand-written Neon upsert against a
            shared jsonb blob — the kind of operation that goes wrong at
            11pm. Each one gates something that either charges money or
            hands a claimant onward, so each says plainly what it does. */}
        {FLAGS.map((flag) => (
          <SettingRow key={flag.key} title={flag.title} description={flag.description}>
            <label className="flex items-center gap-3 min-h-[44px]">
              <input
                type="checkbox"
                checked={settings[flag.key]}
                disabled={saving}
                onChange={(e) => void save({ [flag.key]: e.target.checked })}
                className="accent-accent-600 w-[22px] h-[22px]"
              />
              <span className="text-sm text-ink-700">
                {settings[flag.key] ? 'On' : 'Off'}
              </span>
            </label>
          </SettingRow>
        ))}
      </div>
    </section>
  );
}

/** The flags that live in the shared `admin` blob, with plain-language
 *  descriptions of what flipping each one actually does to the site. */
const FLAGS: {
  key: keyof Settings;
  title: string;
  description: string;
}[] = [
  {
    key: 'ada_chat_enabled',
    title: 'Ada chat',
    description:
      'The live claimant conversation. Off means /chat stops accepting new sessions — the kill switch for Ada herself.',
  },
  {
    key: 'ada_photo_enabled',
    title: 'Ada photo analysis',
    description:
      'The photo path at /photo. Analysis is always presented as triage and screening, never as a compliance certification.',
  },
  {
    key: 'spot_enabled',
    title: 'Spot',
    description:
      'The $79 paid accessibility report at /spot. Off hides the product entirely; nobody can be charged while this is off.',
  },
  {
    key: 'spot_test_payment',
    title: 'Spot test payments',
    description:
      'Routes Spot checkout through Stripe test mode. Must be OFF in production — on means real customers cannot actually pay.',
  },
  {
    key: 'lawsuits_ada_cta_enabled',
    title: 'Ada CTA on lawsuit pages',
    description:
      'Shows "Talk to Ada about this case" on public lawsuit pages. Off renders nothing in its place. Gina reviews this copy before it goes on.',
  },
  {
    key: 'ada_universal_cta',
    title: 'Universal Ada CTA',
    description:
      'Retargets site-wide calls to action at Ada rather than the older Pathway pages, so classification happens in conversation instead of a triage form.',
  },
];

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-surface-200 bg-white p-4 sm:p-5">
      <h2 className="font-display text-lg text-ink-900 mb-1">{title}</h2>
      <p className="text-sm text-ink-500 mb-3 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}
