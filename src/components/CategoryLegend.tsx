import { categories } from '@/lib/categories';

export function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {categories.map(cat => (
        <div key={cat.id} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          <span className="text-sm font-medium text-gray-700">{cat.label}</span>
        </div>
      ))}
    </div>
  );
}
