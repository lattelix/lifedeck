import { Category } from '@/lib/types';

interface CategoryLegendProps {
  categories: Category[];
}

export function CategoryLegend({ categories }: CategoryLegendProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {categories.map(cat => (
        <div key={cat.id} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {cat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
