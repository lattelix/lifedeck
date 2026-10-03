import Link from 'next/link';
import { CreateDailyButton } from '@/components/os/CreateDailyButton';
import { DailyStateForm } from '@/components/os/DailyStateForm';
import { MarkdownView } from '@/components/os/MarkdownView';
import {
  getVaultFile,
  isObsidianConfigured,
  parseNote,
  todayInOsTimezone,
  vaultRepoName,
} from '@/lib/obsidian';

export const dynamic = 'force-dynamic';

function value(input: unknown) {
  if (Array.isArray(input)) return input.join(', ') || '—';
  if (input === null || input === undefined || input === '') return '—';
  return String(input);
}

export default async function TodayPage() {
  const date = todayInOsTimezone();

  if (!isObsidianConfigured()) {
    return (
      <div className="os-page">
        <header className="os-page-header">
          <p className="os-eyebrow">Today · {date}</p>
          <h1>Connect the vault</h1>
          <p>LifeDeck is ready, but the server still needs access to the private Obsidian repository.</p>
        </header>

        <section className="os-card">
          <h2>Required server variables</h2>
          <ul className="os-plain-list">
            <li><code>GITHUB_OBSIDIAN_TOKEN</code> — fine-grained token with Contents read/write on <code>{vaultRepoName()}</code>.</li>
            <li><code>OBSIDIAN_REPO</code> — optional; defaults to <code>lattelix/obsidian</code>.</li>
            <li><code>OS_USERNAME</code> and <code>OS_PASSWORD</code> — protect <code>/os</code> in production.</li>
          </ul>
        </section>
      </div>
    );
  }

  const dailyPath = `10_System/Daily/${date}.md`;
  const protocolPath = '10_System/Protocols/Universal Daily Protocol.md';

  const [dailyResult, protocolResult] = await Promise.allSettled([
    getVaultFile(dailyPath),
    getVaultFile(protocolPath),
  ]);

  const daily = dailyResult.status === 'fulfilled' ? dailyResult.value : null;
  const protocol = protocolResult.status === 'fulfilled' ? protocolResult.value : null;
  const dailyParsed = daily ? parseNote(daily.content) : null;
  const protocolParsed = protocol ? parseNote(protocol.content) : null;

  return (
    <div className="os-page">
      <header className="os-page-header">
        <p className="os-eyebrow">Today · {date}</p>
        <h1>Run the day, not the whole life.</h1>
        <p>Calendar gives the time. The vault gives the rules. This page brings the current operating state together.</p>
      </header>

      {dailyParsed && daily ? (
        <>
          <section className="os-metric-grid">
            <Metric label="Mode" value={value(dailyParsed.frontmatter.protocol_mode)} />
            <Metric label="Top 1" value={value(dailyParsed.frontmatter.top_1)} />
            <Metric label="Energy" value={value(dailyParsed.frontmatter.energy)} />
            <Metric label="Focus h" value={value(dailyParsed.frontmatter.deep_work_hours)} />
          </section>
          <DailyStateForm
            path={daily.path}
            sha={daily.sha}
            initialMode={String(dailyParsed.frontmatter.protocol_mode || '')}
            initialTop1={String(dailyParsed.frontmatter.top_1 || '')}
            initialEnergy={Number(dailyParsed.frontmatter.energy) || 3}
          />
        </>
      ) : (
        <section className="os-card os-warning">
          <strong>No Daily note for {date}</strong>
          <p>Generate it from the current Obsidian daily template.</p>
          <CreateDailyButton />
        </section>
      )}

      <div className="os-two-column">
        <section className="os-card">
          <div className="os-section-heading">
            <div>
              <p className="os-eyebrow">Execution</p>
              <h2>Today note</h2>
            </div>
            <Link href="/os/capture">Capture something →</Link>
          </div>
          {dailyParsed ? (
            <MarkdownView markdown={dailyParsed.body} />
          ) : (
            <p className="os-muted">Create the Daily note above to start today&apos;s operating loop.</p>
          )}
        </section>

        <section className="os-card">
          <div className="os-section-heading">
            <div>
              <p className="os-eyebrow">Protocol</p>
              <h2>Universal Daily Protocol</h2>
            </div>
            <Link href="/os/protocols">Open editor →</Link>
          </div>
          {protocolParsed ? (
            <MarkdownView markdown={protocolParsed.body.split('\n# 2. Core Daily Sequence')[0]} />
          ) : (
            <p className="os-muted">Protocol could not be loaded from the vault.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="os-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
