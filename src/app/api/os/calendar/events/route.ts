import { guardMutation } from '@/lib/owner-access';
import { NextResponse } from 'next/server';
import {
  createCalendarEvent,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar';

export async function POST(request: Request) {
  const denied = guardMutation(request); if (denied) return denied;
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar is not configured.' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();

    const calendarId = typeof body.calendarId === 'string' ? body.calendarId : '';
    const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
    const start = typeof body.start === 'string' ? body.start : '';
    const end = typeof body.end === 'string' ? body.end : '';
    const description = typeof body.description === 'string'
      ? body.description.trim()
      : undefined;

    if (!calendarId || !summary || !start || !end) {
      return NextResponse.json(
        { error: 'calendarId, summary, start and end are required.' },
        { status: 400 },
      );
    }

    const event = await createCalendarEvent({
      calendarId,
      summary,
      start,
      end,
      description,
    });

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create event.' },
      { status: 500 },
    );
  }
}
