import { requireOwnerPage } from '@/lib/owner-access';
import { checkVaultConnection } from '@/lib/obsidian';
import { VaultNotice } from '@/components/os/VaultNotice';
import { CaptureForm } from '@/components/os/CaptureForm';

export const dynamic = 'force-dynamic';

export default async function CapturePage() {
  await requireOwnerPage();
  const connection = await checkVaultConnection();
  return (
    <div className="os-page">
      <header className="os-page-header">
        <p className="os-eyebrow">Capture</p>
        <h1>Get it out of your head.</h1>
        <p>Raw input is written into Obsidian Inbox. Classification and routing can happen after capture instead of before it.</p>
      </header>
      {connection.ok ? <CaptureForm /> : <VaultNotice problem={connection.error} />}
    </div>
  );
}
