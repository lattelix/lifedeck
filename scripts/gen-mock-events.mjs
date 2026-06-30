import fs from 'fs';
import path from 'path';

const START_DAYS_AGO = 120;
const EVENTS_FILE = path.join(process.cwd(), 'data', 'events.raw.json');

// Real item names from the registry, mapped to realistic event titles
const itemTitles = [
  // work
  'GrowNet админка', 'GrowNet: рефакторинг API', 'GrowNet ревью PR',
  'TalentBay devops', 'TalentBay: фикс CI/CD', 'TalentBay деплой',
  'Созвон с командой', 'Weekly meeting', 'Стендап', 'Дэйли стендап',
  'Работа над фичей', 'Работа: код-ревью',

  // study
  'Синергия: лекция', 'Синергия: семинар', 'Синергия ВКР драфт',
  'Школа 21 — проект', 'Школа 21 пул-реквест', 'Школа 21 экзамен',
  'Лекция по архитектуре', 'Курс на Степике',

  // algorithms
  'Codewars ката', 'Codewars 6 кю задача',
  'Leetcode daily', 'LeetCode: деревья', 'LeetCode medium',
  'Алгоритмы графов', 'Решение задач',

  // languages
  'English File unit 5', 'English class', 'Английский разговорный',
  'Duolingo streak', 'Duolingo 30 минут',

  // projects
  'Second Brain OS', 'Second Brain OS: UI', 'Second Brain OS рефакторинг',
  'LiveProfile MVP', 'LiveProfile дизайн',
  'Figma лендинг', 'Дизайн MVP', 'Проект: прототип',

  // personal
  'Спортзал', 'Обед', 'Чтение книги', 'Прогулка', 'Медитация',
];

function generateEvents() {
  const events = [];
  let currentId = 1;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - START_DAYS_AGO);

  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    // ~15% chance of zero-activity day
    if (Math.random() < 0.15) continue;

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const count = isWeekend
      ? 1 + Math.floor(Math.random() * 3)
      : 2 + Math.floor(Math.random() * 5);

    let startHour = 9;
    for (let i = 0; i < count; i++) {
      const minutes = [15, 30, 45, 60, 90, 120, 180][Math.floor(Math.random() * 7)];
      const title = itemTitles[Math.floor(Math.random() * itemTitles.length)];

      const evtStart = new Date(d);
      evtStart.setHours(startHour, 0, 0, 0);
      const evtEnd = new Date(evtStart.getTime() + minutes * 60000);

      events.push({
        id: `evt_${currentId++}`,
        title,
        start: evtStart.toISOString(),
        end: evtEnd.toISOString(),
        source: 'calendar',
      });

      startHour += Math.ceil(minutes / 60) + 1;
      if (startHour > 22) break;
    }
  }

  const dir = path.dirname(EVENTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
  console.log(`Generated ${events.length} mock events in ${EVENTS_FILE}`);
}

generateEvents();
