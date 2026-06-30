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

export interface Activity {
  id: string;
  title: string;
  categoryId: string;
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
  days: DayActivity[];
}

export interface RawEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source: string;
}
