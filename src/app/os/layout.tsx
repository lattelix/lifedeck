import { SessionGuard } from '@/components/os/SessionGuard';
import { requireOwnerPage } from '@/lib/owner-access';
import './repair.css';
import './theme.css';
import type { Metadata } from 'next';
import { OsNav } from '@/components/os/OsNav';

export const metadata: Metadata = {
  title: 'Personal OS — LifeDeck',
  description: 'Private operating interface for protocols, capture and review.',
  robots: { index: false, follow: false },
  manifest: '/os/manifest.webmanifest',
};

export default async function OsLayout({ children }: { children: React.ReactNode }) {
  await requireOwnerPage();
  return (
    <div className="os-shell">
      <SessionGuard />
      <OsNav />
      <main className="os-main">{children}</main>
    </div>
  );
}
