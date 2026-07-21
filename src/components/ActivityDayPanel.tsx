import type { Board, DayActivity } from '@/lib/types';
import { formatActivityDate } from '@/lib/activity';

interface ActivityDayPanelProps {
  board: Board;
  day: DayActivity;
}

export function ActivityDayPanel({ board, day }: ActivityDayPanelProps) {
  const sourceMap = new Map(board.sources.map(source => [source.id, source]));
  const itemMap = new Map(board.items.map(item => [item.id, item]));
  const categoryMap = new Map(board.categories.map(category => [category.id, category]));

  return (
    <aside className="surface detail-panel" aria-live="polite">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Выбранный день</p>
          <h3>{formatActivityDate(day.date, true)}</h3>
        </div>
        <span className="count-badge">{day.activities.length}</span>
      </div>

      {day.activities.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-mark" aria-hidden="true" />
          <p>Нет опубликованной активности</p>
        </div>
      ) : (
        <ol className="activity-list">
          {day.activities.map(activity => {
            const source = sourceMap.get(activity.sourceId);
            const item = itemMap.get(activity.itemId);
            const category = categoryMap.get(activity.categoryId);

            return (
              <li key={activity.id} className="activity-row">
                <span
                  className="activity-dot"
                  style={{ backgroundColor: category?.color ?? 'var(--accent)' }}
                  aria-hidden="true"
                />
                <div className="activity-copy">
                  <p>{activity.title}</p>
                  <div className="activity-meta">
                    <span>{source?.label ?? activity.sourceId}</span>
                    {item ? <span>{item.label}</span> : null}
                    {activity.sourceId === 'calendar' ? (
                      <span>{formatDuration(activity.minutes)}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}
