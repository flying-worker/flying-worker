import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import App from "../../core/Application";
import { Auth } from "../index";
import type { Config } from "../../type-declaration";

/**
 * Regression cover for: the JWT auth cookie was set without an await.
 *
 * `Cookie.set` awaits an HMAC via crypto.subtle before appending Set-Cookie,
 * so a handler that returned straight after `login()` could finish before the
 * header was attached.
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
				api: {
					driver: "jwt",
					useCookie: { status: true, key: "auth_token", maxAge: "1h" },
				},
			},
		},
	} as unknown as Config;
}

describe("jwtLogin() cookie", () => {
	beforeEach(() => {
		App.hono = new Hono();
		App.loadConfig(makeConfig());
		App.basicInit();

		// The shape the docs suggest: log in, return the token immediately.
		App.hono.post("/api/login", async (c) => {
			const token = await Auth.guard("api").login({
				id: 1,
				name: "Ada",
				email: "ada@example.com",
			});
			return c.json({ token });
		});
	});

	it("attaches Set-Cookie before the handler's response is returned", async () => {
		const res = await App.hono.request("/api/login", { method: "POST" });

		expect(res.headers.get("set-cookie") ?? "").toContain("auth_token=");
	});

	it("still returns the token in the body", async () => {
		const res = await App.hono.request("/api/login", { method: "POST" });
		const body = (await res.json()) as { token?: string };

		expect(typeof body.token).toBe("string");
		expect(body.token!.split(".")).toHaveLength(3);
	});
});
