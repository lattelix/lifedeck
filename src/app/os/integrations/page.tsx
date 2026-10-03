import {
  getConfiguredCalendars,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar';
import { isObsidianConfigured, vaultRepoName } from '@/lib/obsidian';

export const dynamic = 'force-dynamic';

export default function IntegrationsPage() {
  const obsidian = isObsidianConfigured();
  const googleCalendar = isGoogleCalendarConfigured();
  const calendars = getConfiguredCalendars();

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
          subtitle={`${calendars.length} configured calendar${calendars.length === 1 ? '' : 's'}`}
          status={googleCalendar ? 'connected' : 'needs setup'}
          description="Server-side OAuth refresh-token connector. Personal OS can read the next seven days and create new time blocks."
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
          <li><code>GOOGLE_CALENDAR_CLIENT_ID</code>, <code>GOOGLE_CALENDAR_CLIENT_SECRET</code> and <code>GOOGLE_CALENDAR_REFRESH_TOKEN</code> enable Calendar read/write.</li>
          <li><code>GOOGLE_CALENDAR_IDS</code> limits Calendar access to an explicit semicolon-separated set of <code>label=id</code> entries. If omitted, the connector uses <code>primary</code>.</li>
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
