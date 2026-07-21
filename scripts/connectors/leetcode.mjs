// Коннектор «LeetCode» — РЕАЛЬНЫЕ данные через публичный GraphQL.
// Берём submissionCalendar (кол-во сабмишенов по дням) → активность по дням.
// Без OAuth. Нужен публичный username.

export const meta = { id: 'leetcode', label: 'LeetCode' };

const ITEM = { id: 'leetcode', label: 'LeetCode', categoryId: 'algorithms', sourceId: 'leetcode' };
const WINDOW_DAYS = 180;

function sourceFor(username, status, statusMessage) {
  return {
    ...meta,
    url: username ? `https://leetcode.com/u/${encodeURIComponent(username)}/` : undefined,
    status,
    ...(statusMessage ? { statusMessage } : {}),
  };
}

export async function collect(config = {}) {
  const username = config.username;
  if (!username) {
    console.warn('[leetcode] нет username — пропускаю');
    return {
      source: sourceFor('', 'error', 'В конфигурации не указан username'),
      items: [],
      activities: [],
    };
  }

  const query = `query($u:String!){ matchedUser(username:$u){ userCalendar { submissionCalendar } } }`;
  let calendarRaw = null;
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'second-brain-os',
      },
      body: JSON.stringify({ query, variables: { u: username } }),
    });
    if (!res.ok) {
      console.warn(`[leetcode] HTTP ${res.status}`);
      return {
        source: sourceFor(username, 'error', `LeetCode API вернул HTTP ${res.status}`),
        items: [],
        activities: [],
      };
    }
    const data = await res.json();
    calendarRaw = data?.data?.matchedUser?.userCalendar?.submissionCalendar;
    if (!calendarRaw) {
      console.warn('[leetcode] пользователь не найден или календарь пуст');
      return {
        source: sourceFor(username, 'empty', 'Пользователь не найден или календарь пуст'),
        items: [],
        activities: [],
      };
    }
  } catch (e) {
    console.warn('[leetcode] fetch не удался:', e.message);
    return {
      source: sourceFor(username, 'error', 'Не удалось получить данные LeetCode'),
      items: [],
      activities: [],
    };
  }

  let calendar;
  try { calendar = JSON.parse(calendarRaw); } catch { calendar = {}; }

  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  const activities = [];
  for (const [ts, count] of Object.entries(calendar)) {
    const ms = Number(ts) * 1000;
    if (ms < cutoff) continue;
    const n = Number(count) || 0;
    if (n <= 0) continue;
    const date = new Date(ms).toISOString().split('T')[0];
    activities.push({
      id: `lc_${date}`,
      title: `LeetCode: ${n} сабмишенов`,
      categoryId: 'algorithms',
      sourceId: 'leetcode',
      itemId: 'leetcode',
      minutes: Math.min(120, Math.max(10, n * 12)),
      date,
    });
  }

  console.log(`[leetcode] @${username}: ${activities.length} активных дней`);
  return {
    source: sourceFor(
      username,
      activities.length > 0 ? 'ok' : 'empty',
      activities.length > 0 ? '' : `За последние ${WINDOW_DAYS} дней активности не найдено`,
    ),
    items: activities.length ? [ITEM] : [],
    activities,
  };
}
