import type { Board, DayActivity } from './types';

interface ActivityFilters {
  sources: Record<string, boolean>;
  categories: Record<string, boolean>;
  items: Record<string, boolean>;
}

export interface ActivitySummary {
  activeDays: number;
  activityCount: number;
  activeSources: number;
  activeItems: number;
}

export function filterBoardDays(
  days: DayActivity[],
  filters: ActivityFilters,
): DayActivity[] {
  return days.map(day => {
    const activities = day.activities.filter(activity =>
      filters.sources[activity.sourceId]
      && filters.categories[activity.categoryId]
      && filters.items[activity.itemId]
    );

    const byCategory: Record<string, number> = {};
    let totalMinutes = 0;

    for (const activity of activities) {
      byCategory[activity.categoryId] =
        (byCategory[activity.categoryId] ?? 0) + activity.minutes;
      totalMinutes += activity.minutes;
    }

    return { ...day, activities, byCategory, totalMinutes };
  });
}

export function summarizeActivity(days: DayActivity[]): ActivitySummary {
  const activities = days.flatMap(day => day.activities);

  return {
    activeDays: days.filter(day => day.activities.length > 0).length,
    activityCount: activities.length,
    activeSources: new Set(activities.map(activity => activity.sourceId)).size,
    activeItems: new Set(activities.map(activity => activity.itemId)).size,
  };
}

export function latestActiveDay(days: DayActivity[]): DayActivity | undefined {
  return [...days].reverse().find(day => day.activities.length > 0);
}

export function activeCategories(board: Board, days: DayActivity[]) {
  const ids = new Set(
    days.flatMap(day => day.activities.map(activity => activity.categoryId)),
  );

  return board.categories.filter(category => ids.has(category.id));
}

export function formatActivityDate(date: string, includeYear = false): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(new Date(`${date}T12:00:00`));
}

export function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
