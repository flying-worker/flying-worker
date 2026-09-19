import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import { Auth } from "../index";
import { Session, sessionMiddleware } from "../../session";
import { Str } from "../../supports";
import type { Config } from "../../type-declaration";

/**
 * Regression cover for: `guard()` pinned the guard for the rest of the request.
 *
 * `AuthManager` is resolved once per request and cached in the container, so
 * `guard()` assigning to `this.guardsName` made the selection sticky —
 * `Auth.guard('api').login(u)` followed by `Auth.logout()` ran the JWT path.
 */

function makeConfig(): Config {
	return {
		app: {
			name: "test",
			secret: "test-secret-value",
			environment: "test",
			url: "http://localhost",
			timezone: "UTC",
			locale: "en",
			maintenance: { status: false, message: "" },
			apiPrefix: "api",
			webRoute: async () => {},
			apiRoute: async () => {},
		},
		middlewares: { global: [], web: [], api: [], reactRouter: [], aliases: {} },
		session: {
			driver: "cookie",
			cookie_name: "fw_session",
			lifetime: 120,
			path: "/",
			secure: false,
			httpOnly: true,
			sameSite: "Lax",
		},
		auth: {
			defaultWebGuard: "web",
			defaultApiGuard: "api",
			guards: {
				web: { driver: "session" },
				api: { driver: "jwt", useCookie: { status: false, key: "token", maxAge: "1h" } },
			},
		},
	} as unknown as Config;
}

const authKey = Str.snake("test web-auth-user-id");

describe("Auth.guard() scoping", () => {
	beforeEach(() => {
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();
		App.hono.use(sessionMiddleware);
	});

	it("does not pin the guard for later Auth calls in the same request", async () => {
		App.hono.get("/probe", (c) => {
			Session.put(authKey, { guard: "web", userId: 1 });

			// Touching the api guard must not change what the bare facade does.
			const api = Auth.guard("api").check();
			const web = Auth.check();

			return c.json({ api, web });
		});

		const res = await App.hono.request("/probe");
		// No jwtPayload on the context, so the api guard is not authenticated —
		// but the auto-detected web guard still is.
		expect(await res.json()).toEqual({ api: false, web: true });
	});

	it("hands back a distinct instance per guard", async () => {
		App.hono.get("/identity", (c) => {
			const api = Auth.guard("api");
			const web = Auth.guard("web");
			return c.json({ distinct: api !== web });
		});

		const res = await App.hono.request("/identity");
		expect(await res.json()).toEqual({ distinct: true });
	});

	it("keeps a scoped instance bound to its own guard across calls", async () => {
		App.hono.get("/scoped", (c) => {
			Session.put(authKey, { guard: "web", userId: 1 });

			const api = Auth.guard("api");
			return c.json({ first: api.check(), second: api.check(), web: Auth.check() });
		});

		const res = await App.hono.request("/scoped");
		expect(await res.json()).toEqual({ first: false, second: false, web: true });
	});
});
