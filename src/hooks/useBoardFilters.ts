'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { Board } from '@/lib/types';

export interface FilterState {
  sources: Record<string, boolean>;
  categories: Record<string, boolean>;
  items: Record<string, boolean>;
}

const STORAGE_KEY = 'board-filters';
const FILTERS_CHANGE_EVENT = 'board-filters-change';

function buildDefaultState(board: Board): FilterState {
  return {
    sources: Object.fromEntries(board.sources.map(s => [s.id, true])),
    categories: Object.fromEntries(board.categories.map(c => [c.id, true])),
    items: Object.fromEntries(board.items.map(i => [i.id, true])),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeBooleanSection(
  defaults: Record<string, boolean>,
  stored: unknown,
): Record<string, boolean> {
  if (!isRecord(stored)) return defaults;

  const next = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (typeof stored[key] === 'boolean') {
      next[key] = stored[key];
    }
  }
  return next;
}

function mergeStoredState(board: Board, stored: string | null): FilterState {
  const defaults = buildDefaultState(board);
  if (!stored) return defaults;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return defaults;

    return {
      sources: mergeBooleanSection(defaults.sources, parsed.sources),
      categories: mergeBooleanSection(defaults.categories, parsed.categories),
      items: mergeBooleanSection(defaults.items, parsed.items),
    };
  } catch {
    return defaults;
  }
}

function subscribeFilters(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(FILTERS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(FILTERS_CHANGE_EVENT, onStoreChange);
  };
}

function getFiltersSnapshot() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerFiltersSnapshot() {
  return null;
}

export function useBoardFilters(board: Board) {
  const storedFilters = useSyncExternalStore(
    subscribeFilters,
    getFiltersSnapshot,
    getServerFiltersSnapshot,
  );
  const filters = useMemo(
    () => mergeStoredState(board, storedFilters),
    [board, storedFilters],
  );

  const persist = useCallback((state: FilterState) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(FILTERS_CHANGE_EVENT));
  }, []);

  const toggleSource = useCallback((sourceId: string) => {
    const newEnabled = !filters.sources[sourceId];
    const next = { ...filters, sources: { ...filters.sources, [sourceId]: newEnabled } };

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

    persist(next);
  }, [board, filters, persist]);

  const toggleCategory = useCallback((categoryId: string) => {
    const newEnabled = !filters.categories[categoryId];
    const next = {
      ...filters,
      categories: { ...filters.categories, [categoryId]: newEnabled },
    };

    // Cascade: toggle all items in this category
    for (const item of board.items) {
      if (item.categoryId === categoryId) {
        next.items = { ...next.items, [item.id]: newEnabled };
      }
    }

    persist(next);
  }, [board, filters, persist]);

  const toggleItem = useCallback((itemId: string) => {
    const newEnabled = !filters.items[itemId];
    const next = {
      ...filters,
      items: { ...filters.items, [itemId]: newEnabled },
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

    persist(next);
  }, [board, filters, persist]);

  return { filters, toggleSource, toggleCategory, toggleItem };
}
