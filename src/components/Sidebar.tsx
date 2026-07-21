'use client';

import type { Board } from '@/lib/types';

interface SidebarProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Sidebar({
  board,
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}: SidebarProps) {
  return (
    <>
      <button
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onMouseDown={onClose}
        type="button"
        aria-label="Закрыть боковую панель"
        tabIndex={isOpen ? 0 : -1}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <a className="brand-lockup" href="#overview" onClick={onClose}>
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>
            <strong>{board.profile.name}</strong>
            <small>Second Brain OS</small>
          </span>
        </a>

        <nav className="sidebar-nav" aria-label="Навигация по профилю">
          <a href="#overview" onClick={onClose}>
            <OverviewIcon />
            <span>Обзор</span>
          </a>
          <a href="#activity" onClick={onClose}>
            <ActivityIcon />
            <span>Активность</span>
          </a>
          <a href="#sources" onClick={onClose}>
            <SourceIcon />
            <span>Источники</span>
          </a>
        </nav>

        <div className="sidebar-context">
          <p>Публичные данные</p>
          <strong>{board.sources.length} источника</strong>
          <span>{board.items.length} отслеживаемых дел</span>
        </div>

        <div className="sidebar-bottom">
          <button onClick={onToggleTheme} className="theme-button" type="button">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
          <p>Данные остаются под контролем владельца.</p>
        </div>
      </aside>
    </>
  );
}

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h4l2.5-6 5 12 2.5-6h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.2 10.9 7.5-3.8M8.2 13.1l7.5 3.8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
