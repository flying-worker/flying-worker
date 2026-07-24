# Flying Worker — Project Overview for Claude

## What Is This?

**Flying Worker** is a Laravel-inspired full-stack framework for **Cloudflare Workers**. It provides familiar Laravel-like DX on the serverless edge using:

- **Hono** — Web framework (routing, middleware)
- **React 19** — Frontend
- **Inertia.js 2** — Seamless server-driven SPA (no API boilerplate)
- **Cloudflare Workers** — Runtime
- **Cloudflare D1** — SQLite database
- **Cloudflare KV** — Session storage
- **Cloudflare R2** — File storage
- **Vite 7** — Build tool
- **TypeScript** — Fully typed

---

## Directory Structure

```
src/                        # Framework core (the library itself)
├── auth/                   # AuthManager + Social OAuth
├── core/                   # App bootstrap, DI container, Request
├── session/                # Session drivers (KV + cookie)
├── route/                  # Route registration & grouping
├── middlewares/            # Built-in middlewares
├── inertia/                # Inertia.js integration + Vite plugin
├── storage/                # R2FileManager
├── database/               # D1 helper
├── cookie/                 # Signed/unsigned cookie utils
├── supports/               # Str, Encrypt, Utilities helpers
├── type-declaration/       # All TypeScript interfaces
└── zod-schema/             # Zod validation schemas

example/                    # Example application (usage reference)
├── bootstrap/App.tsx       # App initialization entry
├── config/                 # All config files (app, auth, session, cors, etc.)
├── routes/web.tsx          # Inertia web routes
├── routes/api.ts           # API routes
└── resources/js/           # React app (Pages/, app.jsx)

server.ts                   # Cloudflare Worker entry point
wrangler.jsonc              # Cloudflare Wrangler config
vite.config.ts              # Vite config
```

---

## Core Concepts

### Application Bootstrap (`src/core/Application.ts`)
Singleton `App` that:
1. Loads config
2. Wires middleware pipeline (global → web → api)
3. Loads routes
4. Exposes `App.hono` (the Hono instance)

### Routing (`src/route/Route.ts`)
```typescript
Route.get("/", handler)
Route.post("/users", [UserController, "store"])
Route.group("/admin", () => {
  Route.get("/dashboard", handler)
}, ["auth"])
```

### Authentication (`src/auth/Auth.ts`)
Guard-based system, mirrors Laravel:
```typescript
Auth.guard("web").login(user)       // session-based
Auth.guard("api").login(user)       // JWT-based
Auth.check()                        // is logged in?
Auth.user()                         // get authenticated user
```
Supports: session, JWT, OAuth (Google, GitHub, LinkedIn, Twitter)

### Session (`src/session/Session.ts`)
```typescript
Session.put("key", value)
Session.get("key", default)
Session.flash("success", "Saved!")
Session.getFlash("success")
Session.regenerate()
```
Drivers: `kv` (Cloudflare KV) or `cookie` (signed)

### Inertia Rendering (`src/inertia/index.ts`)
```typescript
App.hono.get("/", c => inertiaRender("Home", { user: Auth.user() }))
```
Automatically returns JSON for XHR or full HTML for first load.

### File Storage (`src/storage/R2FileManager.ts`)
```typescript
const storage = new R2FileManager(config)
await storage.upload(file)
await storage.get(key)
await storage.delete(key)
```

### Request (`src/core/request/index.ts`)
Global `AppRequest` singleton:
```typescript
AppRequest.input("name")
AppRequest.all()
AppRequest.header("Authorization")
AppRequest.ip()
```

---

## Configuration Files (`example/config/`)

| File | Purpose |
|---|---|
| `app.ts` | App name, secret, env, maintenance mode |
| `auth.ts` | Auth guards (session/JWT), user/token tables |
| `session.ts` | Driver, lifetime, cookie options |
| `cors.ts` | Origins, methods, headers |
| `csrf.ts` | Excluded paths |
| `middlewares.ts` | Register global/web/api middlewares |
| `r2.ts` | R2 bucket, public URL, allowed types |
| `social-auth.ts` | OAuth client IDs/secrets |
| `database.ts` | D1 connection config |
| `queue.ts` | Queue workers config |
| `event-listener.ts` | App event handlers |

---

## Middleware Pipeline

```
Request → Global (MaintenanceMode) → Web (Session, CSRF) → Route handler
                                  → API (Cors, JWT) → Route handler
```

Custom middlewares extend `BaseMiddleware`:
```typescript
class MyMiddleware extends BaseMiddleware {
  async boot(context: Context, next: Next) {
    // before
    await next()
    // after
  }
}
```

---

## Development Workflow

```bash
# Dev server
npm run dev

# Build
npm run build

# Deploy to Cloudflare
npx wrangler deploy
```

Vite dev server proxies to Cloudflare Worker. Inertia assets auto-reload.

---

## Key Patterns to Follow

1. **Always use `App.hono` for Inertia routes** — use `inertiaRender()`
2. **Use `Route` helper for API routes** — cleaner syntax
3. **Config is the source of truth** — change behavior via `example/config/`
4. **Guards are separate** — web uses sessions, api uses JWT
5. **Session middleware must run before CSRF** — order matters in `middlewares.ts`
6. **R2FileManager requires config object** — pass `r2Config` from `config/r2.ts`

---

## Cloudflare Bindings (wrangler.jsonc)

```
env.kv     → KV namespace for sessions
env.DB     → D1 SQLite database
env.AI     → Cloudflare Workers AI
env.BUCKET → R2 bucket for files
```

Bindings are typed in `example/types/declarations.d.ts`.
