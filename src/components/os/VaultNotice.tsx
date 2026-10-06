import Link from 'next/link';
import type { VaultProblem } from '@/lib/obsidian';

export function VaultNotice({ problem, title = 'Не удалось загрузить Obsidian' }: { problem: VaultProblem; title?: string }) {
  return (
    <section className="os-card os-warning" role="status">
      <h2>{title}</h2>
      <p>{problem.message}</p>
      <p className="os-muted">Код: <code>{problem.code}</code></p>
      <Link href="/os/integrations" prefetch={false}>Проверить подключение →</Link>
    </section>
  );
}
