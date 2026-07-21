# Second Brain OS — Live Activity Board

[Концепция продукта](docs/product-concept.md) · [План разработки](docs/development-plan.md)

Self-owned публичный профиль и личный дашборд: реальные активности из разных ресурсов
нормализуются в один контракт и показываются как GitHub-style heatmap.

Главный принцип: не выдумывать данные. Каждый ресурс подключается отдельным адаптером,
включается/выключается через `connectors.config.json`, а UI строит дерево настроек из
готового `public/board.json`.

## Запуск

1. Установка зависимостей:
   ```bash
   pnpm install
   ```

2. Сборка доски:
   ```bash
   pnpm board
   ```
   Скрипт обходит включенные коннекторы и генерирует `public/board.json`.

3. Запуск приложения:
   ```bash
   pnpm dev
   ```
   Откройте [http://localhost:3000](http://localhost:3000).

4. Production-проверка:
   ```bash
   pnpm build
   ```

Мок календаря остается только dev-инструментом:

```bash
pnpm mock
```

По умолчанию `calendar` выключен в `connectors.config.json`, чтобы production-доска
не содержала синтетические события до подключения реального Google Calendar OAuth.

## Источники

Текущие адаптеры:

- `scripts/connectors/github.mjs` — GitHub public Events API.
- `scripts/connectors/leetcode.mjs` — LeetCode GraphQL `submissionCalendar`.
- `scripts/connectors/codewars.mjs` — Codewars public API.
- `scripts/connectors/calendar.mjs` — dev/mock из `data/events.raw.json`.

Адаптер экспортирует:

```js
export const meta = { id: 'github', label: 'GitHub' };
export async function collect(config) {
  return { source, items, activities };
}
```

`activity`:

```ts
{
  id: string;
  title: string;
  categoryId: string;
  sourceId: string;
  itemId: string;
  minutes: number;
  date: string; // YYYY-MM-DD
}
```

Адаптеры должны быть устойчивыми: сеть, 404 или пустой профиль возвращают пустой результат,
а не роняют сборку.

## Контракт данных v2

`board.json` содержит:
- `profile` — имя и подпись
- `categories[]` — категории с цветами
- `sources[]` — источники данных (calendar, github, ...)
- `items[]` — конкретные дела (GrowNet, LeetCode, ...) с привязкой к категории и источнику
- `days[]` — дни с активностями, каждая активность содержит `categoryId`, `sourceId`, `itemId`

UI целиком строится из `board.json` — дерево настроек, фильтры, легенда, heatmap.

## Как добавить новый источник

1. Создайте `scripts/connectors/<id>.mjs`.
2. Экспортируйте `meta` и `collect(config)`.
3. Зарегистрируйте модуль в `REGISTRY` внутри `scripts/build-board.mjs`.
4. Добавьте источник в `connectors.config.json`.
5. Запустите `pnpm board && pnpm build`.

Не добавляйте универсальный LLM-парсер как основной путь. Новый ресурс — маленький
адаптер к конкретному API/странице, общий контракт и общий агрегатор.

## Как подключить LLM (опционально)

LLM используется только опционально для классификации calendar-событий. Для включения:
1. Создайте файл `.env` в корне проекта
2. Добавьте следующие переменные:
   ```env
   LLM_BASE_URL="https://api.openai.com/v1"
   LLM_API_KEY="ваш-ключ"
   LLM_MODEL="gpt-4o-mini"
   ```

## Автообновление

`.github/workflows/update-board.yml` запускается ежедневно и вручную через
`workflow_dispatch`:

1. устанавливает зависимости;
2. запускает `pnpm board`;
3. проверяет `pnpm lint` и `pnpm build`;
4. коммитит измененный `public/board.json`.

После push Vercel заново деплоит сайт со свежим статически импортированным `board.json`.
Для GitHub-коннектора workflow передает `secrets.GITHUB_TOKEN` как `GITHUB_TOKEN`.

## Decisions (Принятые решения)

- **v2 контракт:** Board включает `sources[]` и `items[]`. Каждая Activity теперь несёт `sourceId` и `itemId`. Дерево настроек строится из этих массивов динамически.
- **Obsidian-палитра:** Тёмная тема: фон `#1E1E1E`, панели `#262626`, текст `#DCDDDE`. Светлая: фон `#FAFAFA`, панели `#FFFFFF`. Акцент `#7C3AED` (оба режима).
- **CSS-переменные + `.dark` класс:** Тема реализована через CSS custom properties, переключаемые классом `.dark` на `<html>`. Без Tailwind dark-mode variant — для полного контроля.
- **Glassmorphism:** Сайдбар, карточки, модалка и тултипы используют `backdrop-filter: blur()` + полупрозрачный фон + тонкая граница.
- **Adapter pattern:** Общее ядро в `scripts/build-board.mjs`, данные источников — в маленьких `scripts/connectors/*.mjs`.
- **Статический `board.json`:** `src/lib/board.ts` импортирует `public/board.json` статически, поэтому обновление данных требует `pnpm board` и нового деплоя.
- **Фильтры в localStorage:** Состояние тумблеров (source/category/item) хранится в `board-filters`, тема — в `theme`. При изменении board.json новые items/sources подхватываются через merge с defaults.
- **ActivityFeed удалён:** По ТЗ. Вся визуализация — через heatmap + тултипы.
- **Каскадные тумблеры:** Выключение источника гасит все его дела и пересчитывает категории. Выключение категории гасит все дела в ней. Выключение последнего дела гасит родителя.
- **Доминантный цвет ячейки:** Ячейка heatmap окрашивается в цвет категории с наибольшим количеством минут за день.
- **ThemeScript:** Inline-скрипт в `<head>` читает localStorage до гидратации React, предотвращая flash of wrong theme.

## TODO

- [ ] Реальный OAuth для Google Calendar вместо генератора
- [x] GitHub-источник (public events API)
- [x] LeetCode-источник (submission calendar)
- [x] Codewars-источник (completed kata API)
- [ ] Бронь-виджет (пока не реализован)
- [ ] Консьерж ИИ (пока не реализован)
- [x] Деплой на Vercel + кастомный поддомен

## Известные ограничения

- `calendar` пока mock/dev-источник и выключен в production-конфиге.
- Фильтры работают только на клиенте (localStorage) — серверный рендер всегда показывает все данные до гидратации.
- При множестве категорий с одинаковыми минутами доминантный цвет ячейки выбирается по первому в алфавитном порядке.
