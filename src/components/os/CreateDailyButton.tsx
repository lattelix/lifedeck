'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateDailyButton() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'creating' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function createDaily() {
    setStatus('creating');
    setMessage('');

    try {
      const response = await fetch('/api/os/daily', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create Daily note.');

      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to create Daily note.');
    }
  }

  return (
    <div className="os-inline-action">
      <button type="button" onClick={createDaily} disabled={status === 'creating'}>
        {status === 'creating' ? 'Creating…' : 'Create today note'}
      </button>
      {message ? <span className="os-status error">{message}</span> : null}
    </div>
  );
}
