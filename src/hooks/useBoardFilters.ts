'use client';

import { useCallback, useEffect, useState } from 'react';
import { Board } from '@/lib/types';

export interface FilterState {
  sources: Record<string, boolean>;
  categories: Record<string, boolean>;
  items: Record<string, boolean>;
}

const STORAGE_KEY = 'board-filters';

function buildDefaultState(board: Board): FilterState {
  return {
    sources: Object.fromEntries(board.sources.map(s => [s.id, true])),
    categories: Object.fromEntries(board.categories.map(c => [c.id, true])),
    items: Object.fromEntries(board.items.map(i => [i.id, true])),
  };
}

export function useBoardFilters(board: Board) {
  const [filters, setFilters] = useState<FilterState>(() => buildDefaultState(board));

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FilterState>;
        const defaults = buildDefaultState(board);

        // Merge: keep stored values for known keys, add defaults for new ones
        setFilters({
          sources: { ...defaults.sources, ...parsed.sources },
          categories: { ...defaults.categories, ...parsed.categories },
          items: { ...defaults.items, ...parsed.items },
        });
      }
    } catch {
      // ignore
    }
  }, [board]);

  const save = useCallback((state: FilterState) => {
    setFilters(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const toggleSource = useCallback((sourceId: string) => {
    setFilters(prev => {
      const newEnabled = !prev.sources[sourceId];
      const next = { ...prev, sources: { ...prev.sources, [sourceId]: newEnabled } };

      // Cascade: disable all items that belong to this source
      for (const item of board.items) {
        if (item.sourceId === sourceId) {
          next.items = { ...next.items, [item.id]: newEnabled };
        }
      }

      // Also cascade category: if all items in a category are disabled, disable category
      for (const cat of board.categories) {
        const catItems = board.items.filter(i => i.categoryId === cat.id);
        const anyOn = catItems.some(i => next.items[i.id]);
        next.categories = { ...next.categories, [cat.id]: anyOn };
      }

      save(next);
      return next;
    });
  }, [board, save]);

  const toggleCategory = useCallback((categoryId: string) => {
    setFilters(prev => {
      const newEnabled = !prev.categories[categoryId];
      const next = {
        ...prev,
        categories: { ...prev.categories, [categoryId]: newEnabled },
      };

      // Cascade: toggle all items in this category
      for (const item of board.items) {
        if (item.categoryId === categoryId) {
          next.items = { ...next.items, [item.id]: newEnabled };
        }
      }

      save(next);
      return next;
    });
  }, [board, save]);

  const toggleItem = useCallback((itemId: string) => {
    setFilters(prev => {
      const newEnabled = !prev.items[itemId];
      const next = {
        ...prev,
        items: { ...prev.items, [itemId]: newEnabled },
      };

      // If we turned off the last item in a category, turn off category
      const item = board.items.find(i => i.id === itemId);
      if (item) {
        const siblings = board.items.filter(i => i.categoryId === item.categoryId);
        const anyOn = siblings.some(i => (i.id === itemId ? newEnabled : next.items[i.id]));
        next.categories = { ...next.categories, [item.categoryId]: anyOn };

        // Same for source
        const sourceItems = board.items.filter(i => i.sourceId === item.sourceId);
        const anySourceOn = sourceItems.some(i => (i.id === itemId ? newEnabled : next.items[i.id]));
        next.sources = { ...next.sources, [item.sourceId]: anySourceOn };
      }

      save(next);
      return next;
    });
  }, [board, save]);

  return { filters, toggleSource, toggleCategory, toggleItem };
}
