// Коннектор «Codewars» — РЕАЛЬНЫЕ данные через официальный публичный API.
// Берём завершённые ката с датами → активность по дням. Без OAuth.

export const meta = { id: 'codewars', label: 'Codewars' };

const ITEM = { id: 'codewars', label: 'Codewars', categoryId: 'algorithms', sourceId: 'codewars' };
const WINDOW_DAYS = 180;
const MAX_PAGES = 5;

function sourceFor(username, status, statusMessage) {
  return {
    ...meta,
    url: username ? `https://www.codewars.com/users/${encodeURIComponent(username)}` : undefined,
    status,
    ...(statusMessage ? { statusMessage } : {}),
  };
}

export async function collect(config = {}) {
  const username = config.username;
  if (!username) {
    console.warn('[codewars] нет username — пропускаю');
    return {
      source: sourceFor('', 'error', 'В конфигурации не указан username'),
      items: [],
      activities: [],
    };
  }

  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  const activities = [];
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await fetch(
        `https://www.codewars.com/api/v1/users/${encodeURIComponent(username)}/code-challenges/completed?page=${page}`,
        { headers: { 'User-Agent': 'second-brain-os', 'Accept': 'application/json' } }
      );
      if (!res.ok) {
        console.warn(`[codewars] HTTP ${res.status} (page ${page})`);
        return {
          source: sourceFor(username, 'error', `Codewars API вернул HTTP ${res.status}`),
          items: [],
          activities: [],
        };
      }
      const data = await res.json();
      const list = data?.data || [];
      if (list.length === 0) break;

      let reachedOld = false;
      for (const kata of list) {
        const at = kata.completedAt ? new Date(kata.completedAt).getTime() : NaN;
        if (!at) continue;
        if (at < cutoff) { reachedOld = true; continue; }
        const date = new Date(at).toISOString().split('T')[0];
        activities.push({
          id: `cw_${kata.id}`,
          title: `Codewars: ${kata.name || 'kata'}`,
          categoryId: 'algorithms',
          sourceId: 'codewars',
          itemId: 'codewars',
          minutes: 20,
          date,
        });
      }
      if (reachedOld) break; // список отсортирован от новых к старым
      if (data.totalPages && page + 1 >= data.totalPages) break;
    }
  } catch (e) {
    console.warn('[codewars] fetch не удался:', e.message);
    return {
      source: sourceFor(username, 'error', 'Не удалось получить данные Codewars'),
      items: [],
      activities: [],
    };
  }

  console.log(`[codewars] @${username}: ${activities.length} завершённых ката (за ${WINDOW_DAYS}д)`);
  return {
    source: sourceFor(
      username,
      activities.length > 0 ? 'ok' : 'empty',
      activities.length > 0 ? '' : `За последние ${WINDOW_DAYS} дней завершённых ката не найдено`,
    ),
    items: activities.length ? [ITEM] : [],
    activities,
  };
}
