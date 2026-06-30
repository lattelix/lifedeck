import { DayActivity } from '@/lib/types';
import { categories } from '@/lib/categories';

export function ActivityFeed({ days }: { days: DayActivity[] }) {
  const activeDays = [...days]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(d => d.activities.length > 0)
    .slice(0, 10);

  if (activeDays.length === 0) {
    return <div className="text-gray-500">Нет активности за последнее время.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Лента событий</h2>
      <div className="flex flex-col gap-8">
        {activeDays.map(day => (
          <div key={day.date} className="border-l-2 border-gray-200 pl-6 relative">
            <div className="absolute w-3 h-3 bg-gray-200 rounded-full -left-[7px] top-1 border-2 border-white" />
            <h3 className="text-sm font-semibold text-gray-500 mb-4 capitalize">
              {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <div className="flex flex-col gap-3">
              {day.activities.map(act => {
                const cat = categories.find(c => c.id === act.categoryId);
                return (
                  <div key={act.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-50 hover:shadow-md transition-shadow">
                    <div className="font-medium text-gray-800">{act.title}</div>
                    <div className="flex items-center gap-3">
                      {cat && (
                        <span
                          className="px-2.5 py-1 text-xs font-semibold rounded-full"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                      )}
                      <span className="text-sm text-gray-400 font-medium whitespace-nowrap min-w-[50px] text-right">
                        {Math.floor(act.minutes / 60) > 0 ? `${Math.floor(act.minutes / 60)}ч ` : ''}{act.minutes % 60}м
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
