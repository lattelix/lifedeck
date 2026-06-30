import { getBoard, fillDays } from '@/lib/board';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const board = getBoard();

  if (!board) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ color: 'var(--text-muted)' }}
      >
        Данные доски не найдены. Запустите генерацию: pnpm mock &amp;&amp; pnpm board
      </div>
    );
  }

  const paddedDays = fillDays(board.days, 18);

  return <Dashboard board={board} paddedDays={paddedDays} />;
}
