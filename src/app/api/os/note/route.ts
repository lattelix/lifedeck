import { NextResponse } from 'next/server';
import { updateVaultFile } from '@/lib/obsidian';

const ALLOWED_PREFIXES = [
  '10_System/Protocols/',
  '10_System/Daily/',
];

function allowed(path: string) {
  return ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const path = typeof body.path === 'string' ? body.path : '';
    const content = typeof body.content === 'string' ? body.content : '';
    const sha = typeof body.sha === 'string' ? body.sha : '';

    if (!path || !content || !sha) {
      return NextResponse.json({ error: 'path, content and sha are required.' }, { status: 400 });
    }

    if (!allowed(path)) {
      return NextResponse.json({ error: 'This note path is not editable from Personal OS.' }, { status: 403 });
    }

    const result = await updateVaultFile(
      path,
      content,
      sha,
      `docs: update ${path.split('/').at(-1)} from LifeDeck`,
    );

    return NextResponse.json({
      ok: true,
      sha: result.content?.sha || sha,
      commit: result.commit?.sha,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save note.' },
      { status: 500 },
    );
  }
}
