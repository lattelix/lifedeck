import { NextResponse } from 'next/server';
import { createVaultFile, todayInOsTimezone } from '@/lib/obsidian';

function safeStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'Capture text is required.' }, { status: 400 });
    }

    const date = todayInOsTimezone();
    const path = `00_Inbox/Capture ${date} ${safeStamp()}.md`;
    const content = `---
type: inbox
status: unprocessed
date: ${date}
source: lifedeck
tags:
  - capture
---

# Capture

${text}
`;

    const result = await createVaultFile(path, content, 'capture: add note from LifeDeck');

    return NextResponse.json({
      ok: true,
      path,
      commit: result.commit?.sha,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create capture.' },
      { status: 500 },
    );
  }
}
