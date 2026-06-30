import fs from 'fs';
import path from 'path';

const START_DAYS_AGO = 120;
const EVENTS_FILE = path.join(process.cwd(), 'data', 'events.raw.json');

const sampleTitles = [
  'GrowNet админка', 'TalentBay devops', 'Созвон с командой', 'Weekly meeting', 'Стендап', 'Работа над фичей',
  'Лекция по архитектуре', 'Курс на Синергии', 'Школа 21 - проект', 'ВКР драфт',
  'Leetcode daily', 'Решение задач на codewars', 'Алгоритмы графов',
  'English class', 'Английский разговорный', 'Duolingo streak',
  'Дизайн MVP', 'Figma лендинг', 'Second Brain OS', 'LiveProfile',
  'Спортзал', 'Обед', 'Чтение книги', 'Прогулка'
];

function generateEvents() {
  const events = [];
  let currentId = 1;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - START_DAYS_AGO);

  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    if (Math.random() < 0.15) continue;

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const count = isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 5);

    let startHour = 9; 
    for (let i = 0; i < count; i++) {
      const minutes = [15, 30, 45, 60, 90, 120, 180][Math.floor(Math.random() * 7)];
      const title = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
      
      const evtStart = new Date(d);
      evtStart.setHours(startHour, 0, 0, 0);
      const evtEnd = new Date(evtStart.getTime() + minutes * 60000);

      events.push({
        id: `evt_${currentId++}`,
        title,
        start: evtStart.toISOString(),
        end: evtEnd.toISOString(),
        source: 'google_calendar'
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
