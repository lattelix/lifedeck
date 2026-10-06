import { VaultNotice } from '@/components/os/VaultNotice';
import { checkVaultConnection } from '@/lib/obsidian';
import { getConfiguredCalendars, isGoogleCalendarConfigured } from '@/lib/google-calendar';
import { isObsidianConfigured, vaultRepoName } from '@/lib/obsidian';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const obsidian = isObsidianConfigured();
  const connection = await checkVaultConnection();
  const googleCalendar = isGoogleCalendarConfigured();
  const calendars = getConfiguredCalendars();
  return (
    <div className="os-page">
      <header className="os-page-header"><p className="os-eyebrow">Integrations</p><h1>One operating layer, multiple sources.</h1><p>Keep durable knowledge in Obsidian, time in Calendar, and use LifeDeck as the orchestration surface.</p></header>
      <section className="os-integration-grid">
        <Integration title="Obsidian" subtitle={vaultRepoName()} status={connection.ok ? 'Чтение проверено' : obsidian ? 'Ошибка доступа' : 'Нужен токен'} description="Проверяется реальное чтение GitHub Contents API токеном сайта. Запись проверяется отдельно при сохранении; успешное чтение не подтверждает право записи." />
        <Integration title="Google Calendar" subtitle={`${calendars.length} configured calendar${calendars.length === 1 ? '' : 's'}`} status={googleCalendar ? 'Ключи заданы — доступ не проверен' : 'Не настроен'} description="Server-side OAuth refresh-token connector. Personal OS can read the next seven days and create new time blocks." />
        <Integration title="GitHub" subtitle="Activity source" status="Адаптер доступен" description="Existing public activity connector remains available for Review and the public profile." />
        <Integration title="LeetCode / Codewars" subtitle="Activity sources" status="Адаптер доступен" description="Existing source adapters remain part of the activity layer rather than becoming Personal OS storage." />
      </section>
      {!connection.ok ? <VaultNotice problem={connection.error} /> : null}
      <section className="os-card">
        <h2>Проверка и настройка</h2>
        <p>При ошибке доступа: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → токен LifeDeck. Выбери obsidian и Contents: Read and write. При замене токена обнови GITHUB_OBSIDIAN_TOKEN в Vercel / Production и выполни Redeploy.</p>
        <p>Проверка повторяется при обновлении этой страницы. Секреты здесь не отображаются.</p>
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
function Integration({ title, subtitle, status, description }: { title: string; subtitle: string; status: string; description: string }) {
  return <article className="os-card os-integration-card"><div className="os-section-heading"><div><p className="os-eyebrow">{subtitle}</p><h2>{title}</h2></div><span className="os-chip">{status}</span></div><p>{description}</p></article>;
}
