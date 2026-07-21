import type { Board, DayActivity, Source } from '@/lib/types';
import { formatActivityDate } from '@/lib/activity';

interface SourcesOverviewProps {
  board: Board;
  days: DayActivity[];
}

export function SourcesOverview({ board, days }: SourcesOverviewProps) {
  return (
    <div className="source-grid">
      {board.sources.map(source => (
        <SourceCard key={source.id} source={source} board={board} days={days} />
      ))}
    </div>
  );
}

function SourceCard({
  source,
  board,
  days,
}: {
  source: Source;
  board: Board;
  days: DayActivity[];
}) {
  const activities = days.flatMap(day =>
    day.activities
      .filter(activity => activity.sourceId === source.id)
      .map(activity => ({ ...activity, date: day.date })),
  );
  const items = board.items.filter(item => item.sourceId === source.id);
  const latestDate = activities.at(-1)?.date;
  const status = source.status ?? (activities.length > 0 ? 'ok' : 'empty');

  const content = (
    <>
      <div className="source-card-topline">
        <div className="source-monogram" aria-hidden="true">
          {source.label.slice(0, 2).toUpperCase()}
        </div>
        <span className={`source-status source-status-${status}`}>
          <span aria-hidden="true" />
          {statusLabel(status)}
        </span>
      </div>
      <div>
        <h3>{source.label}</h3>
        <p className="source-summary">
          {activities.length > 0
            ? `${activities.length} ${pluralizeEvents(activities.length)} · ${items.length} ${pluralizeItems(items.length)}`
            : source.statusMessage || 'Пока нет опубликованных событий'}
        </p>
      </div>
      <p className="source-freshness">
        {latestDate ? `Последняя активность: ${formatActivityDate(latestDate)}` : 'Нет даты активности'}
      </p>
    </>
  );

  if (source.url) {
    return (
      <a className="surface source-card" href={source.url} target="_blank" rel="noreferrer">
        {content}
        <span className="source-link-label">Открыть профиль <span aria-hidden="true">↗</span></span>
      </a>
    );
  }

  return <article className="surface source-card">{content}</article>;
}

function statusLabel(status: NonNullable<Source['status']>): string {
  if (status === 'error') return 'Ошибка обновления';
  if (status === 'empty') return 'Нет данных';
  return 'Данные получены';
}

function pluralizeEvents(value: number): string {
  return value === 1 ? 'событие' : value > 1 && value < 5 ? 'события' : 'событий';
}

function pluralizeItems(value: number): string {
  return value === 1 ? 'дело' : value > 1 && value < 5 ? 'дела' : 'дел';
}
