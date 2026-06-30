'use client';

import { useState } from 'react';
import { Board, DayActivity } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { CategoryLegend } from '@/components/CategoryLegend';
import { SettingsModal } from '@/components/SettingsModal';
import { useTheme } from '@/hooks/useTheme';
import { useBoardFilters } from '@/hooks/useBoardFilters';

interface DashboardProps {
  board: Board;
  paddedDays: DayActivity[];
}

export function Dashboard({ board, paddedDays }: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { filters, toggleSource, toggleCategory, toggleItem } = useBoardFilters(board);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      {/* Burger button (mobile) */}
      <button
        className="burger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        type="button"
        aria-label="Меню"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Доска активности
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Обновлено {new Date(board.profile.updatedAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: 'var(--bg-panel-glass)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
              backdropFilter: 'blur(8px)',
            }}
            type="button"
            aria-label="Настройки"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Heatmap card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              График активности
            </h2>
          </div>
          <ActivityHeatmap days={paddedDays} board={board} filters={filters} />
          <div className="mt-4">
            <CategoryLegend categories={board.categories} />
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal
          board={board}
          filters={filters}
          onToggleSource={toggleSource}
          onToggleCategory={toggleCategory}
          onToggleItem={toggleItem}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
