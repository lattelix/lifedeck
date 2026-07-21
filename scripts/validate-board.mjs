import fs from 'node:fs';
import path from 'node:path';

const BOARD_PATH = path.join(process.cwd(), 'public', 'board.json');
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_STATUSES = new Set(['ok', 'empty', 'error']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertUniqueIds(entries, label) {
  const ids = new Set();
  for (const entry of entries) {
    assert(entry && typeof entry.id === 'string' && entry.id.length > 0, `${label}: invalid id`);
    assert(!ids.has(entry.id), `${label}: duplicate id "${entry.id}"`);
    ids.add(entry.id);
  }
  return ids;
}

function validateBoard(board) {
  assert(board && typeof board === 'object', 'board must be an object');
  assert(board.profile && typeof board.profile.name === 'string', 'profile.name is required');
  assert(Number.isFinite(Date.parse(board.profile.updatedAt)), 'profile.updatedAt must be an ISO date');
  assert(Array.isArray(board.categories), 'categories must be an array');
  assert(Array.isArray(board.sources), 'sources must be an array');
  assert(Array.isArray(board.items), 'items must be an array');
  assert(Array.isArray(board.days), 'days must be an array');

  const categoryIds = assertUniqueIds(board.categories, 'categories');
  const sourceIds = assertUniqueIds(board.sources, 'sources');
  const itemIds = assertUniqueIds(board.items, 'items');

  for (const source of board.sources) {
    assert(typeof source.label === 'string' && source.label.length > 0, `source ${source.id}: label is required`);
    if (source.status !== undefined) {
      assert(SOURCE_STATUSES.has(source.status), `source ${source.id}: invalid status`);
    }
    if (source.url !== undefined) {
      assert(/^https:\/\//.test(source.url), `source ${source.id}: url must use https`);
    }
  }

  for (const item of board.items) {
    assert(categoryIds.has(item.categoryId), `item ${item.id}: unknown category ${item.categoryId}`);
    assert(sourceIds.has(item.sourceId), `item ${item.id}: unknown source ${item.sourceId}`);
  }

  const activityIds = new Set();
  let previousDate = '';

  for (const day of board.days) {
    assert(DATE_PATTERN.test(day.date), `day: invalid date ${day.date}`);
    assert(day.date > previousDate, `days must be unique and sorted: ${day.date}`);
    assert(Array.isArray(day.activities), `day ${day.date}: activities must be an array`);
    assert(day.byCategory && typeof day.byCategory === 'object', `day ${day.date}: byCategory is required`);
    previousDate = day.date;

    const calculatedByCategory = {};
    for (const activity of day.activities) {
      assert(typeof activity.id === 'string' && activity.id.length > 0, `day ${day.date}: activity id is required`);
      assert(!activityIds.has(activity.id), `duplicate activity id ${activity.id}`);
      assert(categoryIds.has(activity.categoryId), `activity ${activity.id}: unknown category ${activity.categoryId}`);
      assert(sourceIds.has(activity.sourceId), `activity ${activity.id}: unknown source ${activity.sourceId}`);
      assert(itemIds.has(activity.itemId), `activity ${activity.id}: unknown item ${activity.itemId}`);
      assert(Number.isFinite(activity.minutes) && activity.minutes > 0, `activity ${activity.id}: minutes must be positive`);

      activityIds.add(activity.id);
      calculatedByCategory[activity.categoryId] =
        (calculatedByCategory[activity.categoryId] ?? 0) + activity.minutes;
    }

    const calculatedTotal = Object.values(calculatedByCategory).reduce((sum, value) => sum + value, 0);
    assert(day.totalMinutes === calculatedTotal, `day ${day.date}: totalMinutes does not reconcile`);

    const categoryKeys = new Set([
      ...Object.keys(day.byCategory),
      ...Object.keys(calculatedByCategory),
    ]);
    for (const categoryId of categoryKeys) {
      assert(
        day.byCategory[categoryId] === calculatedByCategory[categoryId],
        `day ${day.date}: byCategory.${categoryId} does not reconcile`,
      );
    }
  }

  return {
    sources: board.sources.length,
    items: board.items.length,
    days: board.days.length,
    activities: activityIds.size,
  };
}

try {
  const board = JSON.parse(fs.readFileSync(BOARD_PATH, 'utf8'));
  const summary = validateBoard(board);
  console.log('[validate-board] контракт корректен', summary);
} catch (error) {
  console.error('[validate-board]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
