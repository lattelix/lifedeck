'use client';
import Link from 'next/link';

export default function OsError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <section className="os-card os-warning" role="alert">
      <h1>Не удалось загрузить раздел</h1>
      <p>Навигация и остальные разделы доступны. Попробуй повторить запрос или проверь подключение к хранилищу.</p>
      <div className="os-inline-action">
        <button type="button" onClick={() => unstable_retry()}>Попробовать снова</button>
        <Link href="/os/integrations" prefetch={false}>Проверить подключение</Link>
      </div>
    </section>
  );
}
