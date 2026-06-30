import { getBoard, fillDays } from '@/lib/board';
import { ProfileHeader } from '@/components/ProfileHeader';
import { CategoryLegend } from '@/components/CategoryLegend';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { ActivityFeed } from '@/components/ActivityFeed';

export default function Home() {
  const board = getBoard();

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Данные доски не найдены. Пожалуйста, запустите генерацию (npm run mock && npm run board).
      </div>
    );
  }

  const paddedDays = fillDays(board.days, 18);

  return (
    <main className="min-h-screen py-12 px-4 sm:px-8">
      <div className="max-w-[1100px] mx-auto bg-white rounded-3xl p-6 sm:p-12 shadow-sm border border-gray-100">
        <ProfileHeader profile={board.profile} />
        <CategoryLegend />
        <ActivityHeatmap days={paddedDays} />
        <ActivityFeed days={board.days} />
      </div>
    </main>
  );
}
