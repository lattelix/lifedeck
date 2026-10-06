import { vaultProblem } from '@/lib/obsidian';
import { NextResponse } from 'next/server';
import {
  getVaultFile,
  patchFrontmatter,
  updateVaultFile,
} from '@/lib/obsidian';

const MODES = new Set(['Full', 'Reduced', 'Minimum', 'Recovery', '']);

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const path = typeof body.path === 'string' ? body.path : '';
    const sha = typeof body.sha === 'string' ? body.sha : '';
    const protocolMode = typeof body.protocolMode === 'string' ? body.protocolMode : '';
    const top1 = typeof body.top1 === 'string' ? body.top1.trim() : '';
    const energy = Number(body.energy);

    if (!/^10_System\/Daily\/\d{4}-\d{2}-\d{2}\.md$/.test(path)) {
      return NextResponse.json({ error: 'Invalid Daily note path.' }, { status: 400 });
    }

    if (!sha) {
      return NextResponse.json({ error: 'Current note SHA is required.' }, { status: 400 });
    }

    if (!MODES.has(protocolMode)) {
      return NextResponse.json({ error: 'Invalid protocol mode.' }, { status: 400 });
    }

    if (!Number.isInteger(energy) || energy < 1 || energy > 5) {
      return NextResponse.json({ error: 'Energy must be an integer from 1 to 5.' }, { status: 400 });
    }

    const current = await getVaultFile(path);
    if (current.sha !== sha) {
      return NextResponse.json(
        { error: 'The Daily note changed in Obsidian. Refresh before saving.' },
        { status: 409 },
      );
    }

    const content = patchFrontmatter(current.content, {
      protocol_mode: protocolMode,
      top_1: top1,
      energy,
    });

    const result = await updateVaultFile(
      path,
      content,
      current.sha,
      `daily: update state from LifeDeck`,
    );

    return NextResponse.json({
      ok: true,
      sha: result.content?.sha || current.sha,
      commit: result.commit?.sha,
    });
  } catch (error) {
    return NextResponse.json(
      { error: vaultProblem(error).message, code: vaultProblem(error).code },
      { status: vaultProblem(error).status },
    );
  }
}
