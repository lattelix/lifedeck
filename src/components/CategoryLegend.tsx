import { Category } from '@/lib/types';

interface CategoryLegendProps {
  categories: Category[];
}

export function CategoryLegend({ categories }: CategoryLegendProps) {
  if (categories.length === 0) {
    return <span className="legend-empty">Нет активных категорий</span>;
  }

  return (
    <div className="category-legend">
      {categories.map(cat => (
        <div key={cat.id} className="legend-item">
          <span
            className="legend-dot"
            style={{ backgroundColor: cat.color }}
          />
          <span>{cat.label}</span>
        </div>
      ))}
    </div>
  );
}
