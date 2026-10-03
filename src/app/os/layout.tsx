import type { Metadata } from 'next';
import { OsNav } from '@/components/os/OsNav';

export const metadata: Metadata = {
  title: 'Personal OS — LifeDeck',
  description: 'Private operating interface for protocols, capture and review.',
  robots: { index: false, follow: false },
  manifest: '/os/manifest.webmanifest',
};

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="os-shell">
      <OsNav />
      <main className="os-main">{children}</main>
    </div>
  );
}
