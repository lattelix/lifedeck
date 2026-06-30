// Общие справочники для коннекторов (зеркалят src/lib для Node-пайплайна)

export const categories = [
  { id: 'work', label: 'Работа', color: '#7C3AED' },
  { id: 'study', label: 'Учёба', color: '#16A34A' },
  { id: 'algorithms', label: 'Алгоритмы', color: '#F59E0B' },
  { id: 'languages', label: 'Языки', color: '#EA580C' },
  { id: 'projects', label: 'Проекты', color: '#0891B2' },
  { id: 'personal', label: 'Личное', color: '#6B7280' },
];

// Нормализованная активность, которую возвращает любой коннектор:
// { id, title, categoryId, sourceId, itemId, minutes, date('YYYY-MM-DD') }
