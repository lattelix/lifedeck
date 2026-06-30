import { Category } from './types';

export const categories: Category[] = [
  { id: 'work', label: 'Работа', color: '#1B2BE0' },
  { id: 'study', label: 'Учёба', color: '#16A34A' },
  { id: 'algorithms', label: 'Алгоритмы', color: '#9333EA' },
  { id: 'languages', label: 'Языки', color: '#EA580C' },
  { id: 'projects', label: 'Проекты', color: '#0891B2' },
  { id: 'personal', label: 'Личное', color: '#6B7280' },
];

export const CATEGORY_IDS = categories.map(c => c.id);
