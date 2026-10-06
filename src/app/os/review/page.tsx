import { requireOwnerPage } from '@/lib/owner-access';
import { VaultNotice } from '@/components/os/VaultNotice';
import { checkVaultConnection, readVault } from '@/lib/obsidian';
import { MarkdownView } from '@/components/os/MarkdownView';
import { getVaultFile, isObsidianConfigured, listVaultDirectory, parseNote } from '@/lib/obsidian';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  await requireOwnerPage();
  if (!isObsidianConfigured()) {
    return <div className="os-page"><header className="os-page-header"><p className="os-eyebrow">Review</p><h1>Vault connector required</h1><p>Set <code>GITHUB_OBSIDIAN_TOKEN</code> to load Daily notes.</p></header></div>;
  }
  const connection = await checkVaultConnection();
  if (!connection.ok) return <VaultNotice problem={connection.error} />;
  const directory = await readVault(() => listVaultDirectory('10_System/Daily'));
  if (!directory.ok) return <VaultNotice problem={directory.error} title="Не удалось загрузить Daily" />;
  const recent = directory.data.filter(item => item.type === 'file' && /^\d{4}-\d{2}-\d{2}\.md$/.test(item.name)).sort((a, b) => b.name.localeCompare(a.name)).slice(0, 7);
  const notes = await Promise.all(recent.map(async entry => ({ entry, result: await readVault(() => getVaultFile(entry.path)) })));
  return (
    <div className="os-page">
      <header className="os-page-header"><p className="os-eyebrow">Review</p><h1>Use evidence, not vibes.</h1><p>Recent Daily notes become the factual layer for weekly protocol adjustments.</p></header>
      <section className="os-review-grid">
        {notes.length === 0 ? <p className="os-muted">Пока нет дневных заметок. Создай первую в Today.</p> : null}
        {notes.map(({ entry, result }) => {
          if (!result.ok) return <VaultNotice key={entry.path} problem={result.error} title={entry.name} />;
          const file = result.data;
          const parsed = parseNote(file.content);
          return (
            <article className="os-card" key={file.path}>
              <div className="os-section-heading">
                <div><p className="os-eyebrow">{file.name.replace('.md', '')}</p><h2>{String(parsed.frontmatter.top_1 || 'No Top 1 recorded')}</h2></div>
                <span className="os-chip">{String(parsed.frontmatter.protocol_mode || '—')}</span>
              </div>
              <div className="os-mini-metrics">
                <span>Energy <strong>{String(parsed.frontmatter.energy ?? '—')}</strong></span>
                <span>Focus <strong>{String(parsed.frontmatter.deep_work_hours ?? '—')}h</strong></span>
                <span>Lost <strong>{String(parsed.frontmatter.time_lost ?? '—')}h</strong></span>
              </div>
              <details className="os-inline-details"><summary>Open note</summary><MarkdownView markdown={parsed.body} /></details>
            </article>
          );
        })}
      </section>
    </div>
  );
}
