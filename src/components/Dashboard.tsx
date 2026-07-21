'use client';

import { useMemo, useState } from 'react';
import type { Board, DayActivity } from '@/lib/types';
import {
  activeCategories,
  filterBoardDays,
  formatUpdatedAt,
  latestActiveDay,
  summarizeActivity,
} from '@/lib/activity';
import { Sidebar } from '@/components/Sidebar';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { ActivityDayPanel } from '@/components/ActivityDayPanel';
import { CategoryLegend } from '@/components/CategoryLegend';
import { SettingsModal } from '@/components/SettingsModal';
import { SourcesOverview } from '@/components/SourcesOverview';
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
  const [selectedDate, setSelectedDate] = useState(
    () => latestActiveDay(paddedDays)?.date ?? paddedDays.at(-1)?.date ?? '',
  );

  const filteredDays = useMemo(
    () => filterBoardDays(paddedDays, filters),
    [filters, paddedDays],
  );
  const summary = useMemo(() => summarizeActivity(filteredDays), [filteredDays]);
  const visibleCategories = useMemo(
    () => activeCategories(board, filteredDays),
    [board, filteredDays],
  );
  const selectedDay = filteredDays.find(day => day.date === selectedDate)
    ?? latestActiveDay(filteredDays)
    ?? filteredDays.at(-1);

  return (
    <>
      <button
        className="burger-btn"
        onClick={() => setSidebarOpen(value => !value)}
        type="button"
        aria-label={sidebarOpen ? 'Закрыть навигацию' : 'Открыть навигацию'}
        aria-expanded={sidebarOpen}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <Sidebar
        board={board}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="main-content">
        <section className="profile-overview" id="overview">
          <div className="profile-heading">
            <div className="profile-kicker">
              <span className="live-indicator" aria-hidden="true" />
              Живой профиль
            </div>
            <h1>{board.profile.name}</h1>
            <p>{board.profile.tagline}</p>
          </div>
          <div className="freshness-block">
            <span>Последняя синхронизация</span>
            <strong>{formatUpdatedAt(board.profile.updatedAt)}</strong>
          </div>
        </section>

        <section className="metric-strip" aria-label="Сводка активности">
          <Metric value={summary.activeDays} label="активных дней" />
          <Metric value={summary.activityCount} label="подтверждённых событий" />
          <Metric value={summary.activeSources} label="источника с данными" />
          <Metric value={summary.activeItems} label="активных дел" />
        </section>

        <section className="content-section" id="activity">
          <div className="section-header">
            <div>
              <p className="eyebrow">Последние 26 недель</p>
              <h2>Активность</h2>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="secondary-button"
              type="button"
              aria-label="Настроить источники и категории"
            >
              <SettingsIcon />
              <span>Фильтры</span>
            </button>
          </div>

          <div className="activity-layout">
            <div className="surface heatmap-panel">
              <ActivityHeatmap
                days={filteredDays}
                board={board}
                selectedDate={selectedDay?.date ?? ''}
                onSelectDay={setSelectedDate}
              />
              <div className="heatmap-footer">
                <CategoryLegend categories={visibleCategories} />
                <span className="metric-note">Интенсивность, не учёт рабочего времени</span>
              </div>
            </div>
            {selectedDay ? <ActivityDayPanel board={board} day={selectedDay} /> : null}
          </div>
        </section>

        <section className="content-section" id="sources">
          <div className="section-header">
            <div>
              <p className="eyebrow">Происхождение данных</p>
              <h2>Источники</h2>
            </div>
          </div>
          <SourcesOverview board={board} days={filteredDays} />
        </section>

        <footer className="site-footer">
          <span>Second Brain OS</span>
          <span>Self-owned activity profile</span>
        </footer>
      </main>

      {settingsOpen ? (
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
      ) : null}
    </>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="metric-item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
