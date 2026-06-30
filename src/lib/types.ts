export interface Profile {
  name: string;
  tagline: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  label: string;
  color: string;
}

export interface Source {
  id: string;
  label: string;
}

export interface Item {
  id: string;
  label: string;
  categoryId: string;
  sourceId: string;
}

export interface Activity {
  id: string;
  title: string;
  categoryId: string;
  sourceId: string;
  itemId: string;
  minutes: number;
  source: string;
}

export interface DayActivity {
  date: string;
  totalMinutes: number;
  byCategory: Record<string, number>;
  activities: Activity[];
}

export interface Board {
  profile: Profile;
  categories: Category[];
  sources: Source[];
  items: Item[];
  days: DayActivity[];
}

export interface RawEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source: string;
}
