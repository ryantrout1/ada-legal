import React, { useState } from 'react';
import { Lock } from 'lucide-react';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function LawyerNotesSection({ notes, onSaveNote }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = [...notes].sort((a, b) => new Date(b.created_at || b.created_date) - new Date(a.created_at || a.created_date));

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await onSaveNote(text.trim());
    setText('');
    setAdding(false);
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Lock size={13} style={{ color: 'var(--body-secondary)' }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          My Notes
        </span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', color: 'var(--body-secondary)', fontStyle: 'italic' }}>
          (private — only you can see these)
        </span>
      </div>

      {sorted.length === 0 && !adding && (
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', fontStyle: 'italic', margin: '0 0 8px' }}>
          No notes yet.
        </p>
      )}

      {sorted.map(note => (
        <div key={note.id} style={{ marginBottom: '8px', padding: '8px 12px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--body-secondary)' }}>
            {formatDateTime(note.created_at || note.created_date)}
          </span>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)', lineHeight: 1.6, margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>
            {note.note_text}
          </p>
        </div>
      ))}

      {adding && (
        <div style={{ marginTop: '8px' }}>
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Add a private note about this case..."
            rows={3}
            style={{
              width: '100%', padding: '10px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: 'var(--heading)', border: '2px solid var(--border)', borderRadius: '8px',
              outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '70px',
              backgroundColor: 'white'
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
            <button type="button" onClick={handleSave} disabled={saving || !text.trim()} style={{
              padding: '0 16px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
              fontWeight: 700, color: 'white',
              backgroundColor: (saving || !text.trim()) ? 'var(--body-secondary)' : 'var(--section-label)',
              border: 'none', borderRadius: '8px', cursor: (saving || !text.trim()) ? 'not-allowed' : 'pointer',
              minHeight: '36px'
            }}>{saving ? 'Saving…' : 'Save Note'}</button>
            <button type="button" onClick={() => { setAdding(false); setText(''); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
              color: 'var(--body-secondary)', padding: '4px'
            }}>Cancel</button>
          </div>
        </div>
      )}

      {!adding && (
        <button type="button" onClick={() => setAdding(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: sorted.length > 0 ? '4px' : 0,
          padding: '0 14px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          fontWeight: 700, color: 'var(--body)', backgroundColor: 'transparent',
          border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', minHeight: '36px'
        }}>+ Add Note</button>
      )}
    </div>
  );
}