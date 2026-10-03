import { NextResponse } from 'next/server';
import {
  createVaultFile,
  getVaultFile,
  todayInOsTimezone,
} from '@/lib/obsidian';

const TEMPLATE_PATH = '10_System/Templates/Template_Daily.md';

function renderTemplate(template: string, date: string) {
  return template
    .replaceAll('{{date:YYYY-MM-DD}}', date)
    .replaceAll('{{date:YYYY-MM-DD dddd}}', date);
}

export async function POST() {
  try {
    const date = todayInOsTimezone();
    const path = `10_System/Daily/${date}.md`;

    try {
      const existing = await getVaultFile(path);
      return NextResponse.json({
        ok: true,
        created: false,
        path: existing.path,
      });
    } catch {
      // Missing daily note: continue and create from the vault template.
    }

    const template = await getVaultFile(TEMPLATE_PATH);
    const content = renderTemplate(template.content, date);

    const result = await createVaultFile(
      path,
      content,
      `daily: create ${date} from LifeDeck`,
    );

    return NextResponse.json({
      ok: true,
      created: true,
      path,
      commit: result.commit?.sha,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create Daily note.' },
      { status: 500 },
    );
  }
}
