'use client';

import { useState } from 'react';

export function CaptureForm() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit() {
    if (!text.trim()) return;
    setStatus('saving');
    setMessage('');

    try {
      const response = await fetch('/api/os/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Capture failed.');

      setText('');
      setStatus('saved');
      setMessage(`Saved to ${data.path}`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Capture failed.');
    }
  }

  return (
    <section className="os-card os-capture-card">
      <div className="os-section-heading">
        <div>
          <p className="os-eyebrow">Quick capture</p>
          <h2>Dump it here. Sort it later.</h2>
        </div>
      </div>

      <textarea
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="Что изменилось? Идея, задача, состояние, решение, ссылка…"
        rows={9}
      />

      <div className="os-capture-actions">
        <button type="button" onClick={submit} disabled={!text.trim() || status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save to Inbox'}
        </button>
        {message ? (
          <span className={status === 'error' ? 'os-status error' : 'os-status'}>
            {message}
          </span>
        ) : null}
      </div>
    </section>
  );
}
