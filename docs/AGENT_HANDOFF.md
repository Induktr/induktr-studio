# INDUKTR STUDIO // SYSTEM CONTEXT & AGENT HANDOFF DOSSIER
> **Target Audience:** Autonomous AI Agents, Lead Engineers, Subagents.  
> **Status:** Active Production Architecture (Bun Monorepo, React 19, NestJS 11, Prisma 7).  
> **Canonical Path:** `C:\Users\USER\Documents\projects\induktr-studio`

---

## 1. MISSION & IDENTITY

**Induktr Studio** — это суверенная цифровая инженерная лаборатория и экосистема прямого взаимодействия с клиентами нового поколения. Проект объединяет:
1. **Ultra-Performance Portfolio & HUD Terminal:** Кинематический фронтенд с тактильной инженерной эстетикой (Tactical Dark, Neon Amber / Cyber Cyan, 60+ FPS compositor animations).
2. **Digital Engineering Storefront:** Витрина цифровых активов (архитектурные чит-листы, дизайн-системы, production-ready бойлерплейты) с моментальной выдачей через защищенные пресайнед-ссылки.
3. **Omnichannel Client Hub & Telegram Mini App:** Единый центр управления заказами с поддержкой бесшовного переключения между десктопным веб-интерфейсом и нативным Telegram WebApp (TMA).
4. **Idempotent CLI Intake Pipeline:** Инженерный терминал брифинга проектов с гарантированной дедупликацией лидов, Zod-валидацией и мгновенной доставкой через Telegram Bot Webhook.

---

## 2. MONOREPO TOPOLOGY & ARCHITECTURE

Репозиторий построен на базе **Bun 1.4+ Workspaces** с максимальным упором на изоляцию слоев, zero-duplication контрактов и скорость сборки.

```
induktr-studio/
├── apps/
│   ├── api/                    # NestJS 11 Core (Fastify, GraphQL Code-First, Prisma 7)
│   │   ├── prisma/             # schema.prisma & SQLite/Postgres миграции
│   │   ├── schema.gql          # Автосгенерированная AST GraphQL схема
│   │   └── src/
│   │       ├── common/         # ZodValidationPipe, Guards, Interceptors
│   │       └── modules/
│   │           ├── auth/       # Telegram HMAC-SHA256, JWT, Demo Gateway
│   │           ├── ecommerce/  # Заказы, presigned download URLs, каталог
│   │           ├── lead/       # Прием лидов, идемпотентность, CRM
│   │           ├── prisma/     # PrismaService с $connect / $disconnect
│   │           └── telegram/   # Webhook контроллер и рассылка уведомлений
│   └── web/                    # React 19 Frontend (Vite 6, FSD Architecture)
│       └── src/
│           ├── app/            # App root, Redux Toolkit Store (auth-slice)
│           ├── pages/          # AuthPage, HomePage
│           ├── widgets/        # Header, Hero, Showcase, Storefront, ClientHub, Footer
│           ├── features/       # LeadForm (CLI terminal), Telegram Auth Handshake
│           ├── entities/       # ProductCard, MilestoneTracker
│           └── shared/         # URQL GraphQL client, CSS Tokens, Engine Stores:
│               ├── lib/stores/ # React 19 useSyncExternalStore (Telemetry & Browser)
│               └── styles/     # tokens.css (Design System, Cyber Tactical Palettes)
├── packages/
│   └── contracts/              # @induktr/contracts (Single Source of Truth)
│       └── src/index.ts        # Zod схемы, DTO типы, общие интерфейсы
└── docs/                       # Системная и архитектурная документация
```

---

## 3. STRICT INVARIANTS (НЕПРИКОСНОВЕННЫЕ ПРАВИЛА КОДА)

Любой агент, вносящий изменения, **ОБЯЗАН** строго соблюдать следующие правила:

### ❌ 1. Полный запрет на `framer-motion`
- `framer-motion` запрещен из-за избыточного веса бандла и проблем с конкарренси в React 19.
- Анимации строятся **исключительно** на:
  - GPU-ускоренных CSS переменных и трансформациях (`transform`, `opacity`, `translate3d`).
  - Легковесном RAF-движке и `useSyncExternalStore` (zero-allocation цикл обновления).

### ❌ 2. Полный запрет на `class-validator` и `class-transformer`
- Валидация бэкенда полностью мигрирована на **`nestjs-zod`** и единые схемы `@induktr/contracts`.
- DTO определяются через `class MyDto extends createZodDto(MyZodSchema) {}` с сопутствующими `@InputType()` / `@ObjectType()` / `@Field()` декораторами для GraphQL.
- Рассинхронизация между Prisma-моделями, Zod-контрактами и GraphQL-типами недопустима.

### ⚡ 3. Стандарты React 19 и React Compiler
- **Никаких сайд-эффектов и вызовов типа `new Date()` внутри рендера** (это нарушает строгую чистоту React Compiler и отлавливается Oxlint).
- Для синхронизации с браузером (`window.ononline`, `window.matchMedia`, RAF telemetry loop) **строго использовать `useSyncExternalStore`**, а не связки `useState + useEffect`.
- В формах (`react-hook-form`): **НЕ вызывать `watch()` напрямую в теле компонента** (вызывает `react(incompatible-library)`). Использовать только хук `useWatch({ control, name })`.

### 🛡️ 4. Качество и CI/CD ворота
Каждый шаг должен завершаться проверкой:
1. `tsc --build` — 0 ошибок типизации.
2. `bun run lint` (`oxlint apps packages`) — 0 ворнингов, 0 ошибок на 85+ файлах (155+ правил).
3. `bun run test` (`vitest run`) — 100% зеленых тестов (сейчас 37 из 37 в 13 сьютах).
4. `bun run --filter @induktr/api build` и `bun run --filter @induktr/web build` — код завершения 0.

---

## 4. ТЕКУЩИЙ СТАТУС РЕАЛИЗАЦИИ (ЧТО УЖЕ СДЕЛАНО)

| Компонент / Модуль | Статус | Детали реализации |
| :--- | :---: | :--- |
| **Shared Contracts** | ✅ Завершено | `packages/contracts/src/index.ts` содержит схемы Zod для всех сущностей (Lead, User, Auth, Product, Purchase, CustomOrder). |
| **Backend Validation** | ✅ Завершено | `ZodValidationPipe` глобально подключен в `main.ts`. Сервисы валидируют выходные данные через `Schema.parse(...)`. |
| **Prisma ↔ GraphQL Sync** | ✅ Завершено | Модели `Lead`, `User`, `Product`, `Purchase`, `CustomOrder` синхронизированы в `schema.gql`. |
| **Telegram HMAC Guard** | ✅ Завершено | Защита роутов с верификацией `initData` через SHA-256 HMAC (с fallback для локального тестирования). |
| **Auth System** | ✅ Завершено | `AuthService` выдает JWT-токены, связывает Telegram ID с локальными пользователями, поддерживает Founder Demo Bypass. |
| **Redux Toolkit** | ✅ Завершено | `authSlice` управляет сессией, токеном и профилем пользователя с авто-сохранением в `localStorage`. |
| **React 19 Stores** | ✅ Завершено | `telemetry-store.ts` (RAF HUD, 60 FPS, эквалайзер) и `browser-store.ts` (network, prefers-reduced-motion, concurrency). |
| **Figma Mockups UI** | ✅ Завершено | Свёрстаны все 10 экранов: Header, Hero HUD Radar, Showcase Bento Grid, Digital Storefront, CLI Terminal Intake, Client Hub (Desktop + TMA switcher), Auth Page. |
| **React Hook Form** | ✅ Завершено | Все формы (`LeadForm`, `TokenForm`) подключены через `react-hook-form` + `zodResolver`. |

---

## 5. СЛЕДУЮЩИЕ ЭТАПЫ ЭВОЛЮЦИИ (ROADMAP ДЛЯ СЛЕДУЮЩИХ АГЕНТОВ)

Если задача требует дальнейшего развития архитектуры, приоритизированы следующие задачи:

1. **Web Worker Physics & Swarm Matrix Engine:**
   - Вынос расчетов топологии узлов AI Swarm в выделенный Web Worker с `SharedArrayBuffer` / `Transferable ArrayBuffer`, снимая нагрузку с основного UI-потока.
2. **Криптографическая защита от Replay-атак:**
   - Добавление валидации временного окна `auth_date` (не старше 24 часов) и хранилища использованных нонсов в Redis/кэше на бэкенде.
3. **Офлайн-устойчивость & IndexedDB Persistence:**
   - Настройка сервисного воркера и офлайн-кэширования запросов через IndexedDB с запросом квоты через `navigator.storage.persist()`.
4. **Native View Transitions API v2:**
   - Бесшовный пространственный морфинг между карточками Bento Grid при разворачивании деталей системы.
5. **Платежный шлюз Telegram Stars & Web3:**
   - Интеграция вебхуков оплаты через Telegram Stars (Invoice API) и прямого крипто-эквайринга с автоматической генерацией инвойсов.

---

## 6. ШПАРГАЛКА ПО КОМАНДАМ

```bash
# Установка и запуск в режиме разработки
bun install
bun run dev

# Проверка качества кода (обязательно перед завершением задачи!)
bun run lint            # oxlint apps packages
bun run test            # vitest run
bun run typecheck       # tsc --build

# Сборка пакетов
bun run --filter @induktr/contracts build
bun run --filter @induktr/api build
bun run --filter @induktr/web build

# Работа с базой данных и GraphQL
bun run prisma:generate # Генерация Prisma Client
bun run generate:schema # Регенерация apps/api/schema.gql
```
