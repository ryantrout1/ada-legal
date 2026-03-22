import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import EmailFlowDiagram from '../components/admin/emails/EmailFlowDiagram';
import EmailTemplateTable from '../components/admin/emails/EmailTemplateTable';
import EmailTemplateEditor from '../components/admin/emails/EmailTemplateEditor';

export default function AdminEmails() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadTemplates = async () => {
    const all = await base44.entities.EmailTemplate.list('created_date', 50);
    setTemplates(all);
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      await loadTemplates();
      setLoading(false);
    }
    init();
  }, []);

  const handleSelectByKey = (key) => {
    const tpl = templates.find(t => t.template_key === key);
    if (tpl) setSelected(tpl);
  };

  const handleToggleActive = async (tpl) => {
    await base44.entities.EmailTemplate.update(tpl.id, { is_active: !tpl.is_active });
    await loadTemplates();
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading email templates" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading email templates…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {selected ? (
          <EmailTemplateEditor
            template={selected}
            onBack={() => setSelected(null)}
            onSaved={async () => {
              await loadTemplates();
              const refreshed = (await base44.entities.EmailTemplate.filter({ template_key: selected.template_key }, '-created_date', 1))[0];
              if (refreshed) setSelected(refreshed);
            }}
          />
        ) : (
          <>
            <AdminPageHeader title="Email Templates" />
            <EmailFlowDiagram onSelectTemplate={handleSelectByKey} />
            <EmailTemplateTable
              templates={templates}
              onSelect={setSelected}
              onToggleActive={handleToggleActive}
            />
          </>
        )}
      </div>
    </div>
  );
}