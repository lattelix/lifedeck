import boardData from '../../public/board.json';
import { Board, DayActivity } from './types';

// Статический импорт: board.json бандлится в сборку, поэтому работает и на Vercel
// (serverless-функции не всегда видят файлы из public/ через fs). Чтобы обновить
// доску — пересобрать пайплайн (pnpm board) и задеплоить заново.
export function getBoard(): Board | null {
  return boardData as unknown as Board;
}

export function intensityLevel(totalMinutes: number): 0 | 1 | 2 | 3 | 4 {
  if (totalMinutes === 0) return 0;
  if (totalMinutes <= 120) return 1;
  if (totalMinutes <= 240) return 2;
  if (totalMinutes <= 360) return 3;
  return 4;
}

export function fillDays(days: DayActivity[], weeks = 18): DayActivity[] {
  const map = new Map(days.map(d => [d.date, d]));
  
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);
  
  // Align endDate to Sunday
  const endDayOfWeek = endDate.getDay() || 7; // 1-7 (Mon-Sun)
  if (endDayOfWeek !== 7) {
    endDate.setDate(endDate.getDate() + (7 - endDayOfWeek));
  }
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (weeks * 7) + 1);

  const result: DayActivity[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    // Add timezone offset to keep correct local date
    const localCurrent = new Date(current.getTime() - current.getTimezoneOffset() * 60000);
    const dateStr = localCurrent.toISOString().split('T')[0];
    const existing = map.get(dateStr);
    
    if (existing) {
      result.push(existing);
    } else {
      result.push({
        date: dateStr,
        totalMinutes: 0,
        byCategory: {},
        activities: [],
      });
    }
    
    current.setDate(current.getDate() + 1);
  }

  return result;
}
