import { VaultNotice } from '@/components/os/VaultNotice';
import { vaultProblem } from '@/lib/obsidian';
import { MarkdownView } from '@/components/os/MarkdownView';
import { ProtocolEditor } from '@/components/os/ProtocolEditor';
import { getVaultFile, isObsidianConfigured, parseNote } from '@/lib/obsidian';

export const dynamic = 'force-dynamic';
const UNIVERSAL = '10_System/Protocols/Universal Daily Protocol.md';
const SPEC = '10_System/Protocols/Protocol Object Spec.md';

export default async function ProtocolsPage() {
  if (!isObsidianConfigured()) return <NotConfigured />;
  const [protocolResult, specResult] = await Promise.allSettled([getVaultFile(UNIVERSAL), getVaultFile(SPEC)]);
  const protocol = protocolResult.status === 'fulfilled' ? protocolResult.value : null;
  const spec = specResult.status === 'fulfilled' ? specResult.value : null;
  return (
    <div className="os-page">
      <header className="os-page-header">
        <p className="os-eyebrow">Protocols</p>
        <h1>Rules that still work when motivation does not.</h1>
        <p>The vault remains the source of truth. Editing here writes the same Markdown back to Obsidian through GitHub.</p>
      </header>
      {protocol ? (
        <>
          <section className="os-card">
            <div className="os-section-heading">
              <div><p className="os-eyebrow">Active · v0.1</p><h2>Universal Daily Protocol</h2></div>
              <span className="os-chip">source of truth</span>
            </div>
            <MarkdownView markdown={parseNote(protocol.content).body} />
          </section>
          <ProtocolEditor path={protocol.path} initialContent={protocol.content} initialSha={protocol.sha} />
        </>
      ) : (
        <VaultNotice problem={vaultProblem(protocolResult.status === 'rejected' ? protocolResult.reason : null)} title="Протокол не загружен" />
      )}
      {spec ? (
        <details className="os-card os-details"><summary>Protocol Object Spec</summary><MarkdownView markdown={parseNote(spec.content).body} /></details>
      ) : null}
    </div>
  );
}
function NotConfigured() {
  return <div className="os-page"><header className="os-page-header"><p className="os-eyebrow">Protocols</p><h1>Vault connector required</h1><p>Set <code>GITHUB_OBSIDIAN_TOKEN</code> on the server first.</p></header></div>;
}
