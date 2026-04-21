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
}

const DEFAULT: Settings = {
  data_collection_enabled: true,
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
      </div>
    </section>
  );
}

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
