import { isObsidianConfigured, vaultRepoName } from '@/lib/obsidian';

export const dynamic = 'force-dynamic';

export default function IntegrationsPage() {
  const obsidian = isObsidianConfigured();

  return (
    <div className="os-page">
      <header className="os-page-header">
        <p className="os-eyebrow">Integrations</p>
        <h1>One operating layer, multiple sources.</h1>
        <p>Keep durable knowledge in Obsidian, time in Calendar, and use LifeDeck as the orchestration surface.</p>
      </header>

      <section className="os-integration-grid">
        <Integration
          title="Obsidian"
          subtitle={vaultRepoName()}
          status={obsidian ? 'connected' : 'needs setup'}
          description="Protocols, Daily notes, Inbox and durable context. Read/write happens server-side through GitHub."
        />
        <Integration
          title="Google Calendar"
          subtitle="Calendar compiler"
          status="next"
          description="The existing calendar adapter is still mock-only. OAuth read/write is the next runtime integration."
        />
        <Integration
          title="GitHub"
          subtitle="Activity source"
          status="connected"
          description="Existing public activity connector remains available for Review and the public profile."
        />
        <Integration
          title="LeetCode / Codewars"
          subtitle="Activity sources"
          status="connected"
          description="Existing source adapters remain part of the activity layer rather than becoming Personal OS storage."
        />
      </section>

      <section className="os-card">
        <h2>Production environment</h2>
        <ul className="os-plain-list">
          <li><code>OS_USERNAME</code> + <code>OS_PASSWORD</code> protect the private workspace.</li>
          <li><code>GITHUB_OBSIDIAN_TOKEN</code> reads and writes the private vault.</li>
          <li><code>OBSIDIAN_REPO</code> optionally overrides <code>lattelix/obsidian</code>.</li>
          <li><code>OS_TIME_ZONE</code> optionally overrides <code>Europe/Moscow</code>.</li>
        </ul>
      </section>
    </div>
  );
}

function Integration({
  title,
  subtitle,
  status,
  description,
}: {
  title: string;
  subtitle: string;
  status: string;
  description: string;
}) {
  return (
    <article className="os-card os-integration-card">
      <div className="os-section-heading">
        <div>
          <p className="os-eyebrow">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <span className="os-chip">{status}</span>
      </div>
      <p>{description}</p>
    </article>
  );
}
