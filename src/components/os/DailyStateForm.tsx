'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DailyStateFormProps {
  path: string;
  sha: string;
  initialMode: string;
  initialTop1: string;
  initialEnergy: number;
}

const MODES = ['', 'Full', 'Reduced', 'Minimum', 'Recovery'];

export function DailyStateForm({
  path,
  sha: initialSha,
  initialMode,
  initialTop1,
  initialEnergy,
}: DailyStateFormProps) {
  const router = useRouter();
  const [sha, setSha] = useState(initialSha);
  const [protocolMode, setProtocolMode] = useState(initialMode);
  const [top1, setTop1] = useState(initialTop1);
  const [energy, setEnergy] = useState(initialEnergy);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function save() {
    setStatus('saving');
    setMessage('');

    try {
      const response = await fetch('/api/os/daily/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          sha,
          protocolMode,
          top1,
          energy,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update Daily state.');

      setSha(data.sha);
      setStatus('saved');
      setMessage('Daily updated.');
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to update Daily state.');
    }
  }

  return (
    <section className="os-card">
      <div className="os-section-heading">
        <div>
          <p className="os-eyebrow">Boot</p>
          <h2>Set today&apos;s operating state</h2>
        </div>
      </div>

      <div className="os-form-grid">
        <label className="os-field">
          <span>Mode</span>
          <select
            value={protocolMode}
            onChange={event => setProtocolMode(event.target.value)}
          >
            {MODES.map(mode => (
              <option value={mode} key={mode || 'unset'}>
                {mode || 'Not chosen'}
              </option>
            ))}
          </select>
        </label>

        <label className="os-field">
          <span>Energy · {energy}/5</span>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={energy}
            onChange={event => setEnergy(Number(event.target.value))}
          />
        </label>

        <label className="os-field os-field-wide">
          <span>Top 1</span>
          <input
            value={top1}
            onChange={event => setTop1(event.target.value)}
            placeholder="One concrete outcome that makes today count"
          />
        </label>
      </div>

      <div className="os-inline-action">
        <button type="button" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save state'}
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
