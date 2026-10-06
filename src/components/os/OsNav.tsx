'use client';

import Link from 'next/link';
import { ThemeSwitcher } from './ThemeSwitcher';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/os', label: 'Today' },
  { href: '/os/calendar', label: 'Calendar' },
  { href: '/os/protocols', label: 'Protocols' },
  { href: '/os/capture', label: 'Capture' },
  { href: '/os/review', label: 'Review' },
  { href: '/os/knowledge', label: 'Knowledge' },
  { href: '/os/integrations', label: 'Integrations' },
];

export function OsNav() {
  const pathname = usePathname();

  return (
    <aside className="os-sidebar">
      <Link className="os-brand" href="/os">
        <span className="os-brand-mark">OS</span>
        <span>
          <strong>Personal OS</strong>
          <small>LifeDeck</small>
        </span>
      </Link>

      <nav className="os-nav" aria-label="Personal OS">
        {items.map(item => {
          const active = item.href === '/os'
            ? pathname === '/os'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'active' : ''}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ThemeSwitcher />

      <div className="os-sidebar-footer">
        <Link href="/">Public profile ↗</Link>
        <span>Private workspace</span>
      </div>
    </aside>
  );
}
