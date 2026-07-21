'use client';

import type { Board, DayActivity } from '@/lib/types';
import { formatActivityDate } from '@/lib/activity';
import { intensityLevel } from '@/lib/board';
import { useEffect, useRef } from 'react';

interface HeatmapProps {
  days: DayActivity[];
  board: Board;
  selectedDate: string;
  onSelectDay: (date: string) => void;
}

export function ActivityHeatmap({
  days,
  board,
  selectedDate,
  onSelectDay,
}: HeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollLeft = container.scrollWidth;
  }, [days.length]);

  const weeks: DayActivity[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return (
    <div className="heatmap-scroll custom-scrollbar" ref={scrollRef}>
      <div className="heatmap-layout">
        <div className="heatmap-day-labels" aria-hidden="true">
          <span>Пн</span>
          <span />
          <span>Ср</span>
          <span />
          <span>Пт</span>
          <span />
          <span />
        </div>

        <div className="heatmap-grid" role="grid" aria-label="Активность за 26 недель">
          {weeks.map((week, weekIndex) => {
            const monthStart = week.find(day => day.date.endsWith('-01'));

            return (
              <div className="heatmap-week" key={week[0]?.date ?? weekIndex} role="row">
                {monthStart ? (
                  <span className="heatmap-month" aria-hidden="true">
                    {new Date(`${monthStart.date}T12:00:00`).toLocaleString('ru-RU', { month: 'short' })}
                  </span>
                ) : null}

                {week.map(day => {
                  const eventCount = day.activities.length;
                  const isSelected = day.date === selectedDate;
                  const level = intensityLevel(day.totalMinutes);
                  const color = getCellColor(level, day, board);
                  const label = `${formatActivityDate(day.date)}: ${eventCount} ${eventWord(eventCount)}`;

                  return (
                    <button
                      key={day.date}
                      className={`heatmap-cell ${isSelected ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      type="button"
                      role="gridcell"
                      aria-label={label}
                      aria-selected={isSelected}
                      onClick={() => onSelectDay(day.date)}
                    >
                      <span className="heatmap-tooltip" role="tooltip">
                        <strong>{formatActivityDate(day.date)}</strong>
                        <span>{eventCount > 0 ? `${eventCount} ${eventWord(eventCount)}` : 'Нет активности'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getCellColor(
  level: 0 | 1 | 2 | 3 | 4,
  day: DayActivity,
  board: Board,
): string {
  if (level === 0) return 'var(--heatmap-empty)';

  const dominant = Object.entries(day.byCategory).sort((a, b) => b[1] - a[1])[0];
  const category = board.categories.find(item => item.id === dominant?.[0]);
  const baseColor = category?.color ?? '#7C3AED';
  const opacity = [0, 0.42, 0.62, 0.82, 1][level];

  return hexWithOpacity(baseColor, opacity);
}

function hexWithOpacity(hex: string, opacity: number): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function eventWord(value: number): string {
  if (value === 1) return 'событие';
  if (value > 1 && value < 5) return 'события';
  return 'событий';
}
