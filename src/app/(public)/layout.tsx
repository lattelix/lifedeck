import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicTheme } from '@/components/public/PublicTheme';
import './site.css';
export const metadata: Metadata = {
  title: { default: 'LifeDeck Personal OS — свой порядок дня', template: '%s · LifeDeck Personal OS' },
  description: 'Личное рабочее пространство: план дня, протоколы, заметки Obsidian и Google Calendar.',
  openGraph: { title: 'LifeDeck Personal OS', description: 'Свой порядок дня. Без лишнего шума.', type: 'website', locale: 'ru_RU' },
  twitter: { card: 'summary', title: 'LifeDeck Personal OS', description: 'Личное пространство для Today, Capture и Review.' },
};
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="site-shell">
    <a className="site-skip" href="#content">Перейти к содержимому</a>
    <header className="site-header"><Link className="site-brand" href="/about"><span className="site-mark" aria-hidden="true">LD</span><span>LifeDeck<small>Personal OS</small></span></Link><nav aria-label="О проекте"><Link href="/about#how">Как работает</Link><Link href="/privacy">Конфиденциальность</Link></nav><div className="site-header-actions"><PublicTheme/><Link className="site-button small" href="/login">Войти <span aria-hidden="true">↗</span></Link></div></header>
    <main id="content">{children}</main>
    <footer className="site-footer"><div><Link className="site-brand" href="/about">LifeDeck Personal OS</Link><p>Личный проект lattelix. Порядок, который остаётся твоим.</p></div><nav aria-label="Документы и контакты"><Link href="/about">О проекте</Link><Link href="/privacy">Конфиденциальность</Link><Link href="/terms">Условия</Link><a href="mailto:lattelix.dev@gmail.com">Связаться</a></nav></footer>
  </div>;
}
