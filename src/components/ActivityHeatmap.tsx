'use client';

import { DayActivity, Board } from '@/lib/types';
import { intensityLevel } from '@/lib/board';
import { FilterState } from '@/hooks/useBoardFilters';
import { useMemo } from 'react';

interface HeatmapProps {
  days: DayActivity[];
  board: Board;
  filters: FilterState;
}

function filterDay(day: DayActivity, filters: FilterState): DayActivity {
  const filteredActivities = day.activities.filter(
    a => filters.items[a.itemId] && filters.categories[a.categoryId] && filters.sources[a.sourceId]
  );

  const byCategory: Record<string, number> = {};
  let totalMinutes = 0;
  for (const a of filteredActivities) {
    byCategory[a.categoryId] = (byCategory[a.categoryId] || 0) + a.minutes;
    totalMinutes += a.minutes;
  }

  return { ...day, activities: filteredActivities, byCategory, totalMinutes };
}

export function ActivityHeatmap({ days, board, filters }: HeatmapProps) {
  const filteredDays = useMemo(
    () => days.map(d => filterDay(d, filters)),
    [days, filters]
  );

  const weeks: DayActivity[][] = [];
  for (let i = 0; i < filteredDays.length; i += 7) {
    weeks.push(filteredDays.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto pb-4 custom-scrollbar">
      <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-xs justify-between py-1 mr-2 mt-5" style={{ color: 'var(--text-muted)' }}>
          <span>Пн</span>
          <span></span>
          <span>Ср</span>
          <span></span>
          <span>Пт</span>
          <span></span>
          <span></span>
        </div>

        {/* Grid */}
        <div className="flex gap-[3px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px] mt-5 relative">
              {/* Month label */}
              {week[0] && (week[0].date.endsWith('-01') || week[0].date.endsWith('-02') || week[0].date.endsWith('-03')) && new Date(week[0].date).getDate() <= 7 ? (
                <div
                  className="absolute -top-5 text-[10px] whitespace-nowrap"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {new Date(week[0].date).toLocaleString('ru-RU', { month: 'short' })}
                </div>
              ) : null}

              {week.map((day, dIdx) => {
                const level = intensityLevel(day.totalMinutes);
                const colors = getCellColor(level, day, board);

                return (
                  <div
                    key={dIdx}
                    className="heatmap-cell"
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: 3,
                      backgroundColor: colors.bg,
                    }}
                  >
                    {/* Tooltip */}
                    <div className="heatmap-tooltip glass-modal" style={{ padding: 12 }}>
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {new Date(day.date).toLocaleDateString('ru-RU', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                      <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        Всего: {Math.floor(day.totalMinutes / 60)}ч {day.totalMinutes % 60}м
                      </div>
                      <div className="flex flex-col gap-1">
                        {Object.entries(day.byCategory).map(([catId, mins]) => {
                          const cat = board.categories.find(c => c.id === catId);
                          if (!cat || mins === 0) return null;
                          return (
                            <div key={catId} className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="flex-1" style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                              <span style={{ color: 'var(--text-muted)' }} className="font-medium">
                                {Math.floor(mins / 60)}ч {mins % 60}м
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {day.activities.length > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                          {day.activities.slice(0, 4).map(act => (
                            <div key={act.id} className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                              • {act.title} ({Math.floor(act.minutes / 60) > 0 ? `${Math.floor(act.minutes / 60)}ч ` : ''}{act.minutes % 60}м)
                            </div>
                          ))}
                          {day.activities.length > 4 && (
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              +{day.activities.length - 4} ещё
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCellColor(level: 0 | 1 | 2 | 3 | 4, day: DayActivity, board: Board): { bg: string } {
  if (level === 0) {
    return { bg: 'var(--heatmap-empty)' };
  }

  // Find dominant category for coloring
  const entries = Object.entries(day.byCategory);
  if (entries.length === 0) return { bg: 'var(--heatmap-empty)' };

  entries.sort((a, b) => b[1] - a[1]);
  const topCatId = entries[0][0];
  const cat = board.categories.find(c => c.id === topCatId);
  const baseColor = cat?.color || 'var(--accent)';

  // Opacity based on intensity level
  const opacity = level === 1 ? 0.45 : level === 2 ? 0.65 : level === 3 ? 0.82 : 1;

  return { bg: hexWithOpacity(baseColor, opacity) };
}

function hexWithOpacity(hex: string, opacity: number): string {
  // Convert hex + opacity to rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
