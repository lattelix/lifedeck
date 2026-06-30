import { Item } from './types';

export interface ItemDef extends Item {
  keywords: string[];
}

export const items: ItemDef[] = [
  // work / calendar
  { id: 'grownet', label: 'GrowNet', categoryId: 'work', sourceId: 'calendar', keywords: ['grownet'] },
  { id: 'talentbay', label: 'TalentBay', categoryId: 'work', sourceId: 'calendar', keywords: ['talentbay'] },
  { id: 'work-meeting', label: 'Созвоны', categoryId: 'work', sourceId: 'calendar', keywords: ['созвон', 'meeting', 'стендап', 'weekly'] },
  { id: 'work-general', label: 'Работа (общее)', categoryId: 'work', sourceId: 'calendar', keywords: ['админк', 'devops', 'работа', 'фич'] },

  // study / calendar
  { id: 'synergy', label: 'Синергия', categoryId: 'study', sourceId: 'calendar', keywords: ['синергия', 'вкр'] },
  { id: 'school21', label: 'Школа 21', categoryId: 'study', sourceId: 'calendar', keywords: ['школа 21'] },
  { id: 'study-general', label: 'Учёба (общее)', categoryId: 'study', sourceId: 'calendar', keywords: ['лекция', 'курс', 'учеб'] },

  // algorithms / calendar
  { id: 'codewars', label: 'Codewars', categoryId: 'algorithms', sourceId: 'calendar', keywords: ['codewars', 'кодерун'] },
  { id: 'leetcode', label: 'LeetCode', categoryId: 'algorithms', sourceId: 'calendar', keywords: ['leetcode'] },
  { id: 'algo-general', label: 'Алгоритмы (общее)', categoryId: 'algorithms', sourceId: 'calendar', keywords: ['алгоритм', 'задач'] },

  // languages / calendar
  { id: 'english-file', label: 'English File', categoryId: 'languages', sourceId: 'calendar', keywords: ['english file', 'english class', 'английск'] },
  { id: 'lang-general', label: 'Языки (общее)', categoryId: 'languages', sourceId: 'calendar', keywords: ['язык'] },

  // projects / calendar
  { id: 'second-brain', label: 'Second Brain OS', categoryId: 'projects', sourceId: 'calendar', keywords: ['second brain'] },
  { id: 'liveprofile', label: 'LiveProfile', categoryId: 'projects', sourceId: 'calendar', keywords: ['liveprofile', 'livеprofile'] },
  { id: 'projects-general', label: 'Проекты (общее)', categoryId: 'projects', sourceId: 'calendar', keywords: ['проект', 'mvp', 'дизайн', 'figma', 'лендинг'] },

  // personal / calendar (fallback)
  { id: 'other', label: 'Прочее', categoryId: 'personal', sourceId: 'calendar', keywords: [] },
];

/**
 * Classify an event title to an item id.
 * Returns the matching item, or the 'other' fallback.
 */
export function classifyToItem(title: string): ItemDef {
  const lower = title.toLowerCase();
  for (const item of items) {
    if (item.keywords.length > 0 && item.keywords.some(kw => lower.includes(kw))) {
      return item;
    }
  }
  return items.find(i => i.id === 'other')!;
}
