'use client';

import { useState } from 'react';
import { Board } from '@/lib/types';
import { FilterState } from '@/hooks/useBoardFilters';

interface SettingsModalProps {
  board: Board;
  filters: FilterState;
  onToggleSource: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onToggleItem: (id: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onClose: () => void;
}

export function SettingsModal({
  board,
  filters,
  onToggleSource,
  onToggleCategory,
  onToggleItem,
  theme,
  onToggleTheme,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-modal custom-scrollbar" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Настройки доски
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Theme toggle */}
        <div className="flex items-center justify-between py-3 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {theme === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
          </span>
          <div
            className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
            onClick={onToggleTheme}
          />
        </div>

        {/* Filter tree */}
        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          Фильтры активностей
        </div>

        <div className="flex flex-col gap-1">
          {board.sources.map(source => (
            <SourceNode
              key={source.id}
              source={source}
              board={board}
              filters={filters}
              onToggleSource={onToggleSource}
              onToggleCategory={onToggleCategory}
              onToggleItem={onToggleItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Source level ──────────────────────────────────────────────
function SourceNode({
  source,
  board,
  filters,
  onToggleSource,
  onToggleCategory,
  onToggleItem,
}: {
  source: Board['sources'][0];
  board: Board;
  filters: FilterState;
  onToggleSource: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onToggleItem: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const sourceItems = board.items.filter(i => i.sourceId === source.id);
  const categoryIds = [...new Set(sourceItems.map(i => i.categoryId))];

  return (
    <div>
      <div className="tree-toggle" onClick={() => setExpanded(!expanded)}>
        <Chevron expanded={expanded} />
        <div
          className={`toggle-switch ${filters.sources[source.id] ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleSource(source.id); }}
          style={{ transform: 'scale(0.85)' }}
        />
        <span className="font-medium">{source.label}</span>
      </div>

      {expanded && (
        <div className="tree-node">
          {categoryIds.map(catId => {
            const cat = board.categories.find(c => c.id === catId);
            if (!cat) return null;
            return (
              <CategoryNode
                key={catId}
                category={cat}
                items={sourceItems.filter(i => i.categoryId === catId)}
                filters={filters}
                onToggleCategory={onToggleCategory}
                onToggleItem={onToggleItem}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Category level ───────────────────────────────────────────
function CategoryNode({
  category,
  items,
  filters,
  onToggleCategory,
  onToggleItem,
}: {
  category: Board['categories'][0];
  items: Board['items'];
  filters: FilterState;
  onToggleCategory: (id: string) => void;
  onToggleItem: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="tree-toggle" onClick={() => setExpanded(!expanded)}>
        <Chevron expanded={expanded} />
        <div
          className={`toggle-switch ${filters.categories[category.id] ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleCategory(category.id); }}
          style={{ transform: 'scale(0.85)' }}
        />
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
        <span>{category.label}</span>
      </div>

      {expanded && (
        <div className="tree-node">
          {items.map(item => (
            <div key={item.id} className="tree-toggle" style={{ paddingLeft: 4 }}>
              <div
                className={`toggle-switch ${filters.items[item.id] ? 'active' : ''}`}
                onClick={() => onToggleItem(item.id)}
                style={{ transform: 'scale(0.8)' }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chevron icon ─────────────────────────────────────────────
function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`tree-chevron ${expanded ? 'expanded' : ''}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
