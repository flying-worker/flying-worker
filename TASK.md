# Flying Worker — Task Board

> Laravel-like DX framework for Cloudflare Workers.
> Track remaining work here. Mark items `[x]` when done.

---

## DONE ✅

- [x] Application bootstrap (`src/core/Application.ts`)
- [x] Hono routing with groups and middleware support (`src/route/Route.ts`)
- [x] DI container per request (`src/core/container.ts`)
- [x] Global `AppRequest` singleton (`src/core/request/index.ts`)
- [x] Session management — KV + cookie drivers (`src/session/Session.ts`)
- [x] Session middleware (`src/middlewares/Session.ts`)
- [x] CSRF token protection — Laravel-style (`src/middlewares/CsrfToken.ts`)
- [x] CORS middleware (`src/middlewares/Cors.ts`)
- [x] Maintenance mode middleware (`src/middlewares/MaintenanceMode.ts`)
- [x] Auth system — session guard (`src/auth/Auth.ts`)
- [x] Auth system — JWT guard (`src/auth/Auth.ts`)
- [x] Social OAuth base (`src/auth/social-auth/BaseSocialAuth.ts`)
- [x] Google OAuth provider
- [x] GitHub OAuth provider
- [x] LinkedIn OAuth provider
- [x] Twitter/X OAuth provider
- [x] R2 file storage manager (`src/storage/R2FileManager.ts`)
- [x] Inertia.js rendering (`src/inertia/index.ts`)
- [x] Inertia Vite plugin with manifest generation (`src/inertia/vite-plugin.ts`)
- [x] Signed/unsigned cookie utilities (`src/cookie/index.ts`)
- [x] String helpers — snake, slug, uuid, etc. (`src/supports/Str.ts`)
- [x] Password hashing + JWT encrypt/decrypt (`src/supports/Encrypt.ts`)
- [x] TypeScript type declarations (`src/type-declaration/`)
- [x] Example app with config files (`example/`)

---

## IN PROGRESS 🔄

- [ ] **Social Auth verification** — LinkedIn, GitHub, Twitter need end-to-end testing; only Google is confirmed working
- [ ] **JwtAuth middleware** — exists at `src/middlewares/JwtAuth.ts` but needs integration test with routes
- [ ] **SessionAuth middleware** — placeholder exists at `src/middlewares/SessionAuth.ts` but not implemented

---

## TODO 📋

### 🗄️ Database Layer
- [ ] **Drizzle ORM integration** — wire `DB()` helper in `src/database/index.ts` to actual D1 connection from `example/config/database.ts`
- [ ] **Base Model class** — Laravel Eloquent-style active record (or query builder) wrapper over Drizzle
- [ ] **Migration runner** — CLI command to run D1 migrations via Wrangler
- [ ] **Seeder support** — seed scripts for D1 development data
- [ ] **Query builder helpers** — fluent API: `DB.table("users").where("id", 1).first()`

### ✅ Validation
- [ ] **Request validation class** — Laravel `$request->validate([...])` equivalent using Zod
- [ ] **Validation middleware** — automatically validate request body against a schema
- [ ] **Form request classes** — encapsulate validation rules and authorization in a class
- [ ] **Validation error response** — consistent JSON + Inertia-friendly error bag format
- [ ] **Zod schemas for all config types** — extend `src/zod-schema/jwt-guard.ts` to cover all guards

### 📬 Queue System
- [ ] **Queue config** — uncomment and implement `example/config/queue.ts`
- [ ] **Queue worker base class** — abstract `Job` class with `handle()` method
- [ ] **Cloudflare Queue binding** — connect `server.ts` `queue()` handler to job dispatch
- [ ] **Job dispatch helper** — `Queue.dispatch(new SendEmailJob(user))` facade
- [ ] **Failed job handling** — retry logic and dead letter storage

### 📡 Event System
- [ ] **Event emitter** — typed event bus for decoupled app events
- [ ] **Listener registration** — uncomment and implement `example/config/event-listener.ts`
- [ ] **Built-in events** — `UserLoggedIn`, `UserRegistered`, `FileUploaded`, etc.
- [ ] **Async listener support** — listeners dispatched to Cloudflare Queue

### 📧 Mail System
- [ ] **Mail driver interface** — abstract mailer that works with any SMTP/transactional provider
- [ ] **Resend / Mailgun / Sendgrid adapters** — popular email providers
- [ ] **Mailable class** — `new WelcomeMail(user).send()` pattern
- [ ] **Mail config** — `example/config/mail.ts` with driver, from address, etc.
- [ ] **Inertia-renderable mail templates** — React email templates using `@react-email`

### 🗃️ Cache System
- [ ] **Cache facade** — `Cache.put(key, value, ttl)`, `Cache.get(key)`, `Cache.forget(key)`
- [ ] **KV cache driver** — backed by Cloudflare KV (separate from sessions)
- [ ] **In-memory cache driver** — for request-scoped caching
- [ ] **Cache tags** — invalidate groups of cached items

### 🛡️ Error Handling
- [ ] **Global error handler middleware** — catch uncaught exceptions, return proper HTTP responses
- [ ] **HTTP exception classes** — `NotFoundException`, `ForbiddenException`, `ValidationException`
- [ ] **Inertia-aware error pages** — pass error to React `Error` page component
- [ ] **Error reporting** — optional Sentry/Axiom integration hook

### 🔐 Auth Improvements
- [ ] **SessionAuth middleware** — protect routes; redirect to login if unauthenticated
- [ ] **GuestMiddleware** — redirect authenticated users away from guest-only routes
- [ ] **Email verification** — mark user as verified, resend verification flow
- [ ] **Password reset** — token-based reset flow with expiration
- [ ] **Two-factor authentication (2FA)** — TOTP-based 2FA with QR code
- [ ] **Auth scaffolding** — CLI command to generate login/register/forgot-password pages

### 📤 File Uploads
- [ ] **Form upload helper** — handle `multipart/form-data` file field to R2 in one call
- [ ] **File validation rules** — `required|file|mimes:jpg,png|max:2048`
- [ ] **Temporary signed URLs** — time-limited R2 access URLs
- [ ] **Image manipulation** — resize/crop via Cloudflare Images or Sharp WASM

### 🌐 API Layer
- [ ] **API Resource classes** — transform model data for JSON responses (Laravel Resource pattern)
- [ ] **API Resource collections** — paginated resource wrapping
- [ ] **Rate limiting** — per-IP or per-user request throttling using KV counters
- [ ] **API versioning** — route group helper for `/v1`, `/v2` prefixes

### 🧪 Testing
- [ ] **Vitest setup** — configure Vitest with Cloudflare Workers environment
- [ ] **HTTP test helpers** — `TestRequest.get("/").assertStatus(200)`
- [ ] **Auth test helpers** — `actingAs(user)` for authenticated tests
- [ ] **Database test helpers** — transactions that roll back after each test
- [ ] **Factory pattern** — model factories for test data generation

### 🖥️ CLI / Artisan-like
- [ ] **`fw` CLI tool** — root command for framework tasks
- [ ] **`fw make:controller`** — scaffold controller class
- [ ] **`fw make:middleware`** — scaffold middleware class
- [ ] **`fw make:migration`** — create D1 migration file
- [ ] **`fw make:job`** — scaffold queue job class
- [ ] **`fw make:mail`** — scaffold mailable class
- [ ] **`fw route:list`** — print all registered routes

### ⏰ Scheduling
- [ ] **Task scheduler** — cron-based job runner via Cloudflare Workers Cron Triggers
- [ ] **Schedule definition** — fluent API `Schedule.call(fn).daily()`, `.weekly()`, `.cron("*/5 * * * *")`
- [ ] **Schedule config** — `example/config/schedule.ts`

### 🔄 WebSockets / Real-time
- [ ] **Cloudflare Durable Objects integration** — stateful WebSocket rooms
- [ ] **Broadcasting facade** — `Broadcast.channel("orders").emit("status", data)`
- [ ] **Pusher-compatible API** — work with Laravel Echo on the frontend

### 🧩 Frontend / Inertia Improvements
- [ ] **Shared props** — middleware that injects global props (auth user, flash) into all Inertia responses
- [ ] **Inertia partial reloads** — server-side support for `only: ["users"]` requests
- [ ] **Inertia SSR** — server-side rendering with React DOM server
- [ ] **Page layouts** — layout persistence support in `app.jsx`
- [ ] **Ziggy-style route helper** — typed route URL generator for use in React components

### 📦 Package & Publishing
- [ ] **Separate library from example** — extract `src/` as publishable npm package (`flying-worker`)
- [ ] **`create-flying-worker` CLI** — scaffold new project (like `create-react-app`)
- [ ] **Package documentation site** — VitePress or Starlight docs
- [ ] **Type-safe config builder** — exported `defineConfig()` helpers
- [ ] **Changelog & versioning** — semantic release setup

### 🔧 DX & Developer Tooling
- [ ] **Hot reload for routes** — reload routes without full Worker restart in dev
- [ ] **Debug toolbar** — request info panel in development (like Laravel Debugbar)
- [ ] **Request logging** — structured logging middleware with Axiom/Cloudflare Logpush
- [ ] **Environment validation** — fail-fast on missing required env vars at startup

---

## Priority Order (Suggested)

1. **Database Layer** — everything else depends on this
2. **Validation** — needed for forms and API
3. **Error Handling** — required for production stability
4. **Auth Improvements** (SessionAuth, password reset)
5. **Testing** — ensure framework correctness
6. **Queue + Events** — async workflows
7. **CLI tools** — developer productivity
8. **Mail** — notifications
9. **Cache** — performance
10. **Package publishing** — share with community
