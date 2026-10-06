import { vaultProblem } from '@/lib/obsidian';
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
    } catch (error) {
      // Only a verified missing path permits creation. Never write after a failed auth/network read.
      if (vaultProblem(error).code !== 'not_found') throw error;
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
      { error: vaultProblem(error).message, code: vaultProblem(error).code },
      { status: vaultProblem(error).status },
    );
  }
}
