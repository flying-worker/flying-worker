# Flying Worker — Known Issues

> Code review findings. Fix before production use.
> Mark items `[x]` when resolved.

---

## CRITICAL

- [ ] **SQL Injection in `Auth.attempt()`**
  - **File:** `src/auth/Auth.ts` ~line 224
  - **Problem:** WHERE clause built with unparameterized string interpolation wrapped in `sql.raw()`. Attacker passes `{ email: 'x" OR "1"="1' }` to bypass authentication.
  - **Fix:** Use parameterized queries — pass values as bound parameters, not string-interpolated into the query.

- [ ] **Hardcoded App Secret**
  - **File:** `example/config/app.ts` line 6
  - **Problem:** `secret: "12086fb500fc4bafae7d660773b554c6"` is committed to the repo. This value signs cookies, signs JWTs, and encrypts data. Anyone with repo access can forge sessions and tokens.
  - **Fix:** Read from environment variable only: `secret: env.APP_SECRET`

- [ ] **Cryptographically Weak UUID (`Math.random()`)**
  - **File:** `src/supports/Str.ts` lines 20–26
  - **Problem:** Uses `Math.random()` which is predictable. This UUID is used for session ID generation and OAuth `state` parameter. An attacker can predict session IDs or forge OAuth state values.
  - **Fix:** Replace with `crypto.randomUUID()` — one line change.

- [ ] **Twitter PKCE is Broken**
  - **File:** `src/auth/social-auth/Twitter.ts` ~line 78
  - **Problem:** A new code challenge is generated during token exchange, but the old stored verifier is sent. The hashes won't match — Twitter OAuth token exchange will always fail.
  - **Fix:** Remove the redundant `getCodeChallenge()` call during token exchange; use only the stored verifier.

- [ ] **Route-Specific Middlewares Silently Ignored**
  - **File:** `src/core/Application.ts` lines 106–122
  - **Problem:** `middlewares` is destructured from route definition but never applied to the Hono route handler. Any auth-protected route defined with `["auth"]` middleware is publicly accessible.
  - **Fix:** Apply middlewares in `applyRoutes()`: `this.hono[method](finalPath, ...middlewareHandlers, handler)`

---

## HIGH

- [ ] **Session Saved on Every Request (Even if Unchanged)**
  - **File:** `src/session/SessionMiddleware.ts`
  - **Problem:** `Session.save()` is called unconditionally after every request. `SessionStore` has an `isDirty` flag but it's never checked — causes excessive unnecessary writes to Cloudflare KV.
  - **Fix:** Check `Session.isDirty()` before calling `Session.save()`.

- [ ] **Global App Singleton Holds Per-Request State — Race Condition**
  - **File:** `src/core/Application.ts` lines 170–172
  - **Problem:** `App` is a singleton that holds `this.context` and `this.currentStates`, both overwritten per request. Under concurrent Workers requests, one request can read another's auth state or context.
  - **Fix:** Store per-request state in Hono's `context.set()`/`context.get()` instead of on the singleton instance.

- [ ] **Two Duplicate Session Classes with Conflicting APIs**
  - **Files:** `src/session/Session.ts` and `src/session/SessionManager.ts`
  - **Problem:** Both implement KV + cookie drivers, both have `get`/`forget`/`flash`. But naming is inconsistent — `Session.ts` uses `put(key, value)`, `SessionManager.ts` uses `set(key, value)`. No documentation on which to use.
  - **Fix:** Consolidate into a single class. Remove or clearly deprecate the other.

---

## MEDIUM

- [ ] **`@ts-ignore` Hiding Real Type Errors**
  - **Files:** `src/core/Application.ts` line 119, `src/inertia/index.ts` line 37
  - **Problem:** TypeScript errors are suppressed with `// @ts-ignore` instead of being fixed. Hides real type mismatches.
  - **Fix:** Resolve the underlying types properly — type the `method` key access on Hono instance correctly.

- [ ] **Mixing `await` and `.then()` on the Same Promise**
  - **Files:** `src/auth/social-auth/Github.ts` ~line 87 (and all 4 OAuth providers)
  - **Problem:** `await fetch(...).then(res => res.json())` mixes async styles inconsistently.
  - **Fix:** Use pure `await` consistently: `const res = await fetch(...); const data = await res.json();`

- [ ] **`user.password = undefined` Instead of Deleting the Property**
  - **File:** `src/auth/Auth.ts` ~line 481
  - **Problem:** Setting to `undefined` leaves the key present — `"password" in user` is still `true`. Serialization may include the field.
  - **Fix:** Use `delete user.password` or omit the field when constructing the response object.

- [ ] **Container Has No Lifecycle Management**
  - **File:** `src/core/container.ts`
  - **Problem:** Resolved instances accumulate with no way to clear them. No singleton vs transient lifecycle distinction. If the container is ever held longer than a single request, memory leaks.
  - **Fix:** Add a `flush()` method; call it at end of request. Distinguish singleton from transient bindings.

- [ ] **Silent Exception Swallowing**
  - **Files:** `src/auth/Auth.ts` lines 54–64, and across middleware files
  - **Problem:** `catch (error) { return defaultValue; }` with no logging. When something breaks in production, there's no trace.
  - **Fix:** At minimum log the error with context before returning the fallback value.

- [ ] **Widespread `any` Types Undermining Type Safety**
  - **Files:** `src/auth/Auth.ts`, `src/storage/R2FileManager.ts`, `src/core/container.ts`
  - **Problem:** `any` and `{ [key: string]: any }` used where proper interfaces would provide compile-time safety.
  - **Fix:** Define proper interfaces for user records, database rows, and container resolved values.

- [ ] **Middleware Instantiation Runs on Every `boot()` Call**
  - **File:** `src/core/Application.ts` lines 149–167
  - **Problem:** `activeGlobalMiddleware()` creates new middleware instances and calls `hono.use()` every time `boot()` is called. If `boot()` is called per-request (which it appears to be), this adds duplicate middleware layers over time.
  - **Fix:** Guard with a `this.booted` flag — only register middlewares once.

---

## LOW

- [ ] **Debug `console.log` Left in Production Code**
  - **File:** `src/session/SessionManager.ts` lines 38, 42
  - **Problem:** `console.log("loading from KV")` and `console.log("loading from cookie")` are noise in production logs.
  - **Fix:** Remove or put behind a `DEBUG` env flag.

- [ ] **Vague Error Messages**
  - **File:** `src/core/Application.ts` line 36
  - **Problem:** `throw new Error("App Configuration not set")` gives no context about which key is missing or what value was received.
  - **Fix:** Include the config key name and received value in the message.

- [ ] **CSRF Token Size Below Current Best Practice**
  - **File:** `src/middlewares/CsrfToken.ts` lines 44–48
  - **Problem:** 20 bytes (40 hex chars) is acceptable but current best practice recommends 32+ bytes.
  - **Fix:** Change `new Uint8Array(20)` to `new Uint8Array(32)` and update the length check from `40` to `64`.

- [ ] **No JSDoc on Public APIs**
  - **Files:** Most of `src/` — `AppRequest`, `Auth`, `R2FileManager`, `Route`, etc.
  - **Problem:** No IDE hints or inline documentation for anyone consuming this as a framework.
  - **Fix:** Add JSDoc to all public methods with param/return descriptions.

- [ ] **OAuth State Uses Weak UUID**
  - **Files:** `src/auth/social-auth/Google.ts`, `Github.ts`, `Linkedin.ts`, `Twitter.ts`
  - **Problem:** All four providers call `Str.uuid()` (which uses `Math.random()`) to generate the OAuth `state` parameter. This is the CSRF protection for OAuth flows.
  - **Fix:** Same fix as the UUID issue above — use `crypto.randomUUID()` or `crypto.getRandomValues()` directly.
  - **Note:** This duplicates the UUID issue but is listed separately because it affects OAuth security specifically.

---

## Summary

| Severity | Count |
|---|---|
| Critical | 5 |
| High | 3 |
| Medium | 6 |
| Low | 5 |
| **Total** | **19** |
