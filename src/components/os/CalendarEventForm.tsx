'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface CalendarOption {
  id: string;
  label: string;
}

interface CalendarEventFormProps {
  calendars: CalendarOption[];
}

function localDateTimeValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CalendarEventForm({ calendars }: CalendarEventFormProps) {
  const router = useRouter();
  const defaults = useMemo(() => {
    const start = new Date();
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      start: localDateTimeValue(start),
      end: localDateTimeValue(end),
    };
  }, []);

  const [calendarId, setCalendarId] = useState(calendars[0]?.id || 'primary');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function createEvent() {
    if (!summary.trim()) return;

    setStatus('saving');
    setMessage('');

    try {
      const response = await fetch('/api/os/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId,
          summary,
          description,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create event.');

      setSummary('');
      setDescription('');
      setStatus('saved');
      setMessage('Event created.');
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to create event.');
    }
  }

  return (
    <section className="os-card">
      <div className="os-section-heading">
        <div>
          <p className="os-eyebrow">Write</p>
          <h2>Add calendar block</h2>
        </div>
      </div>

      <div className="os-form-grid">
        <label className="os-field os-field-wide">
          <span>Title</span>
          <input
            value={summary}
            onChange={event => setSummary(event.target.value)}
            placeholder="Deep work · Personal OS"
          />
        </label>

        <label className="os-field">
          <span>Calendar</span>
          <select value={calendarId} onChange={event => setCalendarId(event.target.value)}>
            {calendars.map(calendar => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.label}
              </option>
            ))}
          </select>
        </label>

        <label className="os-field">
          <span>Start</span>
          <input
            type="datetime-local"
            value={start}
            onChange={event => setStart(event.target.value)}
          />
        </label>

        <label className="os-field">
          <span>End</span>
          <input
            type="datetime-local"
            value={end}
            onChange={event => setEnd(event.target.value)}
          />
        </label>

        <label className="os-field os-field-wide">
          <span>Description</span>
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            rows={3}
            placeholder="Optional context"
          />
        </label>
      </div>

      <div className="os-inline-action">
        <button
          type="button"
          onClick={createEvent}
          disabled={!summary.trim() || status === 'saving'}
        >
          {status === 'saving' ? 'Creating…' : 'Create event'}
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
