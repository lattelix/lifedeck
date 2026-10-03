import { MarkdownView } from '@/components/os/MarkdownView';
import {
  getVaultFile,
  isObsidianConfigured,
  listVaultDirectory,
  parseNote,
} from '@/lib/obsidian';

export const dynamic = 'force-dynamic';

const IMPORTANT_NOTES = [
  {
    path: '10_System/Personal OS.md',
    label: 'Personal OS',
    description: 'System architecture and operating model.',
  },
  {
    path: '10_System/LifeDeck Web Interface Architecture.md',
    label: 'LifeDeck Web Interface Architecture',
    description: 'Web/PWA architecture and repository boundaries.',
  },
  {
    path: '20_PARA/Areas/Health/Health Area.md',
    label: 'Health Area',
    description: 'Health rules, working assumptions and links.',
  },
  {
    path: '10_System/Protocols/Protocol Object Spec.md',
    label: 'Protocol Object Spec',
    description: 'Shared schema for executable protocols.',
  },
];

export default async function KnowledgePage() {
  if (!isObsidianConfigured()) {
    return (
      <div className="os-page">
        <header className="os-page-header">
          <p className="os-eyebrow">Knowledge</p>
          <h1>Vault connector required</h1>
          <p>Configure the private Obsidian connector to browse durable context here.</p>
        </header>
      </div>
    );
  }

  const [notes, projects, areas] = await Promise.all([
    Promise.all(
      IMPORTANT_NOTES.map(async item => {
        try {
          const file = await getVaultFile(item.path);
          return { ...item, file, parsed: parseNote(file.content) };
        } catch {
          return { ...item, file: null, parsed: null };
        }
      }),
    ),
    listVaultDirectory('20_PARA/Projects'),
    listVaultDirectory('20_PARA/Areas'),
  ]);

  return (
    <div className="os-page">
      <header className="os-page-header">
        <p className="os-eyebrow">Knowledge</p>
        <h1>The vault without opening the vault.</h1>
        <p>Read the durable context that drives Personal OS while Obsidian remains the canonical human-readable store.</p>
      </header>

      <section className="os-two-column">
        <article className="os-card">
          <div className="os-section-heading">
            <div>
              <p className="os-eyebrow">PARA</p>
              <h2>Projects</h2>
            </div>
            <span className="os-chip">{projects.length}</span>
          </div>
          <ul className="os-resource-list">
            {projects.map(item => (
              <li key={item.path}>
                <strong>{item.name.replace(/\.md$/, '')}</strong>
                <span>{item.type}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="os-card">
          <div className="os-section-heading">
            <div>
              <p className="os-eyebrow">PARA</p>
              <h2>Areas</h2>
            </div>
            <span className="os-chip">{areas.length}</span>
          </div>
          <ul className="os-resource-list">
            {areas.map(item => (
              <li key={item.path}>
                <strong>{item.name.replace(/\.md$/, '')}</strong>
                <span>{item.type}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="os-knowledge-notes">
        {notes.map(note => (
          <details className="os-card os-details" key={note.path}>
            <summary>
              <span>
                <strong>{note.label}</strong>
                <small>{note.description}</small>
              </span>
              <span className="os-chip">{note.file ? 'loaded' : 'unavailable'}</span>
            </summary>
            {note.parsed ? (
              <MarkdownView markdown={note.parsed.body} />
            ) : (
              <p className="os-muted">This note could not be loaded.</p>
            )}
          </details>
        ))}
      </section>
    </div>
  );
}
