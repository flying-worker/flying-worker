import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import { Auth } from "../index";
import { Session, sessionMiddleware } from "../../session";
import { Str } from "../../supports";
import type { Config } from "../../type-declaration";

/**
 * Regression cover for: `Auth.logout()` left the user authenticated.
 *
 * `SessionStore.regenerate()` only swaps the session ID — the data object is
 * carried over — so the auth entry has to be removed explicitly. Without that,
 * the session middleware writes `{guard, userId}` straight back under the new
 * ID and the next request is still logged in.
 */

/** In-memory stand-in for the KV binding. */
function makeKv() {
	const store = new Map<string, string>();
	return {
		store,
		get: async (key: string) => store.get(key) ?? null,
		put: async (key: string, value: string) => void store.set(key, value),
		delete: async (key: string) => void store.delete(key),
	};
}

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
			driver: "kv",
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

/** The key Auth stores its session entry under (mirrors AuthManager.sessionKey). */
const authKey = Str.snake("test web-auth-user-id");

/** Pull the session cookie out of a response so it can be replayed. */
function sessionCookie(res: Response): string {
	const raw = res.headers.get("set-cookie") ?? "";
	const match = raw.match(/fw_session=([^;,]*)/);
	return match ? `fw_session=${match[1]}` : "";
}

describe("Auth.logout() on a session guard", () => {
	let kv: ReturnType<typeof makeKv>;

	beforeEach(() => {
		kv = makeKv();
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();
		App.hono.use(sessionMiddleware);

		App.hono.get("/login", (c) => {
			Session.put(authKey, { guard: "web", userId: 7 });
			return c.text("in");
		});

		App.hono.get("/logout", async (c) => {
			await Auth.logout();
			return c.text(String(Auth.check()));
		});

		App.hono.get("/check", (c) => c.text(String(Auth.check())));
	});

	const env = () => ({ kv });

	it("leaves the user logged out on the following request", async () => {
		const loggedIn = await App.hono.request("/login", {}, env());
		const cookie = sessionCookie(loggedIn);

		const stillIn = await App.hono.request(
			"/check",
			{ headers: { cookie } },
			env(),
		);
		expect(await stillIn.text()).toBe("true");

		const loggedOut = await App.hono.request(
			"/logout",
			{ headers: { cookie } },
			env(),
		);
		expect(await loggedOut.text()).toBe("false");

		// The regenerated ID must not carry the auth entry forward.
		const after = await App.hono.request(
			"/check",
			{ headers: { cookie: sessionCookie(loggedOut) } },
			env(),
		);
		expect(await after.text()).toBe("false");
	});

	it("destroys the pre-logout record so the old cookie cannot be replayed", async () => {
		const loggedIn = await App.hono.request("/login", {}, env());
		const cookie = sessionCookie(loggedIn);

		await App.hono.request("/logout", { headers: { cookie } }, env());

		const replayed = await App.hono.request(
			"/check",
			{ headers: { cookie } },
			env(),
		);
		expect(await replayed.text()).toBe("false");
	});
});
