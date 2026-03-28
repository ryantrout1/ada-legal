import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Bold, Italic, Underline, Link, Heading1, List, AlignLeft, ChevronDown } from 'lucide-react';

function ToolbarButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      aria-label={label}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: '6px',
        border: 'none', cursor: 'pointer',
        backgroundColor: active ? '#E2E8F0' : 'transparent',
        color: active ? 'var(--slate-900)' : '#64748B',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Icon size={16} />
    </button>
  );
}

function InsertVariableDropdown({ variables, onInsert }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(!open); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px', borderRadius: '6px', height: '32px',
          border: '1px solid var(--slate-200)', cursor: 'pointer',
          backgroundColor: open ? '#F1F5F9' : 'white',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600,
          color: '#C2410C',
        }}
      >
        {'{{ }}'} Insert Variable <ChevronDown size={12} />
      </button>
      {open && variables.length > 0 && (
        <div style={{
          position: 'absolute', top: '36px', left: 0, zIndex: 20,
          backgroundColor: 'white', border: '1px solid var(--slate-200)',
          borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: '200px', maxHeight: '240px', overflowY: 'auto',
          padding: '4px',
        }}>
          {variables.map(v => (
            <button
              key={v}
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                onInsert(v);
                setOpen(false);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', border: 'none', borderRadius: '6px',
                cursor: 'pointer', backgroundColor: 'transparent',
                fontFamily: 'monospace', fontSize: '0.75rem', color: '#C2410C',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF1EC'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {'{{' + v + '}}'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RichEmailEditor({ value, onChange, variables }) {
  const editorRef = useRef(null);
  const isInitialMount = useRef(true);
  const lastHtml = useRef(value);

  // Initialize editor content on mount or when value changes externally
  useEffect(() => {
    if (editorRef.current && isInitialMount.current) {
      editorRef.current.innerHTML = value || '';
      isInitialMount.current = false;
    }
  }, [value]);

  // Sync if value changes from outside (e.g. template switch)
  useEffect(() => {
    if (editorRef.current && value !== lastHtml.current) {
      const sel = window.getSelection();
      const hadFocus = document.activeElement === editorRef.current;
      editorRef.current.innerHTML = value || '';
      lastHtml.current = value;
      if (hadFocus) editorRef.current.focus();
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html !== lastHtml.current) {
      lastHtml.current = html;
      onChange(html);
    }
  }, [onChange]);

  const exec = useCallback((cmd, val) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val || null);
    emitChange();
  }, [emitChange]);

  const handleInsertVariable = useCallback((varName) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const tag = `{{${varName}}}`;
    // Insert at cursor via insertHTML
    document.execCommand('insertHTML', false,
      `<span style="background:#FEF1EC;color:#C2410C;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.8125rem;font-weight:600;" contenteditable="true">${tag}</span>&nbsp;`
    );
    emitChange();
  }, [emitChange]);

  const handleInsertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  }, [exec]);

  return (
    <div style={{
      border: '2px solid var(--slate-200)', borderRadius: '8px',
      overflow: 'hidden', backgroundColor: 'white',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap',
        padding: '6px 8px', borderBottom: '1px solid var(--slate-200)',
        backgroundColor: '#FAFAFA',
      }}>
        <ToolbarButton icon={Bold} label="Bold" onClick={() => exec('bold')} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => exec('italic')} />
        <ToolbarButton icon={Underline} label="Underline" onClick={() => exec('underline')} />
        <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0', margin: '0 4px' }} />
        <ToolbarButton icon={Link} label="Insert Link" onClick={handleInsertLink} />
        <ToolbarButton icon={Heading1} label="Heading" onClick={() => exec('formatBlock', 'h2')} />
        <ToolbarButton icon={AlignLeft} label="Paragraph" onClick={() => exec('formatBlock', 'p')} />
        <ToolbarButton icon={List} label="Bullet List" onClick={() => exec('insertUnorderedList')} />
        <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0', margin: '0 4px' }} />
        <InsertVariableDropdown variables={variables} onInsert={handleInsertVariable} />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onBlur={emitChange}
        style={{
          minHeight: '400px', padding: '16px',
          fontFamily: 'Manrope, Arial, sans-serif', fontSize: '0.9375rem',
          lineHeight: 1.7, color: 'var(--slate-800)',
          outline: 'none', overflowY: 'auto', maxHeight: '600px',
        }}
        role="textbox"
        aria-multiline="true"
        aria-label="Email body editor"
      />
    </div>
  );
}