# Flying Worker

A Laravel-inspired full-stack framework for **Cloudflare Workers**.

Guards, sessions, middleware, controllers, flash messages and a service container — the ergonomics you expect from Laravel, running on the edge with Hono, React and Inertia. No API boilerplate: your controllers return pages, not JSON.

```ts
Route.get("/dashboard", [DashboardController, "index"], ["auth"]);

class DashboardController {
  async index(c: Context) {
    return inertiaRender("Dashboard", { user: await Auth.user() });
  }
}
```

> **Status:** `0.1.0`, early and moving. The API described here is what ships today; anything not yet merged is marked inline.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers |
| HTTP | [Hono](https://hono.dev) 4 |
| Frontend | React 19 + [Inertia.js](https://inertiajs.com) 2 |
| Database | Cloudflare D1 (SQLite) via [Drizzle ORM](https://orm.drizzle.team) |
| Sessions | Cloudflare KV, or signed cookies |
| File storage | Cloudflare R2 |
| Validation | Zod |
| Build | Vite 7 + Wrangler |
| Language | TypeScript, strict |

---

## Quick start

```bash
git clone https://github.com/flying-worker/flying-worker.git
cd flying-worker
npm install

# Create the D1 database and apply migrations locally
npx wrangler d1 create flying-worker-db      # copy the id into framework/wrangler.json
npm run db:migrate:local

npm run dev
```

The dev server runs Vite with the Cloudflare plugin, so the Worker and the React app reload together.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server + Worker |
| `npm run build` | Build the example app |
| `npm run build:pkg` | Build the `flying-worker` package for publishing |
| `npm run preview` | Preview the built Worker with Wrangler |
| `npm run typecheck` | Typecheck both workspaces |
| `npm run db:generate` | Generate migrations from your Drizzle models |
| `npm run db:migrate:local` | Apply migrations to the local D1 |
| `npm run db:migrate` | Apply migrations to the remote D1 |
| `npm run db:studio` | Open Drizzle Studio |

Deploy with `npx wrangler deploy` from `framework/`.

---

## Repository layout

This is a monorepo with two workspaces:

```
flying-worker/          # the framework package (published to npm)
└── src/
    ├── core/           # Application, bootstrap, DI container, AppRequest
    ├── route/          # Route registration and grouping
    ├── auth/           # AuthManager, guards, social OAuth
    ├── session/        # Session store (KV + cookie drivers)
    ├── middlewares/    # Built-in middleware
    ├── inertia/        # Inertia integration + Vite plugin
    ├── database/       # D1/Drizzle helper
    ├── storage/        # R2FileManager
    ├── cookie/         # Signed and unsigned cookie helpers
    ├── supports/       # Str, Encrypt, csrfToken
    ├── zod-schema/     # Built-in schemas
    └── type-declaration/

framework/              # the example application
├── bootstrap/App.tsx   # Worker entry
├── config/             # all configuration
├── routes/             # web.tsx, api.ts
├── app/
│   ├── controllers/
│   └── models/         # Drizzle schema
├── middlewares/        # app-level middleware
└── resources/
    ├── js/             # React app + Pages/
    └── views/app.tsx   # Inertia root document
```

---

## Bootstrap

`framework/bootstrap/App.tsx` is the Worker entry, referenced by `wrangler.json`'s `main` through `server.ts`:

```ts
import { createBootstrap } from "flying-worker/core";
import { renderer } from "flying-worker/renderer";

export default createBootstrap({
  loadConfig: async () => (await import("../config")).default,
  onCreate: (app) => {
    app.use(renderer);
  },
});
```

`createBootstrap` returns the Worker handler. Boot runs **once per isolate** and is memoized, atomic (the app is only published on success) and self-healing — a failed boot returns 500 and is retried cleanly on the next request rather than leaving a half-built app behind.

### Per-request isolation

A Worker isolate serves many concurrent requests. Flying Worker keeps each request's context, DI container and auth state in an `AsyncLocalStorage` store, so `Auth.user()`, `Session.get()` and `AppRequest.input()` always resolve to the correct request — never a neighbour's.

This is why the facades are safe to import as module-level singletons.

---

## Configuration

Everything lives in `framework/config/`, aggregated by `config/index.ts`:

| File | Controls |
|---|---|
| `app.ts` | Name, secret, environment, URL, maintenance mode, API prefix, route loaders |
| `auth.ts` | Guards, user/role/token tables |
| `session.ts` | Driver, lifetime, cookie name and flags |
| `database.ts` | D1 connections |
| `middlewares.ts` | Global, web, api and aliased middleware |
| `cors.ts` | Origins, methods, headers |
| `csrf.ts` | Paths excluded from CSRF |
| `inertia.ts` | Root view component |
| `r2.ts` | Bucket, public URL, size and MIME limits |
| `social-auth.ts` | OAuth client IDs and secrets |

Routes are loaded from `app.ts`, which is also where the API prefix is set:

```ts
export const appConfig: AppConfig = {
  name: "Flying Worker",
  secret: "…",                 // used to sign cookies and JWTs — move this to a secret
  apiPrefix: "api",
  webRoute: async () => { await import("../routes/web"); },
  apiRoute: async () => { await import("../routes/api"); },
};
```

> Put `secret` in a Wrangler secret (`npx wrangler secret put APP_SECRET`) before deploying. It signs your session cookies and JWTs.

---

## Routing

Two styles, both available:

```ts
// Route helper — Laravel-like
Route.get("/product", handler);
Route.post("/users", [UserController, "store"]);
Route.put("/users/:id", [UserController, "update"]);
Route.delete("/users/:id", [UserController, "destroy"]);
Route.all("/webhook", handler);

// Hono directly, for Inertia pages
App.hono.get("/", (c) => inertiaRender("Home", { name: "World" }));
```

`Route.patch()` and `Route.options()` land with [#16](https://github.com/flying-worker/flying-worker/pull/16). There is deliberately **no** `Route.head()` — Hono answers HEAD from the matching GET route with the body stripped.

### Groups

Prefixes and middleware nest and accumulate:

```ts
Route.group("/admin", () => {
  Route.get("/dashboard", [AdminController, "index"]);

  Route.group("/users", () => {
    Route.get("/", [UserController, "index"]);      // /admin/users
  }, ["can:manage-users"]);
}, ["auth"]);
```

Middleware names are aliases registered in `config/middlewares.ts`. An unregistered alias throws at boot with a clear message rather than silently skipping the guard.

### Controllers

Pass `[Class, "method"]`. A fresh instance is constructed per request ([#13](https://github.com/flying-worker/flying-worker/pull/13)), so storing request state on `this` is safe:

```ts
export class UserController {
  async index(c: Context) {
    return c.json({ users: await DB().select().from(users).all() });
  }
}
```

Every handler must return a `Response` — Hono throws otherwise.

---

## Middleware

Registered in `config/middlewares.ts` in four buckets:

```ts
export const middlewaresConfig: MiddlewaresConfig = {
  global: [MaintenanceMode],                     // every request
  web:    [Session, CsrfToken, HandleInertiaRequests],  // everything except api/*
  api:    [Cors],                                // api/* only
  aliases: { auth: RequireLogin },               // referenced by name on routes
};
```

**Order matters.** `Session` must come before `CsrfToken`, because CSRF reads its token from the session.

Built-ins exported from `flying-worker/middlewares`: `MaintenanceMode`, `Session`, `CsrfToken`, `Cors`, `HandleInertiaRequests`, `JwtAuth`.

`SessionAuth` exists in the source but is not currently exported — write your own guard middleware for session-protected routes until it is.

### Writing your own

```ts
import { BaseMiddleware } from "flying-worker/core";

class RequestTimer extends BaseMiddleware {
  async boot(context: Context, next: Next) {
    const start = Date.now();
    await next();
    context.res.headers.set("X-Duration", `${Date.now() - start}ms`);
  }
}
```

### CSRF

`CsrfToken` protects every non-idempotent web request. Get the token for forms and meta tags with:

```ts
import { csrfToken } from "flying-worker/supports";

<input type="hidden" name="_token" value={csrfToken()} />
```

The cookie value is XOR-encoded with a per-request nonce (BREACH mitigation), so it changes on every response while `csrfToken()` stays stable for the session — matching Laravel's behaviour. Exclude paths in `config/csrf.ts`.

---

## Authentication

Guard-based, mirroring Laravel. A guard is either **session** (cookie + KV) or **jwt** (bearer token, optionally in a cookie).

```ts
// config/auth.ts
export const authConfig: AuthConfig = {
  defaultWebGuard: "web",
  defaultApiGuard: "api",
  guards: {
    web: { driver: "session", userTable: users, rolePermissionTable: rolePermissions },
    api: {
      driver: "jwt",
      useCookie: { status: true, maxAge: "2d", key: "authorization-token" },
      userTable: users,
      rolePermissionTable: rolePermissions,
      tokenTable: tokens,
    },
  },
};
```

### Usage

```ts
// Credentials — returns true (session) or the token string (jwt), false on failure
const result = await Auth.attempt({ email, password });

// Log a user in directly
await Auth.login(user, { remember: true });

// Pick a guard explicitly; the returned instance is scoped to it
const token = await Auth.guard("api").login(user, { permissions: ["posts.read"] });

Auth.check();            // boolean
await Auth.user();       // AuthenticatedUser | null
await Auth.logout();
```

The guard is auto-detected from the request path — requests under `apiPrefix` use `defaultApiGuard`, everything else uses `defaultWebGuard`. `Auth.guard(name)` returns a **new** instance scoped to that guard ([#5](https://github.com/flying-worker/flying-worker/pull/5)), so it never leaks into later calls.

### Roles and permissions

```ts
const user = await Auth.user();

user.hasRole("admin");
user.hasRole(["admin", "editor"]);          // any of
user.hasPermission("posts.publish");
user.hasTokenPermission("posts.read");      // jwt guards: permissions baked into the token
```

Sensitive columns (`password`, `remember_token`) are stripped from the authenticated user before it reaches your code or an Inertia prop. Extend the list per guard with `hidden: [...]` ([#12](https://github.com/flying-worker/flying-worker/pull/12)).

### Social OAuth

Google, GitHub, LinkedIn and X:

```ts
SocialAuth.google().redirect();
SocialAuth.google().guard("web").login();
SocialAuth.google().login({
  createUserCallback: async (socialUser) => { /* create and return a user */ },
});
```

Credentials go in `config/social-auth.ts`.

---

## Sessions

Driver is `kv` or `cookie`, set in `config/session.ts`.

```ts
Session.put("cart", { items: 2 });
Session.get("cart", defaultValue);
Session.has("cart");
Session.forget("cart");
Session.all();
Session.flush();
Session.getId();
```

Writes are skipped entirely when nothing changed, so a plain `GET` costs zero KV writes.

### Flash data

Survives exactly one request — even if nothing reads it:

```ts
Session.flash("status", "Profile updated.");

// next request
Session.get("status");   // "Profile updated." — read by its plain key
```

### Regenerating

```ts
await Session.regenerate();      // new ID, data carried over
await Session.regenerate(true);  // …and destroy the old record
await Session.invalidate();      // flush + regenerate + destroy
```

`regenerate()` and `invalidate()` arrive with [#3](https://github.com/flying-worker/flying-worker/pull/3).

---

## Cookies

Signed by default with your app secret:

```ts
await Cookie.set("token", value, "3d");        // signed; "30s" | "5m" | "2h" | "7d" | seconds
await Cookie.get("token");                     // undefined if missing or tampered with

Cookie.setUnsigned("theme", "dark", { maxAge: 3600 });  // readable by JS
Cookie.getUnsigned("theme");
Cookie.delete("token");
```

Path, `Secure`, `HttpOnly` and `SameSite` default to your session config and can be overridden per call. Omit the lifetime for a browser-session cookie.

---

## Inertia

Return a page from any handler. Inertia sends JSON for an XHR navigation and a full HTML document on first load — same code either way.

```ts
App.hono.get("/users", async (c) =>
  inertiaRender("Users", {
    users: await DB().select().from(users).all(),
    filters: AppRequest.all(),
  }),
);
```

`Users` resolves to `resources/js/Pages/Users.jsx`. The root document is `config/inertia.ts` → `resources/views/app.tsx`.

### Shared props

```ts
// middlewares/HandleInertiaRequests.ts
shareInertia({ auth: { user: Auth.user() } });
```

Function props are called lazily and Promise props are awaited ([#7](https://github.com/flying-worker/flying-worker/pull/7)), so `Auth.user()` can be shared without `await`.

### Partial reloads and asset versioning

Partial reloads (`X-Inertia-Partial-Data`) resolve **only** the requested props, so the work behind the others is never done. Asset version mismatches return `409` with `X-Inertia-Location` so the client hard-reloads and picks up new assets.

---

## Requests

`AppRequest` is bound to the current request:

```ts
await AppRequest.initializeBody();     // required before reading a POST/PUT/PATCH body

AppRequest.input("email", "default");
AppRequest.all();                      // query params + body (merged as of #8)
AppRequest.header("authorization");
AppRequest.ip();
AppRequest.isMethod("post");
AppRequest.uri();                      // /path?query
AppRequest.pathname();                 // /path
AppRequest.fullurl();
AppRequest.getRequest();               // the raw Request
```

### File uploads

Lands with [#14](https://github.com/flying-worker/flying-worker/pull/14):

```ts
await AppRequest.initializeBody();

const avatar = AppRequest.file("avatar");      // File | null
const photos = AppRequest.files("photos[]");   // File[]
AppRequest.hasFile("avatar");

await storage.upload(avatar!);
```

### Validation

Lands with [#19](https://github.com/flying-worker/flying-worker/pull/19):

```ts
const { email, password } = await AppRequest.validate(
  z.object({ email: z.string().email(), password: z.string().min(8) }),
);
```

Reads the body for you, validates query params and body together, and returns the schema's output type so coercions and defaults apply. On failure it throws a `ValidationException`, rendered as `422` with `{ message, errors }` keyed by field.

---

## Database

D1 through Drizzle. `DB()` is cached per request:

```ts
import { DB } from "flying-worker/database";
import { users } from "../models";

await DB().select().from(users).where(eq(users.id, 1)).get();
await DB().insert(users).values({ name, email }).run();
await DB().query.users.findFirst({ with: { posts: true } });
```

### Typing your schema

The framework ships without knowledge of your tables. Register them once via declaration merging and `DB()` is fully typed everywhere:

```ts
// framework/types/database.d.ts
import type * as schema from "../app/models";

declare global {
  namespace FlyingWorker {
    interface Database { schema: typeof schema }
  }
}
export {};
```

Models are ordinary Drizzle tables in `app/models/`. Generate migrations with `npm run db:generate`.

---

## File storage (R2)

```ts
import { R2FileManager } from "flying-worker/storage";
import { r2Config } from "../config/r2";

const storage = new R2FileManager(r2Config);

const key = await storage.upload(file);          // validates size and MIME from config
await storage.uploadBuffer(buffer, "reports/q1.pdf");
await storage.get(key);
await storage.exists(key);
await storage.list({ prefix: "avatars/" });
await storage.copy(from, to);
await storage.move(from, to);
await storage.delete(key);
await storage.deleteMultiple([a, b]);
storage.getPublicUrl(key);
```

Size limits and allowed MIME types are enforced from `config/r2.ts` — an oversized or disallowed upload throws a `400` before touching the bucket.

---

## Helpers

```ts
import { Str, passwordHash, passwordVerify, encrypt, decrypt } from "flying-worker/supports";

Str.slug("Hello, World!");          // "hello-world"
Str.snake("Flying Worker");         // "flying_worker"  (whitespace only, not camelCase)
Str.contains(haystack, needles, ignoreCase);
Str.uuid();
Str.toQueryParams({ page: 2 });     // "page=2", drops undefined

await passwordHash(plain);          // bcrypt, salted
await passwordVerify(plain, hash);
await encrypt(data);                // signed with your app secret
await decrypt(token);
```

---

## Cloudflare bindings

Declared in `framework/wrangler.json` and typed in `framework/types/declarations.d.ts`:

| Binding | Purpose |
|---|---|
| `kv` | Session storage (`kv` driver) |
| `DB` | D1 database |
| `MY_BUCKET` | R2 bucket for file storage |
| `AI` | Workers AI (optional) |

The KV binding name can be overridden with the `KV_BINDING_NAME` environment variable.

---

## Testing

Vitest, with unit tests co-located in `src/**/__tests__/`:

```bash
npm test                    # run the framework suite
npm run typecheck           # both workspaces
```

Tests run against real Hono request cycles with in-memory stand-ins for KV and D1, so middleware ordering, session persistence and per-request isolation are exercised end to end rather than mocked away.

---

## Contributing

CI runs typecheck, tests and the package build on every pull request ([#17](https://github.com/flying-worker/flying-worker/pull/17)). Please add a test that fails without your change.

---

## License

MIT
