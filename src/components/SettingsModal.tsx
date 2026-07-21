'use client';

import { useEffect, useState } from 'react';
import type { Board } from '@/lib/types';
import type { FilterState } from '@/hooks/useBoardFilters';

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
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal-content custom-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Публичная витрина</p>
            <h2 id="settings-title">Настройки доски</h2>
          </div>
          <button onClick={onClose} className="icon-button" type="button" aria-label="Закрыть настройки">
            <CloseIcon />
          </button>
        </div>

        <div className="setting-row">
          <div>
            <strong>Тёмная тема</strong>
            <span>Настройка хранится только в этом браузере</span>
          </div>
          <ToggleButton enabled={theme === 'dark'} onToggle={onToggleTheme} label="Тёмная тема" />
        </div>

        <div className="filter-heading">
          <strong>Опубликованные данные</strong>
          <span>Источник → категория → дело</span>
        </div>

        <div className="filter-tree">
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

function SourceNode({
  source,
  board,
  filters,
  onToggleSource,
  onToggleCategory,
  onToggleItem,
}: {
  source: Board['sources'][number];
  board: Board;
  filters: FilterState;
  onToggleSource: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onToggleItem: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const sourceItems = board.items.filter(item => item.sourceId === source.id);
  const categoryIds = [...new Set(sourceItems.map(item => item.categoryId))];

  return (
    <div className="filter-node">
      <div className="filter-row filter-row-source">
        <button
          className="filter-expand"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
        >
          <Chevron expanded={expanded} />
          <span>{source.label}</span>
        </button>
        <ToggleButton
          enabled={Boolean(filters.sources[source.id])}
          onToggle={() => onToggleSource(source.id)}
          label={`Источник ${source.label}`}
        />
      </div>

      {expanded ? (
        <div className="filter-children">
          {categoryIds.map(categoryId => {
            const category = board.categories.find(item => item.id === categoryId);
            if (!category) return null;

            return (
              <CategoryNode
                key={categoryId}
                category={category}
                items={sourceItems.filter(item => item.categoryId === categoryId)}
                filters={filters}
                onToggleCategory={onToggleCategory}
                onToggleItem={onToggleItem}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CategoryNode({
  category,
  items,
  filters,
  onToggleCategory,
  onToggleItem,
}: {
  category: Board['categories'][number];
  items: Board['items'];
  filters: FilterState;
  onToggleCategory: (id: string) => void;
  onToggleItem: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="filter-node">
      <div className="filter-row">
        <button
          className="filter-expand"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
        >
          <Chevron expanded={expanded} />
          <span className="category-dot" style={{ backgroundColor: category.color }} aria-hidden="true" />
          <span>{category.label}</span>
        </button>
        <ToggleButton
          enabled={Boolean(filters.categories[category.id])}
          onToggle={() => onToggleCategory(category.id)}
          label={`Категория ${category.label}`}
        />
      </div>

      {expanded ? (
        <div className="filter-children filter-items">
          {items.map(item => (
            <div className="filter-row" key={item.id}>
              <span className="filter-item-label">{item.label}</span>
              <ToggleButton
                enabled={Boolean(filters.items[item.id])}
                onToggle={() => onToggleItem(item.id)}
                label={`Дело ${item.label}`}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToggleButton({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      className={`toggle-switch ${enabled ? 'active' : ''}`}
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
    >
      <span />
    </button>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg className={expanded ? 'expanded' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
