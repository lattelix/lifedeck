// Коннектор «GitHub» — РЕАЛЬНЫЕ данные через публичный Events API.
// Репозитории становятся «делами» (items), события (push/PR/issue) — активностью по дням.
// Без OAuth. Лимит без токена: 60 запросов/час и ~90 дней истории.
// Опционально: GITHUB_TOKEN в .env поднимает лимит.

export const meta = { id: 'github', label: 'GitHub' };

function sourceFor(username, status, statusMessage) {
  return {
    ...meta,
    url: username ? `https://github.com/${encodeURIComponent(username)}` : undefined,
    status,
    ...(statusMessage ? { statusMessage } : {}),
  };
}

// Длительности нет → оцениваем «усилие» в минутах по типу события (прокси для интенсивности доски)
function minutesFor(ev) {
  switch (ev.type) {
    case 'PushEvent': return Math.min(60, Math.max(10, (ev.payload?.size || ev.payload?.commits?.length || 1) * 10));
    case 'PullRequestEvent': return 30;
    case 'PullRequestReviewEvent': return 20;
    case 'IssuesEvent': return 15;
    case 'IssueCommentEvent': return 10;
    case 'CreateEvent': return 10;
    case 'ReleaseEvent': return 20;
    case 'ForkEvent': return 5;
    case 'WatchEvent': return 5;
    default: return 5;
  }
}

function titleFor(ev, repoLabel) {
  switch (ev.type) {
    case 'PushEvent': return `Push → ${repoLabel} (${ev.payload?.size || 1} commits)`;
    case 'PullRequestEvent': return `PR ${ev.payload?.action || ''} → ${repoLabel}`.trim();
    case 'PullRequestReviewEvent': return `Review → ${repoLabel}`;
    case 'IssuesEvent': return `Issue ${ev.payload?.action || ''} → ${repoLabel}`.trim();
    case 'CreateEvent': return `Создал ${ev.payload?.ref_type || ''} → ${repoLabel}`.trim();
    case 'ReleaseEvent': return `Release → ${repoLabel}`;
    case 'ForkEvent': return `Fork → ${repoLabel}`;
    case 'WatchEvent': return `★ ${repoLabel}`;
    default: return `${ev.type} → ${repoLabel}`;
  }
}

function repoToItem(repoName) {
  const short = repoName.includes('/') ? repoName.split('/')[1] : repoName;
  const id = 'gh-' + short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { id, label: short, categoryId: 'projects', sourceId: 'github' };
}

export async function collect(config = {}) {
  const username = config.username;
  if (!username) {
    console.warn('[github] нет username в connectors.config.json — пропускаю');
    return {
      source: sourceFor('', 'error', 'В конфигурации не указан username'),
      items: [],
      activities: [],
    };
  }

  const headers = { 'User-Agent': 'second-brain-os', 'Accept': 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

  let events = [];
  let requestError = '';
  try {
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
        { headers }
      );
      if (!res.ok) {
        requestError = `GitHub API вернул HTTP ${res.status}`;
        console.warn(`[github] HTTP ${res.status} (page ${page})`);
        break;
      }
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      events = events.concat(batch);
      if (batch.length < 100) break;
    }
  } catch (e) {
    console.warn('[github] fetch не удался, источник пуст:', e.message);
    return {
      source: sourceFor(username, 'error', 'Не удалось получить данные GitHub'),
      items: [],
      activities: [],
    };
  }

  if (requestError && events.length === 0) {
    return {
      source: sourceFor(username, 'error', requestError),
      items: [],
      activities: [],
    };
  }

  const itemsMap = new Map();
  const activities = [];
  for (const ev of events) {
    const repo = ev.repo?.name;
    const date = (ev.created_at || '').split('T')[0];
    if (!repo || !date) continue;
    const item = repoToItem(repo);
    itemsMap.set(item.id, item);
    activities.push({
      id: 'gh_' + ev.id,
      title: titleFor(ev, item.label),
      categoryId: 'projects',
      sourceId: 'github',
      itemId: item.id,
      minutes: minutesFor(ev),
      date,
    });
  }

  console.log(`[github] @${username}: ${activities.length} событий, ${itemsMap.size} репозиториев`);
  return {
    source: sourceFor(
      username,
      activities.length > 0 ? 'ok' : 'empty',
      activities.length > 0 ? '' : 'За доступный период публичных событий не найдено',
    ),
    items: [...itemsMap.values()],
    activities,
  };
}
