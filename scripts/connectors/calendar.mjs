// Коннектор «Календарь». Пока источник данных — mock (data/events.raw.json).
// Когда подключим Google Calendar OAuth — заменим чтение мока на реальный fetch,
// интерфейс collect() останется тем же.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { categories } from './shared.mjs';

export const meta = { id: 'calendar', label: 'Календарь' };

const items = [
  // work
  { id: 'grownet', label: 'GrowNet', categoryId: 'work', sourceId: 'calendar', keywords: ['grownet'] },
  { id: 'talentbay', label: 'TalentBay', categoryId: 'work', sourceId: 'calendar', keywords: ['talentbay'] },
  { id: 'work-meeting', label: 'Созвоны', categoryId: 'work', sourceId: 'calendar', keywords: ['созвон', 'meeting', 'стендап', 'weekly'] },
  { id: 'work-general', label: 'Работа (общее)', categoryId: 'work', sourceId: 'calendar', keywords: ['админк', 'devops', 'работа', 'фич'] },
  // study
  { id: 'synergy', label: 'Синергия', categoryId: 'study', sourceId: 'calendar', keywords: ['синергия', 'вкр'] },
  { id: 'school21', label: 'Школа 21', categoryId: 'study', sourceId: 'calendar', keywords: ['школа 21'] },
  { id: 'study-general', label: 'Учёба (общее)', categoryId: 'study', sourceId: 'calendar', keywords: ['лекция', 'курс', 'учеб'] },
  // algorithms
  { id: 'codewars', label: 'Codewars', categoryId: 'algorithms', sourceId: 'calendar', keywords: ['codewars', 'кодерун'] },
  { id: 'leetcode', label: 'LeetCode', categoryId: 'algorithms', sourceId: 'calendar', keywords: ['leetcode'] },
  { id: 'algo-general', label: 'Алгоритмы (общее)', categoryId: 'algorithms', sourceId: 'calendar', keywords: ['алгоритм', 'задач'] },
  // languages
  { id: 'english-file', label: 'English File', categoryId: 'languages', sourceId: 'calendar', keywords: ['english file', 'english class', 'английск'] },
  { id: 'lang-general', label: 'Языки (общее)', categoryId: 'languages', sourceId: 'calendar', keywords: ['язык'] },
  // projects
  { id: 'second-brain', label: 'Second Brain OS', categoryId: 'projects', sourceId: 'calendar', keywords: ['second brain'] },
  { id: 'liveprofile', label: 'LiveProfile', categoryId: 'projects', sourceId: 'calendar', keywords: ['liveprofile', 'livеprofile'] },
  { id: 'projects-general', label: 'Проекты (общее)', categoryId: 'projects', sourceId: 'calendar', keywords: ['проект', 'mvp', 'дизайн', 'figma', 'лендинг'] },
  // fallback
  { id: 'other', label: 'Прочее', categoryId: 'personal', sourceId: 'calendar', keywords: [] },
];

function classifyToItem(title) {
  const lower = title.toLowerCase();
  for (const item of items) {
    if (item.keywords.length > 0 && item.keywords.some(kw => lower.includes(kw))) return item;
  }
  return items.find(i => i.id === 'other');
}

async function classifyEvent(title) {
  const item = classifyToItem(title);
  if (item.id !== 'other') return { categoryId: item.categoryId, itemId: item.id };

  const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env;
  if (LLM_BASE_URL && LLM_API_KEY && LLM_MODEL) {
    try {
      const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: `Return ONLY ONE category id from: ${categories.map(c => c.id).join(', ')}. If unsure, "personal".` },
            { role: 'user', content: title },
          ],
          temperature: 0.1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const r = data.choices?.[0]?.message?.content?.trim();
        if (r && categories.some(c => c.id === r)) return { categoryId: r, itemId: 'other' };
      }
    } catch (e) {
      console.error('[calendar] LLM classify failed, using rules:', e.message);
    }
  }
  return { categoryId: 'personal', itemId: 'other' };
}

export async function collect() {
  const eventsFile = path.join(process.cwd(), 'data', 'events.raw.json');
  if (!fs.existsSync(eventsFile)) {
    console.log('[calendar] events.raw.json not found — running mock generator…');
    execSync('pnpm mock', { stdio: 'inherit' });
  }
  const raw = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  const activities = [];
  for (const ev of raw) {
    const minutes = Math.round((new Date(ev.end) - new Date(ev.start)) / 60000);
    if (!(minutes > 0)) continue;
    const { categoryId, itemId } = await classifyEvent(ev.title);
    const d = new Date(ev.start);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    activities.push({
      id: ev.id,
      title: ev.title,
      categoryId,
      sourceId: 'calendar',
      itemId,
      minutes,
      date: local.toISOString().split('T')[0],
    });
  }
  const boardItems = items.map(({ keywords, ...rest }) => rest);
  console.log(`[calendar] ${activities.length} activities, ${boardItems.length} items (mock)`);
  return { source: meta, items: boardItems, activities };
}
