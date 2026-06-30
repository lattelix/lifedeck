import { DayActivity } from '@/lib/types';
import { intensityLevel } from '@/lib/board';
import { categories } from '@/lib/categories';

export function ActivityHeatmap({ days }: { days: DayActivity[] }) {
  const weeks: DayActivity[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  return (
    <div className="mb-12 overflow-x-auto pb-4">
      <h2 className="text-xl font-semibold mb-4">График активности</h2>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 text-xs text-gray-400 justify-between py-1 mr-2 mt-4">
          <span>Пн</span>
          <span></span>
          <span>Ср</span>
          <span></span>
          <span>Пт</span>
          <span></span>
          <span></span>
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1 mt-4 relative group">
              {week[0].date.endsWith('-01') || (wIdx === 0 && week[0]) ? (
                 <div className="absolute -top-5 text-xs text-gray-400 whitespace-nowrap">
                   {new Date(week[0].date).toLocaleString('ru-RU', { month: 'short' })}
                 </div>
              ) : null}
              {week.map((day, dIdx) => {
                const level = intensityLevel(day.totalMinutes);
                const opacity = level === 0 ? 0.1 : level === 1 ? 0.4 : level === 2 ? 0.6 : level === 3 ? 0.8 : 1;
                
                return (
                  <div
                    key={dIdx}
                    className="w-3 h-3 rounded-sm relative group/day cursor-pointer transition-transform hover:scale-125"
                    style={{
                      backgroundColor: level === 0 ? '#E5E7EB' : '#1B2BE0',
                      opacity: level === 0 ? 1 : opacity
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white border border-gray-100 shadow-lg p-3 rounded-lg opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all z-10 pointer-events-none">
                      <div className="text-sm font-medium mb-1">
                        {new Date(day.date).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Всего: {Math.floor(day.totalMinutes / 60)}ч {day.totalMinutes % 60}м
                      </div>
                      <div className="flex flex-col gap-1">
                        {Object.entries(day.byCategory).map(([catId, mins]) => {
                          const cat = categories.find(c => c.id === catId);
                          if (!cat || mins === 0) return null;
                          return (
                            <div key={catId} className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="flex-1">{cat.label}</span>
                              <span className="text-gray-500 font-medium">
                                {Math.floor(mins / 60)}ч {mins % 60}м
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
