import { categories } from './categories';

const rules: Record<string, string[]> = {
  work: ['grownet', 'talentbay', 'админк', 'devops', 'работа', 'созвон', 'meeting', 'стендап'],
  study: ['синергия', 'школа 21', 'лекция', 'курс', 'вкр', 'учеб'],
  algorithms: ['алгоритм', 'leetcode', 'кодерун', 'codewars', 'задач'],
  languages: ['english', 'английск', 'язык', 'duolingo', 'english file'],
  projects: ['проект', 'mvp', 'дизайн', 'figma', 'лендинг', 'second brain', 'liveprofile', 'livеprofile'],
};

export async function classifyEvent(title: string): Promise<string> {
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
