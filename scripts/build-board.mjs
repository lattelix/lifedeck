// Агрегатор доски на архитектуре коннекторов.
// Обходит включённые в connectors.config.json коннекторы, тянет реальную активность,
// собирает единый public/board.json (контракт v2: profile, categories, sources, items, days).

import fs from 'fs';
import path from 'path';
import { categories } from './connectors/shared.mjs';
import * as calendar from './connectors/calendar.mjs';
import * as github from './connectors/github.mjs';

// ── .env loader (для опционального LLM/GITHUB_TOKEN) ──────────
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (m) {
      const key = m[1];
      const val = (m[2] || '').replace(/^['"](.*?)['"]$/, '$1').trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// Реестр доступных коннекторов
const REGISTRY = { calendar, github };

async function buildBoard() {
  const cfgPath = path.join(process.cwd(), 'connectors.config.json');
  let config = { calendar: { enabled: true } };
  if (fs.existsSync(cfgPath)) {
    config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  } else {
    console.warn('[build-board] connectors.config.json не найден — только calendar');
  }

  const sources = [];
  const itemsMap = new Map();
  const allActivities = [];

  for (const [id, conf] of Object.entries(config)) {
    if (!conf || !conf.enabled) continue;
    const mod = REGISTRY[id];
    if (!mod) { console.warn(`[build-board] неизвестный коннектор: ${id}`); continue; }
    try {
      const { source, items, activities } = await mod.collect(conf);
      if (source) sources.push(source);
      for (const it of items || []) itemsMap.set(it.id, it);
      for (const a of activities || []) allActivities.push(a);
    } catch (e) {
      console.error(`[build-board] коннектор ${id} упал:`, e.message);
    }
  }

  // Агрегация по дням
  const daysMap = new Map();
  for (const a of allActivities) {
    if (!a.date || !(a.minutes > 0)) continue;
    if (!daysMap.has(a.date)) {
      daysMap.set(a.date, { date: a.date, totalMinutes: 0, byCategory: {}, activities: [] });
    }
    const day = daysMap.get(a.date);
    day.totalMinutes += a.minutes;
    day.byCategory[a.categoryId] = (day.byCategory[a.categoryId] || 0) + a.minutes;
    day.activities.push({
      id: a.id, title: a.title, categoryId: a.categoryId,
      sourceId: a.sourceId, itemId: a.itemId, minutes: a.minutes,
    });
  }
  const days = [...daysMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  const board = {
    profile: {
      name: 'Alex',
      tagline: 'Building Second Brain OS · dev & founder',
      updatedAt: new Date().toISOString(),
    },
    categories,
    sources,
    items: [...itemsMap.values()],
    days,
  };

  const boardFile = path.join(process.cwd(), 'public', 'board.json');
  fs.mkdirSync(path.dirname(boardFile), { recursive: true });
  fs.writeFileSync(boardFile, JSON.stringify(board, null, 2), 'utf8');

  console.log(`[build-board] источники=${sources.length} дела=${itemsMap.size} дней=${days.length} активностей=${allActivities.length}`);
  console.log(`[build-board] → ${boardFile}`);
}

buildBoard().catch(console.error);
