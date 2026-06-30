import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.replace(/^['"](.*)['"]$/, '$1').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const categories = [
  { id: 'work', label: 'Работа', color: '#1B2BE0' },
  { id: 'study', label: 'Учёба', color: '#16A34A' },
  { id: 'algorithms', label: 'Алгоритмы', color: '#9333EA' },
  { id: 'languages', label: 'Языки', color: '#EA580C' },
  { id: 'projects', label: 'Проекты', color: '#0891B2' },
  { id: 'personal', label: 'Личное', color: '#6B7280' },
];

const rules = {
  work: ['grownet', 'talentbay', 'админк', 'devops', 'работа', 'созвон', 'meeting', 'стендап'],
  study: ['синергия', 'школа 21', 'лекция', 'курс', 'вкр', 'учеб'],
  algorithms: ['алгоритм', 'leetcode', 'кодерун', 'codewars', 'задач'],
  languages: ['english', 'английск', 'язык', 'duolingo', 'english file'],
  projects: ['проект', 'mvp', 'дизайн', 'figma', 'лендинг', 'second brain', 'liveprofile', 'livеprofile'],
};

async function classifyEvent(title) {
  const lowerTitle = title.toLowerCase();
  const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env;

  if (LLM_BASE_URL && LLM_API_KEY && LLM_MODEL) {
    try {
      const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an event classifier. Return ONLY ONE category id from the following list that best matches the event title. Categories: ${categories.map(c => c.id).join(', ')}. If none match perfectly, choose "personal". Do not include any other text.`
            },
            {
              role: 'user',
              content: title
            }
          ],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        if (result && categories.some(c => c.id === result)) {
          return result;
        }
      }
    } catch (e) {
      console.error('LLM classification failed, falling back to rules:', e);
    }
  }

  for (const [catId, keywords] of Object.entries(rules)) {
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      return catId;
    }
  }
  return 'personal';
}

async function buildBoard() {
  const eventsFile = path.join(process.cwd(), 'data', 'events.raw.json');
  const boardFile = path.join(process.cwd(), 'public', 'board.json');

  if (!fs.existsSync(eventsFile)) {
    console.log(`[build-board] ${eventsFile} not found. Running mock generator...`);
    execSync('npm run mock', { stdio: 'inherit' });
  }

  const rawEvents = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  const daysMap = new Map();

  for (const ev of rawEvents) {
    const categoryId = await classifyEvent(ev.title);
    
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    const minutes = Math.round((end - start) / 60000);
    
    if (minutes <= 0) continue;

    const localDate = new Date(start.getTime() - start.getTimezoneOffset() * 60000);
    const dateStr = localDate.toISOString().split('T')[0];

    if (!daysMap.has(dateStr)) {
      daysMap.set(dateStr, {
        date: dateStr,
        totalMinutes: 0,
        byCategory: {},
        activities: []
      });
    }

    const day = daysMap.get(dateStr);
    day.totalMinutes += minutes;
    day.byCategory[categoryId] = (day.byCategory[categoryId] || 0) + minutes;
    day.activities.push({
      id: ev.id,
      title: ev.title,
      categoryId,
      minutes,
      source: ev.source
    });
  }

  const days = Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const profile = {
    name: "Alex",
    tagline: "Building Second Brain OS · dev & founder",
    updatedAt: new Date().toISOString()
  };

  const board = {
    profile,
    categories,
    days
  };

  const publicDir = path.dirname(boardFile);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(boardFile, JSON.stringify(board, null, 2), 'utf8');
  
  console.log(`[build-board] Processed ${rawEvents.length} events into ${days.length} days.`);
  console.log(`[build-board] Output written to ${boardFile}`);
}

buildBoard().catch(console.error);
