import { CalendarEventForm } from '@/components/os/CalendarEventForm';
import {
  getConfiguredCalendars,
  isGoogleCalendarConfigured,
  listCalendarEvents,
} from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

function formatDate(value: string, allDay: boolean) {
  if (allDay) {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeZone: process.env.OS_TIME_ZONE || 'Europe/Moscow',
    }).format(new Date(`${value}T12:00:00Z`));
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: process.env.OS_TIME_ZONE || 'Europe/Moscow',
  }).format(new Date(value));
}

export default async function CalendarPage() {
  const calendars = getConfiguredCalendars();
  const configured = isGoogleCalendarConfigured();

  let events: Awaited<ReturnType<typeof listCalendarEvents>> = [];
  let error = '';

  if (configured) {
    try {
      const start = new Date();
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      events = await listCalendarEvents(start, end);
    } catch (value) {
      error = value instanceof Error ? value.message : 'Calendar sync failed.';
    }
  }

  return (
    <div className="os-page">
      <header className="os-page-header">
        <p className="os-eyebrow">Calendar</p>
        <h1>Time is the execution surface.</h1>
        <p>LifeDeck reads the next seven days and can write concrete blocks back to the calendars you explicitly configure.</p>
      </header>

      {!configured ? (
        <section className="os-card os-warning">
          <h2>Google Calendar needs credentials</h2>
          <p>Set the Calendar OAuth environment variables listed in Integrations. The rest of Personal OS keeps working without them.</p>
        </section>
      ) : null}

      {error ? (
        <section className="os-card os-warning">
          <h2>Calendar sync failed</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {configured ? <CalendarEventForm calendars={calendars} /> : null}

      <section className="os-card">
        <div className="os-section-heading">
          <div>
            <p className="os-eyebrow">Next 7 days</p>
            <h2>Execution timeline</h2>
          </div>
          <span className="os-chip">{events.length} events</span>
        </div>

        {events.length > 0 ? (
          <ol className="os-calendar-list">
            {events.map(event => (
              <li key={`${event.calendarId}-${event.id}`} className="os-calendar-event">
                <div className="os-calendar-time">
                  <strong>{formatDate(event.start, event.allDay)}</strong>
                  {!event.allDay ? <span>→ {formatDate(event.end, false)}</span> : null}
                </div>
                <div className="os-calendar-copy">
                  <span className="os-chip">{event.calendarLabel}</span>
                  <h3>{event.summary}</h3>
                  {event.description ? <p>{event.description}</p> : null}
                </div>
                {event.htmlLink ? (
                  <a href={event.htmlLink} target="_blank" rel="noreferrer">
                    Open ↗
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="os-muted">
            {configured
              ? 'No events found in the next seven days.'
              : 'Connect Google Calendar to populate the timeline.'}
          </p>
        )}
      </section>
    </div>
  );
}
