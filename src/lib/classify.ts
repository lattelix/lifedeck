import { categories } from './categories';
import { classifyToItem } from './items';

const rules: Record<string, string[]> = {
  work: ['grownet', 'talentbay', 'админк', 'devops', 'работа', 'созвон', 'meeting', 'стендап'],
  study: ['синергия', 'школа 21', 'лекция', 'курс', 'вкр', 'учеб'],
  algorithms: ['алгоритм', 'leetcode', 'кодерун', 'codewars', 'задач'],
  languages: ['english', 'английск', 'язык', 'duolingo', 'english file'],
  projects: ['проект', 'mvp', 'дизайн', 'figma', 'лендинг', 'second brain', 'liveprofile', 'livеprofile'],
};

/**
 * Classify event title → { categoryId, itemId }.
 * Uses item registry first, falls back to legacy keyword rules, then LLM.
 */
export async function classifyEvent(title: string): Promise<{ categoryId: string; itemId: string }> {
  // 1. Try item-level classification (keyword match)
  const item = classifyToItem(title);
  if (item.id !== 'other') {
    return { categoryId: item.categoryId, itemId: item.id };
  }

  // 2. Fallback to legacy category-level rules
  const lowerTitle = title.toLowerCase();
  for (const [catId, keywords] of Object.entries(rules)) {
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      return { categoryId: catId, itemId: 'other' };
    }
  }

  // 3. LLM adapter (optional)
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
            { role: 'user', content: title }
          ],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        if (result && categories.some(c => c.id === result)) {
          return { categoryId: result, itemId: 'other' };
        }
      }
    } catch (e) {
      console.error('LLM classification failed, falling back to default:', e);
    }
  }

  return { categoryId: 'personal', itemId: 'other' };
}
