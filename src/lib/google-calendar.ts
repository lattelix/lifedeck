import 'server-only';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface CalendarSource {
  id: string;
  label: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  calendarLabel: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  start: string;
  end: string;
  allDay: boolean;
}

interface GoogleEvent {
  id?: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

function credentials() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function isGoogleCalendarConfigured() {
  return credentials() !== null;
}

export function getConfiguredCalendars(): CalendarSource[] {
  const raw = process.env.GOOGLE_CALENDAR_IDS?.trim();
  if (!raw) return [{ id: 'primary', label: 'Primary' }];

  const result: CalendarSource[] = [];

  for (const entry of raw.split(';')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf('=');
    if (separator < 0) {
      result.push({ id: trimmed, label: trimmed });
      continue;
    }

    const label = trimmed.slice(0, separator).trim();
    const id = trimmed.slice(separator + 1).trim();
    if (id) result.push({ id, label: label || id });
  }

  return result.length > 0 ? result : [{ id: 'primary', label: 'Primary' }];
}

async function getAccessToken() {
  const config = credentials();
  if (!config) {
    throw new Error(
      'Google Calendar is not configured. Set GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET and GOOGLE_CALENDAR_REFRESH_TOKEN.',
    );
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Google OAuth refresh failed (${response.status}): ${await response.text()}`,
    );
  }

  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error('Google OAuth did not return an access token.');
  return data.access_token;
}

async function calendarFetch(
  calendarId: string,
  path: string,
  init?: RequestInit,
) {
  const accessToken = await getAccessToken();
  const url = `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}${path}`;

  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google Calendar request failed (${response.status}): ${await response.text()}`,
    );
  }

  return response;
}

function normalizeEvent(
  source: CalendarSource,
  event: GoogleEvent,
): CalendarEvent | null {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;

  if (!event.id || !start || !end) return null;

  return {
    id: event.id,
    calendarId: source.id,
    calendarLabel: source.label,
    summary: event.summary || '(Untitled event)',
    description: event.description,
    htmlLink: event.htmlLink,
    start,
    end,
    allDay: Boolean(event.start?.date && !event.start?.dateTime),
  };
}

export async function listCalendarEvents(
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEvent[]> {
  const sources = getConfiguredCalendars();

  const collections = await Promise.all(
    sources.map(async source => {
      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      });

      const response = await calendarFetch(
        source.id,
        `/events?${params.toString()}`,
      );
      const data = await response.json() as { items?: GoogleEvent[] };

      return (data.items || [])
        .map(event => normalizeEvent(source, event))
        .filter((event): event is CalendarEvent => event !== null);
    }),
  );

  return collections
    .flat()
    .sort((a, b) => a.start.localeCompare(b.start));
}

export async function createCalendarEvent(input: {
  calendarId: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}) {
  const allowed = getConfiguredCalendars();
  const source = allowed.find(calendar => calendar.id === input.calendarId);

  if (!source) {
    throw new Error('Selected calendar is not configured for Personal OS.');
  }

  const start = new Date(input.start);
  const end = new Date(input.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid event start or end time.');
  }
  if (end <= start) throw new Error('Event end must be after its start.');

  const timeZone = process.env.OS_TIME_ZONE || 'Europe/Moscow';
  const response = await calendarFetch(source.id, '/events', {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description || undefined,
      start: {
        dateTime: start.toISOString(),
        timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone,
      },
    }),
  });

  return response.json();
}
