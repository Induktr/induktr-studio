# ⚡ INDUKTR STUDIO // AGENT QUICK-START PITCH & SYSTEM BRIEF
> **Кому:** Автономным AI-агентам, субагентам, разработчикам.  
> **Проект:** `Induktr Studio` (суверенная цифровая студия и HUD-витрина цифровых активов).  
> **Локация:** `C:\Users\USER\Documents\projects\induktr-studio` | **Среда:** Bun 1.4+ Monorepo.

---

### 1. Архитектурный каркас (Monorepo Stack)
* **Рантайм:** Bun 1.4+ Workspaces. Никакого Node/npm в качестве раннера.
* **Backend (`apps/api`):** NestJS 11, Fastify, GraphQL Code-First, Prisma 7, SQLite L1 / PostgreSQL.
* **Frontend (`apps/web`):** React 19, Vite 6, Tailwind CSS, Feature-Sliced Design (FSD v2.1).
* **Single Source of Truth (`packages/contracts`):** `@induktr/contracts` (общие Zod-схемы, DTO и интерфейсы).

---

### 2. Текущее состояние (100% Verified Baseline)
* **Тесты:** 13 сьютов, 37/37 green (`bun run test`).
* **Линтер:** Oxlint (155+ правил) — 0 ошибок, 0 ворнингов на 85+ файлах (`bun run lint`).
* **Типизация:** `tsc --build` — 0 ошибок в strict-режиме (`bun run typecheck`).
* **Сборка:** Web & API компилируются без сбоев (`apps/web/dist`).
* **Готовые экраны (10 UI модулей):** Header HUD, Hero Radar, Bento Showcase, Storefront, CLI Terminal Intake, Client Hub (Desktop + TMA Switcher), Auth Page.

---

### 3. Жесткие табу кода (Hard Invariants)
1. ❌ **Никакого `framer-motion`:** Анимации строго на GPU CSS-переменных и RAF через `useSyncExternalStore`.
2. ❌ **Никакого `class-validator`:** Вся валидация бэкенда только через `nestjs-zod` и `@induktr/contracts`.
3. ❌ **Никаких сайд-эффектов в рендере:** Запрещен `new Date()` и `watch()` внутри тела компонентов (строго соблюдать React Compiler).
4. ❌ **Никаких незакрытых нативных буферов:** Bun SQLite базы обязаны иметь LRU/TTL лимит и очистку в `onModuleDestroy`.
5. ❌ **Никаких сырых Telegram-данных:** Проверка `initData` строго по HMAC-SHA256 через `timingSafeEqual` с окном свежести `auth_date`.

---

### 4. Действующие протоколы (Rules 1–13)
* **Правила 1–10:** Детерминированный контракт выхода, изоляция контекста, SRP субагентов, read-only аудит, JIT-скиллы, IPO-мониторинг, НУ/ВУ декомпозиция, компиляторный гейткипер, Circuit Breaker ($N \ge 3$), Zero-Trust ветки.
* **Правила 11–13:** Детерминированный L1-кэш SQLite, анти-реплей криптография, Zero-Reflow RAF (остановка при 0 подписчиков, `scaleY` трансформация).

---

### 5. Дорожная карта задач (Active Backlog)
1. **Web Worker Swarm Matrix:** Вынос графовой топологии AI в Worker через `SharedArrayBuffer`.
2. **Anti-Replay Nonce Store:** Регистрация одноразовых нонсов авторизации в L1 кэше.
3. **Offline IndexedDB Storage:** Кэширование витрины и лидов с квотой `navigator.storage.persist()`.
4. **Telegram Stars & Web3 Pay:** Автоматическая генерация инвойсов и крипто-эквайринг.

---

### 6. Команды сдачи задачи (Definition of Done)
Перед завершением любого шага выполни:
```bash
bun run lint            # 0 warnings
bun run test            # 100% green
bun run typecheck       # 0 errors
bun run --filter @induktr/web build
```
Если `Exit Code != 0` — задача не считается завершенной.
