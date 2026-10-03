'use client';

import { useState } from 'react';

interface ProtocolEditorProps {
  path: string;
  initialContent: string;
  initialSha: string;
}

export function ProtocolEditor({
  path,
  initialContent,
  initialSha,
}: ProtocolEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [sha, setSha] = useState(initialSha);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function save() {
    setStatus('saving');
    setMessage('');

    try {
      const response = await fetch('/api/os/note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content, sha }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Save failed.');

      setSha(data.sha);
      setStatus('saved');
      setMessage('Saved to Obsidian.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    }
  }

  return (
    <div className="os-editor">
      <div className="os-editor-toolbar">
        <div>
          <strong>Edit source</strong>
          <span>{path}</span>
        </div>
        <button type="button" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </div>

      <textarea
        value={content}
        onChange={event => {
          setContent(event.target.value);
          if (status === 'saved') setStatus('idle');
        }}
        spellCheck={false}
        aria-label="Protocol markdown source"
      />

      {message ? (
        <p className={status === 'error' ? 'os-status error' : 'os-status'}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
